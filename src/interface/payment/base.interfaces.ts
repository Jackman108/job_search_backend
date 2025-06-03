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
    Refunded = 'refunded',
    PartiallyRefunded = 'partially_refunded'
}

/**
 * Методы оплаты
 */
export enum PaymentMethod {
    WebPay = 'webpay',
    Crypto = 'crypto',
    Card = 'card',
    Other = 'other'
}

/**
 * Типы платежных операций
 */
export enum PaymentOperationType {
    Payment = 'payment',
    Refund = 'refund',
    Capture = 'capture',
    Preauthorization = 'preauth',
    Recurring = 'recurring',
    Chargeback = 'chargeback'
}

/**
 * Типы ошибок платежных систем
 */
export enum PaymentErrorType {
    Network = 'NETWORK_ERROR',
    Validation = 'VALIDATION_ERROR',
    Authentication = 'AUTH_ERROR',
    RateLimit = 'RATE_LIMIT',
    ServerError = 'SERVER_ERROR',
    InsufficientFunds = 'INSUFFICIENT_FUNDS',
    Timeout = 'TIMEOUT',
    Duplicate = 'DUPLICATE_PAYMENT',
    Declined = 'PAYMENT_DECLINED',
    Unknown = 'UNKNOWN_ERROR'
}

/**
 * Структура данных ошибки платежа
 */
export interface PaymentErrorDetails {
    message: string;
    code?: string;
    type: PaymentErrorType;
    originalError?: any;
    recoverable: boolean;
    retryable: boolean;
    context?: Record<string, any>;
}

/**
 * Базовый интерфейс для платежных данных, соответствует таблице payments
 */
export interface PaymentBase {
    id: string;
    subscription_id: string;
    amount: number;
    payment_status: PaymentStatus;
    payment_method: PaymentMethod | string;
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
    subscription_id?: string;
    amount: number;
    currency?: string;
    payment_method?: PaymentMethod | string;
    metadata?: Record<string, any>;
    description?: string;
    redirectUrl?: string;
    webhookUrl?: string;
}

/**
 * Параметры для операции возврата средств
 */
export interface RefundPaymentParams {
    paymentId: string;
    amount?: number; // Если не указано, то полный возврат
    reason?: string;
    metadata?: Record<string, any>;
}

/**
 * Общий интерфейс для платежных сервисов с типизацией возвращаемых значений
 */
export interface IPaymentService<T, P extends CreatePaymentParams = CreatePaymentParams> {
    createPayment: (params: P) => Promise<PaymentResult<T>>;
    getPayment: (userId: string, paymentId: string) => Promise<PaymentResult<T>>;
    updatePayment: (paymentId: string, updates: Partial<T>) => Promise<PaymentResult<T>>;
    deletePayment: (userId: string, paymentId: string) => Promise<PaymentResult<boolean>>;
    listPayments: (filters?: Record<string, any>) => Promise<PaymentResult<T[]>>;
    refundPayment: (params: RefundPaymentParams) => Promise<PaymentResult<T>>;
}

/**
 * Интерфейс для мониторинга платежей
 */
export interface PaymentMonitoring {
    registerAttempt: (paymentId: string, method: string) => void;
    registerSuccess: (paymentId: string, amount: number) => void;
    registerFailure: (paymentId: string, errorCode: string) => void;
    getMetrics: () => Record<string, any>;
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
    refundPayment: (params: RefundPaymentParams) => Promise<PaymentResult<any>>;
    getPaymentDetails: (paymentId: string) => Promise<PaymentResult<any>>;
}

/**
 * Контекст стратегии платежей
 */
export interface PaymentStrategyContext {
    strategy: PaymentStrategy;
    setStrategy: (strategy: PaymentStrategy) => void;
    executePayment: (params: any) => Promise<PaymentResult<any>>;
    validateWebhook: (data: any, signature: string) => Promise<PaymentResult<boolean>>;
    checkStatus: (paymentId: string) => Promise<PaymentResult<PaymentStatus>>;
    refundPayment: (params: RefundPaymentParams) => Promise<PaymentResult<any>>;
    getPaymentDetails: (paymentId: string) => Promise<PaymentResult<any>>;
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

/**
 * Интерфейс для валидатора платежных данных
 */
export interface PaymentValidator {
    validatePaymentData: (data: any) => string | null;
    validateRefundData: (data: RefundPaymentParams) => string | null;
    validateWebhookData: (data: any, signature: string) => boolean;
}

/**
 * Интерфейс для кэширования платежных операций
 */
export interface PaymentCache {
    getPayment: (paymentId: string) => Promise<any | null>;
    setPayment: (paymentId: string, data: any, ttl?: number) => Promise<void>;
    invalidatePayment: (paymentId: string) => Promise<void>;
    getStatus: (paymentId: string) => Promise<PaymentStatus | null>;
    setStatus: (paymentId: string, status: PaymentStatus, ttl?: number) => Promise<void>;
} 