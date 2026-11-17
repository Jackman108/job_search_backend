import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveUserRank } from './deriveUserRank.js';

describe('deriveUserRank', () => {
    it('starts as Новичок', () => {
        const r = deriveUserRank(0, 0);
        assert.equal(r.id, 'novice');
        assert.equal(r.title, 'Новичок');
        assert.equal(r.level, 1);
    });

    it('reaches Искатель at 5 successful responses', () => {
        assert.equal(deriveUserRank(5, 0).title, 'Искатель');
    });

    it('counts spin bonus toward early tiers', () => {
        // 2 success + 9 spins → +3 effective → 5 → Искатель
        assert.equal(deriveUserRank(2, 9).title, 'Искатель');
    });

    it('reaches Мастер охоты at 200', () => {
        const r = deriveUserRank(200, 0);
        assert.equal(r.id, 'master');
        assert.equal(r.nextTitle, null);
        assert.equal(r.progressPct, 100);
    });
});
