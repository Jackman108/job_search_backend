/**
 * Интеграционный сервис для работы с платежами
 * Использует паттерн стратегии для переключения между разными платежными системами
 */
import {
    CryptoPaymentDetails,
    InitCryptoPaymentParams,
    InitWebPayPaymentParams,
    PaymentMethod,
    PaymentResult,
    WebpayInitResult
} from '@interface';
import { createPaymentError, createPaymentStrategyContext } from '@integrations';
import { logger } from '@utils';
import { createPaymentStrategyFactory } from './paymentStrategyFactory.js';

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

        // Обрабатываем вебхук напрямую через стратегию
        return await strategy.processPaymentWebhook(data, signature);
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
): Promise<PaymentResult<any>> => {
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

        // Проверяем статус платежа напрямую через стратегию
        return await strategy.checkPaymentStatus(paymentId);
    } catch (error) {
        return createPaymentError(error, 'Error checking payment status');
    }
}; 