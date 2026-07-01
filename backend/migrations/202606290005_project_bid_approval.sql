ALTER TABLE project_bids
    ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_project_bids_share_token
    ON project_bids (share_token)
    WHERE share_token IS NOT NULL;
