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
 * Базовый интерфейс для платежных сервисов
 */
export interface IPaymentService {
    createPayment: (params: any) => Promise<PaymentResult<PaymentBase>>;
    updatePaymentStatus: (paymentId: string, status: PaymentStatus) => Promise<PaymentResult<PaymentBase>>;
    handlePaymentRedirect: (params: any) => Promise<PaymentResult<string>>;
    processPaymentWebhook: (data: any, signature: string) => Promise<PaymentResult<boolean>>;
}

/**
 * Интерфейс стратегии платежа
 * Используется для реализации паттерна Стратегия для различных платежных систем
 */
export interface PaymentStrategy {
    initPayment: (params: any) => Promise<PaymentResult<any>>;
    validatePaymentSignature: (data: any, signature: string) => boolean;
    handlePaymentCallback: (params: any) => Promise<PaymentResult<string>>;
    processPaymentWebhook: (data: any, signature: string) => Promise<PaymentResult<boolean>>;
    checkPaymentStatus: (paymentId: string) => Promise<PaymentResult<PaymentStatus>>;
    cleanupPayment: (paymentId: string) => Promise<PaymentResult<boolean>>;
}

/**
 * Интерфейс для сервиса переключения между платежными системами
 */
export interface PaymentStrategyContext {
    setStrategy: (strategy: PaymentStrategy) => void;
    executePayment: (params: any) => Promise<PaymentResult<any>>;
    validateWebhook: (data: any, signature: string) => Promise<PaymentResult<boolean>>;
    checkStatus: (paymentId: string) => Promise<PaymentResult<PaymentStatus>>;
}