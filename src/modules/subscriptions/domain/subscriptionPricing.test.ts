import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    calculateSubscriptionDetails,
    isSubscriptionType,
    SUBSCRIPTION_PRICES,
    subscriptionTypeFromAmount,
} from './subscriptionPricing.js';

describe('subscriptionPricing', () => {
    it('accepts known types', () => {
        assert.equal(isSubscriptionType('daily'), true);
        assert.equal(isSubscriptionType('yearly'), false);
    });

    it('prices match table', () => {
        assert.equal(SUBSCRIPTION_PRICES.daily, 3);
        assert.equal(SUBSCRIPTION_PRICES.weekly, 15);
        assert.equal(SUBSCRIPTION_PRICES.monthly, 50);
    });

    it('extends end date by type', () => {
        const start = new Date('2026-01-01T00:00:00.000Z');
        const daily = calculateSubscriptionDetails('daily', start);
        assert.equal(daily.price, 3);
        assert.equal(daily.endDate.toISOString().slice(0, 10), '2026-01-02');

        const weekly = calculateSubscriptionDetails('weekly', new Date('2026-01-01T00:00:00.000Z'));
        assert.equal(weekly.endDate.toISOString().slice(0, 10), '2026-01-08');
    });

    it('rejects unknown type', () => {
        assert.throws(() => calculateSubscriptionDetails('yearly'), /Invalid subscription type/);
    });

    it('maps known amounts to subscription types', () => {
        assert.equal(subscriptionTypeFromAmount(3), 'daily');
        assert.equal(subscriptionTypeFromAmount(15), 'weekly');
        assert.equal(subscriptionTypeFromAmount(50), 'monthly');
        assert.equal(subscriptionTypeFromAmount(99), null);
    });
});
