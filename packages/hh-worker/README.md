# `@market-hunter/hh-worker`

Dedicated package for the HeadHunter Puppeteer worker: public bin, scenario API, job file store, claim/`processJob`, detached CLI, and Puppeteer run scenarios.

## Crash isolation

API always queues: writes `.hh-jobs/<id>.json`, spawns this package’s `bin/run.mjs` **detached**. Chrome/Puppeteer death kills the worker process only.

Poll status: `GET /jobs/:jobId`. Stop: `POST /stop` cancels queued + tree-kills running PIDs.

## Layout

| Path                          | Role                                                                |
| ----------------------------- | ------------------------------------------------------------------- |
| `bin/run.mjs`                 | Stable public entry (spawn target)                                  |
| `src/cli.ts`                  | Detached binder — loads deps factory, runs `processJob`             |
| `src/loadProcessJobDeps.ts`   | Resolves injectable factory (`HH_WORKER_DEPS_FACTORY` or API root)  |
| `src/index.ts`                | **Public API** — scenarios + job store + `processJob`               |
| `src/job/`                    | File-backed `.hh-jobs` store, job types, claim/`processJob` + ports |
| `src/run/`                    | Puppeteer scenarios (internal; `@run` only inside this tree)        |
| API `src/worker/`             | Enqueue/spawn/cancel + thin `createProcessJobDeps` composition      |

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
| `JobBroadcast` | `broadcast`                                            | **noop for WS** (log-only); poll `GET /jobs/:jobId` is SoT |
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
Override deps factory: `HH_WORKER_DEPS_FACTORY=/absolute/path/to/createProcessJobDeps.ts`.

Selectors stay in API `src/config` (`constants.config.ts`). Credentials come from the job payload / form — never from package source.

**Broadcast / live updates:** detached worker cannot reach the API WebSocket. `JobBroadcast` logs in-process; clients treat **`GET /jobs/:jobId` (+ refetch after settle)** as source of truth. No cross-process WS broker unless product needs live CAPTCHA/progress push later.

See root `docs/ARCHITECTURE.md` and `OPEN-WORK.md`.
