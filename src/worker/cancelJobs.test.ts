import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cancelJobsForUser } from './cancelJobs.js';
import { enqueueGetFeedback, enqueueSendFeedback, readJob } from './jobStore.js';

const jobsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.hh-jobs');

afterEach(() => {
    if (!fs.existsSync(jobsDir)) return;
    for (const name of fs.readdirSync(jobsDir)) {
        if (!name.endsWith('.json')) continue;
        const full = path.join(jobsDir, name);
        try {
            const raw = JSON.parse(fs.readFileSync(full, 'utf8')) as { userId?: string };
            if (raw.userId === 'cancel-jobs-test-user') fs.unlinkSync(full);
        } catch {
            /* ignore */
        }
    }
});

describe('cancelJobsForUser', () => {
    it('cancels only requested kinds', () => {
        const userId = 'cancel-jobs-test-user';
        const apply = enqueueSendFeedback({
            userId,
            email: 'a@b.c',
            password: '',
            position: 'x',
            message: 'm',
            vacancyUrl: 'https://hh.ru/search/vacancy?text=x',
        });
        const refresh = enqueueGetFeedback({ userId, email: 'a@b.c', password: '' });

        const result = cancelJobsForUser(userId, { kinds: ['sendFeedback'] });
        assert.deepEqual(result.cancelledJobIds, [apply.id]);
        assert.equal(readJob(apply.id)?.status, 'cancelled');
        assert.equal(readJob(refresh.id)?.status, 'queued');

        const result2 = cancelJobsForUser(userId, { kinds: ['getFeedback'] });
        assert.deepEqual(result2.cancelledJobIds, [refresh.id]);
        assert.equal(readJob(refresh.id)?.status, 'cancelled');
    });
});
