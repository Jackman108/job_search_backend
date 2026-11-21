/** Secondary public API for webhook helpers (avoids circular import via `index` ↔ integrations). */
export { claimWebhookEvent } from './application/webhookEvents.js';
export {
    buildProviderEventId,
    decideWebhookGate,
    resolveCryptoEventKey,
    resolveWebpayEventKey,
    signaturesMatch,
    type WebhookClaim,
    type WebhookGateDecision,
} from './domain/webhookGate.js';
