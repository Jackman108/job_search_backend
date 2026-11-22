# payments

Core `payments` rows, payment info, and provider CRUD tables (`webpay_payments`, `crypto_payments`). Integration strategies + S6 webhooks still live under `services/integrations` (follow-up).

## Public API

- `register(app)` — mount `/payment`, `/payment/info/*`, `/payment/crypto`, `/payment/webpay`
- Core: `listPayments` / `getPayment` / `createPayment` / `updatePayment` / `deletePayment` / `safePaymentOperations`
- Info: `infoPaymentOperations`
- Crypto: `cryptoService` + table helpers
- WebPay: `webpayService` + table helpers

## Tables

- `payments` (shared `user_id` schema preferred)
- `webpay_payments`, `crypto_payments`

## Env

Provider keys via existing payment configs (`USE_MOCK_PROVIDER`, WebPay/NOWPayments). Missing keys: warn once, no crash.

## Routes

| Method         | Path                                            | Auth |
| -------------- | ----------------------------------------------- | ---- |
| GET/POST       | `/payment`                                      | yes  |
| GET/PUT/DELETE | `/payment/:id`                                  | yes  |
| GET            | `/payment/info/methods`                         | no   |
| GET            | `/payment/info/current-plan`                    | yes  |
| GET            | `/payment/info/test-page`                       | no   |
| CRUD           | `/payment/crypto`, `/payment/crypto/:paymentId` | yes  |
| CRUD           | `/payment/webpay`, `/payment/webpay/:id`        | yes  |

Integration: `/integration/:method`, `/webhook/:method` still via legacy `integration.routes` until S6.

## Security

- Mutating/list routes require JWT; rows scoped by `user_id` (or legacy subscription scope).
- Empty list → `200 []`.
- Webhook signature verify (S6) before side effects — follow-up in this module.
