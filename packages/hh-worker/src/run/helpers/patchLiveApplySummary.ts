import type { Counters } from '@interface';
import { readJob, updateJob } from '../../job/store.js';

/** Keep GET /jobs/:id summary counters fresh during the apply loop (not only at end). */
export function patchLiveApplySummary(jobId: string, counters: Counters, pagesVisited: number): void {
    const prev = readJob(jobId)?.summary;
    updateJob(jobId, {
        summary: {
            found: prev?.found,
            foundListed: prev?.foundListed,
            applyablePage1: prev?.applyablePage1,
            alreadyInDb: prev?.alreadyInDb,
            success: counters.successfullySubmittedCount,
            skipped: counters.skippedCount,
            failed: counters.failedCount,
            pages: pagesVisited,
            endReason: prev?.endReason,
        },
        lastEventAt: new Date().toISOString(),
    });
}
