/**
 * Интерфейсы для работы с криптоплатежами
 */
import { CreatePaymentParams, IPaymentService, PaymentResult, PaymentStatus, PaymentStrategy } from './base.interfaces';

/**
 * Детали криптоплатежа, соответствуют структуре таблицы crypto_payments
 */
export interface CryptoPaymentDetails {
    id?: string;
    payment_id: string;
    amount: number;
    currency: string;
    crypto_address: string;
    crypto_amount: number;
    payment_status: PaymentStatus;
    created_at: Date;
    updated_at: Date;
    expires_at?: Date;
    transaction_hash?: string | null;
    network: string;
    wallet_provider: string;
}

/**
 * Данные для создания криптоплатежа
 */
export interface CryptoPaymentData {
    id?: string;
    payment_id: string;
    amount: number;
    currency?: string;
    crypto_address?: string;
    crypto_amount?: number;
    payment_status?: PaymentStatus;
    expires_at?: Date;
    transaction_hash?: string | null;
    network?: string;
    wallet_provider?: string;
    created_at?: Date;
    updated_at?: Date;
}

/**
 * Параметры для инициализации криптоплатежа
 */
export interface InitCryptoPaymentParams {
    id: string;
    payment_id: string;
    amount: number;
    currency?: string;
    network?: string;
}

/**
 * Параметры для создания криптоплатежа, расширяет базовый интерфейс CreatePaymentParams
 */
export interface CreateCryptoPaymentParams extends CreatePaymentParams {
    id?: string;
    payment_id: string;
    network: string;
    crypto_address?: string;
}

/**
 * Интерфейс для сервиса криптоплатежей
 */
export interface ICryptoPaymentService extends IPaymentService<CryptoPaymentDetails, CreateCryptoPaymentParams> {
    // Дополнительные методы специфичные для криптоплатежей могут быть добавлены здесь
}

/**
 * Интерфейс для стратегии криптоплатежей
 */
export interface CryptoPaymentStrategy extends PaymentStrategy {
    initCryptoPayment: (params: InitCryptoPaymentParams) => Promise<PaymentResult<CryptoPaymentDetails>>;
    validateCryptoWebhookSignature: (data: any, signature: string) => boolean;
    getCryptoPaymentDetails: (paymentId: string) => Promise<PaymentResult<CryptoPaymentDetails>>;
    deletePendingCryptoPayment: (paymentId: string) => Promise<PaymentResult<boolean>>;
} 