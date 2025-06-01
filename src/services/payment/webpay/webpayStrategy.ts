/**
 * Стратегия для обработки платежей через WebPay
 * Реализует интерфейс PaymentStrategy для WebPay
 */
import { InitWebPayPaymentParams, PaymentResult, PaymentStatus, WebpayInitResult, WebPayStrategy } from '@interface';
import { cleanupPendingCryptoPayment, cleanupPendingWebPayPayment, createPaymentErrorHandler, initWebpayFiatPayment, updatePaymentStatus, validateWebpaySignature, withPaymentErrorHandling } from '@services';
import { logger } from '@utils';

import { FRONTEND_URL } from '@config';

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

            // Вызов сервиса инициализации WebPay
            const result = await initWebpayFiatPayment({
                userId: params.userId,
                paymentId: params.paymentId,
                currency: params.currency,
                amount: params.amount,
                paymentMethod: params.paymentMethod

            });

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to initialize WebPay payment');
            }

            return {
                success: true,
                data: {
                    wt: result.data.wt || '',
                    redirectUrl: result.data.redirectUrl,
                    orderNum: result.data.orderNum
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
        return validateWebpaySignature(data, signature);
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
                // Любая логика очистки платежа
                return true;
            },
            handleError,
            'cleanupPayment'
        );
    };

    /**
     * Удаляет незавершенный WebPay платеж с тем же subscription_id
     * @param subscriptionId ID подписки
     * @returns Результат удаления
     */
    const deletePendingWebPayPayment = async (subscriptionId: string): Promise<PaymentResult<boolean>> => {
        return withPaymentErrorHandling(
            async () => {
                const result = await cleanupPendingWebPayPayment(subscriptionId);
                return result.data || false;
            },
            handleError,
            'deletePendingWebPayPayment'
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
        deletePendingWebPayPayment,
        cleanupPayment
    };
}; 