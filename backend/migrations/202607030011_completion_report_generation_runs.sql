CREATE TABLE IF NOT EXISTS completion_report_generation_runs (
    id TEXT PRIMARY KEY,
    completion_report_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    generated_by_user_id TEXT NOT NULL,
    photo_count INTEGER NOT NULL DEFAULT 0 CHECK (photo_count >= 0),
    service_step_count INTEGER NOT NULL DEFAULT 0 CHECK (service_step_count >= 0),
    add_on_count INTEGER NOT NULL DEFAULT 0 CHECK (add_on_count >= 0),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completion_report_generation_runs_report
    ON completion_report_generation_runs (completion_report_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_completion_report_generation_runs_job
    ON completion_report_generation_runs (job_id, organization_id, generated_at DESC);
