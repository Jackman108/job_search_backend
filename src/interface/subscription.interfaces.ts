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

export interface Payment {
    id: string;
    subscription_id: string;
    amount: number;
    payment_status: 'pending' | 'completed' | 'failed';
    payment_method: string;
    created_at: Date;
    updated_at: Date;
} 