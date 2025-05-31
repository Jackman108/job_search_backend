/**
 * Интерфейсы для работы с WebPay платежами
 */
import { IPaymentService, PaymentBase, PaymentResult, PaymentStatus, PaymentStrategy } from './base.interfaces';

/**
 * Отдельная модель для WebPay платежей со специфичными полями
 */
export interface WebPayPayment extends PaymentBase {
    wsb_order_num: string;
    wsb_currency_id: string;
    wsb_total: number;
    amount: number;
    transaction_id: string | null;
    signature: string | null;
    success_url: string | null;
    cancel_url: string | null;
}

/**
 * Параметры для инициализации fiat-платежа
 */
export interface InitWebPayPaymentParams {
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
export interface InitWebPayPaymentResult {
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
export interface IWebPayService extends IPaymentService<WebPayPayment> {
    // Дополнительные методы для WebPayService, если нужны
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