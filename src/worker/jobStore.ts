import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { GetFeedbackParams, SendFeedbackParams } from '@interface';
import type { GetFeedbackJob, HhJob, SendFeedbackJob } from './jobTypes.js';

const JOBS_DIR = path.resolve(process.cwd(), '.hh-jobs');

function ensureDir(): void {
  if (!fs.existsSync(JOBS_DIR)) {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
  }
}

function jobPath(id: string): string {
  return path.join(JOBS_DIR, `${id}.json`);
}

export function writeJob(job: HhJob): void {
  ensureDir();
  fs.writeFileSync(jobPath(job.id), JSON.stringify(job, null, 2), 'utf8');
}

export function readJob(id: string): HhJob | null {
  const p = jobPath(id);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8')) as HhJob;
}

export function updateJob(id: string, patch: Partial<HhJob>): HhJob {
  const cur = readJob(id);
  if (!cur) throw new Error(`job not found: ${id}`);
  const next = { ...cur, ...patch } as HhJob;
  writeJob(next);
  return next;
}

export function enqueueSendFeedback(payload: SendFeedbackParams): SendFeedbackJob {
  const job: SendFeedbackJob = {
    id: randomUUID(),
    kind: 'sendFeedback',
    status: 'queued',
    createdAt: new Date().toISOString(),
    userId: payload.userId,
    payload,
  };
  writeJob(job);
  return job;
}

export function enqueueGetFeedback(payload: GetFeedbackParams): GetFeedbackJob {
  const job: GetFeedbackJob = {
    id: randomUUID(),
    kind: 'getFeedback',
    status: 'queued',
    createdAt: new Date().toISOString(),
    userId: payload.userId,
    payload,
  };
  writeJob(job);
  return job;
}

export { JOBS_DIR };
