import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-jobs-captcha-'));
process.env.HH_JOBS_DIR = tmpRoot;

const { enqueueSendFeedback, readJob, takeCaptchaAnswer, writeCaptchaAnswer, writeJob } = await import('./store.js');

describe('captcha answer side-channel + resilient read', () => {
    before(() => {
        fs.mkdirSync(tmpRoot, { recursive: true });
    });

    after(() => {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
    });

    it('writeCaptchaAnswer / takeCaptchaAnswer round-trip', () => {
        const job = enqueueSendFeedback({
            userId: 'u',
            email: 'a@b.c',
            password: 'x',
            position: 'dev',
            message: 'hi',
            vacancyUrl: 'https://hh.ru/search/vacancy',
        });
        writeCaptchaAnswer(job.id, ' AB12 ');
        assert.equal(takeCaptchaAnswer(job.id), 'AB12');
        assert.equal(takeCaptchaAnswer(job.id), null);
    });

    it('readJob retries past empty file then returns job', () => {
        const job = enqueueSendFeedback({
            userId: 'u2',
            email: 'a@b.c',
            password: 'x',
            position: 'dev',
            message: 'hi',
            vacancyUrl: 'https://hh.ru/search/vacancy',
        });
        writeJob({ ...job, lastEvent: 'ok' });
        const again = readJob(job.id);
        assert.ok(again);
        assert.equal(again.lastEvent, 'ok');
    });
});
