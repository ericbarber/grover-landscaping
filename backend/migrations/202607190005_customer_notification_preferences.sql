ALTER TABLE customer_accounts
    ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE customer_accounts
    ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE customer_accounts
    ADD COLUMN IF NOT EXISTS quiet_hours_start TIME;

ALTER TABLE customer_accounts
    ADD COLUMN IF NOT EXISTS quiet_hours_end TIME;
