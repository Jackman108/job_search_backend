/**
 * Базовые интерфейсы для всех платежных систем
 */

/**
 * Статусы платежа
 */
export enum PaymentStatus {
    Pending = 'pending',
    Processing = 'processing',
    OnHold = 'on_hold',
    Completed = 'completed',
    Failed = 'failed',
    Expired = 'expired',
    Canceled = 'canceled',
    Refunded = 'refunded'
}

/**
 * Базовый интерфейс для платежных данных
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
 * Обобщенный результат операции платежа
 */
export interface PaymentResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    errorCode?: string;
    errorType?: string;
    details?: Record<string, any>;
}

/**
 * Базовые параметры для создания платежа
 */
export interface CreatePaymentParams {
    userId?: string;
    subscription_id: string;
    amount: number;
    currency?: string;
    payment_method: string;
    id?: string;
}

/**
 * Общий интерфейс для платежных сервисов с типизацией возвращаемых значений
 */
export interface IPaymentService<T extends PaymentBase> {
    createPayment: (params: CreatePaymentParams) => Promise<PaymentResult<T>>;
    getPayment: (userId: string, paymentId: string) => Promise<PaymentResult<T>>;
    updatePayment: (paymentId: string, updates: Partial<T>) => Promise<PaymentResult<T>>;
    deletePayment: (userId: string, paymentId: string) => Promise<PaymentResult<boolean>>;
    listPayments: () => Promise<PaymentResult<T[]>>;
}

/**
 * Базовый интерфейс для стратегий платежей
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
 * Контекст стратегии платежей
 */
export interface PaymentStrategyContext {
    strategy: PaymentStrategy;
    setStrategy: (strategy: PaymentStrategy) => void;
    executePayment: (params: any) => Promise<PaymentResult<any>>;
}

/**
 * Конфигурация для NowPayments API
 */
export interface NowPaymentsConfig {
    apiKey: string;
    ipnSecret: string;
    baseUrl: string;
    paymentTimeout: number;
    minAmount: number;
    maxAmount: number;
    defaultCurrency: string;
    maxRetries: number;
    retryDelay: number;
} 