/**
 * HTTP DTOs for HH script routes (POST /start, /refresh, /stop, GET /jobs/:jobId).
 * Credentials always come from the request body — never from secrets.ts.
 */

export interface StartScriptBody {
    email: string;
    password: string;
    position: string;
    message: string;
    vacancyUrl: string;
}

export interface RefreshScriptBody {
    email: string;
    password: string;
}

export interface StopScriptBody {
    /** Optional legacy browser hint (ignored; stop uses job cancel + PID kill). */
    browser?: unknown;
}

export type HhWorkerMode = 'queue';

/** `/start` and `/refresh` always queue a detached worker. */
export interface HhJobQueuedResponse {
    message: string;
    jobId: string;
    mode: 'queue';
}

export interface StopScriptResponse {
    message: string;
    cancelledJobIds: string[];
    cancelledCount: number;
    abortedJobIds: string[];
    abortedCount: number;
}

export type HhJobKindDto = 'sendFeedback' | 'getFeedback';

export type HhJobStatusDto = 'queued' | 'running' | 'done' | 'error' | 'cancelled';

/** Public job status — never includes HH credentials from the stored payload. */
export interface HhJobStatusResponse {
    id: string;
    kind: HhJobKindDto;
    status: HhJobStatusDto;
    createdAt: string;
    startedAt?: string;
    finishedAt?: string;
    error?: string;
    countersUpdated: boolean;
    /** Latest worker progress line for poll SoT (CAPTCHA / errors). */
    lastEvent?: string;
    lastEventAt?: string;
    /** CAPTCHA image URL when detected. */
    captchaSrc?: string;
}
