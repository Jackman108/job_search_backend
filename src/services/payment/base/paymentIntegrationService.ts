/**
 * Интеграционный сервис для работы с платежами
 * Использует паттерн стратегии для переключения между разными платежными системами
 */
import {
    CryptoPaymentDetails,
    CryptoPaymentStrategy,
    InitCryptoPaymentParams,
    InitWebPayPaymentParams,
    PaymentResult,
    PaymentStrategy,
    WebpayInitResult,
    WebPayStrategy
} from '@interface';
import { createPaymentStrategyContext } from '@services';
import { logger } from '@utils';

// Импортируем функции создания стратегий динамически
const getWebpayStrategy = async (): Promise<WebPayStrategy> => {
    const { createWebPayStrategy } = await import('../webpay/webpayStrategy.js');
    return createWebPayStrategy();
};

const getCryptoStrategy = async (): Promise<CryptoPaymentStrategy> => {
    const { createCryptoStrategy } = await import('../crypto/cryptoStrategy.js');
    return createCryptoStrategy();
};

// Создаем контекст стратегии платежей
const paymentContext = createPaymentStrategyContext();

/**
 * Инициализирует платеж с использованием WebPay стратегии
 * @param params Параметры платежа WebPay
 * @returns Результат инициализации платежа
 */
export const initializeWebpayPayment = async (params: InitWebPayPaymentParams): Promise<PaymentResult<WebpayInitResult>> => {
    try {
        logger.info('Initializing WebPay payment through strategy', { params });

        // Получаем стратегию WebPay
        const webpayStrategy = await getWebpayStrategy();

        // Устанавливаем стратегию WebPay
        paymentContext.setStrategy(webpayStrategy);

        // Выполняем платеж через контекст
        return await paymentContext.executePayment(params);
    } catch (error) {
        logger.error('Error initializing WebPay payment', { error, params });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error initializing WebPay payment'
        };
    }
};

/**
 * Инициализирует криптоплатеж с использованием Crypto стратегии
 * @param params Параметры криптоплатежа
 * @returns Результат инициализации криптоплатежа
 */
export const initializeCryptoPayment = async (params: InitCryptoPaymentParams): Promise<PaymentResult<CryptoPaymentDetails>> => {
    try {
        logger.info('Initializing crypto payment through strategy', { params });

        // Получаем стратегию Crypto
        const cryptoStrategy = await getCryptoStrategy();

        // Устанавливаем стратегию Crypto
        paymentContext.setStrategy(cryptoStrategy);

        // Выполняем платеж через контекст
        return await paymentContext.executePayment(params);
    } catch (error) {
        logger.error('Error initializing crypto payment', { error, params });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error initializing crypto payment'
        };
    }
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

        // Выбираем стратегию в зависимости от метода оплаты
        let strategy: PaymentStrategy;

        switch (paymentMethod.toLowerCase()) {
            case 'webpay':
                strategy = await getWebpayStrategy();
                break;
            case 'crypto':
                strategy = await getCryptoStrategy();
                break;
            default:
                return {
                    success: false,
                    error: `Unsupported payment method: ${paymentMethod}`
                };
        }

        // Устанавливаем выбранную стратегию
        paymentContext.setStrategy(strategy);

        // Обрабатываем вебхук напрямую через стратегию
        return await strategy.processPaymentWebhook(data, signature);
    } catch (error) {
        logger.error('Error processing payment webhook', { error, paymentMethod });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error processing payment webhook'
        };
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

        // Выбираем стратегию в зависимости от метода оплаты
        let strategy: PaymentStrategy;

        switch (paymentMethod.toLowerCase()) {
            case 'webpay':
                strategy = await getWebpayStrategy();
                break;
            case 'crypto':
                strategy = await getCryptoStrategy();
                break;
            default:
                return {
                    success: false,
                    error: `Unsupported payment method: ${paymentMethod}`
                };
        }

        // Устанавливаем выбранную стратегию
        paymentContext.setStrategy(strategy);

        // Проверяем статус платежа напрямую через стратегию
        return await strategy.checkPaymentStatus(paymentId);
    } catch (error) {
        logger.error('Error checking payment status', { error, paymentMethod, paymentId });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error checking payment status'
        };
    }
}; 