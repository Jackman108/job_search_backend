# notifications

In-app notification inbox (daily engagement notes tied to ranks).

## Public API

- `register(app)` — mount routes
- `listNotifications(userId, limit?)`
- `markNotificationRead(userId, id)`
- `unreadNotificationCount(userId)`
- `ensureDailyNotification(userId)`
- types: `AppNotification`

## Tables

- `app_notifications` (migration `002_app_notifications.sql`)

## Env

None required today (`module.config.ts` placeholder).

## Routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/notifications` | yes |
| GET | `/notifications/unread-count` | yes |
| POST | `/notifications/:id/read` | yes (owner via `user_id` in UPDATE) |

## Security

- All routes require JWT (`req.userId`).
- Mark-read scoped by `user_id` — cannot mark another user’s row.
- Empty list → `200 []`.
- Temporary coupling: reads profile via legacy `profileService` + `deriveUserRank` until `profile` module exists.
