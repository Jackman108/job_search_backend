/**
 * A7 minimal health smoke — no HH, no auth, no DB.
 *
 * Probes HTTP GET /health and WS /health against a running backend.
 *
 *   yarn smoke:health
 *   API_URL=http://localhost:8000 WS_URL=ws://localhost:8080 yarn smoke:health
 *   yarn smoke:health --http-only
 */
import WebSocket from 'ws';

const HTTP_TIMEOUT_MS = 5_000;
const WS_TIMEOUT_MS = 5_000;

const args = new Set(process.argv.slice(2));
const httpOnly = args.has('--http-only');

const apiBase = (process.env.API_URL || 'http://localhost:8000').replace(/\/$/, '');
const wsBase = (process.env.WS_URL || 'ws://localhost:8080').replace(/\/$/, '');

const fail = (msg) => {
    console.error(`smoke-health FAIL: ${msg}`);
    process.exit(1);
};

const assertHealthPayload = (payload, label) => {
    if (!payload || typeof payload !== 'object') {
        fail(`${label}: expected JSON object`);
    }
    if (payload.status !== 'ok') {
        fail(`${label}: status=${JSON.stringify(payload.status)} (want "ok")`);
    }
    if (typeof payload.service !== 'string' || !payload.service) {
        fail(`${label}: missing service`);
    }
    if (typeof payload.ts !== 'string' || !payload.ts) {
        fail(`${label}: missing ts`);
    }
};

const smokeHttp = async () => {
    const url = `${apiBase}/health`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);
    let res;
    try {
        res = await fetch(url, { signal: ctrl.signal });
    } catch (err) {
        fail(`HTTP ${url}: ${err.message}`);
    } finally {
        clearTimeout(timer);
    }
    if (res.status !== 200) {
        fail(`HTTP ${url}: status ${res.status}`);
    }
    const body = await res.json();
    assertHealthPayload(body, `HTTP ${url}`);
    console.log(`HTTP OK  ${url}  service=${body.service}  ts=${body.ts}`);
};

const smokeWs = () =>
    new Promise((resolve, reject) => {
        const url = `${wsBase}/health`;
        const ws = new WebSocket(url);
        let settled = false;

        const done = (err, payload) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try {
                ws.close();
            } catch {
                /* ignore */
            }
            if (err) reject(err);
            else resolve(payload);
        };

        const timer = setTimeout(() => done(new Error(`timeout after ${WS_TIMEOUT_MS}ms`)), WS_TIMEOUT_MS);

        ws.on('open', () => {
            /* server pushes health JSON then closes */
        });

        ws.on('message', (raw) => {
            try {
                const payload = JSON.parse(String(raw));
                assertHealthPayload(payload, `WS ${url}`);
                done(null, payload);
            } catch (err) {
                done(err);
            }
        });

        ws.on('error', (err) => done(err));
        ws.on('close', () => {
            if (!settled) done(new Error('closed before health payload'));
        });
    });

const main = async () => {
    await smokeHttp();
    if (httpOnly) {
        console.log('smoke-health PASS (http-only)');
        return;
    }
    try {
        const payload = await smokeWs();
        console.log(`WS   OK  ${wsBase}/health  service=${payload.service}  ts=${payload.ts}`);
    } catch (err) {
        fail(`WS ${wsBase}/health: ${err.message}`);
    }
    console.log('smoke-health PASS');
};

main().catch((err) => fail(err.message || String(err)));
