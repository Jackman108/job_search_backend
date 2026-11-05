/**
 * Конфигурация для WebPay платежей
 */
import { ENV } from './base.config.js';

/**
 * Базовые URL для интеграции WebPay
 */
export const WEBPAY_URL_BASE_DEV = process.env.WEBPAY_URL_BASE_DEV ?? '';
export const WEBPAY_URL_BASE_PROD = process.env.WEBPAY_URL_BASE_PROD ?? '';

/** 
 * Секретный ключ для формирования подписи WebPay 
 */
export const WEBPAY_SECRET_KEY = process.env.WEBPAY_SECRET_KEY ?? '';

/** 
 * Выбор базового URL WebPay провайдера на основе окружения 
 */
export const WEBPAY_API_BASE_URL = ENV.isProduction
    ? WEBPAY_URL_BASE_PROD
    : WEBPAY_URL_BASE_DEV;

/**
 * ID магазина в системе WebPay
 */
export const WEBPAY_STORE_ID = parseInt(process.env.WEBPAY_STORE_ID || '0', 10);

/**
 * Версия API WebPay
 */
export const WEBPAY_VERSION = parseInt(process.env.WEBPAY_VERSION || '2', 10);

/**
 * Флаг тестового режима WebPay
 * 0 - боевой режим, 1 - тестовый режим
 */
export const WEBPAY_TEST_MODE = ENV.isProduction ? 0 : 1;

/**
 * URL для обработки платежей WebPay
 */
export const WEBPAY_RETURN_URL = `${process.env.API_URL || ''}/api/webpay/return`;
export const WEBPAY_CANCEL_URL = `${process.env.API_URL || ''}/api/webpay/cancel`;
export const WEBPAY_NOTIFY_URL = `${process.env.API_URL || ''}/api/webpay/notify`;

/**
 * Таймаут платежа в секундах (30 минут)
 */
export const WEBPAY_PAYMENT_TIMEOUT = parseInt(process.env.WEBPAY_PAYMENT_TIMEOUT || '1800', 10);

/**
 * Настройки для моковых платежей в режиме разработки
 */
export const WEBPAY_MOCK_CONFIG = {
    paymentTimeout: parseInt(process.env.WEBPAY_MOCK_TIMEOUT || '60', 10), // 1 минута для моковых платежей
    defaultCurrency: process.env.WEBPAY_DEFAULT_CURRENCY || 'BYN'
}; 