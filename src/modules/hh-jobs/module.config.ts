/** Env / feature flags for HH job enqueue + poll. */
export const hhJobsConfig = {
    /** Max enqueue calls (/start|/refresh|/sync-resume) per user per window (S10). */
    enqueueMaxPerWindow: 6,
    /** Sliding window for enqueue rate limit (ms). */
    enqueueWindowMs: 60_000,
    /** Default GET /jobs list limit. */
    defaultListLimit: 20,
    maxListLimit: 50,
};

export function validateHhJobsConfig(): void {
    if (hhJobsConfig.enqueueMaxPerWindow < 1) {
        throw new Error('hhJobsConfig.enqueueMaxPerWindow must be >= 1');
    }
    if (hhJobsConfig.enqueueWindowMs < 1000) {
        throw new Error('hhJobsConfig.enqueueWindowMs must be >= 1000');
    }
}
