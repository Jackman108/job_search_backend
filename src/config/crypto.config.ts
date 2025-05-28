// config/crypto.config.ts
import { NowPaymentsConfig } from '@interface';

/**
 * Конфигурация для NOWPayments API
 */
export const nowPaymentsConfig: NowPaymentsConfig = {
    apiKey: process.env.NOWPAYMENTS_API_KEY || '',
    ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',
    baseUrl: process.env.NODE_ENV === 'production'
        ? 'https://api.nowpayments.io/v1'
        : 'https://api-sandbox.nowpayments.io/v1',
    paymentTimeout: parseInt(process.env.CRYPTO_PAYMENT_TIMEOUT || '86400'),
    minAmount: parseInt(process.env.CRYPTO_MIN_AMOUNT || '1'),
    maxAmount: parseInt(process.env.CRYPTO_MAX_AMOUNT || '10000'),
    defaultCurrency: process.env.CRYPTO_DEFAULT_CURRENCY || 'USDT',
    maxRetries: parseInt(process.env.CRYPTO_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.CRYPTO_RETRY_DELAY || '1000')
};

/**
 * Настройки для криптоплатежей
 */
export const CRYPTO_CONFIG = {
    // Поддерживаемые сети
    supportedNetworks: ['BTC', 'ETH', 'USDT', 'BNB'],

    // Время ожидания подтверждения транзакции (в секундах)
    confirmationTimeout: parseInt(process.env.CRYPTO_CONFIRMATION_TIMEOUT || '1800'),

    // URL для вебхуков
    webhookUrl: `${process.env.API_URL || 'http://localhost:8000'}/api/crypto/webhook`,

    // Параметры для автоматической проверки статуса платежа
    statusCheck: {
        interval: parseInt(process.env.CRYPTO_STATUS_CHECK_INTERVAL || '60000'), // в миллисекундах
        maxAttempts: parseInt(process.env.CRYPTO_STATUS_CHECK_ATTEMPTS || '10')
    }
};