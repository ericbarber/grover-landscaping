CREATE TABLE IF NOT EXISTS completion_report_summary_versions (
    id TEXT PRIMARY KEY,
    completion_report_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    written_by_user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completion_report_summary_versions_report
    ON completion_report_summary_versions (completion_report_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_completion_report_summary_versions_org
    ON completion_report_summary_versions (organization_id, created_at DESC);
