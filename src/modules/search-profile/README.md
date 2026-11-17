# search-profile

HH login credentials (`vacancy_auth`) and search/apply profiles (`vacancy_submit`).

## Public API

- `register(app)`
- Auth: `getVacancyAuthByUserId`, `createVacancyAuth`, `updateVacancyAuth`, `deleteVacancyAuth`, `upsertVacancyAuthCredentials`
- Submit: `getVacancySubmitByUserId`, `createVacancySubmit`, `updateVacancySubmit`, `deleteVacancySubmit`
- Controllers re-exported for legacy shims

## Tables

- `vacancy_auth` (migration `001` + `003`)
- `vacancy_submit` (migration `003`)

## Env

- `HH_CRED_KEY` — AES-256-GCM key (platform boot); offline local backup (D2)

## Routes

| Method | Path | Auth |
|--------|------|------|
| GET/POST | `/vacancy-auth` | yes |
| PUT/DELETE | `/vacancy-auth/:authId` | yes |
| GET/POST | `/vacancy-field` | yes |
| PUT/DELETE | `/vacancy-field/:fieldId` | yes |

## Security

- Passwords stored as `password_enc` only; plaintext column cleared on write.
- Mutations scoped by `req.userId`.
- HH job files must not contain passwords (worker uses `credentialsRepo`).
