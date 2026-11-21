export type SubscriptionType = 'daily' | 'weekly' | 'monthly';

export const SUBSCRIPTION_PRICES: Record<SubscriptionType, number> = {
    daily: 3,
    weekly: 15,
    monthly: 50,
};

export function isSubscriptionType(value: string): value is SubscriptionType {
    return value === 'daily' || value === 'weekly' || value === 'monthly';
}

/** Pure: price + end date for a subscription type. */
export function calculateSubscriptionDetails(
    subscriptionType: string,
    endDate: Date | string = new Date(),
): { price: number; endDate: Date } {
    if (!isSubscriptionType(subscriptionType)) {
        throw new Error('Invalid subscription type');
    }
    const price = SUBSCRIPTION_PRICES[subscriptionType];
    const endDateObj = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate.getTime());

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

    return { price, endDate: endDateObj };
}
