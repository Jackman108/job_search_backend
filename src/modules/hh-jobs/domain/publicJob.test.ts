import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { HhJob } from '@market-hunter/contracts';
import { toPublicJobListItem, toPublicJobStatus } from './publicJob.js';

function sampleJob(overrides: Partial<HhJob> = {}): HhJob {
    return {
        id: 'job-1',
        kind: 'sendFeedback',
        status: 'running',
        createdAt: '2026-11-17T00:00:00.000Z',
        userId: 'user-1',
        payload: {
            userId: 'user-1',
            email: 'secret@example.com',
            password: 'should-not-leak',
            position: 'dev',
            message: 'hi',
            vacancyUrl: 'https://hh.ru/search/vacancy',
        },
        captchaAnswer: 'ABC123',
        captchaImagePath: undefined,
        awaitingCaptcha: true,
        lastEvent: 'waiting captcha',
        ...overrides,
    } as HhJob;
}

describe('hh-jobs publicJob (S3)', () => {
    it('toPublicJobStatus omits payload and captchaAnswer', () => {
        const pub = toPublicJobStatus(sampleJob());
        const raw = JSON.stringify(pub);
        assert.equal(pub.id, 'job-1');
        assert.equal(pub.awaitingCaptcha, true);
        assert.equal(pub.hasCaptchaImage, false);
        assert.ok(!('payload' in pub));
        assert.ok(!('captchaAnswer' in pub));
        assert.ok(!('userId' in pub));
        assert.ok(!raw.includes('should-not-leak'));
        assert.ok(!raw.includes('secret@example.com'));
        assert.ok(!raw.includes('ABC123'));
    });

    it('toPublicJobListItem omits credentials', () => {
        const item = toPublicJobListItem(sampleJob({ status: 'done' }));
        const raw = JSON.stringify(item);
        assert.equal(item.status, 'done');
        assert.ok(!raw.includes('should-not-leak'));
        assert.ok(!('payload' in item));
    });
});
