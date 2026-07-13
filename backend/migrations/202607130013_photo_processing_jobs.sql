CREATE TABLE IF NOT EXISTS photo_processing_jobs (
    id TEXT PRIMARY KEY,
    photo_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('thumbnail_generation')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (
        status IN ('queued', 'processing', 'completed', 'failed', 'dead_letter')
    ),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_error TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (photo_id, task_type)
);

CREATE INDEX IF NOT EXISTS idx_photo_processing_jobs_delivery
    ON photo_processing_jobs (status, available_at, created_at)
    WHERE status IN ('queued', 'failed', 'processing');

CREATE INDEX IF NOT EXISTS idx_photo_processing_jobs_photo
    ON photo_processing_jobs (photo_id, task_type, status);

CREATE INDEX IF NOT EXISTS idx_photo_processing_jobs_organization
    ON photo_processing_jobs (organization_id, status, created_at DESC);
