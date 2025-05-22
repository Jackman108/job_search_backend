/**
 * Базовые интерфейсы для работы с платежной системой
 */

export enum PaymentStatus {
    Pending = 'pending', // Ожидает оплаты
    Processing = 'processing', // В процессе обработки
    Completed = 'completed', // Успешно завершен
    Failed = 'failed', // Неудачный платеж
    Refunded = 'refunded', // Возврат средств
    Cancelled = 'cancelled', // Отменен пользователем
    Expired = 'expired', // Время истекло
    OnHold = 'on_hold' // На удержании (требует проверки)
}

/**
 * Основной интерфейс платежа
 */
export interface PaymentBase {
    id: string;
    subscription_id: string;
    amount: number;
    payment_status: PaymentStatus;
    payment_method: string;
    created_at: Date;
    updated_at: Date;
}


/**
 * Интерфейс для работы с платежными провайдерами
 */
export interface PaymentProvider {
    createPayment(params: any): Promise<any>;
    checkPaymentStatus(paymentId: string): Promise<PaymentStatus>;
    processWebhook(data: any, signature: string): Promise<boolean>;
}