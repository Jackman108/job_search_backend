export type SubscriptionType = 'daily' | 'weekly' | 'monthly';

export interface SubscriptionRequestBody {
    subscription_type: SubscriptionType;
    start_date: Date;
}

export interface Subscription {
    id: string;
    user_id: string;
    subscription_type: SubscriptionType;
    price: number;
    start_date: Date;
    end_date: Date;
    created_at: Date;
    updated_at: Date;
}
