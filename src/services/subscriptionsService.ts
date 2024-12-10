import {Subscription} from '../interface/interface.js';
import {executeQuery} from "../server/middlewares.js";

export const createTableSubscriptions = async (): Promise<void> => {
    const query = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      subscription_type  VARCHAR(20) NOT NULL,
      price DECIMAL NOT NULL,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

    await executeQuery(query);
};

export async function listSubscription(userId: string): Promise<Subscription[]> {
    const query = `
        SELECT * FROM subscriptions WHERE user_id = $1;
    `;

    return await executeQuery(query, [userId]);
}

export async function getSubscription(subscriptionId: string | number): Promise<Subscription> {
    const query = `
         SELECT * FROM subscriptions WHERE id = $1;
    `;
    const result = await executeQuery(query, [subscriptionId]);
    if (result.length === 0) {
        throw new Error(`Subscription not found for ID: ${subscriptionId}`);
    }
    return result[0];
}

export async function createSubscription(subscriptionData: Partial<Subscription>): Promise<Subscription> {
    const query = `
        INSERT INTO subscriptions (user_id, subscription_type, price, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const values = [
        subscriptionData.userId,
        subscriptionData.subscriptionType,
        subscriptionData.price,
        subscriptionData.startDate || new Date().toISOString(),
        subscriptionData.endDate,
    ];

    const result = await executeQuery(query, values);
    return result[0];
}

export async function updateSubscription(subscriptionData: Partial<Subscription>): Promise<Subscription> {
    const updateFields = [];
    const values = [];
    let index = 1;

    if (subscriptionData.subscriptionType) {
        updateFields.push(`subscription_type  = $${index++}`);
        values.push(subscriptionData.subscriptionType);
    }
    if (subscriptionData.price) {
        updateFields.push(`price = $${index++}`);
        values.push(subscriptionData.price);
    }
    if (subscriptionData.startDate) {
        updateFields.push(`start_date = $${index++}`);
        values.push(subscriptionData.startDate);
    }

    if (subscriptionData.endDate) {
        updateFields.push(`end_date = $${index++}`);
        values.push(subscriptionData.endDate);
    }

    if (updateFields.length === 0) {
        throw new Error('No fields to update');
    }

    const query = `
        UPDATE subscriptions
        SET ${updateFields.join(', ')}
        WHERE id = $${index}
        RETURNING *;
    `;

    values.push(subscriptionData.id);
    const result = await executeQuery(query, values);
    if (result.length === 0) {
        throw new Error(`Subscription with ID ${subscriptionData.id} not found.`);
    }
    return result[0];
}

export const deleteSubscription = async (id: string | number): Promise<void> => {
    const query = `
        DELETE FROM subscriptions WHERE id = $1;
    `;
    await executeQuery(query, [id]);
}
