/**
 * Narrow port so claim/run loop stays free of API `@services`.
 * Wired by the detached CLI (or tests) with profile counter implementations.
 */
export interface JobCounters {
    incrementSpinCount(userId: string): Promise<void>;
    updateSuccessfulResponsesCount(userId: string): Promise<void>;
}
