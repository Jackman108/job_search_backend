#!/usr/bin/env node
/**
 * A7 cross-service smoke (no live HH):
 *   auth login (seed user) → backend GET /health → GET /vacancy with Bearer → 200 array
 *
 * Env:
 *   AUTH_URL   default http://localhost:8001/api
 *   API_URL    default http://localhost:8000
 *   E2E_EMAIL / E2E_PASSWORD  default seed user
 *   E2E_REQUIRE=1  fail if services down (CI when stack is up); otherwise skip exit 0
 */
const AUTH_URL = (process.env.AUTH_URL || 'http://localhost:8001/api').replace(/\/$/, '');
const API_URL = (process.env.API_URL || 'http://localhost:8000').replace(/\/$/, '');
const EMAIL = process.env.E2E_EMAIL || 'user@market-hunter.local';
const PASSWORD = process.env.E2E_PASSWORD || 'Aa12345678';
const REQUIRE = process.env.E2E_REQUIRE === '1';

const skip = (reason) => {
    console.warn(`[e2e-cross] skip: ${reason}`);
    process.exit(0);
};

const fail = (reason) => {
    console.error(`[e2e-cross] fail: ${reason}`);
    process.exit(1);
};

async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    const text = await res.text();
    let body = null;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = text;
    }
    return { res, body };
}

async function main() {
    let health;
    try {
        health = await fetchJson(`${API_URL}/health`);
    } catch (err) {
        const msg = `backend unreachable at ${API_URL}/health (${err.message})`;
        if (REQUIRE) fail(msg);
        skip(msg);
    }
    if (!health.res.ok) {
        const msg = `backend /health → ${health.res.status}`;
        if (REQUIRE) fail(msg);
        skip(msg);
    }
    console.log('[e2e-cross] backend /health ok');

    let login;
    try {
        login = await fetchJson(`${AUTH_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
        });
    } catch (err) {
        const msg = `auth unreachable at ${AUTH_URL} (${err.message})`;
        if (REQUIRE) fail(msg);
        skip(msg);
    }
    if (!login.res.ok || !login.body?.accessToken) {
        fail(`auth login → ${login.res.status} ${JSON.stringify(login.body)}`);
    }
    console.log('[e2e-cross] auth login ok');

    const token = login.body.accessToken;
    const vacancy = await fetchJson(`${API_URL}/vacancy`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!vacancy.res.ok) {
        fail(`GET /vacancy → ${vacancy.res.status} ${JSON.stringify(vacancy.body)}`);
    }
    if (!Array.isArray(vacancy.body)) {
        fail(`GET /vacancy expected array, got ${typeof vacancy.body}`);
    }
    console.log(`[e2e-cross] GET /vacancy ok (length=${vacancy.body.length})`);
    console.log('[e2e-cross] pass');
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
