import { ENV } from './base.config.js';

export const PAYMENT_URL_BASE_DEV =
    process.env.PAYMENT_URL_BASE_DEV ?? '';

/**
 * Базовый URL платежного провайдера для продакшена
 */
export const PAYMENT_URL_BASE_PROD =
    process.env.PAYMENT_URL_BASE_PROD ?? '';

export const USE_MOCK_PROVIDER = ENV.isDevelopment;

/**
 * Выбор базового URL провайдера на основе окружения
 */
export const PAYMENT_API_BASE_URL = ENV.isProduction
    ? PAYMENT_URL_BASE_PROD
    : PAYMENT_URL_BASE_DEV;

/**
 * Базовые URL для интеграции WebPay
 */
export const WEBPAY_URL_BASE_DEV = process.env.WEBPAY_URL_BASE_DEV ?? '';
export const WEBPAY_URL_BASE_PROD = process.env.WEBPAY_URL_BASE_PROD ?? '';
/** Секретный ключ для формирования подписи WebPay */
export const WEBPAY_SECRET_KEY = process.env.WEBPAY_SECRET_KEY ?? '';
/** Выбор базового URL WebPay провайдера на основе окружения */
export const WEBPAY_API_BASE_URL = ENV.isProduction
    ? WEBPAY_URL_BASE_PROD
    : WEBPAY_URL_BASE_DEV; 