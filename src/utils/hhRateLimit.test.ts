import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HH_RATE_LIMIT, withJitter } from './hhRateLimit.js';

describe('hhRateLimit.withJitter', () => {
    it('stays within [base, base+jitter]', () => {
        const base = HH_RATE_LIMIT.APPLY_BASE_MS;
        const jitter = HH_RATE_LIMIT.APPLY_JITTER_MS;
        for (let i = 0; i < 40; i += 1) {
            const ms = withJitter(base, jitter);
            assert.ok(ms >= base, `expected >= ${base}, got ${ms}`);
            assert.ok(ms <= base + jitter, `expected <= ${base + jitter}, got ${ms}`);
        }
    });

    it('clamps negative base/jitter to non-negative span', () => {
        assert.equal(withJitter(-10, 0), 0);
        assert.equal(withJitter(100, -5), 100);
    });
});
