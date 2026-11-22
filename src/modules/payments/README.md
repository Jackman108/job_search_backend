# payments

Core `payments` rows, payment info, provider CRUD, and S6 webhook gate (signature → claim → side effects). Provider strategy adapters still under `services/integrations`.

## Public API

- `register(app)` — mount `/payment*`, crypto/webpay CRUD, integration + webhook routes
- Core / info / crypto / webpay CRUD helpers
- `webhookPublic` — `claimWebhookEvent`, `decideWebhookGate`, event-key helpers (for integrations)

## Tables

- `payments` (shared `user_id` schema preferred)
- `webpay_payments`, `crypto_payments`
- `payment_webhook_events` (S6 idempotency; migration `006`)

## Env

Provider keys via existing payment configs (`USE_MOCK_PROVIDER`, WebPay/NOWPayments). Missing keys: warn once, no crash.

## Routes

| Method | Path | Auth |
|--------|------|------|
| GET/POST | `/payment` | yes |
| GET/PUT/DELETE | `/payment/:id` | yes |
| GET | `/payment/info/methods` | no |
| GET | `/payment/info/current-plan` | yes |
| GET | `/payment/info/test-page` | no |
| CRUD | `/payment/crypto`, `/payment/webpay` | yes |
| POST | `/integration/:paymentMethod` | yes |
| POST | `/webhook/:paymentMethod` | **no** (signature) |
| GET | `/status|details/:paymentMethod/:paymentId` | yes |
| POST | `/refund/:paymentMethod` | yes |

## Security

- Mutating/list routes require JWT; rows scoped by `user_id` (or legacy subscription scope).
- Empty list → `200 []`.
- Webhooks: verify signature **before** side effects; unique `(provider, provider_event_id)` claim; raw body captured for HMAC on `/webhook/*`.
- On `payment_status=completed`, `activateAfterPaid` maps amount → plan and calls `subscriptions.activate()` (best-effort; already-active is OK).
