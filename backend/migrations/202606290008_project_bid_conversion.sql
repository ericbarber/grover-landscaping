CREATE TABLE IF NOT EXISTS project_bid_conversions (
    project_bid_id TEXT PRIMARY KEY REFERENCES project_bids(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL REFERENCES service_jobs(id),
    converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_job_add_ons (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES service_jobs(id) ON DELETE CASCADE,
    project_bid_id TEXT NOT NULL REFERENCES project_bids(id) ON DELETE CASCADE,
    project_bid_line_item_id TEXT NOT NULL UNIQUE REFERENCES project_bid_line_items(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_description TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    note TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_job_add_ons_job_status
    ON service_job_add_ons (job_id, status, created_at);
