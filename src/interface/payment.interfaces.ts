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

/**
 * Параметры для инициализации fiat-платежа
 */
export interface InitFiatPaymentParams {
    userId: string;
    amount: number;
    currency: string;
    payment_method: string;
}

/**
 * Результат инициализации fiat-платежа
 */
export interface InitFiatPaymentResult {
    paymentId: string;
    redirectUrl: string;
}

/**
 * Параметры для инициализации платежа через WebPay
 */
export interface WebpayInitParams {
    wsb_storeid: number;
    wsb_order_num: string;
    wsb_currency_id: 'BYN' | 'USD' | 'EUR' | 'RUB';
    wsb_seed: string;
    wsb_test: 0 | 1;
    wsb_invoice_item_name: string[];
    wsb_invoice_item_quantity: number[];
    wsb_invoice_item_price: number[];
    wsb_total: number;
    wsb_version?: number;
    /** Дополнительные параметры WebPay */
    [key: string]: any;
}

/**
 * Результат инициализации платежа через WebPay
 */
export interface WebpayInitResult {
    wt: string;
    redirectUrl: string;
} 