import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { redact } from './redact.js';

describe('redact', () => {
    it('masks password and token keys', () => {
        const out = redact({
            email: 'a@b.c',
            password: 'secret-pass',
            nested: { token: 'abc', ok: 1 },
        }) as Record<string, unknown>;
        assert.equal(out.email, 'a@b.c');
        assert.match(String(out.password), /REDACTED/);
        const nested = out.nested as Record<string, unknown>;
        assert.match(String(nested.token), /REDACTED/);
        assert.equal(nested.ok, 1);
    });

    it('handles arrays', () => {
        const out = redact([{ password: 'x' }]) as Array<Record<string, unknown>>;
        assert.match(String(out[0].password), /REDACTED/);
    });
});
