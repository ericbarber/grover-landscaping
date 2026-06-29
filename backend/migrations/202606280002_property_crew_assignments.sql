CREATE TABLE IF NOT EXISTS property_crew_assignments (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    crew_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ended_at IS NULL OR ended_at >= assigned_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_property_crew_assignments_one_active
    ON property_crew_assignments (property_id, organization_id)
    WHERE active;

CREATE INDEX IF NOT EXISTS idx_property_crew_assignments_property
    ON property_crew_assignments (property_id, organization_id, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_property_crew_assignments_crew
    ON property_crew_assignments (crew_id, organization_id, active);
