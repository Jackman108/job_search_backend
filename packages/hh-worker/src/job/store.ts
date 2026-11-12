import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { GetFeedbackParams, SendFeedbackParams } from '@interface';
import type { GetFeedbackJob, HhJob, SendFeedbackJob } from './types.js';

const JOBS_DIR = process.env.HH_JOBS_DIR
    ? path.resolve(process.env.HH_JOBS_DIR)
    : path.resolve(process.cwd(), '.hh-jobs');

const READ_RETRIES = 8;
const READ_RETRY_MS = 25;

function ensureDir(): void {
    if (!fs.existsSync(JOBS_DIR)) {
        fs.mkdirSync(JOBS_DIR, { recursive: true });
    }
}

function jobPath(id: string): string {
    return path.join(JOBS_DIR, `${id}.json`);
}

/** Side-channel so CAPTCHA answers are not lost in concurrent JSON RMW races. */
export function captchaAnswerPath(id: string): string {
    return path.join(JOBS_DIR, `${id}.captcha-answer`);
}

export function writeCaptchaAnswer(id: string, answer: string): void {
    ensureDir();
    const p = captchaAnswerPath(id);
    const tmp = `${p}.${process.pid}.${randomUUID()}.tmp`;
    fs.writeFileSync(tmp, answer, 'utf8');
    try {
        fs.renameSync(tmp, p);
    } catch {
        try {
            fs.unlinkSync(p);
        } catch {
            /* missing is fine */
        }
        fs.renameSync(tmp, p);
    }
}

/** Read+delete pending answer, or null. */
export function takeCaptchaAnswer(id: string): string | null {
    const p = captchaAnswerPath(id);
    if (!fs.existsSync(p)) return null;
    try {
        const answer = fs.readFileSync(p, 'utf8').trim();
        fs.unlinkSync(p);
        return answer || null;
    } catch {
        return null;
    }
}

function sleepSync(ms: number): void {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        /* busy-wait — short retry only; store stays sync for existing callers */
    }
}

function parseJobJson(raw: string): HhJob {
    return JSON.parse(raw) as HhJob;
}

/** Write via temp + replace so concurrent readers never see a torn JSON file. */
export function writeJob(job: HhJob): void {
    ensureDir();
    const p = jobPath(job.id);
    const tmp = `${p}.${process.pid}.${randomUUID()}.tmp`;
    const data = JSON.stringify(job, null, 2);
    fs.writeFileSync(tmp, data, 'utf8');
    try {
        // POSIX: rename over existing is atomic. Windows: rename fails if dest exists.
        fs.renameSync(tmp, p);
    } catch {
        try {
            fs.unlinkSync(p);
        } catch {
            /* missing is fine */
        }
        fs.renameSync(tmp, p);
    }
}

export function readJob(id: string): HhJob | null {
    const p = jobPath(id);
    for (let attempt = 0; attempt < READ_RETRIES; attempt++) {
        if (!fs.existsSync(p)) return null;
        try {
            const raw = fs.readFileSync(p, 'utf8');
            if (!raw.trim()) {
                sleepSync(READ_RETRY_MS);
                continue;
            }
            return parseJobJson(raw);
        } catch (err) {
            const last = attempt === READ_RETRIES - 1;
            if (last) {
                console.error(`readJob(${id}): corrupt/partial JSON after ${READ_RETRIES} tries`, err);
                return null;
            }
            sleepSync(READ_RETRY_MS);
        }
    }
    return null;
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
            const id = name.replace(/\.json$/, '');
            return readJob(id);
        })
        .filter((job): job is HhJob => job !== null);
}

export { JOBS_DIR };
