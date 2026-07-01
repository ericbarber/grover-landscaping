ALTER TABLE project_bids
    ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS share_revoked_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS notification_outbox (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
    recipient TEXT NOT NULL,
    template_key TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'skipped')),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_delivery
    ON notification_outbox (status, available_at, created_at)
    WHERE status IN ('queued', 'failed');

CREATE INDEX IF NOT EXISTS idx_notification_outbox_entity
    ON notification_outbox (entity_type, entity_id, created_at DESC);
