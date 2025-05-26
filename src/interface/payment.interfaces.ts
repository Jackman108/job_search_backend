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
 * Параметры для создания платежа
 */
export interface CreatePaymentParams {
    userId: string;
    amount: number;
    currency: string;
    payment_method: string;
    subscription_id?: string;
}

/**
 * Результат операции с платежом
 */
export interface PaymentResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Функциональный интерфейс для работы с платежами
 */
export interface PaymentOperations {
    listPayments: (userId: string) => Promise<PaymentBase[]>;
    getPayment: (userId: string, paymentId: string) => Promise<PaymentBase>;
    createPayment: (params: CreatePaymentParams) => Promise<PaymentBase>;
    updatePayment: (userId: string, paymentId: string, updates: Partial<PaymentBase>) => Promise<PaymentBase>;
    deletePayment: (userId: string, paymentId: string) => Promise<void>;
}

/**
 * Интерфейс для работы с платежными провайдерами
 */
export interface PaymentProvider {
    createPayment(params: any): Promise<any>;
    checkPaymentStatus(paymentId: string): Promise<PaymentStatus>;
    processWebhook(data: any, signature: string): Promise<boolean>;
}

/**
 * Базовый интерфейс для платежных сервисов
 */
export interface IPaymentService {
    createPayment: (params: any) => Promise<PaymentResult<PaymentBase>>;
    updatePaymentStatus: (paymentId: string, status: PaymentStatus) => Promise<PaymentResult<PaymentBase>>;
    handlePaymentRedirect: (params: any) => Promise<PaymentResult<string>>;
    processPaymentWebhook: (data: any, signature: string) => Promise<PaymentResult<boolean>>;
}