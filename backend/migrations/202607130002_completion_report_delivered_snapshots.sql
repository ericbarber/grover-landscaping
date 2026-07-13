ALTER TABLE job_completion_reports
    ADD COLUMN IF NOT EXISTS delivered_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS delivered_snapshot_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_job_completion_reports_delivered_snapshot
    ON job_completion_reports (report_status, delivered_snapshot_at DESC)
    WHERE delivered_snapshot IS NOT NULL;
