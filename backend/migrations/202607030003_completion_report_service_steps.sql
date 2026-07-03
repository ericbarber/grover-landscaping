CREATE TABLE IF NOT EXISTS completion_report_service_steps (
    id TEXT PRIMARY KEY,
    completion_report_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    service_step_id TEXT NOT NULL,
    label TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (completion_report_id, service_step_id)
);

CREATE INDEX IF NOT EXISTS idx_completion_report_service_steps_report
    ON completion_report_service_steps (completion_report_id, done);

CREATE INDEX IF NOT EXISTS idx_completion_report_service_steps_job
    ON completion_report_service_steps (job_id, organization_id, done);
