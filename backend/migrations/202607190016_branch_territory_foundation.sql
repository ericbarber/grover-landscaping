CREATE TABLE IF NOT EXISTS organization_branches (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    time_zone TEXT NOT NULL DEFAULT 'America/Phoenix',
    service_area_label TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, code),
    UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS service_territories (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, branch_id, name),
    UNIQUE (id, organization_id),
    FOREIGN KEY (branch_id, organization_id)
        REFERENCES organization_branches(id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_branches_org_status
    ON organization_branches (organization_id, status, name);

CREATE INDEX IF NOT EXISTS idx_service_territories_branch_status
    ON service_territories (organization_id, branch_id, status, name);

INSERT INTO organization_branches (
    id, organization_id, name, code, service_area_label
)
SELECT
    'branch_default_' || md5(crew.organization_id),
    crew.organization_id,
    'Main Branch',
    'MAIN',
    'Primary service area'
FROM crews crew
GROUP BY crew.organization_id
ON CONFLICT (organization_id, code) DO NOTHING;

INSERT INTO service_territories (
    id, organization_id, branch_id, name
)
SELECT
    'territory_default_' || md5(branch.organization_id),
    branch.organization_id,
    branch.id,
    'Primary Territory'
FROM organization_branches branch
WHERE branch.code = 'MAIN'
ON CONFLICT (organization_id, branch_id, name) DO NOTHING;

ALTER TABLE crews
    ADD COLUMN IF NOT EXISTS branch_id TEXT;

ALTER TABLE crews
    ADD COLUMN IF NOT EXISTS territory_id TEXT;

UPDATE crews crew
SET
    branch_id = branch.id,
    territory_id = territory.id
FROM organization_branches branch
JOIN service_territories territory
  ON territory.branch_id = branch.id
 AND territory.organization_id = branch.organization_id
WHERE branch.organization_id = crew.organization_id
  AND branch.code = 'MAIN'
  AND territory.name = 'Primary Territory'
  AND (crew.branch_id IS NULL OR crew.territory_id IS NULL);

ALTER TABLE crews
    ADD CONSTRAINT crews_branch_organization_fkey
    FOREIGN KEY (branch_id, organization_id)
    REFERENCES organization_branches(id, organization_id);

ALTER TABLE crews
    ADD CONSTRAINT crews_territory_organization_fkey
    FOREIGN KEY (territory_id, organization_id)
    REFERENCES service_territories(id, organization_id);

CREATE INDEX IF NOT EXISTS idx_crews_branch_territory
    ON crews (organization_id, branch_id, territory_id, status);
