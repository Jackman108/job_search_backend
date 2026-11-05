/**
 * Интерфейсы для работы с API NOWPayments
 */
import { PaymentStatus } from './base.interfaces';

/**
 * Интерфейс для ответа API NOWPayments при создании платежа
 */
export interface NowPaymentsCreatePaymentResponse {
    payment_id: string;
    payment_status: string;
    pay_address: string;
    price_amount: number;
    price_currency: string;
    pay_amount: number;
    pay_currency: string;
    order_id?: string;
    order_description?: string;
    ipn_callback_url?: string;
    created_at: string;
    updated_at: string;
    purchase_id?: string;
    network?: string;
    network_precision?: string;
    time_limit?: string;
    expiration_estimate_date?: string;
    is_fixed_rate?: boolean;
    is_fee_paid_by_user?: boolean;
    valid_until?: string;
    type?: string;
}

/**
 * Интерфейс для ответа API NOWPayments при проверке статуса платежа
 */
export interface NowPaymentsPaymentStatusResponse {
    payment_id: string;
    payment_status: string;
    pay_address: string;
    price_amount: number;
    price_currency: string;
    pay_amount: number;
    pay_currency: string;
    order_id?: string;
    order_description?: string;
    ipn_callback_url?: string;
    created_at: string;
    updated_at: string;
    purchase_id?: string;
    outcome_amount?: number;
    outcome_currency?: string;
}

/**
 * Параметры для создания платежа через NOWPayments API
 */
export interface CreateNowPaymentParams {
    price_amount: number;
    price_currency: string;
    pay_currency: string;
    ipn_callback_url?: string;
    order_id?: string;
    order_description?: string;
    is_fixed_rate?: boolean;
    is_fee_paid_by_user?: boolean;
    success_url?: string;
    cancel_url?: string;
    partially_paid_url?: string;
}

/**
 * Параметры для создания счета через NOWPayments API
 */
export interface CreateNowInvoiceParams {
    price_amount: number;
    price_currency: string;
    pay_currency?: string;
    ipn_callback_url?: string;
    order_id?: string;
    order_description?: string;
    success_url?: string;
    cancel_url?: string;
    is_fixed_rate?: boolean;
    is_fee_paid_by_user?: boolean;
}

/**
 * Интерфейс для ответа API NOWPayments при создании счета
 */
export interface NowPaymentsCreateInvoiceResponse {
    id: string;
    token_id: string;
    order_id?: string;
    order_description?: string;
    price_amount: number;
    price_currency: string;
    pay_currency?: string;
    ipn_callback_url?: string;
    invoice_url: string;
    success_url?: string;
    cancel_url?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Интерфейс для API клиента NOWPayments
 */
export interface INowPaymentsApi {
    createPayment: (params: CreateNowPaymentParams) => Promise<NowPaymentsCreatePaymentResponse>;
    createInvoice: (params: CreateNowInvoiceParams) => Promise<NowPaymentsCreateInvoiceResponse>;
    getPaymentStatus: (paymentId: string) => Promise<NowPaymentsPaymentStatusResponse>;
    validateWebhookSignature: (data: any, signature: string) => boolean;
    mapPaymentStatus: (nowpaymentStatus: string) => PaymentStatus;
} 