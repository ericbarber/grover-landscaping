ALTER TABLE job_completion_reports
    DROP CONSTRAINT IF EXISTS job_completion_reports_report_status_check;

UPDATE job_completion_reports
SET report_status = CASE report_status
    WHEN 'ready' THEN 'submitted'
    WHEN 'sent' THEN 'delivered'
    ELSE report_status
END;

ALTER TABLE job_completion_reports
    ADD CONSTRAINT job_completion_reports_report_status_check
    CHECK (
        report_status IN (
            'draft',
            'submitted',
            'in_review',
            'changes_requested',
            'delivered'
        )
    );

ALTER TABLE job_completion_reports
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by_user_id TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivered_by_user_id TEXT,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

UPDATE job_completion_reports
SET submitted_at = COALESCE(submitted_at, created_at)
WHERE report_status IN ('submitted', 'in_review', 'changes_requested', 'delivered');

UPDATE job_completion_reports
SET delivered_at = COALESCE(delivered_at, sent_at)
WHERE report_status = 'delivered';

CREATE TABLE IF NOT EXISTS job_completion_report_status_history (
    id TEXT PRIMARY KEY,
    completion_report_id TEXT NOT NULL REFERENCES job_completion_reports(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by_user_id TEXT NOT NULL,
    change_reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (from_status IS NULL OR from_status <> to_status),
    CHECK (
        from_status IS NULL OR from_status IN (
            'draft',
            'submitted',
            'in_review',
            'changes_requested',
            'delivered'
        )
    ),
    CHECK (
        to_status IN (
            'draft',
            'submitted',
            'in_review',
            'changes_requested',
            'delivered'
        )
    )
);

ALTER TABLE job_completion_report_status_history
    ADD COLUMN IF NOT EXISTS change_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_job_completion_report_status_history_report
    ON job_completion_report_status_history (completion_report_id, changed_at DESC);
