ALTER TABLE job_photos
    ADD COLUMN IF NOT EXISTS upload_mode TEXT NOT NULL DEFAULT 'local-placeholder';

ALTER TABLE job_photos
    ADD COLUMN IF NOT EXISTS thumbnail_object_key TEXT;

CREATE INDEX IF NOT EXISTS idx_job_photos_upload_mode
    ON job_photos (upload_mode, status);

CREATE INDEX IF NOT EXISTS idx_job_photos_thumbnail_object_key
    ON job_photos (thumbnail_object_key)
    WHERE thumbnail_object_key IS NOT NULL;
