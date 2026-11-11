import { processJob as runProcessJob } from '@market-hunter/hh-worker/job';
import { createProcessJobDeps } from './createProcessJobDeps.js';

/** Bound entry for detached CLI — injects API counters + broadcast ports. */
export async function processJob(id: string): Promise<void> {
    return runProcessJob(id, createProcessJobDeps());
}
