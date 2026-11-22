import { executeQuery, logger } from '../../../utils/index.js';
import type { WebhookClaim } from '../domain/webhookGate.js';

/**
 * Insert-once claim for S6 idempotency.
 * Returns `duplicate` when (provider, provider_event_id) already exists.
 */
export async function claimWebhookEvent(
    provider: string,
    providerEventId: string,
    paymentId?: string | null,
): Promise<WebhookClaim> {
    try {
        const rows = await executeQuery<{ provider_event_id: string }>(
            `INSERT INTO payment_webhook_events (provider, provider_event_id, payment_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (provider, provider_event_id) DO NOTHING
             RETURNING provider_event_id`,
            [provider, providerEventId, paymentId ?? null],
        );
        return rows.length > 0 ? 'claimed' : 'duplicate';
    } catch (error) {
        logger.error('claimWebhookEvent failed', { error, provider, providerEventId });
        throw error;
    }
}
