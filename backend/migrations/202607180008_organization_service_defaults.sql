ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS time_zone TEXT NOT NULL DEFAULT 'America/Phoenix',
    ADD COLUMN IF NOT EXISTS service_area_label TEXT,
    ADD COLUMN IF NOT EXISTS default_daily_stop_capacity INTEGER NOT NULL DEFAULT 12;

ALTER TABLE organizations
    DROP CONSTRAINT IF EXISTS organizations_default_daily_stop_capacity_check;

ALTER TABLE organizations
    ADD CONSTRAINT organizations_default_daily_stop_capacity_check
    CHECK (default_daily_stop_capacity BETWEEN 1 AND 100);
