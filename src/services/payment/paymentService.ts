import { CreatePaymentParams, PaymentBase, PaymentStatus } from '@interface';
import { getSubscriptionIdByUserId, withErrorHandling } from '@integrations';
import { checkTableExists, executeQuery, generateUpdateQueryWithConditions } from '@utils';
import { isPaymentsKeyedByUserId } from '../integrations/common/paymentSchema.utils';

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
    if (await isPaymentsKeyedByUserId()) {
        return executeQuery<PaymentBase>(`SELECT * FROM payments WHERE user_id = $1;`, [userId]);
    }
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    return executeQuery<PaymentBase>(`SELECT * FROM payments WHERE subscription_id = $1;`, [subscriptionId]);
};

/**
 * Получение одного платежа по id (scoped to user)
 */
export const getPayment = async (userId: string, paymentId: string): Promise<PaymentBase> => {
    if (await isPaymentsKeyedByUserId()) {
        const byUser = await executeQuery<PaymentBase>(`SELECT * FROM payments WHERE user_id = $1 AND id = $2;`, [
            userId,
            paymentId,
        ]);
        if (!byUser[0]) throw new Error(`Payment not found for id ${paymentId}`);
        return byUser[0];
    }
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    const result = await executeQuery<PaymentBase>(`SELECT * FROM payments WHERE subscription_id = $1 AND id = $2;`, [
        subscriptionId,
        paymentId,
    ]);
    if (!result[0]) throw new Error(`Payment not found for id ${paymentId}`);
    return result[0];
};

/**
 * Создание нового платежа
 */
export const createPayment = async (params: CreatePaymentParams): Promise<PaymentBase> => {
    const { userId, amount, payment_method, subscription_id } = params;

    if (!userId && !subscription_id) {
        throw new Error('Either userId or subscription_id must be provided');
    }

    if (await isPaymentsKeyedByUserId()) {
        if (!userId) throw new Error('userId is required for shared payments schema');
        const [created] = await executeQuery<PaymentBase>(
            `INSERT INTO payments (user_id, amount, payment_status, payment_method)
             VALUES ($1, $2, $3, $4) RETURNING *;`,
            [userId, amount, PaymentStatus.Pending, payment_method || 'webpay'],
        );
        return created;
    }

    const actualSubscriptionId = subscription_id || (userId ? await getSubscriptionIdByUserId(userId) : '');
    const [created] = await executeQuery<PaymentBase>(
        `INSERT INTO payments (subscription_id, amount, payment_status, payment_method)
         VALUES ($1, $2, $3, $4) RETURNING *;`,
        [actualSubscriptionId, amount, PaymentStatus.Pending, payment_method || 'webpay'],
    );
    return created;
};

/**
 * Обновление полей платежа по id
 */
export const updatePayment = async (
    userId: string,
    paymentId: string,
    updates: Partial<PaymentBase>,
): Promise<PaymentBase> => {
    const scope = (await isPaymentsKeyedByUserId())
        ? { user_id: userId, id: paymentId }
        : { subscription_id: await getSubscriptionIdByUserId(userId), id: paymentId };

    const { query, values } = generateUpdateQueryWithConditions(
        'payments',
        { ...updates, updated_at: new Date() },
        scope,
    );
    await executeQuery(query, values);

    const [updated] = await executeQuery<PaymentBase>(`SELECT * FROM payments WHERE id = $1;`, [paymentId]);
    return updated;
};

/**
 * Удаление платежа по id (scoped to user)
 */
export const deletePayment = async (userId: string, paymentId: string): Promise<void> => {
    await executeQuery(`DELETE FROM crypto_payments WHERE payment_id = $1;`, [paymentId]).catch(() => undefined);
    await executeQuery(`DELETE FROM webpay_payments WHERE payment_id = $1;`, [paymentId]).catch(() => undefined);

    if (await isPaymentsKeyedByUserId()) {
        await executeQuery(`DELETE FROM payments WHERE user_id = $1 AND id = $2;`, [userId, paymentId]);
        return;
    }
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    await executeQuery(`DELETE FROM payments WHERE subscription_id = $1 AND id = $2;`, [subscriptionId, paymentId]);
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
    },
};
