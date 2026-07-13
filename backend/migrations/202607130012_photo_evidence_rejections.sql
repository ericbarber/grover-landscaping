ALTER TABLE job_photos
    ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

ALTER TABLE job_photos
    ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_job_photos_rejected_at
    ON job_photos (rejected_at DESC)
    WHERE status = 'rejected';
