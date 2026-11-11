#!/usr/bin/env node
/**
 * Stable public entry for the detached HH worker.
 * API queue mode spawns this file (or HH_WORKER_ENTRY) so Chrome crashes
 * stay out of the Express process. Implementation remains in src/worker/.
 *
 * Usage: node packages/hh-worker/bin/run.mjs <jobId>
 *    or: yarn workspace @market-hunter/hh-worker start <jobId>
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendRoot = path.resolve(packageRoot, '../..');
const tsxCli = path.join(backendRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const workerCli = path.join(backendRoot, 'src', 'worker', 'cli.ts');

const jobId = process.argv[2];
if (!jobId) {
    console.error('usage: hh-worker <jobId>');
    process.exit(2);
}

if (!fs.existsSync(tsxCli)) {
    console.error(`hh-worker: tsx CLI missing at ${tsxCli} (run yarn/npm install at backend root)`);
    process.exit(1);
}
if (!fs.existsSync(workerCli)) {
    console.error(`hh-worker: worker CLI missing at ${workerCli}`);
    process.exit(1);
}

const result = spawnSync(process.execPath, [tsxCli, workerCli, jobId], {
    cwd: backendRoot,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
});

if (result.error) {
    console.error('hh-worker: failed to start', result.error);
    process.exit(1);
}

process.exit(result.status ?? 1);
