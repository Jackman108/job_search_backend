# feedback

HH chat / negotiation feedback rows (shared table with `user_id`, S4).

## Public API

- `register(app)` — mount routes
- `saveChatFeedback` / `getChatFeedback` / `deleteChatFeedback` / `deleteFeedbackTable` / `ensureFeedbacksTable`
- `feedbackTableIdent()` — shared table name (`feedbacks`)

## Tables

- `feedbacks` (migration `004_vacancies_feedbacks_shared.sql`)
- Joins `vacancies` on `(user_id, vacancy_id = id)` for title/company SoT
- Legacy per-user tables renamed `_legacy_*` via `yarn migrate:s4`

## Env

None required today.

## Routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/feedback` | yes |
| DELETE | `/feedback/:feedbackId` | yes |
| DELETE | `/default/feedback` | yes (DELETE WHERE user_id) |

## Security

- All routes require JWT (`req.userId`); rows scoped by `user_id`.
- Empty list → `200 []`.
- CTA junk titles scrubbed on read; vacancy join preferred for display titles.
