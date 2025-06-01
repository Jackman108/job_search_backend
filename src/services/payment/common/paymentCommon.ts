import { USE_MOCK_PROVIDER } from '@config';
import { PaymentBase, PaymentResult, PaymentStatus } from '@interface';
import { executeQuery, logger } from '@utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * @module PaymentCommon
 * @description Базовые утилиты для платежной системы
 * Этот модуль содержит низкоуровневые функции, используемые всеми платежными сервисами:
 * - Генерация идентификаторов
 * - Получение данных из БД
 * - Стандартизация форматов
 * - Обработка ошибок
 */

/**
 * Генерирует уникальный идентификатор платежа
 * @returns Уникальный UUID для платежа
 */
export const generatePaymentId = (): string => {
    return uuidv4();
};

/**
 * Генерирует уникальный номер заказа для платежей
 * @returns Уникальный идентификатор заказа
 */
export const generateOrderNumber = (): string => {
    return `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Получает payment_id по user_id из таблицы payments
 * @param userId ID пользователя
 * @returns ID платежа или null, если не найден
 */
export const getPaymentIdByUserId = async (userId: string): Promise<string> => {
    const query = `
        SELECT p.id
        FROM payments p
        JOIN subscriptions s ON p.subscription_id = s.id
        WHERE s.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT 1;
    `;
    const result = await executeQuery<{ id: string }>(query, [userId]);
    if (!result.length) {
        throw new Error(`Payment not found for user ${userId}`);
    }
    return result[0].id;
};

/**
 * Получение платежа по ID подписки
 * Это каноническая версия функции, используемая во всех платежных сервисах
 * @param subscriptionId ID подписки
 * @returns Платеж или null, если не найден
 */
export const getPaymentBySubscriptionId = async (subscriptionId: string): Promise<PaymentBase | null> => {
    const query = `SELECT * FROM payments WHERE subscription_id = $1 ORDER BY created_at DESC LIMIT 1;`;
    const result = await executeQuery<PaymentBase>(query, [subscriptionId]);
    return result.length > 0 ? result[0] : null;
};

/**
 * Получает subscription_id по user_id из таблицы subscriptions
 * @param userId ID пользователя
 * @returns ID подписки или null, если не найдена
 */
export const getSubscriptionIdByUserId = async (userId: string): Promise<string> => {
    const query = `
        SELECT id FROM subscriptions 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
    `;
    const result = await executeQuery<{ id: string }>(query, [userId]);
    if (!result.length) {
        throw new Error(`Subscription not found for user ${userId}`);
    }
    return result[0].id;
};

/**
 * Обновляет статус платежа
 * @param paymentId ID платежа
 * @param status Новый статус платежа
 */
export const updatePaymentStatus = async (paymentId: string, status: PaymentStatus): Promise<void> => {
    const query = `
        UPDATE payments
        SET payment_status = $1, updated_at = NOW()
        WHERE id = $2
    `;
    await executeQuery(query, [status, paymentId]);
};

/**
 * Стандартизирует статус платежа
 * @param status Статус платежа в любом формате
 * @returns Стандартизированный статус платежа
 */
export const standardizePaymentStatus = (status: string): PaymentStatus => {
    const statusMap: Record<string, PaymentStatus> = {
        'pending': PaymentStatus.Pending,
        'processing': PaymentStatus.Processing,
        'on_hold': PaymentStatus.OnHold,
        'completed': PaymentStatus.Completed,
        'successful': PaymentStatus.Completed,
        'success': PaymentStatus.Completed,
        'failed': PaymentStatus.Failed,
        'error': PaymentStatus.Failed,
        'expired': PaymentStatus.Expired,
        'canceled': PaymentStatus.Canceled,
        'refunded': PaymentStatus.Refunded,
    };

    const normalizedStatus = status.toLowerCase();
    return statusMap[normalizedStatus] || PaymentStatus.Pending;
};

/**
 * Функция-обертка для обработки ошибок в платежных сервисах
 * @param fn Функция для выполнения
 * @returns Результат выполнения функции или объект с ошибкой
 */
export const withErrorHandling = async <T>(fn: () => Promise<T>): Promise<PaymentResult<T>> => {
    try {
        const result = await fn();
        return { success: true, data: result };
    } catch (error) {
        // Логируем ошибки только в режиме разработки
        if (USE_MOCK_PROVIDER) {
            logger.error('Payment service error:', { error });
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown payment service error'
        };
    }
};