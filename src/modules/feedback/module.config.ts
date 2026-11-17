/** Shared feedbacks table (S4). */
export const feedbackConfig = {
    table: 'feedbacks' as const,
};

export function validateFeedbackConfig(): void {
    // No required env — placeholder for module config gate.
}

/** Quoted shared feedbacks table ident. */
export function feedbackTableIdent(): string {
    return feedbackConfig.table;
}
