CREATE TABLE IF NOT EXISTS photo_erasure_deletion_jobs (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    object_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (
        status IN ('queued', 'processing', 'completed', 'failed', 'dead_letter', 'resolved')
    ),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    last_error TEXT,
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, object_key)
);

ALTER TABLE photo_erasure_deletion_jobs
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS resolution_note TEXT;

ALTER TABLE photo_erasure_deletion_jobs
    DROP CONSTRAINT IF EXISTS photo_erasure_deletion_jobs_status_check;

ALTER TABLE photo_erasure_deletion_jobs
    ADD CONSTRAINT photo_erasure_deletion_jobs_status_check CHECK (
        status IN ('queued', 'processing', 'completed', 'failed', 'dead_letter', 'resolved')
    );

CREATE INDEX IF NOT EXISTS idx_photo_erasure_deletion_jobs_delivery
    ON photo_erasure_deletion_jobs (status, available_at, created_at)
    WHERE status IN ('queued', 'failed', 'processing');

CREATE INDEX IF NOT EXISTS idx_photo_erasure_deletion_jobs_account
    ON photo_erasure_deletion_jobs (organization_id, account_id, status);
