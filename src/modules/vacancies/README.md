# vacancies

User vacancy rows from HH apply runs (per-user tables until S4).

## Public API

- `register(app)` — mount routes
- `saveVacancy` / `getVacanciesUser` / `deleteVacancyUser` / `deleteVacancyTable` / `createTableVacanciesUser`
- `vacancyTableIdent(userId)` — quoted legacy table name for joins

## Tables

- Per-user `"${userId}_vacancy"` (S4 will migrate to shared `vacancies(user_id, …)`)

## Env

None required today.

## Routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/vacancy` | yes |
| DELETE | `/vacancy/:vacancyId` | yes |
| DELETE | `/default/vacancies` | yes |

## Security

- All routes require JWT (`req.userId`); table scoped by that id.
- Empty list → `200 []`.
- Dynamic table names are quoted idents from trusted `userId` (JWT), not request body.
