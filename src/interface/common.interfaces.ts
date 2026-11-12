// src/interface/common.interfaces.ts
export interface Counters {
    successfullySubmittedCount: number;
    /** Preflight skips (hidden resume, employer questions, disabled submit). */
    skippedCount: number;
    /** Apply attempts that opened but did not confirm success. */
    failedCount: number;
}

/** Why the apply loop finished (done-modal copy). */
export type HhApplyEndReason = 'last_page' | 'page_cap' | 'stopped' | 'aborted';

/** Apply-run totals persisted on the job file (start found + finish modal). */
export interface HhApplySummary {
    /** HH SERP «Найдено N» after search/filters (set at apply start). */
    found?: number;
    success: number;
    skipped: number;
    failed: number;
    pages: number;
    endReason?: HhApplyEndReason;
}
