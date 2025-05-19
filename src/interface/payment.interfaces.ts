import { PaymentStatus } from '../constants/paymentStatus';

export interface Payment {
    id: string;
    subscription_id: string;
    amount: number;
    payment_status: PaymentStatus;
    payment_method: string;
    created_at: Date;
    updated_at: Date;
}


export interface CryptoPaymentData {
    id: string;
    subscription_id: string;
    amount: string;
    currency: string;
    network: string;
    /** Опциональный адрес кошелька, если передан */
    crypto_address?: string;
}

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

export interface CryptoPaymentProvider {
    createPayment(amount: number, currency: string): Promise<CryptoPaymentDetails>;
    checkPaymentStatus(paymentId: string): Promise<string>;
    processWebhook(data: any, signature: string): Promise<boolean>;
} 