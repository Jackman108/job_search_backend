import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    buildProviderEventId,
    decideWebhookGate,
    resolveCryptoEventKey,
    resolveWebpayEventKey,
    signaturesMatch,
} from './webhookGate.js';

describe('webhookGate', () => {
    it('builds stable provider event ids', () => {
        assert.equal(buildProviderEventId('crypto', 'np_1:finished'), 'crypto:np_1:finished');
    });

    it('resolves crypto event key from payment_id + status', () => {
        assert.equal(resolveCryptoEventKey({ payment_id: 'np_1', payment_status: 'finished' }), 'np_1:finished');
        assert.equal(resolveCryptoEventKey({}), null);
    });

    it('resolves webpay event key from order + tid + status', () => {
        assert.equal(
            resolveWebpayEventKey({ wsb_order_num: 'o1', wsb_tid: 't1', wsb_status: 'paid' }),
            'o1:t1:paid',
        );
        assert.equal(resolveWebpayEventKey({}), null);
    });

    it('rejects mismatched signatures (timing-safe compare)', () => {
        assert.equal(signaturesMatch('abc', 'abc'), true);
        assert.equal(signaturesMatch('abc', 'abd'), false);
        assert.equal(signaturesMatch('abc', 'ab'), false);
        assert.equal(signaturesMatch('', 'x'), false);
    });

    it('gates invalid signature before side effects', () => {
        assert.equal(
            decideWebhookGate({ signatureOk: false, eventKey: 'e1', claim: 'claimed' }),
            'reject_signature',
        );
    });

    it('skips duplicate provider_event_id (idempotent replay)', () => {
        assert.equal(
            decideWebhookGate({ signatureOk: true, eventKey: 'e1', claim: 'duplicate' }),
            'skip_duplicate',
        );
    });

    it('processes only after claim', () => {
        assert.equal(decideWebhookGate({ signatureOk: true, eventKey: 'e1', claim: 'claimed' }), 'process');
        assert.equal(decideWebhookGate({ signatureOk: true, eventKey: null, claim: null }), 'reject_event');
    });
});
