import { v4 as uuidv4 } from 'uuid';
import type { InitFiatPaymentParams, InitFiatPaymentResult } from '@interface';
import { createPayment, updatePayment } from './paymentService';
import { PaymentStatus } from '../../constants/paymentStatus';
import { PAYMENT_API_BASE_URL, USE_MOCK_PROVIDER } from '@config';
import { getSubscriptionIdByUserId } from '@utils';

/**
 * Отправляет запрос к провайдеру для инициализации fiat-платежа и сохраняет запись в БД
 */

export async function initFiatPayment(
    params: InitFiatPaymentParams
): Promise<InitFiatPaymentResult> {
    const { userId, amount, currency, payment_method } = params;
    const providerRequestId = uuidv4();
    const endpoint = `${PAYMENT_API_BASE_URL}/${payment_method}`;
    const subscriptionId = await getSubscriptionIdByUserId(userId);

    if (USE_MOCK_PROVIDER) {
        // В режиме разработки возвращаем мок-URL без внешнего запроса

        const redirectUrl = `${endpoint}/mock/${providerRequestId}`;
        const payment = await createPayment(userId, {
            subscription_id: subscriptionId,
            amount,
            payment_method,
            payment_status: PaymentStatus.Pending,
        });
        return { paymentId: payment.id, redirectUrl };
    }

    // Продакшн: запрос к провайдеру
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: providerRequestId, amount, currency }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fiat provider error ${response.status}: ${errorText}`);
    }
    const { page: redirectUrl } =
        (await response.json()) as { page: string };

    // Создаем запись платежа в БД
    const payment = await createPayment(userId, {
        subscription_id: subscriptionId,
        amount,
        payment_method,
        payment_status: PaymentStatus.Pending,
    });
    // Обновляем время, если необходимо
    await updatePayment(userId, payment.id, { updated_at: new Date() });

    return { paymentId: payment.id, redirectUrl };
} 