/**
 * Интерфейсы для стратегий обработки платежей
 */
import { PaymentResult, PaymentStatus } from './base.interfaces';

/**
 * Базовый интерфейс стратегии платежей
 */
export interface PaymentStrategyInterface {
    /**
     * Инициализирует платеж
     * @param params Параметры платежа
     * @returns Результат инициализации платежа
     */
    initializePayment: (params: any) => Promise<PaymentResult<any>>;

    /**
     * Проверяет статус платежа
     * @param userId ID пользователя
     * @param paymentId ID платежа
     * @returns Статус платежа
     */
    checkPaymentStatus: (userId: string, paymentId: string) => Promise<PaymentStatus>;

    /**
     * Получает детали платежа
     * @param paymentId ID платежа
     * @returns Детали платежа
     */
    getPaymentDetails: (paymentId: string) => Promise<any>;

    /**
     * Обрабатывает вебхук от платежной системы
     * @param webhookData Данные вебхука
     * @param signature Подпись вебхука
     * @returns Результат обработки вебхука
     */
    handleWebhook: (webhookData: any, signature: string) => Promise<PaymentResult<boolean>>;

    /**
     * Проверяет подпись вебхука
     * @param data Данные вебхука
     * @param signature Подпись вебхука
     * @returns true если подпись верна, иначе false
     */
    validateWebhookSignature: (data: any, signature: string) => boolean;

    /**
     * Обрабатывает возврат платежа
     * @param paymentId ID платежа
     * @param amount Сумма возврата (опционально)
     * @returns Результат обработки возврата
     */
    handleRefund: (paymentId: string, amount?: number) => Promise<PaymentResult<boolean>>;
} 