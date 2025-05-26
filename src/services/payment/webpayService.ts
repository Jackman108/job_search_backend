import {
    IWebPayService,
    InitFiatPaymentParams,
    PaymentBase,
    PaymentResult,
    PaymentStatus,
    WebpayInitParams
} from '@interface';
import { WEBPAY_RETURN_URL, WEBPAY_CANCEL_URL, USE_MOCK_PROVIDER } from '@config';
import { getSubscriptionIdByUserId, generateOrderNumber, withErrorHandling, executeQuery } from '@utils';
import { createPayment, getPaymentBySubscriptionId, updatePayment, updatePaymentStatus, deletePendingCryptoPayment } from '@services';
import {
    createWebpayPayment,
    getWebpayPaymentByPaymentId,
    getWebpayPaymentByOrderNum,
    updateWebpayPaymentByOrderNum,
    initWebpayPayment,
    handleWebpayReturn,
    handleWebpayCancel,
    handleWebpayNotify,
    validateWebpaySignature
} from '@services';


/**
 * Проверяет и удаляет существующий WebPay платеж при переключении на криптоплатеж
 * @param subscriptionId ID подписки
 */
export const deletePendingWebPayPayment = async (subscriptionId: string): Promise<void> => {
    const query = `
        DELETE FROM webpay_payments 
        WHERE subscription_id = $1 AND payment_status = $2
    `;
    await executeQuery(query, [subscriptionId, PaymentStatus.Pending]);
    console.log(`Deleted pending WebPay payment for subscription: ${subscriptionId}`);
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
        await updatePaymentStatus(webpayPayment.payment_id, PaymentStatus.Completed);

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
    params: InitFiatPaymentParams
): Promise<PaymentResult<any>> => {
    return withErrorHandling(async () => {
        const { userId, amount, currency, payment_method } = params;
        const orderNum = generateOrderNumber();
        const subscriptionId = await getSubscriptionIdByUserId(userId);

        // Проверяем существующий платеж для этой подписки
        const existingPayment = await getPaymentBySubscriptionId(subscriptionId);

        let payment: PaymentBase;

        if (existingPayment && existingPayment.payment_status === PaymentStatus.Pending) {
            // Если есть существующий платеж в статусе Pending, обновляем его
            payment = await updatePayment(userId, existingPayment.id, {
                payment_method,
                amount,
                updated_at: new Date()
            });

            // Если метод оплаты изменился на webpay, удаляем криптоплатежи
            if (payment_method === 'webpay') {
                await deletePendingCryptoPayment(subscriptionId);
            }
        } else {
            // Иначе создаем новый платеж
            payment = await createPayment({
                userId,
                amount,
                currency,
                payment_method,
                subscription_id: subscriptionId
            });
        }

        // Создаем запись в таблице webpay_payments
        const webpayPayment = await createWebpayPayment({
            payment_id: payment.id,
            wsb_order_num: orderNum,
            wsb_currency_id: currency,
            wsb_total: amount,
            payment_status: PaymentStatus.Pending,
            success_url: params.success_url || WEBPAY_RETURN_URL,
            cancel_url: params.cancel_url || WEBPAY_CANCEL_URL
        });

        // Инициализация платежа через WebPay API
        const webpayParams: WebpayInitParams = {
            wsb_seed: Date.now().toString(),
            wsb_storeid: Number(process.env.WEBPAY_STORE_ID || '000000'),
            wsb_order_num: orderNum,
            wsb_test: process.env.NODE_ENV !== 'production' ? 1 : 0 as 0 | 1,
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

        const result = await initWebpayPayment(webpayParams);

        // В режиме разработки запускаем автоматическую обработку платежа через минуту
        if (USE_MOCK_PROVIDER) {
            console.log(`WebPay payment ${orderNum} created. Will be processed in 1 minute.`);
            setTimeout(async () => {
                try {
                    await processWebpayWebhook(orderNum, `mock-tx-${Date.now()}`);
                } catch (error) {
                    console.error('Error processing mock WebPay webhook:', error);
                }
            }, 60000); // 1 минута
        }

        return {
            paymentId: payment.id,
            redirectUrl: result.redirectUrl,
            orderNum: result.orderNum
        };
    });
};

/**
 * Реализация интерфейса IWebPayService
 */
export const webpayService: IWebPayService = {
    // Реализация общего интерфейса IPaymentService
    createPayment: async (params) => {
        return withErrorHandling(async () => {
            const result = await initWebpayFiatPayment({
                ...params,
                payment_method: 'webpay'
            });

            if (!result.success || !result.data) {
                return {
                    id: '',
                    subscription_id: params.subscription_id || '',
                    amount: params.amount,
                    payment_status: PaymentStatus.Failed,
                    payment_method: 'webpay',
                    created_at: new Date(),
                    updated_at: new Date()
                } as PaymentBase;
            }

            // Получаем данные о WebPay платеже
            const paymentId = result.data.paymentId || '';
            const paymentResult = await getWebpayPaymentByPaymentId(paymentId);

            // Создаем объект PaymentBase с данными из результата
            const paymentBase: PaymentBase = {
                id: paymentId,
                subscription_id: params.subscription_id || '',
                amount: params.amount,
                payment_status: PaymentStatus.Pending,
                payment_method: 'webpay',
                created_at: paymentResult?.created_at || new Date(),
                updated_at: paymentResult?.updated_at || new Date()
            };

            return paymentBase;
        });
    },

    updatePaymentStatus: async (paymentId, status) => {
        return withErrorHandling(async () => {
            return await updatePaymentStatus(paymentId, status);
        });
    },

    handlePaymentRedirect: async (params) => {
        const { orderNum, transactionId } = params;
        return withErrorHandling(async () => await handleWebpayReturn(orderNum, transactionId));
    },

    processPaymentWebhook: async (data, signature) => {
        return withErrorHandling(async () => await handleWebpayNotify(data, signature));
    },

    // Методы специфичные для WebPay
    initFiatPayment: initWebpayFiatPayment,
    handleWebpayReturn: async (orderNum, transactionId) => {
        return withErrorHandling(async () => await handleWebpayReturn(orderNum, transactionId));
    },
    handleWebpayCancel: async (orderNum) => {
        return withErrorHandling(async () => await handleWebpayCancel(orderNum));
    },
    validateWebpaySignature
}; 