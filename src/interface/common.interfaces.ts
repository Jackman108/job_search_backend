// src/interface/common.interfaces.ts
export interface Counters {
    successfullySubmittedCount: number;
    /** Preflight skips (hidden resume, employer questions, disabled submit). */
    skippedCount: number;
    /** Apply attempts that opened but did not confirm success. */
    failedCount: number;
    /** Per-reason tallies for done-modal (e.g. no_success_marker). */
    failReasons?: Record<string, number>;
}

/** @deprecated Prefer `@market-hunter/contracts`. */
export type { HhApplyEndReason, HhApplySummary } from '@market-hunter/contracts';
