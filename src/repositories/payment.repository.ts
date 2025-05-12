import { Payment } from '@interface';
import { executeQuery, generateUpdateQueryWithConditions } from '@utils';

export const PaymentRepository = {
    list: async (subscriptionId: string): Promise<Payment[]> => {
        const query = `SELECT * FROM payments WHERE subscription_id = $1;`;
        return await executeQuery<Payment>(query, [subscriptionId]);
    },

    get: async (subscriptionId: string, paymentId: string): Promise<Payment> => {
        const query = `SELECT * FROM payments WHERE subscription_id = $1 AND id = $2;`;
        const result = await executeQuery<Payment>(query, [subscriptionId, paymentId]);
        if (!result || result.length === 0) {
            throw new Error(`Payment not found for id ${paymentId}`);
        }
        return result[0];
    },

    create: async (
        subscriptionId: string,
        amount: number,
        status: string,
        method: string
    ): Promise<Payment> => {
        const query = `
            INSERT INTO payments (subscription_id, amount, payment_status, payment_method)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [subscriptionId, amount, status, method];
        const [created] = await executeQuery<Payment>(query, values);
        return created;
    },

    update: async (
        subscriptionId: string,
        paymentId: string,
        updates: Partial<Payment>
    ): Promise<void> => {
        const { query, values } = generateUpdateQueryWithConditions(
            'payments',
            updates,
            { subscription_id: subscriptionId, id: paymentId }
        );
        await executeQuery<Payment>(query, values);
    },

    delete: async (subscriptionId: string, paymentId: string): Promise<void> => {
        const query = `DELETE FROM payments WHERE subscription_id = $1 AND id = $2;`;
        await executeQuery(query, [subscriptionId, paymentId]);
    }
}; 