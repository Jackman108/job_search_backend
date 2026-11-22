import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildHealthPayload, HEALTH_HTTP_PATH, HEALTH_WS_PATH } from './health.js';

describe('system health payload', () => {
    it('builds ok payload with service and iso ts', () => {
        const payload = buildHealthPayload('backend');
        assert.equal(payload.status, 'ok');
        assert.equal(payload.service, 'backend');
        assert.equal(Number.isNaN(Date.parse(payload.ts)), false);
    });

    it('keeps http and ws health paths aligned', () => {
        assert.equal(HEALTH_HTTP_PATH, '/health');
        assert.equal(HEALTH_WS_PATH, '/health');
    });
});
