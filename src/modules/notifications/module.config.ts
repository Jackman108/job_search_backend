/** Env / feature flags for notifications (none required today). */
export const notificationsConfig = {
    defaultListLimit: 30,
    dailyKind: 'daily' as const,
};

export function validateNotificationsConfig(): void {
    // No required env yet — placeholder for module config gate.
}
