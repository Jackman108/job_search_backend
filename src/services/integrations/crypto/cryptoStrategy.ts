/**
 * Стратегия для обработки криптоплатежей
 * Реализует интерфейс PaymentStrategy для криптоплатежей
 */
import { nowPaymentsConfig } from '@config';
import {
    CryptoPaymentDetails,
    CryptoPaymentStrategy,
    InitCryptoPaymentParams,
    PaymentResult,
    PaymentStatus
} from '@interface';

import {
    cleanupPendingCryptoPayment,
    cleanupPendingWebPayPayment,
    createDataHash,
    createPaymentError,
    createPaymentErrorHandler,
    getCryptoPaymentById,
    initCryptoDirectPayment,
    mapCryptoStatus,
    normalizeDataForSignature,
    updatePaymentStatus,
    verifyHmacSignature,
    withPaymentErrorHandling
} from '@integrations';

import { logger } from '@utils';

/**
 * Создание стратегии платежей для криптовалют
 * Реализует интерфейс PaymentStrategy
 */
export const createCryptoStrategy = (): CryptoPaymentStrategy => {
    // Создаем обработчик ошибок для Crypto
    const handleError = createPaymentErrorHandler('Crypto');

    /**
     * Инициализирует криптоплатеж
     * @param params Параметры криптоплатежа
     * @returns Результат инициализации криптоплатежа
     */
    const initPayment = async (params: InitCryptoPaymentParams): Promise<PaymentResult<CryptoPaymentDetails>> => {
        logger.info('Initializing crypto payment', { params });

        try {
            // Проверяем, если есть незавершенные webpay платежи, удаляем их
            await cleanupPendingWebPayPayment(params.paymentId);

            // Инициализация криптоплатежа
            return await initCryptoStrategyPayment(params);
        } catch (error) {
            return createPaymentError(error, 'Failed to initialize crypto payment');
        }
    };

    /**
     * Инициализирует криптоплатеж с детальными параметрами
     * @param params Параметры криптоплатежа
     * @returns Результат инициализации криптоплатежа
     */
    const initCryptoStrategyPayment = async (params: InitCryptoPaymentParams): Promise<PaymentResult<CryptoPaymentDetails>> => {
        try {
            logger.info('Initializing crypto payment details', { params });

            // Нормализуем параметры для подписи
            const normalizedParams = normalizeDataForSignature(params, {
                sortKeys: true,
                excludeEmpty: true
            });

            // Вызов сервиса инициализации криптоплатежа
            const result = await initCryptoDirectPayment({
                paymentId: params.paymentId,
                amount: params.amount,
                currency: params.currency || nowPaymentsConfig.defaultCurrency,
                network: params.network || 'BTC',
                userId: params.userId
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to initialize crypto payment');
            }

            return {
                success: true,
                data: result.data
            };
        } catch (error) {
            return createPaymentError(error, 'Failed to initialize crypto payment');
        }
    };

    /**
     * Проверяет подпись вебхука от криптопровайдера
     * @param data Данные вебхука
     * @param signature Подпись вебхука
     * @returns true если подпись валидна, иначе false
     */
    const validatePaymentSignature = (data: any, signature: string): boolean => {
        if (!nowPaymentsConfig.ipnSecret) {
            logger.error('Missing crypto IPN secret for signature validation');
            return false;
        }

        // Нормализуем данные для проверки подписи
        const normalizedData = normalizeDataForSignature(data, {
            excludeKeys: ['signature', 'hmac']
        });

        // Создаем хеш данных для сравнения с подписью
        const dataHash = createDataHash(normalizedData, 'sha256');

        // Проверяем HMAC подпись
        return verifyHmacSignature(
            dataHash,
            signature,
            nowPaymentsConfig.ipnSecret,
            'sha512'
        );
    };

    /**
     * Реализация функции validateCryptoWebhookSignature для совместимости с интерфейсом
     */
    const validateCryptoWebhookSignature = (data: any, signature: string): boolean => {
        return validatePaymentSignature(data, signature);
    };

    /**
     * Получает детали криптоплатежа
     * @param paymentId ID платежа
     * @returns Детали криптоплатежа
     */
    const getCryptoPaymentDetails = async (paymentId: string): Promise<PaymentResult<CryptoPaymentDetails>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Getting crypto payment details', { paymentId });

                // Здесь должен быть вызов сервиса для получения деталей платежа
                const paymentDetails = await getCryptoPaymentById(paymentId);
                return paymentDetails;
            },
            handleError,
            'getCryptoPaymentDetails'
        );
    };

    /**
     * Обрабатывает callback от пользователя
     * @param params Параметры callback
     * @returns Результат обработки callback
     */
    const handlePaymentCallback = async (params: any): Promise<PaymentResult<string>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Handling crypto payment callback', { params });
                // Логика обработки возврата от пользователя
                return 'Crypto payment callback handled successfully';
            },
            handleError,
            'handlePaymentCallback'
        );
    };

    /**
     * Обрабатывает вебхук от криптопровайдера
     * @param data Данные вебхука
     * @param signature Подпись вебхука
     * @returns Результат обработки вебхука
     */
    const processPaymentWebhook = async (data: any, signature: string): Promise<PaymentResult<boolean>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Processing crypto payment webhook', { data });

                // Проверяем подпись вебхука
                if (!validatePaymentSignature(data, signature)) {
                    logger.error('Invalid crypto webhook signature', { data, signature });
                    throw new Error('Invalid crypto webhook signature');
                }

                // Обновляем статус платежа на основе данных вебхука
                const paymentId = data.payment_id;
                const status = mapCryptoStatus(data.payment_status);

                await updatePaymentStatus(paymentId, status);
                return true;
            },
            handleError,
            'processPaymentWebhook'
        );
    };

    /**
     * Проверяет статус криптоплатежа
     * @param paymentId ID платежа
     * @returns Статус платежа
     */
    const checkPaymentStatus = async (paymentId: string): Promise<PaymentResult<PaymentStatus>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Checking crypto payment status', { paymentId });
                const result = await checkCryptoPaymentStatus(paymentId);
                if (!result.success || !result.data) {
                    throw new Error(result.error || 'Failed to check crypto payment status');
                }
                return result.data;
            },
            handleError,
            'checkPaymentStatus'
        );
    };

    /**
     * Проверяет статус криптоплатежа
     * @param paymentId ID платежа
     * @returns Статус платежа
     */
    const checkCryptoPaymentStatus = async (paymentId: string): Promise<PaymentResult<PaymentStatus>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Checking crypto payment status details', { paymentId });

                // Получаем детали платежа
                const result = await getCryptoPaymentDetails(paymentId);

                if (!result.success || !result.data) {
                    throw new Error('Failed to get crypto payment details');
                }

                return result.data.payment_status;
            },
            handleError,
            'checkCryptoPaymentStatus'
        );
    };

    /**
     * Удаляет незавершенный WebPay платеж с тем же subscription_id
     * @param subscriptionId ID подписки
     * @returns Результат удаления
     */
    const deletePendingCryptoPayment = async (subscriptionId: string): Promise<PaymentResult<boolean>> => {
        return withPaymentErrorHandling(
            async () => {
                logger.info('Deleting pending crypto payment', { subscriptionId });
                // Вызов сервиса для удаления криптоплатежа
                const result = await cleanupPendingCryptoPayment(subscriptionId);
                return result.data || false;
            },
            handleError,
            'deletePendingCryptoPayment'
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
                logger.info('Cleaning up crypto payment', { paymentId });
                // Любая логика очистки платежа
                return true;
            },
            handleError,
            'cleanupPayment'
        );
    };

    return {
        initPayment,
        initCryptoPayment: initCryptoStrategyPayment,
        validatePaymentSignature,
        validateCryptoWebhookSignature,
        handlePaymentCallback,
        processPaymentWebhook,
        checkPaymentStatus,
        getCryptoPaymentDetails,
        deletePendingCryptoPayment,
        cleanupPayment
    };
}; 