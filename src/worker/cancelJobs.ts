import { listJobs, updateJob } from './jobStore.js';
import { killWorker } from './spawnWorker.js';
import type { HhJob, HhJobStatus } from './jobTypes.js';

const STOPPABLE: ReadonlySet<HhJobStatus> = new Set(['queued', 'running']);

export type CancelJobsResult = {
    cancelledJobIds: string[];
    /** Subset that were `running` when /stop aborted them. */
    abortedJobIds: string[];
};

/**
 * Cancel the caller's queued + running HH jobs (authz by userId).
 * Marks cancelled, then tree-kills tracked detached workers.
 */
export function cancelJobsForUser(userId: string): CancelJobsResult {
    const cancelledJobIds: string[] = [];
    const abortedJobIds: string[] = [];

    for (const job of listJobs()) {
        if (job.userId !== userId || !STOPPABLE.has(job.status)) {
            continue;
        }
        const wasRunning = job.status === 'running';
        markCancelled(job);
        killWorker(job.id);
        cancelledJobIds.push(job.id);
        if (wasRunning) {
            abortedJobIds.push(job.id);
        }
    }

    return { cancelledJobIds, abortedJobIds };
}

function markCancelled(job: HhJob): void {
    updateJob(job.id, {
        status: 'cancelled',
        finishedAt: new Date().toISOString(),
        error: 'Cancelled by user via /stop',
    } as Partial<HhJob>);
}
