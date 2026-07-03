CREATE TABLE IF NOT EXISTS completion_report_add_ons (
    id TEXT PRIMARY KEY,
    completion_report_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    job_add_on_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_description TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (completion_report_id, job_add_on_id)
);

CREATE INDEX IF NOT EXISTS idx_completion_report_add_ons_report
    ON completion_report_add_ons (completion_report_id);

CREATE INDEX IF NOT EXISTS idx_completion_report_add_ons_job
    ON completion_report_add_ons (job_id, organization_id);
