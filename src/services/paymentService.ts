import {Payment} from '../interface/interface.js';
import {checkTableExists, executeQuery, generateUpdateQueryWithConditions} from "../utils/queryHelpers.js";

export const getSubscriptionIdByUserId = async (userId: string): Promise<string> => {
    const query = `
        SELECT * FROM subscriptions 
        WHERE user_id = $1 AND end_date > NOW()
        ORDER BY end_date DESC
        LIMIT 1;
    `;
    const result = await executeQuery(query, [userId]);
    return result[0]?.id;
};

export const createTablePayments = async (): Promise<void> => {
    const tableExists = await checkTableExists('payments');
    if (tableExists) {
        console.log('Table "payments" already exists.');
        return;
    }
    const query = `
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
      amount DECIMAL NOT NULL,
      payment_status VARCHAR(20) DEFAULT 'pending',
      payment_method VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

    await executeQuery(query);
};


export const listPayments = async (userId: string): Promise<Payment[]> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);

    const query = `SELECT * FROM payments WHERE subscription_id = $1;`;
    return await executeQuery(query, [subscriptionId]);
}


export const getPayment = async (
    userId: string, paymentId: string
): Promise<Payment> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);

    const query = `SELECT * FROM payments WHERE subscription_id = $1 AND id = $2;`;
    const result = await executeQuery(query, [subscriptionId, paymentId]);

    if (result.length === 0) throw new Error(`Payment not found for paymentId: ${paymentId}`);
    return result[0];
}


export const createPayment = async (userId: string, paymentData: Partial<Payment>
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    if (!subscriptionId) {
        throw new Error("Payment not created. subscription not found.");
    }
    const query = `
        INSERT INTO payments (subscription_id, amount, payment_status, payment_method)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;

    const values = [
        subscriptionId,
        paymentData.amount,
        paymentData.payment_status || 'pending',
        paymentData.payment_method || 'card'
    ];

    await executeQuery<Payment>(query, values);
}


export const updatePayment = async (
    userId: string, paymentId: string, updates: Partial<Payment>
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);

    const {query, values} = generateUpdateQueryWithConditions(
        "payments",
        updates,
        {subscription_id: subscriptionId, id: paymentId}
    );
    await executeQuery<Payment>(query, values);
};


export const updatePaymentStatus = async (
    userId: string, paymentId: string, status: string
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);

    const {query, values} = generateUpdateQueryWithConditions(
        "payments",
        {payment_status: status},
        {subscription_id: subscriptionId, paymentId}
    );

    await executeQuery<Payment>(query, values);
}


export const deletePayment = async (
    userId: string, paymentId: string
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);

    const query = `DELETE FROM payments WHERE subscription_id = $1 AND id = $2;`;
    await executeQuery(query, [subscriptionId, paymentId]);
}
