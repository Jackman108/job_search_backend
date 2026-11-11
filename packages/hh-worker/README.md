# `@market-hunter/hh-worker`

Dedicated package for the HeadHunter Puppeteer worker: public bin, scenario API, job file store, and Puppeteer run scenarios.

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
| `src/index.ts` | **Public API** — scenarios + job store |
| `src/job/` | File-backed `.hh-jobs` store + job types |
| `src/run/` | Puppeteer scenarios (internal; `@run` only inside this tree) |
| `src/worker/` (API package) | Thin re-exports + enqueue/spawn/cancel + `processJob` (needs `@services` counters) |

## Imports

```ts
import { getFeedback, sendFeedback, readJob, claimQueuedJob } from '@market-hunter/hh-worker';
import type { HhJob } from '@market-hunter/hh-worker/job';

// Inside src/run/* only
import { authorize, initializeBrowser } from '@run';
```

## Run

From backend root:

```bash
yarn worker -- <jobId>
# or
node packages/hh-worker/bin/run.mjs <jobId>
```

Override spawn target: `HH_WORKER_ENTRY=/absolute/path/to/run.mjs`.

Selectors stay in API `src/config` (`constants.config.ts`). Credentials come from the job payload / form — never from package source.

**Leftover:** move `processJob` into the package once counters are decoupled; drop sync Puppeteer from the API process.

See root `docs/ARCHITECTURE.md` and `OPEN-WORK.md`.
