/**
 * Стратегия для обработки платежей через WebPay
 * Реализует интерфейс PaymentStrategy для WebPay
 */
import { FRONTEND_URL, WEBPAY_SECRET_KEY } from '@config';
import {
    cleanupPendingCryptoPayment,
    createPaymentErrorHandler,
    formatAmount,
    generatePaymentId,
    initWebpayFiatPayment,
    normalizeDataForSignature,
    updatePaymentStatus,
    validateWebpaySignature,
    verifyHmacSignature,
    withPaymentErrorHandling
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
    // Создаем обработчик ошибок для WebPay
    const handleError = createPaymentErrorHandler('WebPay');

    /**
     * Инициализирует платеж через WebPay
     * @param params Параметры платежа
     * @returns Результат инициализации платежа
     */
    const initPayment = async (params: InitWebPayPaymentParams): Promise<PaymentResult<WebpayInitResult>> => {
        logger.info('Initializing WebPay payment', { params });

        try {
            // Проверяем, если есть незавершенные криптоплатежи, удаляем их
            await cleanupPendingCryptoPayment(params.paymentId);

            // Инициализация платежа через WebPay
            return await initWebpayStrategyPayment(params);
        } catch (error) {
            return handleError(error, 'initPayment');
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
            return handleError(error, 'initWebpayStrategyPayment');
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
        return verifyHmacSignature(normalizedData, signature, WEBPAY_SECRET_KEY, 'sha1');
    };

    /**
     * Обрабатывает успешный возврат от WebPay
     * @param params Параметры возврата
     * @returns URL для редиректа пользователя
     */
    const handlePaymentCallback = async (params: { orderNum: string, transactionId: string }): Promise<PaymentResult<string>> => {
        return withPaymentErrorHandling(
            async () => {
                return (await handleWebpayReturn(params.orderNum, params.transactionId)).data || '';
            },
            handleError,
            'handlePaymentCallback'
        );
    };

    /**
     * Обрабатывает успешный возврат от WebPay
     * @param orderNum Номер заказа
     * @param transactionId ID транзакции
     * @returns URL для редиректа пользователя
     */
    const handleWebpayReturn = async (orderNum: string, transactionId: string): Promise<PaymentResult<string>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Handling WebPay return', { orderNum, transactionId });

                // Обновляем статус платежа
                await updatePaymentStatus(orderNum, PaymentStatus.Completed);

                return `${FRONTEND_URL}/payment/success`;
            },
            handleError,
            'handleWebpayReturn'
        );
    };

    /**
     * Обрабатывает отмену платежа от WebPay
     * @param orderNum Номер заказа
     * @returns URL для редиректа пользователя
     */
    const handleWebpayCancel = async (orderNum: string): Promise<PaymentResult<string>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Handling WebPay cancel', { orderNum });

                // Обновляем статус платежа
                await updatePaymentStatus(orderNum, PaymentStatus.Canceled);

                return `${FRONTEND_URL}/payment/cancel`;
            },
            handleError,
            'handleWebpayCancel'
        );
    };

    /**
     * Обрабатывает вебхук от WebPay
     * @param data Данные вебхука
     * @param signature Подпись вебхука
     * @returns Результат обработки вебхука
     */
    const processPaymentWebhook = async (data: any, signature: string): Promise<PaymentResult<boolean>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Processing WebPay webhook', { data });

                // Проверяем подпись вебхука
                if (!validatePaymentSignature(data, signature)) {
                    logger.error('Invalid WebPay webhook signature', { data, signature });
                    throw new Error('Invalid WebPay webhook signature');
                }

                // Обновляем статус платежа на основе данных вебхука
                const orderNum = data.wsb_order_num;
                const status = data.payment_status || PaymentStatus.Completed;

                await updatePaymentStatus(orderNum, status);

                return true;
            },
            handleError,
            'processPaymentWebhook'
        );
    };

    /**
     * Проверяет статус платежа
     * @param paymentId ID платежа
     * @returns Статус платежа
     */
    const checkPaymentStatus = async (paymentId: string): Promise<PaymentResult<PaymentStatus>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Checking WebPay payment status', { paymentId });
                // Здесь должна быть логика получения статуса платежа из БД или от WebPay
                // Для примера вернем успешный статус
                return PaymentStatus.Completed;
            },
            handleError,
            'checkPaymentStatus'
        );
    };

    /**
     * Очищает платеж
     * @param paymentId ID платежа
     * @returns Результат очистки
     */
    const cleanupPayment = async (paymentId: string): Promise<PaymentResult<boolean>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Cleaning up WebPay payment', { paymentId });
                const result = await cleanupPendingCryptoPayment(paymentId);
                return result.data || false;
            },
            handleError,
            'deletePendingCryptoPayment'
        );
    };

    /**
     * Обрабатывает возврат средств
     * @param params Параметры возврата
     * @returns Результат операции возврата
     */
    const refundPayment = async (params: any): Promise<PaymentResult<any>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Processing WebPay refund', { params });
                // Здесь будет логика возврата средств
                return { success: true };
            },
            handleError,
            'refundPayment'
        );
    };

    /**
     * Получает детальную информацию о платеже
     * @param paymentId ID платежа
     * @returns Детальная информация о платеже
     */
    const getPaymentDetails = async (paymentId: string): Promise<PaymentResult<any>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Getting WebPay payment details', { paymentId });
                // Здесь будет логика получения информации о платеже
                return { id: paymentId, status: PaymentStatus.Completed };
            },
            handleError,
            'getPaymentDetails'
        );
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
}; 