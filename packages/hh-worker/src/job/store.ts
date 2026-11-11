import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { GetFeedbackParams, SendFeedbackParams } from '@interface';
import type { GetFeedbackJob, HhJob, SendFeedbackJob } from './types.js';

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

/** Transition queued → running; returns null if missing, cancelled, or already claimed. */
export function claimQueuedJob(id: string): HhJob | null {
    const cur = readJob(id);
    if (!cur || cur.status !== 'queued') {
        return null;
    }
    return updateJob(id, {
        status: 'running',
        startedAt: new Date().toISOString(),
    } as Partial<HhJob>);
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

/** All jobs currently on disk (queued/running/terminal). */
export function listJobs(): HhJob[] {
    ensureDir();
    return fs
        .readdirSync(JOBS_DIR)
        .filter((name) => name.endsWith('.json'))
        .map((name) => {
            try {
                return JSON.parse(fs.readFileSync(path.join(JOBS_DIR, name), 'utf8')) as HhJob;
            } catch {
                return null;
            }
        })
        .filter((job): job is HhJob => job !== null);
}

export { JOBS_DIR };
