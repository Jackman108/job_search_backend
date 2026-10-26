// config/crypto.config.ts
import { NowPaymentsConfig } from '@interface';

/**
 * Конфигурация для NOWPayments API
 */
export const nowPaymentsConfig: NowPaymentsConfig = {
    apiKey: process.env.NOWPAYMENTS_API_KEY || '',
    ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',
    baseUrl: process.env.NODE_ENV === 'production'
        ? process.env.NOWPAYMENTS_URL_PROD || ''
        : process.env.NOWPAYMENTS_URL_DEV || '',
    paymentTimeout: parseInt(process.env.CRYPTO_PAYMENT_TIMEOUT || '86400'),
    minAmount: parseInt(process.env.CRYPTO_MIN_AMOUNT || '1'),
    maxAmount: parseInt(process.env.CRYPTO_MAX_AMOUNT || '10000'),
    defaultCurrency: process.env.CRYPTO_DEFAULT_CURRENCY || 'USDT',
    maxRetries: parseInt(process.env.CRYPTO_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.CRYPTO_RETRY_DELAY || '1000')
};