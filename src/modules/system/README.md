# system

Cross-cutting HTTP surface: liveness probes and OpenAPI UI. No domain tables.

## Public API

- `register(app)` — mount `GET /health` and `/api-docs`
- `buildHealthPayload(service)`, `HEALTH_HTTP_PATH`, `HEALTH_WS_PATH`
- `swaggerRouter`, `SWAGGER_MOUNT`

## Tables

None.

## Env

None required.

## Routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | no (liveness, no DB) |
| GET | `/api-docs` | no (Swagger UI) |

WS liveness uses the same `/health` path via `server/wsHealth.ts` + `buildHealthPayload`.

## Security

- Health and docs are intentionally public (no JWT, no secrets in payload).
- Do not attach DB or credential checks to `/health` — keep it safe for compose/k8s probes.
