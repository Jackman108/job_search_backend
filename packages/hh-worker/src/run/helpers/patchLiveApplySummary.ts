import type { Counters } from '@market-hunter/hh-worker/types';
import { readJob, updateJob } from '../../job/store.js';

/** Keep GET /jobs/:id summary counters fresh during the apply loop (not only at end). */
export function patchLiveApplySummary(jobId: string, counters: Counters, pagesVisited: number): void {
    const prev = readJob(jobId)?.summary;
    const success = counters.successfullySubmittedCount;
    const skipped = counters.skippedCount;
    const failed = counters.failedCount;
    updateJob(jobId, {
        summary: {
            found: prev?.found,
            foundListed: prev?.foundListed,
            applyablePage1: prev?.applyablePage1,
            alreadyInDb: prev?.alreadyInDb,
            success,
            skipped,
            failed,
            pages: pagesVisited,
            endReason: prev?.endReason,
            failReasons: counters.failReasons ?? prev?.failReasons,
        },
        lastEvent: `Отклики: ok ${success}, пропущено ${skipped}, ошибки ${failed}, стр. ${pagesVisited}`,
        lastEventAt: new Date().toISOString(),
    });
}
