CREATE TABLE IF NOT EXISTS day_plan_amendment_requests (
    id TEXT PRIMARY KEY,
    day_plan_id TEXT NOT NULL REFERENCES day_plans(id) ON DELETE CASCADE,
    requested_by_crew_id TEXT NOT NULL REFERENCES crews(id),
    amendment_type TEXT NOT NULL CHECK (amendment_type IN ('add_stop', 'remove_stop', 'add_service')),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    stop_id TEXT REFERENCES day_plan_stops(id) ON DELETE SET NULL,
    service_id TEXT,
    service_name TEXT,
    service_description TEXT,
    default_duration_minutes INTEGER CHECK (default_duration_minutes IS NULL OR default_duration_minutes >= 0),
    default_price_cents INTEGER CHECK (default_price_cents IS NULL OR default_price_cents >= 0),
    requires_manager_approval BOOLEAN NOT NULL DEFAULT FALSE,
    requires_bid BOOLEAN NOT NULL DEFAULT FALSE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (amendment_type = 'add_stop' AND stop_id IS NULL AND service_id IS NULL)
        OR (amendment_type = 'remove_stop' AND stop_id IS NOT NULL AND service_id IS NULL)
        OR (
            amendment_type = 'add_service'
            AND stop_id IS NOT NULL
            AND service_id IS NOT NULL
            AND service_name IS NOT NULL
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_day_plan_amendments_plan_status
    ON day_plan_amendment_requests (day_plan_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_day_plan_amendments_crew_created
    ON day_plan_amendment_requests (requested_by_crew_id, created_at DESC);
