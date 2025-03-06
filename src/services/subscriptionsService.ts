import {Subscription} from '../interface/interface.js';
import {checkTableExists, executeQuery, generateUpdateQueryWithConditions} from "../utils/queryHelpers.js";

const SUBSCRIPTION_PRICES: Record<string, number> = {
    daily: 3,
    weekly: 15,
    monthly: 50,
};


const calculateSubscriptionDetails = (subscriptionType: string, endDate: Date | string = new Date()) => {
    const price = SUBSCRIPTION_PRICES[subscriptionType];

    if (!price) {
        throw new Error('Invalid subscription type');
    }

    const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;

    switch (subscriptionType) {
        case 'daily':
            endDateObj.setDate(endDateObj.getDate() + 1);
            break;
        case 'weekly':
            endDateObj.setDate(endDateObj.getDate() + 7);
            break;
        case 'monthly':
            endDateObj.setMonth(endDateObj.getMonth() + 1);
            break;
    }

    return {price, endDate: endDateObj};
};


export const createTableSubscriptions = async (): Promise<void> => {
    const tableExists = await checkTableExists('subscriptions');
    if (tableExists) {
        console.log('Table "subscriptions" already exists.');
        return;
    }

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


export const listSubscription = async (userId: string): Promise<Subscription[]> => {
    const query = `SELECT * FROM subscriptions WHERE user_id = $1;`;
    return await executeQuery<Subscription>(query, [userId]);
}


export const getActiveSubscription = async (userId: string): Promise<Subscription[]> => {
    const query = `
        SELECT * FROM subscriptions 
        WHERE user_id = $1 AND end_date > NOW()
        ORDER BY end_date DESC
        LIMIT 1;
    `;
    return await executeQuery<Subscription>(query, [userId]);
};


export const getSubscription = async (userId: string, subscriptionId: string): Promise<Subscription> => {
    const query = `SELECT * FROM subscriptions WHERE user_id = $1 AND id = $2;`;
    const result = await executeQuery<Subscription>(query, [userId, subscriptionId]);

    if (result.length === 0) throw new Error(`Subscription not found for ID: ${subscriptionId}`);
    return result[0];
}


export const createSubscription = async (subscriptionData: Partial<Subscription>): Promise<void> => {
    const activeSubscription = await getActiveSubscription(subscriptionData.user_id!);

    if (activeSubscription.length !== 0) {
        throw new Error('User already has an active subscription.');
    }

    const {price, endDate} = calculateSubscriptionDetails(subscriptionData.subscription_type!);

    const query = `
        INSERT INTO subscriptions (user_id, subscription_type, price, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    const values = [
        subscriptionData.user_id,
        subscriptionData.subscription_type,
        price,
        subscriptionData.start_date || new Date().toISOString(),
        endDate.toISOString(),
    ];

    await executeQuery<Subscription>(query, values);
}


export const updateSubscription = async (
    userId: string, subscriptionId: string, updates: Partial<Subscription>
): Promise<void> => {
    const subscription = await getSubscription(userId, subscriptionId);
    if (new Date(subscription.end_date) < new Date()) {
        throw new Error('Cannot update expired subscription.');
    }

    const {price, endDate} = calculateSubscriptionDetails(
        updates.subscription_type || subscription.subscription_type, subscription.end_date
    );

    const {query, values} = generateUpdateQueryWithConditions(
        "subscriptions",
        {...updates, price, end_date: endDate},
        {user_id: userId, id: subscriptionId}
    );
    await executeQuery<Subscription>(query, values);
}


export const deleteSubscription = async (
    userId: string, subscriptionId: string
): Promise<void> => {
    const query = `DELETE FROM subscriptions WHERE user_id = $1 AND id = $2;`;
    await executeQuery<Subscription>(query, [userId, subscriptionId]);
}