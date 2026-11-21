# subscriptions

User subscription plans (daily / weekly / monthly). Payments will call `activateSubscription` after webhook success.

## Public API

- `register(app)` — mount `/subscription` routes
- `listSubscription` / `getActiveSubscription` / `getSubscription`
- `createSubscription` / `activateSubscription` (alias) / `updateSubscription` / `deleteSubscription`
- `createTableSubscriptions`
- `calculateSubscriptionDetails` / `SUBSCRIPTION_PRICES` (domain)

## Tables

- `subscriptions`

## Env

None required today.

## Routes

| Method | Path                | Auth              |
| ------ | ------------------- | ----------------- |
| GET    | `/subscription`     | yes (active list) |
| GET    | `/subscription/:id` | yes               |
| POST   | `/subscription`     | yes               |
| PUT    | `/subscription/:id` | yes               |
| DELETE | `/subscription/:id` | yes               |

## Security

- All routes require JWT; rows scoped by `req.userId`.
- Empty active list returns `200 []`.
- Do not log payment secrets here (payments module owns webhooks).
