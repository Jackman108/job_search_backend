import { v4 as uuidv4 } from 'uuid';
import type { InitFiatPaymentParams, InitFiatPaymentResult } from '@interface';
import { createPayment, getPaymentBySubscriptionId, updatePayment } from './paymentService';
import { createWebpayPayment } from './webpayIntegrationService';
import { PaymentStatus } from '@interface';
import { PAYMENT_API_BASE_URL, USE_MOCK_PROVIDER } from '@config';
import { WEBPAY_RETURN_URL, WEBPAY_CANCEL_URL } from '@config';
import { executeQuery, getSubscriptionIdByUserId } from '@utils';
import { mockWebPayResponse } from '../../mock/mockWebPayResponse';

/**
 * Проверяет и удаляет существующий криптоплатеж при переключении на другой метод оплаты
 * @param subscriptionId ID подписки
 */
const deletePendingCryptoPayment = async (subscriptionId: string): Promise<void> => {
    // Проверяем, есть ли незавершенные криптоплатежи для этой подписки
    const query = `
        DELETE FROM crypto_payments 
        WHERE subscription_id = $1 AND payment_status = 'pending'
    `;
    await executeQuery(query, [subscriptionId]);
    console.log(`Deleted pending crypto payments for subscription: ${subscriptionId}`);
};

/**
 * Отправляет запрос к провайдеру для инициализации fiat-платежа и сохраняет запись в БД
 */
export async function initFiatPayment(
    params: InitFiatPaymentParams
): Promise<InitFiatPaymentResult> {
    const { userId, amount, currency, payment_method } = params;
    const providerRequestId = uuidv4();
    const orderNum = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const endpoint = `${PAYMENT_API_BASE_URL}/${payment_method}`;
    const subscriptionId = await getSubscriptionIdByUserId(userId);

    // Проверяем существующий платеж для этой подписки
    const existingPayment = await getPaymentBySubscriptionId(subscriptionId);

    let payment;

    if (existingPayment && existingPayment.payment_status === PaymentStatus.Pending) {
        // Если есть существующий платеж в статусе Pending, обновляем его
        payment = await updatePayment(userId, existingPayment.id, {
            payment_method,
            amount,
            updated_at: new Date()
        });

        // Если метод оплаты изменился на card, удаляем криптоплатежи
        if (payment_method === 'card') {
            await deletePendingCryptoPayment(subscriptionId);
        }
    } else {
        // Иначе создаем новый платеж
        payment = await createPayment(userId, {
            subscription_id: subscriptionId,
            amount,
            payment_method,
            payment_status: PaymentStatus.Pending
        });
    }

    // В зависимости от метода оплаты, выполняем соответствующие действия
    if (payment_method === 'card') {
        // Для WebPay, создаем запись в отдельной таблице webpay_payments
        await createWebpayPayment({
            payment_id: payment.id,
            wsb_order_num: orderNum,
            wsb_currency_id: currency,
            wsb_total: amount,
            payment_status: PaymentStatus.Pending,
            success_url: WEBPAY_RETURN_URL,
            cancel_url: WEBPAY_CANCEL_URL
        });
    }

    if (USE_MOCK_PROVIDER && payment_method === 'card') {
        // В режиме разработки для WebPay возвращаем мок-URL без внешнего запроса
        console.log('Using mock WebPay data in development mode');
        const redirectUrl = mockWebPayResponse.redirectUrl || `http://localhost:3000/payment/success?order=${orderNum}`;

        // Обновляем статус платежа после успешной оплаты мок-данными
        await updatePayment(userId, payment.id, {
            payment_status: PaymentStatus.Completed,
            updated_at: new Date()
        });

        return { paymentId: payment.id, redirectUrl };
    } else if (USE_MOCK_PROVIDER) {
        // Для других методов оплаты в режиме разработки
        const redirectUrl = `${endpoint}/mock/${providerRequestId}?order=${orderNum}`;
        return { paymentId: payment.id, redirectUrl };
    }

    // Продакшн: запрос к провайдеру
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: providerRequestId,
            amount,
            currency,
            order_num: orderNum
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fiat provider error ${response.status}: ${errorText}`);
    }
    const { page: redirectUrl } =
        (await response.json()) as { page: string };

    // Обновляем время, если необходимо
    await updatePayment(userId, payment.id, { updated_at: new Date() });

    return { paymentId: payment.id, redirectUrl };
} 