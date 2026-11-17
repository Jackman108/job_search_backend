/** Shared HH job payloads (API enqueue ↔ worker). Password must be empty on disk (S2). */

export interface GetFeedbackParams {
    userId: string;
    email: string;
    password: string;
}

export interface SendFeedbackParams {
    userId: string;
    email: string;
    password: string;
    position: string;
    message: string;
    vacancyUrl: string;
    dryRun?: boolean;
    applyCap?: number;
}

export interface SyncResumeParams {
    userId: string;
    email: string;
    password: string;
}

/** Why the apply loop finished (done-modal copy). */
export type HhApplyEndReason = 'last_page' | 'page_cap' | 'apply_cap' | 'dry_run' | 'stopped' | 'aborted';

/** Apply-run totals persisted on the job file (start found + finish modal). */
export interface HhApplySummary {
    found?: number;
    foundListed?: number;
    applyablePage1?: number;
    alreadyInDb?: number;
    success: number;
    skipped: number;
    failed: number;
    pages: number;
    endReason?: HhApplyEndReason;
    failReasons?: Record<string, number>;
}
