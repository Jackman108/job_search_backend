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
    /** Alias of foundListed (legacy single number for toast/modal). */
    found?: number;
    /** HH SERP header «Найдено N» after filters. */
    foundListed?: number;
    /** Vacancies on page 1 not already in DB (applyable at announce). */
    applyablePage1?: number;
    /** Skip-set size at announce (already in DB). */
    alreadyInDb?: number;
    success: number;
    skipped: number;
    failed: number;
    pages: number;
    endReason?: HhApplyEndReason;
}
