import { listJobs, updateJob } from './jobStore.js';
import { killWorker } from './spawnWorker.js';
import type { HhJob, HhJobKind, HhJobStatus } from './jobTypes.js';

const STOPPABLE: ReadonlySet<HhJobStatus> = new Set(['queued', 'running']);

export type CancelJobsResult = {
    cancelledJobIds: string[];
    /** Subset that were `running` when /stop aborted them. */
    abortedJobIds: string[];
};

export type CancelJobsOptions = {
    /** When set, only jobs whose kind is in this list are cancelled. */
    kinds?: readonly HhJobKind[];
};

/**
 * Cancel the caller's queued + running HH jobs (authz by userId).
 * Marks cancelled, tree-kills tracked detached workers, then re-stamps cancelled
 * so a dying worker cannot overwrite the status with `error`.
 */
export function cancelJobsForUser(userId: string, options: CancelJobsOptions = {}): CancelJobsResult {
    const cancelledJobIds: string[] = [];
    const abortedJobIds: string[] = [];
    const kindFilter = options.kinds?.length ? new Set(options.kinds) : null;

    for (const job of listJobs()) {
        if (job.userId !== userId || !STOPPABLE.has(job.status)) {
            continue;
        }
        if (kindFilter && !kindFilter.has(job.kind)) {
            continue;
        }
        const wasRunning = job.status === 'running';
        markCancelled(job);
        killWorker(job.id);
        // Win the race against processJob catch → status:error after SIGTERM.
        markCancelled(job);
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
        lastEvent: 'Cancelled by user via /stop',
        lastEventAt: new Date().toISOString(),
        awaitingCaptcha: false,
    } as Partial<HhJob>);
}
