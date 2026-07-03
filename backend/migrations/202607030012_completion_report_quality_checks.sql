CREATE TABLE IF NOT EXISTS completion_report_quality_checks (
    id TEXT PRIMARY KEY,
    completion_report_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    check_name TEXT NOT NULL CHECK (
        check_name IN ('photos_present', 'steps_complete', 'add_ons_reviewed')
    ),
    check_status TEXT NOT NULL CHECK (
        check_status IN ('passed', 'failed')
    ),
    detail TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (completion_report_id, check_name)
);

CREATE INDEX IF NOT EXISTS idx_completion_report_quality_checks_report
    ON completion_report_quality_checks (completion_report_id, check_status);

CREATE INDEX IF NOT EXISTS idx_completion_report_quality_checks_org
    ON completion_report_quality_checks (organization_id, check_status, checked_at DESC);
