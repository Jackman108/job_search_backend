import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import {
    decryptHhPassword,
    encryptHhPassword,
    evaluateHhCredKey,
    resetHhCredKeyCache,
    resolveHhCredKey,
} from './hhCredCrypto.js';

describe('hhCredCrypto', () => {
    const prev = process.env.HH_CRED_KEY;

    beforeEach(() => {
        resetHhCredKeyCache();
        process.env.HH_CRED_KEY = Buffer.alloc(32, 7).toString('base64');
    });

    afterEach(() => {
        resetHhCredKeyCache();
        if (prev === undefined) delete process.env.HH_CRED_KEY;
        else process.env.HH_CRED_KEY = prev;
    });

    it('round-trips password', () => {
        const key = resolveHhCredKey();
        const enc = encryptHhPassword('hunter2', key);
        assert.notEqual(enc, 'hunter2');
        assert.equal(decryptHhPassword(enc, key), 'hunter2');
    });

    it('rejects short keys', () => {
        const check = evaluateHhCredKey(Buffer.alloc(8).toString('base64'));
        assert.equal(check.ok, false);
    });

    it('produces different ciphertext each time (random IV)', () => {
        const key = resolveHhCredKey();
        const a = encryptHhPassword('same', key);
        const b = encryptHhPassword('same', key);
        assert.notEqual(a, b);
    });
});
