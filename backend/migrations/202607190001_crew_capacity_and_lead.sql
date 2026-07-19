ALTER TABLE crews
    ADD COLUMN IF NOT EXISTS daily_stop_capacity INTEGER NOT NULL DEFAULT 10;

ALTER TABLE crews
    DROP CONSTRAINT IF EXISTS crews_daily_stop_capacity_check;

ALTER TABLE crews
    ADD CONSTRAINT crews_daily_stop_capacity_check
    CHECK (daily_stop_capacity BETWEEN 1 AND 100);

ALTER TABLE crews
    ADD COLUMN IF NOT EXISTS lead_membership_id TEXT
    REFERENCES organization_memberships(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crews_lead_membership
    ON crews (lead_membership_id)
    WHERE lead_membership_id IS NOT NULL;
