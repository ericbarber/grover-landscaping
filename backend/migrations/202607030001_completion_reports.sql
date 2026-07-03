CREATE TABLE IF NOT EXISTS completion_reports (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    crew_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN (
            'draft',
            'submitted',
            'in_review',
            'changes_requested',
            'delivered'
        )
    ),
    summary TEXT NOT NULL DEFAULT '',
    submitted_by_user_id TEXT,
    reviewed_by_user_id TEXT,
    delivered_by_user_id TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (reviewed_at IS NULL OR submitted_at IS NOT NULL),
    CHECK (delivered_at IS NULL OR reviewed_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_completion_reports_job
    ON completion_reports (job_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_completion_reports_property
    ON completion_reports (property_id, organization_id, status);

CREATE INDEX IF NOT EXISTS idx_completion_reports_crew
    ON completion_reports (crew_id, organization_id, status);

CREATE INDEX IF NOT EXISTS idx_completion_reports_delivery
    ON completion_reports (organization_id, status, delivered_at DESC);
