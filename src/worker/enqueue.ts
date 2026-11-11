import type { GetFeedbackParams, SendFeedbackParams } from '@interface';
import { enqueueGetFeedback, enqueueSendFeedback } from './jobStore.js';
import { spawnWorker } from './spawnWorker.js';

/** Queue HH Puppeteer work in a detached process so the API process stays up if Chrome dies. */
export function queueSendFeedback(payload: SendFeedbackParams): { jobId: string } {
    const job = enqueueSendFeedback(payload);
    spawnWorker(job.id);
    return { jobId: job.id };
}

export function queueGetFeedback(payload: GetFeedbackParams): { jobId: string } {
    const job = enqueueGetFeedback(payload);
    spawnWorker(job.id);
    return { jobId: job.id };
}
