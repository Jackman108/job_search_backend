/**
 * Фабрика для создания платежных стратегий
 * Позволяет выбирать подходящую стратегию по типу платежа
 */
import { PaymentMethod, PaymentStrategy } from '@interface';
import { logger } from '@utils';

/**
 * Регистрирует новую стратегию в фабрике
 * @param strategyMap Карта стратегий
 * @param method Метод оплаты
 * @param factoryFn Функция для создания стратегии
 */
const registerStrategy = (
    strategyMap: Map<string, () => Promise<PaymentStrategy>>,
    method: PaymentMethod,
    factoryFn: () => Promise<PaymentStrategy>
): void => {
    strategyMap.set(method.toLowerCase(), factoryFn);
};

/**
 * Создает фабрику платежных стратегий
 * @returns Объект фабрики стратегий
 */
export const createPaymentStrategyFactory = () => {
    // Карта для хранения функций создания стратегий
    const strategies = new Map<string, () => Promise<PaymentStrategy>>();

    // Регистрируем стратегии платежей
    registerStrategy(strategies, PaymentMethod.WebPay, async () => {
        const { createWebPayStrategy } = await import('./webpay/webpayStrategy.js');
        return createWebPayStrategy();
    });

    registerStrategy(strategies, PaymentMethod.Crypto, async () => {
        const { createCryptoStrategy } = await import('./crypto/cryptoStrategy.js');
        return createCryptoStrategy();
    });

    /**
     * Получает стратегию по методу оплаты
     * @param method Метод оплаты
     * @returns Платежная стратегия
     */
    const getStrategy = async (method: string): Promise<PaymentStrategy> => {
        const methodLower = method.toLowerCase();
        const strategyFactory = strategies.get(methodLower);

        if (!strategyFactory) {
            logger.error(`Unsupported payment method: ${method}`);
            throw new Error(`Unsupported payment method: ${method}`);
        }

        return await strategyFactory();
    };

    /**
     * Проверяет поддержку метода оплаты
     * @param method Метод оплаты
     * @returns true если метод поддерживается
     */
    const supportsMethod = (method: string): boolean => {
        return strategies.has(method.toLowerCase());
    };

    /**
     * Добавляет новую стратегию в фабрику
     * @param method Метод оплаты
     * @param factoryFn Функция создания стратегии
     */
    const registerNewStrategy = (
        method: string,
        factoryFn: () => Promise<PaymentStrategy>
    ): void => {
        strategies.set(method.toLowerCase(), factoryFn);
        logger.info(`Registered new payment strategy: ${method}`);
    };

    /**
     * Возвращает список доступных методов оплаты
     * @returns Массив доступных методов
     */
    const getAvailableMethods = (): string[] => {
        return Array.from(strategies.keys());
    };

    // Возвращаем публичный интерфейс фабрики
    return {
        getStrategy,
        supportsMethod,
        registerNewStrategy,
        getAvailableMethods
    };
}; 