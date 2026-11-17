# vacancies

User vacancy rows from HH apply runs (shared table with `user_id`, S4).

## Public API

- `register(app)` — mount routes
- `saveVacancy` / `getVacanciesUser` / `deleteVacancyUser` / `deleteVacancyTable` / `ensureVacanciesTable`
- `countSuccessfulVacancies(userId)` — profile spin/success counters
- `vacancyTableIdent()` — shared table name (`vacancies`)

## Tables

- `vacancies` (migration `004_vacancies_feedbacks_shared.sql`)
- Legacy per-user tables renamed `_legacy_*` via `yarn migrate:s4`

## Env

None required today.

## Routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/vacancy` | yes |
| DELETE | `/vacancy/:vacancyId` | yes |
| DELETE | `/default/vacancies` | yes (DELETE WHERE user_id) |

## Security

- All routes require JWT (`req.userId`); rows scoped by `user_id`.
- Empty list → `200 []`.
- PK `(user_id, id)` — HH vacancy id alone is not unique across users.
