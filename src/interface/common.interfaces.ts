// src/interface/common.interfaces.ts
export interface Counters {
    successfullySubmittedCount: number;
    /** Preflight skips (hidden resume, employer questions, disabled submit). */
    skippedCount: number;
    /** Apply attempts that opened but did not confirm success. */
    failedCount: number;
}

/** Final apply-run totals persisted on the job file for the client modal. */
export interface HhApplySummary {
    success: number;
    skipped: number;
    failed: number;
    pages: number;
}
