/**
 * Интерфейсы для работы с криптовалютными платежами
 */
import { PaymentStatus } from "./payment.interfaces";

/**
 * Основные данные для создания криптоплатежа
 */
export interface CryptoPaymentData {
    id: string;
    subscription_id: string;
    amount: string;
    currency: string;
    network: string;
    crypto_address?: string;
}

/**
 * Полные детали криптоплатежа
 */
export interface CryptoPaymentDetails {
    id: string;
    subscription_id: string;
    amount: string;
    currency: string;
    network: string;
    crypto_address: string;
    crypto_amount: string;
    payment_status: PaymentStatus;
    created_at: Date;
    expires_at: Date;
    transaction_hash: string | null;
    wallet_provider: string;
}

/**
 * Параметры для инициализации криптоплатежа
 */
export interface InitCryptoPaymentParams {
    amount: number; // Сумма платежа
    currency: string; // Валюта платежа
    network: string; // Блокчейн-сеть
}

/**
 * Результат инициализации криптоплатежа
 */
export interface InitCryptoPaymentResult {
    address: string; // Адрес для оплаты
    amount: number; // Сумма в криптовалюте
    provider: string; // Провайдер платежа
    expires_at: Date; // Срок действия
}

/**
 * Данные вебхука от криптопровайдера
 */
export interface CryptoWebhookData {
    payment_id: string; // ID платежа
    payment_status: PaymentStatus; // Новый статус
    transaction_hash: string; // Хеш транзакции
    updated_at: Date; // Время обновления
    additional_data?: any; // Дополнительные данные
}

/**
 * Конфигурация криптопровайдера
 */
export interface CryptoProviderConfig {
    apiKey: string; // API ключ
    ipnSecret: string; // Секрет для вебхуков
    defaultCurrency: string; // Валюта по умолчанию
    supportedNetworks: string[]; // Поддерживаемые сети
}


/**
 * Интерфейс для криптопровайдера
 */
export interface CryptoPaymentProvider {
    createPayment(amount: number, currency: string): Promise<CryptoPaymentDetails>;
    checkPaymentStatus(paymentId: string): Promise<string>;
    processWebhook(data: any, signature: string): Promise<boolean>;
}
