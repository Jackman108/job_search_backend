import type { HhApplySummary } from './payload.js';
import type { HhJobKind, HhJobStatus } from './job.js';

/** HTTP DTOs for HH script routes. Credentials come from the client form — never secrets.ts. */

export interface StartScriptBody {
    email: string;
    password: string;
    position: string;
    message: string;
    vacancyUrl: string;
    dryRun?: boolean;
    applyCap?: number;
}

export interface RefreshScriptBody {
    email: string;
    password: string;
}

export interface StopScriptBody {
    browser?: unknown;
}

export interface SyncResumeBody {
    email?: string;
    password?: string;
}

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

/** Public job status — never includes HH credentials / raw payload (S3). */
export interface HhJobStatusResponse {
    id: string;
    kind: HhJobKind;
    status: HhJobStatus;
    createdAt: string;
    startedAt?: string;
    finishedAt?: string;
    error?: string;
    countersUpdated: boolean;
    lastEvent?: string;
    lastEventAt?: string;
    captchaSrc?: string;
    hasCaptchaImage?: boolean;
    awaitingCaptcha?: boolean;
    summary?: HhApplySummary;
}

export interface HhJobListItem {
    id: string;
    kind: HhJobKind;
    status: HhJobStatus;
    createdAt: string;
    startedAt?: string;
    finishedAt?: string;
    error?: string;
    lastEvent?: string;
    summary?: HhApplySummary;
}

export interface CaptchaAnswerBody {
    answer: string;
}
