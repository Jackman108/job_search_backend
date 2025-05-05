export interface Payment {
    id: string;
    subscription_id: string;
    amount: number;
    payment_status: 'pending' | 'completed' | 'failed';
    payment_method: string;
    created_at: Date;
    updated_at: Date;
}

export interface CryptoPaymentDetails {
    paymentId: string;
    cryptoAddress: string;
    cryptoAmount: string;
    currency: string;
    status: string;
    createdAt: Date;
    expiresAt: Date;
}

export interface CryptoPaymentProvider {
    createPayment(amount: number, currency: string): Promise<CryptoPaymentDetails>;
    checkPaymentStatus(paymentId: string): Promise<string>;
    processWebhook(data: any): Promise<void>;
} 