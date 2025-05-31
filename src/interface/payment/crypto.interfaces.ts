/**
 * Интерфейсы для работы с криптоплатежами
 */
import { IPaymentService, PaymentBase, PaymentResult, PaymentStatus, PaymentStrategy } from './base.interfaces';

/**
 * Детали криптоплатежа, расширяет базовый интерфейс платежа
 */
export interface CryptoPaymentDetails extends PaymentBase {
    currency: string;
    crypto_address: string;
    crypto_amount: number;
    expires_at?: Date;
    transaction_hash?: string;
    network: string;
    wallet_provider: string;
}

/**
 * Данные для создания криптоплатежа
 */
export interface CryptoPaymentData {
    id?: string;
    subscription_id: string;
    amount: number;
    currency?: string;
    crypto_address?: string;
    network?: string;
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
 * Интерфейс для сервиса криптоплатежей
 */
export interface ICryptoPaymentService extends IPaymentService<CryptoPaymentDetails> {
    // Дополнительные методы специфичные для криптоплатежей могут быть добавлены здесь
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