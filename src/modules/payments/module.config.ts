/** Payments core + info + provider CRUD. Integration strategies / S6 webhooks follow. */
export const paymentsConfig = {
    table: 'payments' as const,
};

export function validatePaymentsConfig(): void {
    // Provider secrets validated where used; missing keys warn once (quality-bar).
}
