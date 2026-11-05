import { isPaymentMethodAvailable, USE_MOCK_PROVIDER } from '@config';
import { PaymentBase, PaymentResult, PaymentStatus } from '@interface';
import { handleErrors } from '@middlewares';
import { executeQuery, logger } from '@utils';
import { Response } from 'express';

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
 * Проверяет доступность метода оплаты и возвращает соответствующий ответ в случае ошибки
 * @param res Ответ Express
 * @param paymentMethod Метод оплаты
 * @returns true если метод доступен, false если нет (и отправляет ответ)
 */
export const validatePaymentMethod = (res: Response, paymentMethod: string): boolean => {
    if (!isPaymentMethodAvailable(paymentMethod)) {
        handleErrors(res, new Error(`Payment method '${paymentMethod}' is not available`), `Payment method '${paymentMethod}' is not available`);
        return false;
    }
    return true;
};

/**
 * Общие функции для работы с платежами
 */

/**
 * Проверяет обязательные параметры платежа
 * @param params Параметры для проверки
 * @param requiredFields Список обязательных полей
 * @returns Результат проверки с ошибкой или успехом
 */
export const validatePaymentParams = <T>(
    params: T,
    requiredFields: (keyof T)[]
): PaymentResult<boolean> => {
    const missingFields = requiredFields.filter(field =>
        params[field] === undefined || params[field] === null || params[field] === ''
    );

    if (missingFields.length > 0) {
        const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
        logger.error(errorMessage, { params });
        return {
            success: false,
            error: errorMessage
        };
    }

    return { success: true };
};

/**
 * Форматирует сумму платежа для различных платежных систем
 * @param amount Сумма платежа
 * @param options Опции форматирования
 * @returns Отформатированная сумма
 */
export const formatAmount = (
    amount: number,
    options: {
        decimals?: number;
        asString?: boolean;
        multiplyBy?: number;
    } = {}
): string | number => {
    const {
        decimals = 2,
        asString = true,
        multiplyBy = 1
    } = options;

    const formattedAmount = (amount * multiplyBy).toFixed(decimals);
    return asString ? formattedAmount : parseFloat(formattedAmount);
};

/**
 * Создает уникальный идентификатор платежа
 * @param prefix Префикс для идентификатора
 * @returns Уникальный идентификатор
 */
export const generatePaymentId = (prefix = 'PAY'): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
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
 * Получает информацию о платеже по его ID
 * @param paymentId ID платежа
 * @returns Информация о платеже или null, если платеж не найден
 */
export const getPaymentByPaymentId = async (
    paymentId: string
): Promise<PaymentBase> => {
    const query = `SELECT * FROM payments WHERE id = $1;`;
    const result = await executeQuery<PaymentBase>(query, [paymentId]);
    if (!result[0]) throw new Error(`Payment not found for id ${paymentId}`);
    return result[0];
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




