/**
 * Detached HH worker claim loop — package-owned entry (spawned by bin/run.mjs).
 * Loads injectable ProcessJobDeps (default: API createProcessJobDeps).
 */
import { processJob } from './job/processJob.js';
import { loadProcessJobDeps } from './loadProcessJobDeps.js';

const jobId = process.argv[2];
if (!jobId) {
    console.error('usage: hh-worker <jobId>');
    process.exit(2);
}

loadProcessJobDeps()
    .then((deps) => processJob(jobId, deps))
    .then(() => {
        console.log(`job ${jobId} done`);
        process.exit(0);
    })
    .catch((err) => {
        console.error(`job ${jobId} failed`, err);
        process.exit(1);
    });
