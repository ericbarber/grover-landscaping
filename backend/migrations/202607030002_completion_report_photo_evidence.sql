CREATE TABLE IF NOT EXISTS completion_report_photo_evidence (
    id TEXT PRIMARY KEY,
    completion_report_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    photo_id TEXT NOT NULL,
    photo_type TEXT NOT NULL CHECK (
        photo_type IN ('before', 'after', 'issue')
    ),
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    object_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (completion_report_id, photo_id)
);

CREATE INDEX IF NOT EXISTS idx_completion_report_photo_evidence_report
    ON completion_report_photo_evidence (completion_report_id, photo_type);

CREATE INDEX IF NOT EXISTS idx_completion_report_photo_evidence_job
    ON completion_report_photo_evidence (job_id, organization_id, photo_type);

CREATE INDEX IF NOT EXISTS idx_completion_report_photo_evidence_object_key
    ON completion_report_photo_evidence (object_key);
