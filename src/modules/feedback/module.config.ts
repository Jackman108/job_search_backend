/** Env / flags for feedback (per-user tables until S4). */
export const feedbackConfig = {
    tableSuffix: 'feedbacks' as const,
};

export function validateFeedbackConfig(): void {
    // No required env — placeholder for module config gate.
}

/** Quoted per-user feedback table ident (legacy naming until S4). */
export function feedbackTableIdent(userId: string): string {
    return `"${userId}_${feedbackConfig.tableSuffix}"`;
}
