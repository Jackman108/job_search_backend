# `@market-hunter/hh-worker`

Dedicated package for the HeadHunter Puppeteer worker: public bin + Puppeteer scenarios.

## Crash isolation

| Mode | Env | Behavior |
|------|-----|----------|
| **queue** (default) | `HH_WORKER_MODE=queue` or unset | API writes `.hh-jobs/<id>.json`, spawns this package’s `bin/run.mjs` **detached**. Chrome/Puppeteer death kills the worker process only. |
| **sync** | `HH_WORKER_MODE=sync` | Legacy in-process run inside the API (not isolated). |

Poll status: `GET /jobs/:jobId`. Stop: `POST /stop` cancels queued + tree-kills running PIDs.

## Layout

| Path | Role |
|------|------|
| `bin/run.mjs` | Stable public entry (spawn target) |
| `src/run/` | Puppeteer scenarios (authorize, apply, chats) — imported as `@run` |
| `src/worker/` (API package) | Job store, enqueue/spawn, `processJob` claim loop |

## Run

From backend root:

```bash
yarn worker -- <jobId>
# or
node packages/hh-worker/bin/run.mjs <jobId>
# or (workspaces)
yarn workspace @market-hunter/hh-worker start <jobId>
```

Override spawn target: `HH_WORKER_ENTRY=/absolute/path/to/run.mjs`.

Selectors stay in API `src/config` (`constants.config.ts`). Credentials come from the job payload / form — never from package source.

See root `docs/ARCHITECTURE.md` and `OPEN-WORK.md`.
