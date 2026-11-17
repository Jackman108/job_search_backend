import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-jobs-redact-'));
process.env.HH_JOBS_DIR = tmpRoot;

const { enqueueSendFeedback, readJob } = await import('./store.js');

describe('writeJob redacts password (S2)', () => {
    before(() => {
        fs.mkdirSync(tmpRoot, { recursive: true });
    });

    after(() => {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
    });

    it('does not persist plaintext password on disk', () => {
        const job = enqueueSendFeedback({
            userId: 'u',
            email: 'a@b.c',
            password: 'super-secret',
            position: 'dev',
            message: 'hi',
            vacancyUrl: 'https://hh.ru/search/vacancy',
        });
        const raw = fs.readFileSync(path.join(tmpRoot, `${job.id}.json`), 'utf8');
        assert.equal(raw.includes('super-secret'), false);
        const again = readJob(job.id);
        assert.ok(again);
        assert.equal(again.payload.password, '');
        assert.equal(again.payload.email, 'a@b.c');
    });
});
