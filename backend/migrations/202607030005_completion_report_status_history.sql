CREATE TABLE IF NOT EXISTS completion_report_status_history (
    id TEXT PRIMARY KEY,
    completion_report_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    from_status TEXT CHECK (
        from_status IN (
            'draft',
            'submitted',
            'in_review',
            'changes_requested',
            'delivered'
        )
    ),
    to_status TEXT NOT NULL CHECK (
        to_status IN (
            'draft',
            'submitted',
            'in_review',
            'changes_requested',
            'delivered'
        )
    ),
    changed_by_user_id TEXT NOT NULL,
    change_reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (from_status IS NULL OR from_status <> to_status)
);

CREATE INDEX IF NOT EXISTS idx_completion_report_status_history_report
    ON completion_report_status_history (completion_report_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_completion_report_status_history_org
    ON completion_report_status_history (organization_id, changed_at DESC);
