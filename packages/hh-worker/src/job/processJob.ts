import { getFeedback } from '../run/getFeedback.js';
import { sendFeedback } from '../run/sendFeedback.js';
import { createJobStoreBroadcast } from './jobStoreBroadcast.js';
import type { ProcessJobDeps } from './processJob.deps.js';
import { claimQueuedJob, readJob, updateJob } from './store.js';

/**
 * Claim a queued HH job and run the matching scenario.
 * Counters, broadcast, and persistence are injected — package must not import API internals.
 * Broadcast is wrapped so CAPTCHA/errors land on the job file for GET /jobs/:id poll.
 */
export async function processJob(id: string, deps: ProcessJobDeps): Promise<void> {
    const { counters } = deps;
    const job = claimQueuedJob(id);
    if (!job) {
        const existing = readJob(id);
        if (!existing || existing.status === 'cancelled') {
            return;
        }
        throw new Error(`job ${id} is not queued (status=${existing.status})`);
    }

    const broadcast = createJobStoreBroadcast(id, deps.broadcast);

    try {
        if (job.kind === 'sendFeedback') {
            await sendFeedback(job.payload, {
                vacancyRepo: deps.vacancyRepo,
                broadcast,
                jobId: id,
            });
            await counters.incrementSpinCount(job.userId);
            await counters.updateSuccessfulResponsesCount(job.userId);
            // Don't overwrite a late cancel mark (rare; kill may race).
            if (readJob(id)?.status === 'cancelled') {
                return;
            }
            updateJob(id, {
                status: 'done',
                finishedAt: new Date().toISOString(),
                countersUpdated: true,
            });
            broadcast.broadcast(`HH job ${id} done (sendFeedback)`);
        } else {
            await getFeedback(job.payload, {
                feedbackRepo: deps.feedbackRepo,
                broadcast,
                jobId: id,
            });
            if (readJob(id)?.status === 'cancelled') {
                return;
            }
            updateJob(id, {
                status: 'done',
                finishedAt: new Date().toISOString(),
            });
            broadcast.broadcast(`HH job ${id} done (getFeedback)`);
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
            lastEvent: message,
            lastEventAt: new Date().toISOString(),
        });
        broadcast.broadcast(`HH job ${id} error: ${message}`);
        throw err;
    }
}
