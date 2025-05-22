import { PaymentBase } from '@interface';
import { checkTableExists, executeQuery, generateUpdateQueryWithConditions, getSubscriptionIdByUserId } from '@utils';

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
 * Получение платежа по ID подписки
 * @param subscriptionId ID подписки
 */
export const getPaymentBySubscriptionId = async (subscriptionId: string): Promise<PaymentBase | null> => {
    const query = `SELECT * FROM payments WHERE subscription_id = $1 ORDER BY created_at DESC LIMIT 1;`;
    const result = await executeQuery<PaymentBase>(query, [subscriptionId]);
    return result.length > 0 ? result[0] : null;
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
 * @param userId ID пользователя
 * @param paymentData Объект с amount, payment_status, payment_method
 */
export const createPayment = async (
    userId: string,
    paymentData: Partial<PaymentBase>
): Promise<PaymentBase> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    const query = `
        INSERT INTO payments (subscription_id, amount, payment_status, payment_method)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [
        subscriptionId,
        paymentData.amount!,
        paymentData.payment_status || 'pending',
        paymentData.payment_method || 'card'
    ];
    const [created] = await executeQuery<PaymentBase>(query, values);
    return created;
};

/**
 * Обновление полей платежа по id
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
        updates,
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
 * Возвращает активный незавершённый платеж пользователя
 * @param userId ID пользователя
 * @param paymentId ID платежа
 */
export const getActivePayment = async (
    userId: string,
    paymentId: string
): Promise<PaymentBase[]> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    const query = `
        SELECT * FROM payments
        WHERE subscription_id = $1 AND id = $2 AND payment_status = $3;
    `;
    return await executeQuery<PaymentBase>(query, [subscriptionId, paymentId, 'pending']);
};