import type { GetFeedbackParams, SendFeedbackParams } from '@interface';
import { logger } from '../utils/logger.js';
import { enqueueGetFeedback, enqueueSendFeedback } from './jobStore.js';
import { spawnWorker } from './spawnWorker.js';

/** Queue HH Puppeteer work in a detached process so the API process stays up if Chrome dies. */
export function queueSendFeedback(payload: SendFeedbackParams): { jobId: string } {
    const job = enqueueSendFeedback(payload);
    logger.info('HH job queued (sendFeedback /start)', {
        jobId: job.id,
        userId: payload.userId,
        position: payload.position,
    });
    spawnWorker(job.id);
    return { jobId: job.id };
}

export function queueGetFeedback(payload: GetFeedbackParams): { jobId: string } {
    const job = enqueueGetFeedback(payload);
    logger.info('HH job queued (getFeedback /refresh)', {
        jobId: job.id,
        userId: payload.userId,
    });
    spawnWorker(job.id);
    return { jobId: job.id };
}
