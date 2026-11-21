import type express from 'express';
import { validateSubscriptionsConfig } from './module.config.js';
import { registerSubscriptionRoutes } from './http/subscription.routes.js';

export { SubscriptionController } from './http/SubscriptionController.js';
export {
    activateSubscription,
    createSubscription,
    createTableSubscriptions,
    deleteSubscription,
    getActiveSubscription,
    getSubscription,
    listSubscription,
    updateSubscription,
} from './application/subscriptionService.js';
export {
    calculateSubscriptionDetails,
    isSubscriptionType,
    SUBSCRIPTION_PRICES,
    type SubscriptionType,
} from './domain/subscriptionPricing.js';
export { subscriptionsConfig } from './module.config.js';

export function register(app: express.Application): void {
    validateSubscriptionsConfig();
    registerSubscriptionRoutes(app);
}
