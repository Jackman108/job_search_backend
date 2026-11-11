# `@market-hunter/hh-worker`

Dedicated package for the HeadHunter Puppeteer worker: public bin, scenario API, job file store, claim/`processJob`, and Puppeteer run scenarios.

## Crash isolation

API always queues: writes `.hh-jobs/<id>.json`, spawns this package’s `bin/run.mjs` **detached**. Chrome/Puppeteer death kills the worker process only (`HH_WORKER_MODE=sync` removed).

Poll status: `GET /jobs/:jobId`. Stop: `POST /stop` cancels queued + tree-kills running PIDs.

## Layout

| Path                        | Role                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| `bin/run.mjs`               | Stable public entry (spawn target)                                  |
| `src/index.ts`              | **Public API** — scenarios + job store + `processJob`               |
| `src/job/`                  | File-backed `.hh-jobs` store, job types, claim/`processJob` + ports |
| `src/run/`                  | Puppeteer scenarios (internal; `@run` only inside this tree)        |
| `src/worker/` (API package) | Enqueue/spawn/cancel + thin `createProcessJobDeps` binder           |

## Ports (dependency inversion)

```ts
import { processJob } from '@market-hunter/hh-worker';
import type {
    ProcessJobDeps,
    ScenarioDeps,
    JobCounters,
    JobBroadcast,
    VacancyRepo,
    FeedbackRepo,
} from '@market-hunter/hh-worker/job';

// API binder: createProcessJobDeps() → @services + @server
await processJob(jobId, deps);
```

| Port           | Methods                                                | API adapter                                            |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| `JobCounters`  | `incrementSpinCount`, `updateSuccessfulResponsesCount` | `@services` profile                                    |
| `JobBroadcast` | `broadcast`                                            | `@server` WebSocket (process-local in detached worker) |
| `VacancyRepo`  | `saveVacancy`, `getVacanciesUser`                      | `@services` vacancy                                    |
| `FeedbackRepo` | `saveChatFeedback`, `getChatFeedback`                  | `@services` feedback                                   |

`ScenarioDeps` = `Pick<ProcessJobDeps, 'vacancyRepo' | 'feedbackRepo' | 'broadcast'>`.

## Imports

```ts
import { getFeedback, sendFeedback, readJob, claimQueuedJob, processJob } from '@market-hunter/hh-worker';
import type { HhJob, ProcessJobDeps } from '@market-hunter/hh-worker/job';

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

**Leftover:** real message broker when file-queue outgrows (adapters still process-local WS); CLI binder stays in API `src/worker` (needs `@services` adapters).

See root `docs/ARCHITECTURE.md` and `OPEN-WORK.md`.
