import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveRouteParamId } from './routeParamId.utils.js';

describe('resolveRouteParamId', () => {
    it('uses URL param when body id omitted', () => {
        assert.equal(resolveRouteParamId('12', undefined, 'authId'), 12);
    });

    it('accepts matching body id', () => {
        assert.equal(resolveRouteParamId('12', 12, 'authId'), 12);
    });

    it('rejects mismatched body id', () => {
        assert.throws(
            () => resolveRouteParamId('12', 99, 'authId'),
            (err: Error & { status?: number }) => err.status === 400,
        );
    });

    it('rejects non-positive param', () => {
        assert.throws(
            () => resolveRouteParamId('0', undefined, 'authId'),
            (err: Error & { status?: number }) => err.status === 400,
        );
    });
});
