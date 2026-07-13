ALTER TABLE job_photos
    ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;

ALTER TABLE job_photos
    ADD COLUMN IF NOT EXISTS image_width_px INTEGER;

ALTER TABLE job_photos
    ADD COLUMN IF NOT EXISTS image_height_px INTEGER;

ALTER TABLE job_photos
    ADD COLUMN IF NOT EXISTS metadata_source TEXT;

ALTER TABLE job_photos
    ADD COLUMN IF NOT EXISTS metadata_captured_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_job_photos_metadata_source
    ON job_photos (metadata_source, uploaded_at DESC)
    WHERE metadata_source IS NOT NULL;
