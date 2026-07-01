CREATE TABLE IF NOT EXISTS job_completion_reports (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE REFERENCES service_jobs(id) ON DELETE CASCADE,
    report_status TEXT NOT NULL CHECK (report_status IN ('draft', 'ready', 'sent')),
    ready_for_customer BOOLEAN NOT NULL DEFAULT false,
    checklist_progress INTEGER NOT NULL DEFAULT 0 CHECK (checklist_progress >= 0 AND checklist_progress <= 100),
    before_photos INTEGER NOT NULL DEFAULT 0,
    after_photos INTEGER NOT NULL DEFAULT 0,
    issue_photos INTEGER NOT NULL DEFAULT 0,
    share_token TEXT UNIQUE,
    last_generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_completion_reports_job_id
ON job_completion_reports (job_id);

CREATE INDEX IF NOT EXISTS idx_job_completion_reports_status
ON job_completion_reports (report_status);
