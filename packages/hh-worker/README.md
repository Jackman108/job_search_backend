# `@market-hunter/hh-worker`

Dedicated **entrypoint package** for the HeadHunter Puppeteer worker.

## Crash isolation (today)

| Mode | Env | Behavior |
|------|-----|----------|
| **queue** (default) | `HH_WORKER_MODE=queue` or unset | API writes `.hh-jobs/<id>.json`, spawns this package’s `bin/run.mjs` **detached**. Chrome/Puppeteer death kills the worker process only. |
| **sync** | `HH_WORKER_MODE=sync` | Legacy in-process run inside the API (not isolated). |

Poll status: `GET /jobs/:jobId`. Stop: `POST /stop` cancels queued + tree-kills running PIDs.

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

## Boundaries

- **This package** — public bin + packaging docs; no Puppeteer imports here.
- **`src/worker/`** — job store, enqueue/spawn (API side), `cli` + `processJob` (runtime side).
- **`src/run/`** — Puppeteer scenarios (still in the API package; full extract is a later A2 leftover).

See root `docs/ARCHITECTURE.md` and `OPEN-WORK.md`.
