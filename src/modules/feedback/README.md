# feedback

HH chat / negotiation feedback rows (per-user tables until S4).

## Public API

- `register(app)` — mount routes
- `saveChatFeedback` / `getChatFeedback` / `deleteChatFeedback` / `deleteFeedbackTable` / `createChatFeedbackTable`
- `feedbackTableIdent(userId)` — quoted legacy table name

## Tables

- Per-user `"${userId}_feedbacks"` (S4 → shared `feedbacks(user_id, …)`)
- Joins vacancy titles via `vacancies.vacancyTableIdent` (prefer vacancy SoT)

## Env

None required today.

## Routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/feedback` | yes |
| DELETE | `/feedback/:feedbackId` | yes |
| DELETE | `/default/feedback` | yes |

## Security

- All routes require JWT (`req.userId`); table scoped by that id.
- Empty list → `200 []`.
- CTA junk titles scrubbed on read; vacancy join preferred for display titles.
