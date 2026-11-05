import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GetFeedbackParams, SendFeedbackParams } from '@interface';
import { enqueueGetFeedback, enqueueSendFeedback } from './jobStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  child.unref();
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
