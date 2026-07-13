ALTER TABLE crews
    ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'org_demo_landscaping';

UPDATE crews
SET organization_id = 'org_demo_landscaping'
WHERE organization_id IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'crews_organization_id_fkey'
    ) THEN
        ALTER TABLE crews
            ADD CONSTRAINT crews_organization_id_fkey
            FOREIGN KEY (organization_id) REFERENCES organizations(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crews_organization_name
    ON crews (organization_id, name, id);
