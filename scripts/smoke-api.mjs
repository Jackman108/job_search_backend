#!/usr/bin/env node
/**
 * E3 API smoke (no live HH / no Playwright yet):
 *   backend /health → auth login → GET /vacancy → 200 array (empty OK)
 *
 * Fails if stack is down (unlike `yarn e2e`, which skips).
 *
 *   yarn smoke:api
 *   SMOKE_REQUIRE=0 yarn smoke:api   # skip-if-down (same as e2e)
 */
process.env.E2E_REQUIRE = process.env.SMOKE_REQUIRE === '0' ? '0' : '1';
await import('./e2e-cross.mjs');
