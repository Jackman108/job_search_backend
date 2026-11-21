/** Subscriptions / plans. */
export const subscriptionsConfig = {
    table: 'subscriptions' as const,
};

export function validateSubscriptionsConfig(): void {
    // No required env today; prices live in domain.
}
