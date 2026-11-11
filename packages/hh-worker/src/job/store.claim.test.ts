import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-jobs-'));
process.env.HH_JOBS_DIR = tmpRoot;

const { claimQueuedJob, enqueueSendFeedback, readJob, updateJob } = await import('./store.js');

function samplePayload(userId: string) {
    return {
        userId,
        email: 'a@b.c',
        password: 'x',
        position: 'dev',
        message: 'hi',
        vacancyUrl: 'https://hh.ru/search/vacancy',
    };
}

describe('claimQueuedJob', () => {
    before(() => {
        fs.mkdirSync(tmpRoot, { recursive: true });
    });

    after(() => {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
    });

    it('claims queued job to running', () => {
        const job = enqueueSendFeedback(samplePayload('u1'));
        const claimed = claimQueuedJob(job.id);
        assert.ok(claimed);
        assert.equal(claimed.status, 'running');
        assert.ok(claimed.startedAt);
    });

    it('returns null when already running or missing', () => {
        const job = enqueueSendFeedback(samplePayload('u2'));
        claimQueuedJob(job.id);
        assert.equal(claimQueuedJob(job.id), null);
        assert.equal(claimQueuedJob('missing-id'), null);
        assert.equal(readJob(job.id)?.status, 'running');
    });

    it('returns null for cancelled jobs', () => {
        const job = enqueueSendFeedback(samplePayload('u3'));
        updateJob(job.id, { status: 'cancelled' });
        assert.equal(claimQueuedJob(job.id), null);
    });
});
