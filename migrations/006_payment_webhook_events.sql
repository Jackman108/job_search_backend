-- S6: idempotent payment webhooks (unique provider + event id).
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    provider TEXT NOT NULL,
    provider_event_id TEXT NOT NULL,
    payment_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_payment_id
    ON payment_webhook_events (payment_id);
