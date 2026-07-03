CREATE TABLE IF NOT EXISTS completion_report_delivery_attempts (
    id TEXT PRIMARY KEY,
    completion_report_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    attempted_by_user_id TEXT NOT NULL,
    delivery_channel TEXT NOT NULL CHECK (
        delivery_channel IN ('customer_portal', 'email')
    ),
    delivery_status TEXT NOT NULL CHECK (
        delivery_status IN ('pending', 'sent', 'failed')
    ),
    failure_reason TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (delivery_status = 'failed' OR failure_reason IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_completion_report_delivery_attempts_report
    ON completion_report_delivery_attempts (completion_report_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_completion_report_delivery_attempts_org
    ON completion_report_delivery_attempts (organization_id, delivery_status, attempted_at DESC);
