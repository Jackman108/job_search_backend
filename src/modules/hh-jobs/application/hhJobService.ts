import fs from 'fs';
import type {
    GetFeedbackParams,
    HhJob,
    HhJobListItem,
    HhJobStatusResponse,
    SendFeedbackParams,
    SyncResumeParams,
} from '@market-hunter/contracts';
import { cancelJobsForUser } from '../../../worker/cancelJobs.js';
import { queueGetFeedback, queueSendFeedback, queueSyncResume } from '../../../worker/enqueue.js';
import { listJobs, readJob, updateJob, writeCaptchaAnswer } from '../../../worker/jobStore.js';
import { hhJobsConfig } from '../module.config.js';
import { toPublicJobListItem, toPublicJobStatus } from '../domain/publicJob.js';

export function enqueueApply(payload: SendFeedbackParams): { jobId: string } {
    return queueSendFeedback(payload);
}

export function enqueueFeedbackRefresh(payload: GetFeedbackParams): { jobId: string } {
    return queueGetFeedback(payload);
}

export function enqueueResumeSync(payload: SyncResumeParams): { jobId: string } {
    return queueSyncResume(payload);
}

export function stopUserJobs(userId: string) {
    return cancelJobsForUser(userId);
}

export function listUserJobs(userId: string, limitRaw?: number): HhJobListItem[] {
    const limit = Number.isFinite(limitRaw)
        ? Math.min(hhJobsConfig.maxListLimit, Math.max(1, Math.floor(limitRaw!)))
        : hhJobsConfig.defaultListLimit;
    return listJobs()
        .filter((job) => job.userId === userId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, limit)
        .map(toPublicJobListItem);
}

export type JobErr = { ok: false; status: 403 | 404 | 409; message: string };
export type OwnedJob = { ok: true; job: HhJob };

export function getOwnedJob(jobId: string, userId: string): OwnedJob | JobErr {
    const job = readJob(jobId);
    if (!job) return { ok: false, status: 404, message: 'Job not found.' };
    if (job.userId !== userId) return { ok: false, status: 403, message: 'Forbidden.' };
    return { ok: true, job };
}

export function getPublicJobStatus(jobId: string, userId: string): { ok: true; body: HhJobStatusResponse } | JobErr {
    const owned = getOwnedJob(jobId, userId);
    if (!owned.ok) return owned;
    return { ok: true, body: toPublicJobStatus(owned.job) };
}

export type JobActionOk = { ok: true; jobId: string };

export function requestCaptchaRefresh(jobId: string, userId: string): JobActionOk | JobErr {
    const owned = getOwnedJob(jobId, userId);
    if (!owned.ok) return owned;
    if (!owned.job.awaitingCaptcha || owned.job.status !== 'running') {
        return { ok: false, status: 409, message: 'Job is not awaiting CAPTCHA.' };
    }
    updateJob(jobId, {
        captchaRefreshRequested: true,
        lastEvent: 'CAPTCHA refresh requested',
        lastEventAt: new Date().toISOString(),
    });
    return { ok: true, jobId };
}

export function submitCaptchaAnswer(jobId: string, userId: string, answer: string): JobActionOk | JobErr {
    const owned = getOwnedJob(jobId, userId);
    if (!owned.ok) return owned;
    if (owned.job.status !== 'running') {
        return { ok: false, status: 409, message: `Job is not running (status=${owned.job.status}).` };
    }
    if (!owned.job.awaitingCaptcha) {
        return { ok: false, status: 409, message: 'Job is not awaiting a CAPTCHA answer.' };
    }
    writeCaptchaAnswer(jobId, answer);
    updateJob(jobId, {
        captchaAnswer: answer,
        lastEvent: 'CAPTCHA answer submitted',
        lastEventAt: new Date().toISOString(),
    });
    return { ok: true, jobId };
}

export function resolveCaptchaImagePath(jobId: string, userId: string): { ok: true; filePath: string } | JobErr {
    const owned = getOwnedJob(jobId, userId);
    if (!owned.ok) return owned;
    const filePath = owned.job.captchaImagePath;
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).size < 32) {
        return { ok: false, status: 404, message: 'CAPTCHA image not ready.' };
    }
    return { ok: true, filePath };
}
