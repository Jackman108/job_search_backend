import { ENV } from './base.config.js';
import { PaymentMethod } from '@interface';

/**
 * Флаг использования мок-провайдера для режима разработки
 */
export const USE_MOCK_PROVIDER = ENV.isDevelopment;

/**
 * URL для редиректов клиента после обработки платежей
 */
export const FRONTEND_URL = process.env.DOMAIN_URL || 'http://localhost:3000';

/**
 * Общие настройки для всех платежных систем
 */
export const PAYMENT_CONFIG = {
    // Таймаут операции платежа в секундах (30 минут)
    operationTimeout: parseInt(process.env.PAYMENT_OPERATION_TIMEOUT || '1800', 10),

    // Настройки для моковых платежей в режиме разработки
    mockPayment: {
        // Таймаут для автоматического подтверждения мок-платежа (1 минута)
        confirmationTimeout: parseInt(process.env.MOCK_PAYMENT_TIMEOUT || '60', 10),

        // Вероятность успешного платежа в режиме разработки (от 0 до 1)
        successRate: parseFloat(process.env.MOCK_PAYMENT_SUCCESS_RATE || '0.9')
    },

    // Доступные платежные системы
    availablePaymentMethods: ['webpay', 'crypto'],

    // Настройки повторных попыток
    retry: {
        maxRetries: parseInt(process.env.PAYMENT_MAX_RETRIES || '3', 10),
        retryDelay: parseInt(process.env.PAYMENT_RETRY_DELAY || '5000', 10) // в миллисекундах
    },

    // Настройки логирования платежей
    logging: {
        enabled: process.env.PAYMENT_LOGGING_ENABLED !== 'false',
        logWebhooks: process.env.PAYMENT_LOG_WEBHOOKS !== 'false',
        logLevel: process.env.PAYMENT_LOG_LEVEL || 'info'
    }
};

/**
 * Список активных платежных методов
 */
export const AVAILABLE_PAYMENT_METHODS: PaymentMethod[] = [
    PaymentMethod.WebPay,
    PaymentMethod.Crypto
];

/**
 * Проверяет, доступен ли указанный метод оплаты
 * @param method Метод оплаты
 * @returns true если метод доступен, иначе false
 */
export const isPaymentMethodAvailable = (method: string): boolean => {
    const methodLower = method.toLowerCase();
    return AVAILABLE_PAYMENT_METHODS.some(m =>
        m.toLowerCase() === methodLower
    );
};

