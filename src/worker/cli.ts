/**
 * Detached HH worker claim loop (spawned by packages/hh-worker bin).
 * Package owns processJob; this process injects API counters + broadcast ports.
 * Prefer: yarn worker -- <jobId>  |  node packages/hh-worker/bin/run.mjs <jobId>
 */
import { processJob } from './processJob.js';

const jobId = process.argv[2];
if (!jobId) {
    console.error('usage: tsx src/worker/cli.ts <jobId>');
    process.exit(2);
}

processJob(jobId)
    .then(() => {
        console.log(`job ${jobId} done`);
        process.exit(0);
    })
    .catch((err) => {
        console.error(`job ${jobId} failed`, err);
        process.exit(1);
    });
