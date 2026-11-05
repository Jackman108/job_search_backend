/**
 * Стратегия для обработки криптоплатежей
 */
import {
    checkUserCryptoPaymentStatus,
    getCryptoPaymentById,
    initCryptoDirectPayment,
    processWebhook,
    validateNowPaymentsSignature
} from '@integrations';
import {
    CryptoPaymentDetails,
    PaymentResult,
    PaymentStatus,
    PaymentStrategy,
    RefundPaymentParams
} from '@interface';

/**
 * Создает стратегию для работы с криптоплатежами
 */
export const createCryptoStrategy = (): PaymentStrategy => {
    /**
     * Инициализирует криптоплатеж
     */
    const initPayment = async (params: any): Promise<PaymentResult<CryptoPaymentDetails>> => {
        return initCryptoDirectPayment(params);
    };

    /**
     * Проверяет статус криптоплатежа
     */
    const checkPaymentStatus = async (paymentId: string): Promise<PaymentResult<PaymentStatus>> => {
        try {
            const status = await checkUserCryptoPaymentStatus('', paymentId);
            return {
                success: true,
                data: status
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    };

    /**
     * Получает детали криптоплатежа
     */
    const getPaymentDetails = async (paymentId: string): Promise<PaymentResult<CryptoPaymentDetails>> => {
        try {
            const details = await getCryptoPaymentById(paymentId);
            return {
                success: true,
                data: details
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    };

    /**
     * Обрабатывает вебхук от платежной системы
     */
    const processPaymentWebhook = async (webhookData: any, signature: string): Promise<PaymentResult<boolean>> => {
        return processWebhook(webhookData, signature);
    };

    /**
     * Проверяет подпись вебхука
     */
    const validatePaymentSignature = (data: any, signature: string): boolean => {
        return validateNowPaymentsSignature(data, signature);
    };

    /**
     * Обрабатывает возврат платежа
     */
    const refundPayment = async (params: RefundPaymentParams): Promise<PaymentResult<any>> => {
        // Возвраты для криптоплатежей не поддерживаются автоматически
        // Необходимо ручное вмешательство администратора
        return {
            success: false,
            error: 'Crypto payments do not support automatic refunds'
        };
    };

    /**
     * Обрабатывает callback платежа
     */
    const handlePaymentCallback = async (params: any): Promise<PaymentResult<string>> => {
        return {
            success: true,
            data: ''
        };
    };

    // Возвращаем публичный интерфейс стратегии
    return {
        initPayment,
        checkPaymentStatus,
        getPaymentDetails,
        processPaymentWebhook,
        validatePaymentSignature,
        refundPayment,
        handlePaymentCallback
    };
};

// Экспортируем экземпляр стратегии
export const cryptoStrategy = createCryptoStrategy(); 