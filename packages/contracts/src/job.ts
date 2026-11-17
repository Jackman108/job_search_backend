import type { GetFeedbackParams, HhApplySummary, SendFeedbackParams, SyncResumeParams } from './payload.js';

export type HhJobKind = 'sendFeedback' | 'getFeedback' | 'syncResume';

export type HhJobStatus = 'queued' | 'running' | 'done' | 'error' | 'cancelled';

export interface HhJobBase {
    id: string;
    kind: HhJobKind;
    status: HhJobStatus;
    createdAt: string;
    startedAt?: string;
    finishedAt?: string;
    error?: string;
    userId: string;
    countersUpdated?: boolean;
    lastEvent?: string;
    lastEventAt?: string;
    captchaSrc?: string;
    captchaImagePath?: string;
    awaitingCaptcha?: boolean;
    captchaAnswer?: string;
    captchaRefreshRequested?: boolean;
    summary?: HhApplySummary;
}

export interface SendFeedbackJob extends HhJobBase {
    kind: 'sendFeedback';
    payload: SendFeedbackParams;
}

export interface GetFeedbackJob extends HhJobBase {
    kind: 'getFeedback';
    payload: GetFeedbackParams;
}

export interface SyncResumeJob extends HhJobBase {
    kind: 'syncResume';
    payload: SyncResumeParams;
}

export type HhJob = SendFeedbackJob | GetFeedbackJob | SyncResumeJob;
