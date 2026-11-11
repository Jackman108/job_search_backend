import { getFeedback, sendFeedback } from '@market-hunter/hh-worker';
import { incrementSpinCount, updateSuccessfulResponsesCount } from '@services';
import { claimQueuedJob, readJob, updateJob } from './jobStore.js';

export async function processJob(id: string): Promise<void> {
    const job = claimQueuedJob(id);
    if (!job) {
        const existing = readJob(id);
        if (!existing || existing.status === 'cancelled') {
            return;
        }
        throw new Error(`job ${id} is not queued (status=${existing.status})`);
    }

    try {
        if (job.kind === 'sendFeedback') {
            await sendFeedback(job.payload);
            await incrementSpinCount(job.userId);
            await updateSuccessfulResponsesCount(job.userId);
            // Don't overwrite a late cancel mark (rare; kill may race).
            if (readJob(id)?.status === 'cancelled') {
                return;
            }
            updateJob(id, {
                status: 'done',
                finishedAt: new Date().toISOString(),
                countersUpdated: true,
            } as Partial<typeof job>);
        } else {
            await getFeedback(job.payload);
            if (readJob(id)?.status === 'cancelled') {
                return;
            }
            updateJob(id, {
                status: 'done',
                finishedAt: new Date().toISOString(),
            } as Partial<typeof job>);
        }
    } catch (err) {
        if (readJob(id)?.status === 'cancelled') {
            return;
        }
        const message = err instanceof Error ? err.message : String(err);
        updateJob(id, {
            status: 'error',
            finishedAt: new Date().toISOString(),
            error: message,
        } as Partial<typeof job>);
        throw err;
    }
}
