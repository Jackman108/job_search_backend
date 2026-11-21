import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { buildClefEvent, resetSeqSinkState, resolveSeqUrl } from './seqSink.js';

describe('seqSink', () => {
    const prev = process.env.SEQ_URL;

    beforeEach(() => {
        resetSeqSinkState();
        delete process.env.SEQ_URL;
    });

    afterEach(() => {
        resetSeqSinkState();
        if (prev === undefined) {
            delete process.env.SEQ_URL;
        } else {
            process.env.SEQ_URL = prev;
        }
    });

    it('resolveSeqUrl is null when unset', () => {
        assert.equal(resolveSeqUrl(), null);
    });

    it('resolveSeqUrl strips trailing slash', () => {
        process.env.SEQ_URL = 'http://127.0.0.1:5341/';
        resetSeqSinkState();
        assert.equal(resolveSeqUrl(), 'http://127.0.0.1:5341');
    });

    it('buildClefEvent emits CLEF fields', () => {
        const line = buildClefEvent('info', 'hello', { jobId: 'abc' });
        const parsed = JSON.parse(line) as Record<string, unknown>;
        assert.equal(parsed['@mt'], 'hello');
        assert.equal(parsed['@l'], 'Information');
        assert.equal(parsed.Service, 'backend');
        assert.deepEqual(parsed.Meta, { jobId: 'abc' });
        assert.equal(typeof parsed['@t'], 'string');
    });
});
