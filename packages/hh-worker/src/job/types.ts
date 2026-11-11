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
    /** Latest worker progress line (CAPTCHA / errors / milestones) for poll SoT. */
    lastEvent?: string;
    lastEventAt?: string;
    /** CAPTCHA image URL when detected (login or mid-apply). */
    captchaSrc?: string;
    /** Local PNG under `.hh-jobs/` for headless human solve. */
    captchaImagePath?: string;
    /** Worker is blocked on CAPTCHA — POST /jobs/:id/captcha. */
    awaitingCaptcha?: boolean;
    /** One-shot answer written by API; cleared when worker consumes it. */
    captchaAnswer?: string;
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
