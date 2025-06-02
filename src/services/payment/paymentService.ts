import { CreatePaymentParams, PaymentBase, PaymentStatus } from '@interface';
import { getSubscriptionIdByUserId, withErrorHandling } from '@integrations';
import { checkTableExists, executeQuery, generateUpdateQueryWithConditions } from '@utils';


/**
 * @module PaymentService
 * @description Базовый сервис для управления платежами
 * Этот модуль содержит функции для работы с таблицей payments:
 * - Создание и обновление таблицы
 * - CRUD операции с платежами
 * - Безопасные операции с обработкой ошибок
 */

/**
 * Создание таблицы payments с необходимыми полями
 */
export const createTablePayments = async (): Promise<void> => {
    const exists = await checkTableExists('payments');
    if (exists) return;
    const query = `
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
      amount DECIMAL NOT NULL,
      payment_status VARCHAR(20) DEFAULT 'pending',
      payment_method VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`;
    await executeQuery(query);
};

/**
 * Список всех платежей пользователя по подписке
 * @param userId ID пользователя из AuthenticatedRequest
 */
export const listPayments = async (userId: string): Promise<PaymentBase[]> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    const query = `SELECT * FROM payments WHERE subscription_id = $1;`;
    return await executeQuery<PaymentBase>(query, [subscriptionId]);
};

/**
 * Получение одного платежа по subscription_id и id
 * @param userId ID пользователя
 * @param paymentId ID платежа
 */
export const getPayment = async (
    userId: string,
    paymentId: string
): Promise<PaymentBase> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    const query = `SELECT * FROM payments WHERE subscription_id = $1 AND id = $2;`;
    const result = await executeQuery<PaymentBase>(query, [subscriptionId, paymentId]);
    if (!result[0]) throw new Error(`Payment not found for id ${paymentId}`);
    return result[0];
};

/**
 * Создание нового платежа
 * @param params Параметры для создания платежа
 */
export const createPayment = async (
    params: CreatePaymentParams
): Promise<PaymentBase> => {
    const { userId, amount, payment_method, subscription_id } = params;

    // Проверяем, что хотя бы один из userId или subscription_id определен
    if (!userId && !subscription_id) {
        throw new Error('Either userId or subscription_id must be provided');
    }

    // Получаем subscription_id из userId, если subscription_id не указан
    const actualSubscriptionId = subscription_id || (userId ? await getSubscriptionIdByUserId(userId) : '');

    const query = `
        INSERT INTO payments (subscription_id, amount, payment_status, payment_method)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [
        actualSubscriptionId,
        amount,
        PaymentStatus.Pending,
        payment_method || 'webpay'
    ];
    const [created] = await executeQuery<PaymentBase>(query, values);
    return created;
};

/**
 * Обновление полей платежа по id
 * @param userId ID пользователя
 * @param paymentId ID платежа
 * @param updates Поля для обновления
 */
export const updatePayment = async (
    userId: string,
    paymentId: string,
    updates: Partial<PaymentBase>
): Promise<PaymentBase> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);

    const { query, values } = generateUpdateQueryWithConditions(
        'payments',
        { ...updates, updated_at: new Date() },
        { subscription_id: subscriptionId, id: paymentId }
    );
    await executeQuery(query, values);

    // Возвращаем обновлённую запись
    const [updated] = await executeQuery<PaymentBase>(
        `SELECT * FROM payments WHERE id = $1;`,
        [paymentId]
    );
    return updated;
};

/**
 * Удаление платежа по subscription_id и id
 * @param userId ID пользователя
 * @param paymentId ID платежа
 */
export const deletePayment = async (
    userId: string,
    paymentId: string
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    const query = `DELETE FROM payments WHERE subscription_id = $1 AND id = $2;`;
    await executeQuery(query, [subscriptionId, paymentId]);
};

/**
 * Безопасные операции с платежами для использования в контроллерах
 * Обрабатывают ошибки и возвращают результат в стандартном формате
 */
export const safePaymentOperations = {
    listPayments: async (userId: string) => {
        return withErrorHandling(async () => {
            return await listPayments(userId);
        });
    },

    getPayment: async (userId: string, paymentId: string) => {
        return withErrorHandling(async () => {
            const payment = await getPayment(userId, paymentId);
            if (!payment) {
                throw new Error(`Payment not found for id ${paymentId}`);
            }
            return payment;
        });
    },

    createPayment: async (params: CreatePaymentParams) => {
        return withErrorHandling(async () => {
            return await createPayment(params);
        });
    },

    updatePayment: async (userId: string, paymentId: string, updates: Partial<PaymentBase>) => {
        return withErrorHandling(async () => {
            return await updatePayment(userId, paymentId, updates);
        });
    },

    deletePayment: async (userId: string, paymentId: string) => {
        return withErrorHandling(async () => {
            await deletePayment(userId, paymentId);
        });
    }
};