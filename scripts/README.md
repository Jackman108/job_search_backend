# Backend scripts

## `smoke-health.mjs` (A7)

Unauthenticated liveness probe — no HH, no credentials, no DB.

```bash
yarn smoke:health
# or
API_URL=http://localhost:8000 WS_URL=ws://localhost:8080 yarn smoke:health
yarn smoke:health --http-only
```

Requires a running backend (`yarn dev`). Expects HTTP `GET /health` and WS `/health` JSON `{ status: "ok", service, ts }`.

## `verify-hh-login.mjs`

Guest Magritte selector dump for HH login-gate regressions.

```bash
node scripts/verify-hh-login.mjs
```

No real credentials; does not submit login.
