import type { GetFeedbackParams, SendFeedbackParams } from '@interface';

export type HhJobKind = 'sendFeedback' | 'getFeedback';

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
    /** Set after spin/success counters are written (sendFeedback only). */
    countersUpdated?: boolean;
}

export interface SendFeedbackJob extends HhJobBase {
    kind: 'sendFeedback';
    payload: SendFeedbackParams;
}

export interface GetFeedbackJob extends HhJobBase {
    kind: 'getFeedback';
    payload: GetFeedbackParams;
}

export type HhJob = SendFeedbackJob | GetFeedbackJob;
