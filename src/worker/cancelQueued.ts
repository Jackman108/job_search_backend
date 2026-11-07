import { killWorker } from './enqueue.js';
import { listJobs, updateJob } from './jobStore.js';
import type { HhJob } from './jobTypes.js';

export type CancelQueuedResult = {
    cancelledJobIds: string[];
};

/**
 * Mark the caller's queued HH jobs cancelled and kill their detached workers if still tracked.
 * Running jobs are left alone (needs a separate abort signal slice).
 */
export function cancelQueuedJobsForUser(userId: string): CancelQueuedResult {
    const cancelledJobIds: string[] = [];

    for (const job of listJobs()) {
        if (job.userId !== userId || job.status !== 'queued') {
            continue;
        }
        markCancelled(job);
        killWorker(job.id);
        cancelledJobIds.push(job.id);
    }

    return { cancelledJobIds };
}

function markCancelled(job: HhJob): void {
    updateJob(job.id, {
        status: 'cancelled',
        finishedAt: new Date().toISOString(),
        error: 'Cancelled by user via /stop',
    } as Partial<HhJob>);
}
