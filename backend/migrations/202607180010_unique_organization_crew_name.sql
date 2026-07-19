CREATE UNIQUE INDEX IF NOT EXISTS idx_crews_organization_name_unique
    ON crews (organization_id, lower(name));
