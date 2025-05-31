import { USE_MOCK_PROVIDER, WEBPAY_API_BASE_URL, WEBPAY_CANCEL_URL, WEBPAY_RETURN_URL, WEBPAY_SECRET_KEY } from '@config';
import { InitWebPayPaymentParams, PaymentBase, PaymentResult, PaymentStatus, WebpayInitParams, WebpayInitResult } from '@interface';
import { getPaymentBySubscriptionId, updatePayment, updatePaymentStatus, validateWebpaySignature } from '@services';
import { executeQuery, generateOrderNumber, getSubscriptionIdByUserId, logger, withErrorHandling } from '@utils';
import crypto from 'crypto';
import { mockWebPayResponse } from '../../../mock/mockWebPayResponse';
import { createWebpayPayment, updateWebpayPaymentByOrderNum } from './webpayService';
import { getWebpayPaymentByOrderNum } from './webpayService';
import { deletePendingCryptoPayment } from '../crypto/cryptoService';


/**
 * Инициализация платежа через WebPay (Host-to-Host JSON API)
 * В режиме разработки использует моковые данные
 */
export async function initWebpayDirectPayment(
    params: WebpayInitParams
): Promise<PaymentResult<WebpayInitResult>> {
    return await withErrorHandling(async () => {
        // В режиме разработки возвращаем моковые данные
        if (USE_MOCK_PROVIDER) {
            logger.info('Using mock WebPay response in development mode');
            return {
                wt: mockWebPayResponse.wt,
                redirectUrl: mockWebPayResponse.redirectUrl,
                orderNum: params.wsb_order_num
            };
        }

        // В продакшене делаем реальный запрос к WebPay
        const {
            wsb_seed,
            wsb_storeid,
            wsb_order_num,
            wsb_test,
            wsb_currency_id,
            wsb_total,
            ...rest
        } = params;

        // Формирование подписи SHA1: seed+storeid+order_num+test+currency+total+secret_key
        const signaturePayload =
            `${wsb_seed}${wsb_storeid}${wsb_order_num}${wsb_test}${wsb_currency_id}${wsb_total}${WEBPAY_SECRET_KEY}`;
        const wsb_signature = crypto
            .createHash('sha1')
            .update(signaturePayload)
            .digest('hex');

        // Формируем тело запроса
        const requestBody = {
            wsb_seed,
            wsb_storeid,
            wsb_order_num,
            wsb_test,
            wsb_currency_id,
            wsb_total,
            wsb_signature,
            ...rest
        };

        // Отправляем запрос к WebPay API
        const response = await fetch(`${WEBPAY_API_BASE_URL}/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`WebPay API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return {
            wt: data.wt,
            redirectUrl: data.redirectUrl,
            orderNum: wsb_order_num
        };
    });
}

/**
 * Обработка возврата покупателя после успешной оплаты
 * @param orderNum Номер заказа WebPay
 * @param transactionId ID транзакции WebPay
 */
export const handleWebpayReturn = async (
    orderNum: string,
    transactionId: string
): Promise<string> => {
    // Получаем платеж по номеру заказа
    const webpayPayment = await getWebpayPaymentByOrderNum(orderNum);
    if (!webpayPayment) {
        throw new Error(`WebPay payment not found for order ${orderNum}`);
    }

    // Обновляем статус в таблице webpay_payments
    await updateWebpayPaymentByOrderNum(orderNum, {
        payment_status: PaymentStatus.Completed,
        transaction_id: transactionId
    });

    // Обновляем статус в основной таблице payments
    const updateQuery = `
        UPDATE payments
        SET payment_status = $1, updated_at = NOW()
        WHERE subscription_id = $2
    `;
    await executeQuery(updateQuery, [PaymentStatus.Completed, webpayPayment.subscription_id]);

    // Возвращаем URL для редиректа
    return webpayPayment.success_url ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?order=${orderNum}`;
};

/**
 * Обработка возврата покупателя при отмене оплаты
 * @param orderNum Номер заказа WebPay
 */
export const handleWebpayCancel = async (orderNum: string): Promise<string> => {
    // Получаем платеж по номеру заказа
    const webpayPayment = await getWebpayPaymentByOrderNum(orderNum);
    if (!webpayPayment) {
        throw new Error(`WebPay payment not found for order ${orderNum}`);
    }

    // Обновляем статус в таблице webpay_payments
    await updateWebpayPaymentByOrderNum(orderNum, {
        payment_status: PaymentStatus.Failed
    });

    // Обновляем статус в основной таблице payments
    const updateQuery = `
        UPDATE payments
        SET payment_status = $1, updated_at = NOW()
        WHERE subscription_id = $2
    `;
    await executeQuery(updateQuery, [PaymentStatus.Failed, webpayPayment.subscription_id]);

    // Возвращаем URL для редиректа
    return webpayPayment.cancel_url ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel?order=${orderNum}`;
};

/**
 * Обработка нотификации от WebPay
 * @param payload Тело уведомления
 * @param signature Подпись из заголовка X-Webpay-Signature
 */
export const handleWebpayNotify = async (
    payload: any,
    signature: string
): Promise<boolean> => {
    // Проверяем подпись уведомления
    if (!USE_MOCK_PROVIDER && !validateWebpaySignature(payload, signature)) {
        console.error('Invalid WebPay notification signature');
        return false;
    }

    const { wsb_order_num, wsb_tid, wsb_status } = payload;

    // Проверяем обязательные поля
    if (!wsb_order_num || !wsb_status) {
        console.error('Missing required fields in WebPay notification');
        return false;
    }

    // Получаем платеж по номеру заказа
    const webpayPayment = await getWebpayPaymentByOrderNum(wsb_order_num);
    if (!webpayPayment) {
        console.error(`WebPay payment not found for order ${wsb_order_num}`);
        return false;
    }

    // Определяем статус платежа
    const paymentStatus = USE_MOCK_PROVIDER || wsb_status === 'paid' ? PaymentStatus.Completed : PaymentStatus.Failed;

    // Обновляем статус в таблице webpay_payments
    await updateWebpayPaymentByOrderNum(wsb_order_num, {
        payment_status: paymentStatus,
        transaction_id: wsb_tid || null
    });

    // Обновляем статус в основной таблице payments
    const updateQuery = `
        UPDATE payments
        SET payment_status = $1, updated_at = NOW()
        WHERE subscription_id = $2
    `;
    await executeQuery(updateQuery, [paymentStatus, webpayPayment.subscription_id]);

    return true;
};

/**
 * Обработка вебхука от WebPay
 * Аналог handleWebpayNotify, но для использования в режиме разработки с таймером
 * @param orderNum Номер заказа
 * @param transactionId ID транзакции
 */
export const processWebpayWebhook = async (orderNum: string, transactionId: string): Promise<boolean> => {
    try {
        // Получаем платеж по номеру заказа
        const webpayPayment = await getWebpayPaymentByOrderNum(orderNum);
        if (!webpayPayment) {
            console.error(`WebPay payment not found for order ${orderNum}`);
            return false;
        }

        // Обновляем статус в таблице webpay_payments
        await updateWebpayPaymentByOrderNum(orderNum, {
            payment_status: PaymentStatus.Completed,
            transaction_id: transactionId
        });

        // Обновляем статус в основной таблице payments
        await updatePaymentStatus(webpayPayment.subscription_id, PaymentStatus.Completed);

        console.log(`Mock WebPay payment ${orderNum} completed successfully`);
        return true;
    } catch (error) {
        console.error('Error processing mock WebPay webhook:', error);
        return false;
    }
};

/**
 * Инициализация Fiat платежа через WebPay
 */
export const initWebpayFiatPayment = async (
    params: InitWebPayPaymentParams
): Promise<PaymentResult<any>> => {
    return withErrorHandling(async () => {
        const { userId, amount, currency, payment_method } = params;
        const orderNum = generateOrderNumber();
        const subscriptionId = await getSubscriptionIdByUserId(userId);

        // Проверяем существующий платеж для этой подписки
        const existingPayment = await getPaymentBySubscriptionId(subscriptionId);

        if (existingPayment && existingPayment.payment_status === PaymentStatus.Pending) {
            // Если есть существующий платеж в статусе Pending, обновляем его
            const payment: PaymentBase = await updatePayment(userId, existingPayment.id, {
                payment_method,
                amount,
                updated_at: new Date()
            });

            // Если метод оплаты изменился на webpay, удаляем криптоплатежи
            if (payment_method === 'webpay') {
                await deletePendingCryptoPayment(subscriptionId);
            }
        }

        // Инициализация платежа через WebPay API
        const webpayParams: WebpayInitParams = {
            wsb_seed: Date.now().toString(),
            wsb_storeid: Number(process.env.WEBPAY_STORE_ID || '000000'),
            wsb_order_num: orderNum,
            wsb_test: USE_MOCK_PROVIDER ? 1 : 0,
            wsb_currency_id: currency as "BYN" | "USD" | "EUR" | "RUB",
            wsb_total: amount,
            wsb_version: 2,
            wsb_return_url: params.success_url || WEBPAY_RETURN_URL,
            wsb_cancel_return_url: params.cancel_url || WEBPAY_CANCEL_URL,
            wsb_notify_url: process.env.WEBPAY_NOTIFY_URL || 'http://localhost:8000/api/webpay/notify',
            wsb_invoice_item_name: ['Subscription'],
            wsb_invoice_item_quantity: [1],
            wsb_invoice_item_price: [amount],
            success_url: params.success_url,
            cancel_url: params.cancel_url
        };


        // Создаем запись в таблице webpay_payments
        await createWebpayPayment({
            id: '',
            amount: amount,
            transaction_id: '',
            signature: '',
            created_at: new Date(),
            updated_at: new Date(),
            subscription_id: subscriptionId,
            wsb_order_num: orderNum,
            wsb_currency_id: currency,
            wsb_total: amount,
            payment_status: PaymentStatus.Pending,
            payment_method: params.payment_method || 'webpay',
            success_url: params.success_url || WEBPAY_RETURN_URL,
            cancel_url: params.cancel_url || WEBPAY_CANCEL_URL
        });

        const result = await initWebpayDirectPayment(webpayParams);

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to initialize WebPay payment');
        }

        // В режиме разработки запускаем автоматическую обработку платежа через минуту
        if (USE_MOCK_PROVIDER) {
            logger.info(`WebPay payment ${orderNum} created. Will be processed in 1 minute.`);
            setTimeout(async () => {
                try {
                    await processWebpayWebhook(orderNum, `mock-tx-${Date.now()}`);
                } catch (error) {
                    logger.error('Error processing mock WebPay webhook:', { error });
                }
            }, 60000); // 1 минута
        }

        return {
            wt: result.data.wt || '',
            redirectUrl: result.data.redirectUrl,
            orderNum: result.data.orderNum
        };
    });
};
