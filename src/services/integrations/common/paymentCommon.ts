import { USE_MOCK_PROVIDER } from '@config';
import { PaymentBase, PaymentResult, PaymentStatus } from '@interface';
import { executeQuery, logger } from '@utils';

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
 * Нормализует статус платежа из различных платежных систем
 * @param status Статус платежа из внешней системы
 * @param statusMap Карта соответствия статусов
 * @returns Нормализованный статус платежа
 */
export const normalizePaymentStatus = (
    status: string,
    statusMap: Record<string, PaymentStatus>
): PaymentStatus => {
    const normalizedStatus = statusMap[status.toLowerCase()];
    return normalizedStatus || PaymentStatus.Pending;
};

/**
 * Создает стандартизированный ответ об ошибке платежа
 * @param error Объект ошибки
 * @param defaultMessage Сообщение по умолчанию
 * @returns Результат операции с ошибкой
 */
export const createPaymentError = <T>(
    error: unknown,
    defaultMessage = 'Payment operation failed'
): PaymentResult<T> => {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    logger.error(errorMessage, { error });
    return {
        success: false,
        error: errorMessage
    };
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

/**
 * Общие функции для работы с криптоплатежами
 */
import { nowPaymentsConfig } from '@config';
import crypto from 'crypto';

/**
 * Проверяет подпись вебхука от криптопровайдера
 * @param data Данные вебхука
 * @param signature Подпись вебхука
 * @returns true если подпись валидна, иначе false
 */
export const validateCryptoWebhookSignature = (data: any, signature: string): boolean => {
    // В режиме разработки всегда считаем подпись валидной
    if (USE_MOCK_PROVIDER) {
        logger.info('Using mock signature validation in development mode');
        return true;
    }

    if (!nowPaymentsConfig.ipnSecret) {
        throw new Error('IPN secret is not configured');
    }

    const hmac = crypto.createHmac('sha512', nowPaymentsConfig.ipnSecret);
    const expectedSignature = hmac.update(JSON.stringify(data)).digest('hex');
    return expectedSignature === signature;
};

/**
 * Проверяет статус платежа у провайдера
 * @param paymentId ID платежа
 * @returns Статус платежа
 */
export const checkPaymentStatusWithProvider = async (paymentId: string): Promise<string> => {
    // В режиме разработки возвращаем моковые данные
    if (USE_MOCK_PROVIDER) {
        return PaymentStatus.Pending;
    }

    // В продакшн режиме здесь должен быть запрос к API провайдера
    // Например:
    // const response = await fetch(`${nowPaymentsConfig.baseUrl}/payment/${paymentId}`, {
    //     headers: { 'x-api-key': nowPaymentsConfig.apiKey }
    // });
    // const data = await response.json();
    // return data.payment_status;

    // Временная заглушка
    return PaymentStatus.Pending;
};

/**
 * Соответствие статусов провайдера статусам приложения
 */
const CRYPTO_STATUS_MAPPING: Record<string, PaymentStatus> = {
    // Успешные статусы
    'finished': PaymentStatus.Completed,
    'confirmed': PaymentStatus.Completed,
    'complete': PaymentStatus.Completed,
    'paid': PaymentStatus.Completed,
    'success': PaymentStatus.Completed,

    // Ожидающие статусы
    'waiting': PaymentStatus.Pending,
    'confirming': PaymentStatus.Pending,
    'pending': PaymentStatus.Pending,
    'in_progress': PaymentStatus.Processing,
    'sending': PaymentStatus.Processing,
    'received': PaymentStatus.Processing,

    // Проблемные статусы
    'failed': PaymentStatus.Failed,
    'error': PaymentStatus.Failed,
    'invalid': PaymentStatus.Failed,

    // Отмененные статусы
    'refunded': PaymentStatus.Refunded,
    'cancelled': PaymentStatus.Canceled,
    'canceled': PaymentStatus.Canceled,

    // Истекшие статусы
    'expired': PaymentStatus.Expired,
    'timeout': PaymentStatus.Expired
};

/**
 * Преобразует статус платежа из формата криптопровайдера в формат приложения
 * @param cryptoStatus Статус платежа от криптопровайдера
 * @returns Статус платежа в формате приложения
 */
export const mapCryptoStatus = (cryptoStatus: string): PaymentStatus => {
    // Нормализуем статус (приводим к нижнему регистру и удаляем пробелы)
    const normalizedStatus = cryptoStatus.toLowerCase().trim();

    // Логируем преобразование статуса
    logger.info('Mapping crypto payment status', {
        originalStatus: cryptoStatus,
        normalizedStatus
    });

    // Проверяем наличие статуса в маппинге
    if (normalizedStatus in CRYPTO_STATUS_MAPPING) {
        const mappedStatus = CRYPTO_STATUS_MAPPING[normalizedStatus];
        logger.info('Mapped crypto payment status', {
            from: normalizedStatus,
            to: mappedStatus
        });
        return mappedStatus;
    }

    // Пытаемся определить статус по частичному совпадению
    for (const [key, value] of Object.entries(CRYPTO_STATUS_MAPPING)) {
        if (normalizedStatus.includes(key)) {
            logger.info('Mapped crypto payment status by partial match', {
                from: normalizedStatus,
                partialMatch: key,
                to: value
            });
            return value;
        }
    }

    // Если статус не найден, возвращаем Pending по умолчанию
    logger.warn('Unknown crypto payment status, defaulting to Pending', {
        unknownStatus: cryptoStatus
    });
    return PaymentStatus.Pending;
};