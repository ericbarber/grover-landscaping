CREATE TABLE IF NOT EXISTS project_bids (
    id TEXT PRIMARY KEY,
    day_plan_id TEXT NOT NULL REFERENCES day_plans(id) ON DELETE CASCADE,
    customer_account_id TEXT NOT NULL REFERENCES customer_accounts(id),
    source_amendment_id TEXT NOT NULL UNIQUE REFERENCES day_plan_amendment_requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired', 'converted')),
    customer_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_bid_line_items (
    id TEXT PRIMARY KEY,
    project_bid_id TEXT NOT NULL REFERENCES project_bids(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_description TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    note TEXT,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_bid_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_project_bids_day_plan_status
    ON project_bids (day_plan_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_bids_customer_status
    ON project_bids (customer_account_id, status, updated_at DESC);
