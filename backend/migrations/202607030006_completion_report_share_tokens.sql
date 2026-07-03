ALTER TABLE completion_reports
    ADD COLUMN IF NOT EXISTS share_token TEXT;

ALTER TABLE completion_reports
    ADD COLUMN IF NOT EXISTS share_token_created_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_completion_reports_share_token
    ON completion_reports (share_token)
    WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_completion_reports_shared_delivery
    ON completion_reports (organization_id, status, share_token_created_at DESC)
    WHERE share_token IS NOT NULL;
