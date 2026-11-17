-- Notifications module owns app_notifications (daily engagement inbox).
CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    kind VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    day_key DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (user_id, kind, day_key)
);

CREATE INDEX IF NOT EXISTS app_notifications_user_created
    ON app_notifications (user_id, created_at DESC);
