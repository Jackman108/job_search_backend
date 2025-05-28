import { IPaymentService, PaymentBase, PaymentResult, PaymentStatus, PaymentStrategy } from "@interface";

/**
 * Отдельная модель для WebPay платежей со специфичными полями
 */
export interface WebPayPayment {
    id: string;
    subscription_id: string; // ID подписки
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
 * Параметры для инициализации WebPay платежа
 */
export interface WebpayInitParams {
    wsb_seed: string;
    wsb_storeid: number;
    wsb_order_num: string;
    wsb_test: number;
    wsb_currency_id: "BYN" | "USD" | "EUR" | "RUB";
    wsb_total: number;
    wsb_version: number;
    wsb_return_url: string;
    wsb_cancel_return_url: string;
    wsb_notify_url: string;
    wsb_invoice_item_name: string[];
    wsb_invoice_item_quantity: number[];
    wsb_invoice_item_price: number[];
    success_url?: string;
    cancel_url?: string;
}

/**
 * Результат инициализации WebPay платежа
 */
export interface WebpayInitResult {
    wt?: string;
    redirectUrl: string;
    orderNum: string;
}

/**
 * Упрощенные параметры для инициализации WebPay платежа
 */
export interface SimpleWebpayParams {
    subscription_id: string;
    amount: number;
    currency: string;
    success_url?: string;
    cancel_url?: string;
}

/**
 * Интерфейс для WebPay сервиса, реализующий общий интерфейс платежного сервиса
 */
export interface IWebPayService extends IPaymentService {
    listWebPay: () => Promise<PaymentResult<WebPayPayment[]>>;
    getWebPay: (orderNum: string) => Promise<PaymentResult<WebPayPayment>>;
    updateWebPay: (paymentId: string, updates: Partial<WebPayPayment>) => Promise<PaymentResult<WebPayPayment>>;
    deleteWebPay: (userId: string, paymentId: string) => Promise<PaymentResult<void>>;
}

/**
 * Интерфейс для стратегии WebPay платежей
 */
export interface WebPayStrategy extends PaymentStrategy {
    initWebpayPayment: (params: SimpleWebpayParams) => Promise<PaymentResult<WebpayInitResult>>;
    validateWebpaySignature: (data: any, signature: string) => boolean;
    handleWebpayReturn: (orderNum: string, transactionId: string) => Promise<PaymentResult<string>>;
    handleWebpayCancel: (orderNum: string) => Promise<PaymentResult<string>>;
    deletePendingWebPayPayment: (subscriptionId: string) => Promise<PaymentResult<boolean>>;
} 