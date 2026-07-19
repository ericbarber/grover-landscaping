ALTER TABLE day_plans
    ADD COLUMN IF NOT EXISTS time_zone TEXT NOT NULL DEFAULT 'America/Phoenix',
    ADD COLUMN IF NOT EXISTS service_area_label TEXT,
    ADD COLUMN IF NOT EXISTS stop_capacity INTEGER NOT NULL DEFAULT 12;

ALTER TABLE day_plans
    DROP CONSTRAINT IF EXISTS day_plans_stop_capacity_check;

ALTER TABLE day_plans
    ADD CONSTRAINT day_plans_stop_capacity_check
    CHECK (stop_capacity BETWEEN 1 AND 100);
