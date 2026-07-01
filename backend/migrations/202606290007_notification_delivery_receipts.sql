ALTER TABLE notification_outbox
    DROP CONSTRAINT IF EXISTS notification_outbox_status_check;

ALTER TABLE notification_outbox
    ADD CONSTRAINT notification_outbox_status_check
    CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'skipped', 'dead_letter'));

ALTER TABLE notification_outbox
    ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
    ADD COLUMN IF NOT EXISTS provider_response_code INTEGER;

DROP INDEX IF EXISTS idx_notification_outbox_delivery;

CREATE INDEX idx_notification_outbox_delivery
    ON notification_outbox (status, available_at, created_at)
    WHERE status IN ('queued', 'failed', 'sending');
