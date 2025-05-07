export interface Payment {
    id: string;
    subscription_id: string;
    amount: number;
    payment_status: 'pending' | 'completed' | 'failed';
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
}

export interface CryptoPaymentDetails {
    id: string;
    subscription_id: string;
    amount: string;
    currency: string;
    network: string;
    crypto_address: string;
    crypto_amount: string;
    status: string;
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