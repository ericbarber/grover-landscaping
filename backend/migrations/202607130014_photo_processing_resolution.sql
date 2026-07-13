ALTER TABLE photo_processing_jobs
    DROP CONSTRAINT IF EXISTS photo_processing_jobs_status_check;

ALTER TABLE photo_processing_jobs
    ADD CONSTRAINT photo_processing_jobs_status_check
    CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'dead_letter', 'resolved'));

ALTER TABLE photo_processing_jobs
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS resolution_note TEXT;
