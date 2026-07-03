CREATE TABLE IF NOT EXISTS completion_report_quality_check_runs (
    id TEXT PRIMARY KEY,
    completion_report_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    checked_by_user_id TEXT NOT NULL,
    passed_count INTEGER NOT NULL DEFAULT 0 CHECK (passed_count >= 0),
    failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completion_report_quality_check_runs_report
    ON completion_report_quality_check_runs (completion_report_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_completion_report_quality_check_runs_org
    ON completion_report_quality_check_runs (organization_id, checked_at DESC);
