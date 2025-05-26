import { IPaymentService, PaymentResult, PaymentStatus } from "@interface";

/**
 * Отдельная модель для WebPay платежей со специфичными полями
 */
export interface WebPayPayment {
    id: string;
    payment_id: string; // ID из основной таблицы payments
    wsb_order_num: string; // Номер заказа в WebPay
    wsb_currency_id: string; // Валюта платежа
    wsb_total: number; // Сумма платежа
    transaction_id: string | null; // ID транзакции в WebPay (wsb_tid)
    payment_status: PaymentStatus;
    signature: string | null; // Подпись запроса
    created_at: Date;
    updated_at: Date;
    success_url: string | null; // URL для редиректа при успешной оплате
    cancel_url: string | null; // URL для редиректа при отмене
}

/**
 * Параметры для инициализации fiat-платежа
 */
export interface InitFiatPaymentParams {
    userId: string;
    amount: number;
    currency: string;
    payment_method: string;
    success_url?: string;
    cancel_url?: string;
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
    wsb_return_url?: string;
    wsb_cancel_return_url?: string;
    wsb_notify_url?: string;
    success_url?: string;
    cancel_url?: string;
}

/**
 * Результат инициализации платежа через WebPay
 */
export interface WebpayInitResult {
    wt?: string;
    redirectUrl: string;
    paymentId?: string;
    orderNum?: string;
}

/**
 * Параметры для упрощенной инициализации WebPay платежа
 */
export interface SimpleWebpayParams {
    subscription_id: string;
    amount: number;
    currency: string;
    success_url?: string;
    cancel_url?: string;
}

/**
 * Операции для WebPay платежей
 */
export interface WebPayOperations {
    initPayment: (params: WebpayInitParams) => Promise<PaymentResult<WebpayInitResult>>;
    checkStatus: (orderNum: string) => Promise<PaymentResult<PaymentStatus>>;
    handleReturn: (orderNum: string, transactionId: string) => Promise<PaymentResult<string>>;
    handleCancel: (orderNum: string) => Promise<PaymentResult<string>>;
    handleNotify: (data: any, signature: string) => Promise<PaymentResult<boolean>>;
}

/**
 * Интерфейс для WebPay сервиса, реализующий общий интерфейс платежного сервиса
 */
export interface IWebPayService extends IPaymentService {
    initFiatPayment: (params: InitFiatPaymentParams) => Promise<PaymentResult<WebpayInitResult>>;
    handleWebpayReturn: (orderNum: string, transactionId: string) => Promise<PaymentResult<string>>;
    handleWebpayCancel: (orderNum: string) => Promise<PaymentResult<string>>;
    validateWebpaySignature: (payload: any, signature: string) => boolean;
} 