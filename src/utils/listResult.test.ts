import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asListResult } from './listResult.js';

describe('asListResult', () => {
    it('returns empty array for null/undefined (vacancy empty → 200 [])', () => {
        assert.deepEqual(asListResult(undefined), []);
        assert.deepEqual(asListResult(null), []);
    });

    it('passthrough for real rows', () => {
        const rows = [{ id: 1 }];
        assert.equal(asListResult(rows), rows);
    });
});
