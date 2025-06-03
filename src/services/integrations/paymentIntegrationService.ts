/**
 * Интеграционный сервис для работы с платежами
 * Использует паттерн стратегии для переключения между разными платежными системами
 */
import {
    createPaymentError,
    createPaymentStrategyContext
} from '@integrations';
import {
    CryptoPaymentDetails,
    InitCryptoPaymentParams,
    InitWebPayPaymentParams,
    PaymentMethod,
    PaymentResult,
    PaymentStatus,
    RefundPaymentParams,
    WebpayInitResult
} from '@interface';
import { logger } from '@utils';
import { createPaymentStrategyFactory } from './paymentStrategyFactory';



// Создаем фабрику стратегий и контекст
const paymentStrategyFactory = createPaymentStrategyFactory();
const paymentContext = createPaymentStrategyContext();

/**
 * Выполняет платеж с использованием указанной стратегии
 * @param strategyType Тип стратегии платежа
 * @param params Параметры платежа
 * @returns Результат выполнения платежа
 */
const executePaymentWithStrategy = async <T>(
    strategyType: string,
    params: any,
    logLabel: string
): Promise<PaymentResult<T>> => {
    try {
        logger.info(`Initializing ${logLabel} payment through strategy`, { params });

        // Получаем и устанавливаем стратегию
        const strategy = await paymentStrategyFactory.getStrategy(strategyType);
        paymentContext.setStrategy(strategy);

        // Выполняем платеж через контекст
        return await paymentContext.executePayment(params) as PaymentResult<T>;
    } catch (error) {
        return createPaymentError<T>(error, `Error initializing ${logLabel} payment`);
    }
};

/**
 * Инициализирует платеж с использованием WebPay стратегии
 * @param params Параметры платежа WebPay
 * @returns Результат инициализации платежа
 */
export const initializeWebpayPayment = async (
    params: InitWebPayPaymentParams
): Promise<PaymentResult<WebpayInitResult>> => {
    return executePaymentWithStrategy<WebpayInitResult>(PaymentMethod.WebPay, params, 'WebPay');
};

/**
 * Инициализирует криптоплатеж с использованием Crypto стратегии
 * @param params Параметры криптоплатежа
 * @returns Результат инициализации криптоплатежа
 */
export const initializeCryptoPayment = async (
    params: InitCryptoPaymentParams
): Promise<PaymentResult<CryptoPaymentDetails>> => {
    return executePaymentWithStrategy<CryptoPaymentDetails>(PaymentMethod.Crypto, params, 'crypto');
};

/**
 * Обрабатывает вебхук от платежной системы с использованием соответствующей стратегии
 * @param paymentMethod Метод оплаты (webpay, crypto и т.д.)
 * @param data Данные вебхука
 * @param signature Подпись вебхука
 * @returns Результат обработки вебхука
 */
export const processPaymentWebhook = async (
    paymentMethod: string,
    data: any,
    signature: string
): Promise<PaymentResult<boolean>> => {
    try {
        logger.info('Processing payment webhook', { paymentMethod, data });

        // Проверяем поддержку метода
        if (!paymentStrategyFactory.supportsMethod(paymentMethod)) {
            return {
                success: false,
                error: `Unsupported payment method: ${paymentMethod}`
            };
        }

        // Получаем стратегию для указанного метода
        const strategy = await paymentStrategyFactory.getStrategy(paymentMethod);
        paymentContext.setStrategy(strategy);

        // Обрабатываем вебхук через контекст
        return await paymentContext.validateWebhook(data, signature);
    } catch (error) {
        return createPaymentError<boolean>(error, 'Error processing payment webhook');
    }
};

/**
 * Проверяет статус платежа с использованием соответствующей стратегии
 * @param paymentMethod Метод оплаты (webpay, crypto и т.д.)
 * @param paymentId ID платежа
 * @returns Результат проверки статуса платежа
 */
export const checkPaymentStatus = async (
    paymentMethod: string,
    paymentId: string
): Promise<PaymentResult<PaymentStatus>> => {
    try {
        logger.info('Checking payment status', { paymentMethod, paymentId });

        // Проверяем поддержку метода
        if (!paymentStrategyFactory.supportsMethod(paymentMethod)) {
            return {
                success: false,
                error: `Unsupported payment method: ${paymentMethod}`
            };
        }

        // Получаем стратегию для указанного метода
        const strategy = await paymentStrategyFactory.getStrategy(paymentMethod);
        paymentContext.setStrategy(strategy);

        // Проверяем статус платежа через контекст
        return await paymentContext.checkStatus(paymentId);
    } catch (error) {
        return createPaymentError<PaymentStatus>(error, 'Error checking payment status');
    }
};

/**
 * Выполняет возврат средств (рефанд) с использованием соответствующей стратегии
 * @param paymentMethod Метод оплаты (webpay, crypto и т.д.)
 * @param params Параметры возврата средств
 * @returns Результат операции возврата
 */
export const refundPayment = async (
    paymentMethod: string,
    params: RefundPaymentParams
): Promise<PaymentResult<any>> => {
    try {
        logger.info('Processing refund', { paymentMethod, params });

        // Проверяем поддержку метода
        if (!paymentStrategyFactory.supportsMethod(paymentMethod)) {
            return {
                success: false,
                error: `Unsupported payment method: ${paymentMethod}`
            };
        }

        // Получаем стратегию для указанного метода
        const strategy = await paymentStrategyFactory.getStrategy(paymentMethod);
        paymentContext.setStrategy(strategy);

        // Выполняем рефанд через контекст
        return await paymentContext.refundPayment(params);
    } catch (error) {
        return createPaymentError(error, 'Error processing refund');
    }
};

/**
 * Получает детальную информацию о платеже с использованием соответствующей стратегии
 * @param paymentMethod Метод оплаты (webpay, crypto и т.д.)
 * @param paymentId ID платежа
 * @returns Детальная информация о платеже
 */
export const getPaymentDetails = async (
    paymentMethod: string,
    paymentId: string
): Promise<PaymentResult<any>> => {
    try {
        logger.info('Getting payment details', { paymentMethod, paymentId });

        // Проверяем поддержку метода
        if (!paymentStrategyFactory.supportsMethod(paymentMethod)) {
            return {
                success: false,
                error: `Unsupported payment method: ${paymentMethod}`
            };
        }

        // Получаем стратегию для указанного метода
        const strategy = await paymentStrategyFactory.getStrategy(paymentMethod);
        paymentContext.setStrategy(strategy);

        // Получаем детали платежа через контекст
        return await paymentContext.getPaymentDetails(paymentId);
    } catch (error) {
        return createPaymentError(error, 'Error getting payment details');
    }
};

/**
 * Возвращает список доступных методов оплаты
 * @returns Список доступных методов оплаты
 */
export const getAvailablePaymentMethods = (): string[] => {
    return paymentStrategyFactory.getAvailableMethods();
}; 