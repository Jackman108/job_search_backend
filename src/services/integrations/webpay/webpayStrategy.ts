/**
 * Стратегия для обработки платежей через WebPay
 * Реализует интерфейс PaymentStrategy для WebPay
 */
import { FRONTEND_URL, WEBPAY_SECRET_KEY } from '@config';
import {
    cleanupPendingCryptoPayment,
    formatAmount,
    generatePaymentId,
    initWebpayFiatPayment,
    normalizeDataForSignature,
    updatePaymentStatus,
    validateWebpaySignature,
    verifyHmacSignature
} from '@integrations';
import {
    InitWebPayPaymentParams,
    PaymentResult,
    PaymentStatus,
    WebpayInitResult,
    WebPayStrategy
} from '@interface';
import { logger } from '@utils';

/**
 * Создание стратегии платежей для WebPay
 * Реализует интерфейс PaymentStrategy
 */
export const createWebPayStrategy = (): WebPayStrategy => {

    /**
     * Инициализирует платеж через WebPay
     * @param params Параметры платежа
     * @returns Результат инициализации платежа
     */
    const initPayment = async (params: InitWebPayPaymentParams): Promise<PaymentResult<WebpayInitResult>> => {
        try {
            // Проверяем, если есть незавершенные криптоплатежи, удаляем их
            await cleanupPendingCryptoPayment(params.paymentId);

            // Инициализация платежа через WebPay
            return await initWebpayStrategyPayment(params);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    };

    /**
     * Инициализирует платеж через WebPay с детальными параметрами
     * @param params Параметры платежа WebPay
     * @returns Результат инициализации платежа
     */
    const initWebpayStrategyPayment = async (params: InitWebPayPaymentParams): Promise<PaymentResult<WebpayInitResult>> => {
        try {
            logger.info('Initializing WebPay payment details', { params });

            // Создаем уникальный номер заказа
            const orderNum = generatePaymentId('WBP');

            // Форматируем сумму к нужному формату
            const formattedAmount = formatAmount(params.amount, {
                decimals: 2,
                asString: false,
                multiplyBy: 1
            }) as number;

            // Подготавливаем данные для подписи
            const paymentData = {
                order_num: orderNum,
                amount: formattedAmount,
                currency: params.currency,
                payment_id: params.paymentId
            };

            // Нормализуем данные для подписи
            const normalizedData = normalizeDataForSignature(paymentData, {
                sortKeys: true,
                excludeEmpty: true
            });

            // Вызов сервиса инициализации WebPay
            const result = await initWebpayFiatPayment({
                userId: params.userId,
                paymentId: params.paymentId,
                currency: params.currency,
                amount: formattedAmount
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to initialize WebPay payment');
            }

            return {
                success: true,
                data: {
                    wt: result.data.wt || '',
                    redirectUrl: result.data.redirectUrl,
                    orderNum: orderNum
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    };

    /**
     * Проверяет подпись вебхука от WebPay
     * @param data Данные вебхука
     * @param signature Подпись вебхука
     * @returns true если подпись валидна, иначе false
     */
    const validatePaymentSignature = (data: any, signature: string): boolean => {
        if (!WEBPAY_SECRET_KEY) {
            logger.error('Missing WebPay secret key for signature validation');
            return false;
        }

        // Нормализуем данные для проверки подписи
        const normalizedData = normalizeDataForSignature(data, {
            excludeKeys: ['signature', 'wsb_signature']
        });

        // Проверяем подпись с использованием HMAC
        return verifyHmacSignature(JSON.stringify(normalizedData), signature, WEBPAY_SECRET_KEY, 'sha1');
    };

    /**
     * Обрабатывает успешный возврат от WebPay
     * @param params Параметры возврата
     * @returns URL для редиректа пользователя
     */
    const handlePaymentCallback = async (params: { orderNum: string, transactionId: string }): Promise<PaymentResult<string>> => {

        return {
            success: true,
            data: (await handleWebpayReturn(params.orderNum, params.transactionId)).data || ''
        };
    };

    /**
     * Обрабатывает успешный возврат от WebPay
     * @param orderNum Номер заказа
     * @param transactionId ID транзакции
     * @returns URL для редиректа пользователя
     */
    const handleWebpayReturn = async (orderNum: string, transactionId: string): Promise<PaymentResult<string>> => {
        await updatePaymentStatus(orderNum, PaymentStatus.Completed);

        return {
            success: true,
            data: `${FRONTEND_URL}/payment/success`
        };

    };

    /**
     * Обрабатывает отмену платежа от WebPay
     * @param orderNum Номер заказа
     * @returns URL для редиректа пользователя
     */
    const handleWebpayCancel = async (orderNum: string): Promise<PaymentResult<string>> => {
        await updatePaymentStatus(orderNum, PaymentStatus.Canceled);

        return {
            success: true,
            data: `${FRONTEND_URL}/payment/cancel`
        };
    };

    /**
     * Обрабатывает вебхук от WebPay
     * @param data Данные вебхука
     * @param signature Подпись вебхука
     * @returns Результат обработки вебхука
     */
    const processPaymentWebhook = async (data: any, signature: string): Promise<PaymentResult<boolean>> => {

        // Проверяем подпись вебхука
        if (!validatePaymentSignature(data, signature)) {
            logger.error('Invalid WebPay webhook signature', { data, signature });
            throw new Error('Invalid WebPay webhook signature');
        }

        // Обновляем статус платежа на основе данных вебхука
        const orderNum = data.wsb_order_num;
        const status = data.payment_status || PaymentStatus.Completed;

        await updatePaymentStatus(orderNum, status);

        return {
            success: true,
            data: true
        };
    };

    /**
     * Проверяет статус платежа
     * @param paymentId ID платежа
     * @returns Статус платежа
     */
    const checkPaymentStatus = async (paymentId: string): Promise<PaymentResult<PaymentStatus>> => {
        // Здесь должна быть логика получения статуса платежа из БД или от WebPay
        // Для примера вернем успешный статус
        return {
            success: true,
            data: PaymentStatus.Completed
        };
    };


    /**
     * Очищает платеж
     * @param paymentId ID платежа
     * @returns Результат очистки
     */
    const cleanupPayment = async (paymentId: string): Promise<PaymentResult<boolean>> => {
        logger.info('Cleaning up WebPay payment', { paymentId });
        const result = await cleanupPendingCryptoPayment(paymentId);
        return {
            success: true,
            data: result.data || false
        };
    };

    /**
     * Обрабатывает возврат средств
     * @param params Параметры возврата
     * @returns Результат операции возврата
     */
    const refundPayment = async (params: any): Promise<PaymentResult<any>> => {
        // Здесь будет логика возврата средств

        return {
            success: true,
            data: { success: true }
        };
    };

    /**
     * Получает детальную информацию о платеже
     * @param paymentId ID платежа
     * @returns Детальная информация о платеже
     */
    const getPaymentDetails = async (paymentId: string): Promise<PaymentResult<any>> => {
        // Здесь будет логика получения информации о платеже

        return {
            success: true,
            data: { id: paymentId, status: PaymentStatus.Completed }
        };
    };

    return {
        initPayment,
        initWebpayPayment: initWebpayStrategyPayment,
        validatePaymentSignature,
        validateWebpaySignature,
        handlePaymentCallback,
        handleWebpayReturn,
        handleWebpayCancel,
        processPaymentWebhook,
        checkPaymentStatus,
        refundPayment,
        getPaymentDetails
    };
}