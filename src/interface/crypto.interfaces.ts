/**
 * Интерфейсы для работы с криптовалютными платежами
 */
import { IPaymentService, PaymentResult, PaymentStatus, PaymentStrategy } from "@interface";

/**
 * Основные данные для создания криптоплатежа
 */
export interface CryptoPaymentData {
    id: string;
    subscription_id: string;
    amount: number;
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
    amount: number;
    currency: string;
    network: string;
    crypto_address: string;
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
    id: string;
    subscription_id: string;
    amount: number;
    currency?: string;
    network?: string;
}

/**
 * Результат инициализации криптоплатежа
 */
export interface CryptoPaymentInitResult {
    id: string;
    crypto_address: string;
    amount: number;
    currency: string;
    expires_at: Date;
    network: string;
    payment_status: PaymentStatus;
}

/**
 * Данные вебхука от криптопровайдера
 */
export interface CryptoWebhookData {
    payment_id: string;
    payment_status: PaymentStatus;
    transaction_hash: string;
    updated_at: Date;
    additional_data?: any;
}

/**
 * Конфигурация криптопровайдера
 */
export interface CryptoProviderConfig {
    apiKey: string;
    ipnSecret: string;
    defaultCurrency: string;
    supportedNetworks: string[];
}


/**
 * Интерфейс для Crypto сервиса, реализующий общий интерфейс платежного сервиса
 */
export interface ICryptoPaymentService extends IPaymentService {
    listCryptoPayments: () => Promise<PaymentResult<CryptoPaymentDetails[]>>;
    getCryptoPayment: (paymentId: string) => Promise<PaymentResult<CryptoPaymentDetails>>;
    updateCryptoPayment: (paymentId: string, updates: Partial<CryptoPaymentDetails>) => Promise<PaymentResult<CryptoPaymentDetails>>;
    deleteCryptoPayment: (userId: string, paymentId: string) => Promise<PaymentResult<void>>;
    checkCryptoPaymentStatus: (paymentId: string) => Promise<PaymentResult<PaymentStatus>>;
}

export interface NowPaymentsConfig {
    apiKey: string;
    ipnSecret: string;
    baseUrl: string;
    paymentTimeout: number;
    minAmount: number;
    maxAmount: number;
    defaultCurrency: string;
    maxRetries: number;
    retryDelay: number;
}

/**
 * Интерфейс провайдера криптоплатежей
 */
export interface CryptoPaymentProvider {
    createPayment: (amount: number, currency: string) => Promise<CryptoPaymentDetails>;
    checkPaymentStatus: (paymentId: string) => Promise<PaymentStatus>;
    processWebhook: (data: any, signature: string) => Promise<boolean>;
    validateSignature?: (data: any, signature: string) => boolean;
}

/**
 * Интерфейс для стратегии криптоплатежей
 */
export interface CryptoPaymentStrategy extends PaymentStrategy {
    initCryptoPayment: (params: InitCryptoPaymentParams) => Promise<PaymentResult<CryptoPaymentDetails>>;
    validateCryptoWebhookSignature: (data: any, signature: string) => boolean;
    getCryptoPaymentDetails: (paymentId: string) => Promise<PaymentResult<CryptoPaymentDetails>>;
    deletePendingCryptoPayment: (subscriptionId: string) => Promise<PaymentResult<boolean>>;
}
