import { PaymentStatus } from "./payment.interfaces";

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
    wsb_return_url?: string; // URL возврата после оплаты
    wsb_cancel_return_url?: string; // URL возврата после отмены
    wsb_notify_url?: string; // URL для нотификаций
}

/**
 * Результат инициализации платежа через WebPay
 */
export interface WebpayInitResult {
    wt: string;
    redirectUrl: string;
} 