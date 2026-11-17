# hh-jobs

Enqueue / poll / cancel detached HH Puppeteer jobs (apply, feedback refresh, resume sync).

## Public API

- `register(app)` — mount HH routes
- `enqueueApply` / `enqueueFeedbackRefresh` / `enqueueResumeSync`
- `listUserJobs` / `stopUserJobs`
- `toPublicJobStatus` / `toPublicJobListItem` (S3 whitelist)
- pacing helpers: `delayBeforeApply`, `delayBetweenPages`, `HH_RATE_LIMIT`
- types via `@market-hunter/contracts`

## Tables

None (jobs are files under `.hh-jobs/`).

## Env

| Var | Role |
|-----|------|
| `HH_JOBS_DIR` | optional job-file directory |
| `HH_APPLY_PAUSE_MS` / `HH_APPLY_CAP` | apply pacing / cap (worker) |

## Routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/start` | yes | enqueue apply; S10 rate-limit |
| POST | `/refresh` | yes | enqueue feedback; S10 |
| POST | `/sync-resume` | yes | enqueue resume sync; S10 |
| POST | `/stop` | yes | cancel/abort caller jobs |
| GET | `/jobs` | yes | list (no credentials) |
| GET | `/jobs/:jobId` | yes | status whitelist (S3) |
| POST | `/jobs/:jobId/captcha` | yes | owner only |
| POST | `/jobs/:jobId/captcha-refresh` | yes | owner only |
| GET | `/jobs/:jobId/captcha-image` | yes | owner only |

## Security

- All routes require JWT; job reads/writes scoped by `userId` (403 otherwise).
- S3: public status never includes `payload`, password, or `captchaAnswer`.
- S2: enqueue stores empty password; worker loads via `credentialsRepo`.
- S10: sliding-window enqueue limit on `/start`, `/refresh`, `/sync-resume` (429 + `Retry-After`).
- Empty job list → `200 []`.
