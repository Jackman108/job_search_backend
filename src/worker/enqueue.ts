import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GetFeedbackParams, SendFeedbackParams } from '@interface';
import { enqueueGetFeedback, enqueueSendFeedback } from './jobStore.js';
import { killProcessTree } from './killProcessTree.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** jobId → detached worker PID (API process only). */
const workerPids = new Map<string, number>();

function spawnWorker(jobId: string): void {
    const cli = path.join(__dirname, 'cli.ts');
    const tsxCli = path.resolve(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
    const child = spawn(process.execPath, [tsxCli, cli, jobId], {
        detached: true,
        stdio: 'ignore',
        cwd: process.cwd(),
        env: process.env,
        windowsHide: true,
    });
    if (child.pid) {
        workerPids.set(jobId, child.pid);
    }
    child.on('exit', () => {
        workerPids.delete(jobId);
    });
    child.unref();
}

/** Best-effort tree-kill of a tracked detached worker (no-op if already exited). */
export function killWorker(jobId: string): boolean {
    const pid = workerPids.get(jobId);
    if (!pid) {
        return false;
    }
    const killed = killProcessTree(pid);
    workerPids.delete(jobId);
    return killed;
}

/** Queue HH Puppeteer work in a detached process so the API process stays up if Chrome dies. */
export function queueSendFeedback(payload: SendFeedbackParams): { jobId: string } {
    const job = enqueueSendFeedback(payload);
    spawnWorker(job.id);
    return { jobId: job.id };
}

export function queueGetFeedback(payload: GetFeedbackParams): { jobId: string } {
    const job = enqueueGetFeedback(payload);
    spawnWorker(job.id);
    return { jobId: job.id };
}

/** Sync path (legacy). Set HH_WORKER_MODE=sync to force. Default: queue. */
export function useQueuedWorker(): boolean {
    const mode = (process.env.HH_WORKER_MODE || 'queue').toLowerCase();
    return mode !== 'sync';
}
