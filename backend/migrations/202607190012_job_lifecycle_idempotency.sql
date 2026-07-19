CREATE TABLE job_lifecycle_mutations (
    client_mutation_id UUID PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    actor_id TEXT NOT NULL,
    job_id TEXT NOT NULL REFERENCES service_jobs(id),
    requested_action TEXT NOT NULL CHECK (requested_action IN ('start', 'complete')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_lifecycle_mutations_tenant_applied
    ON job_lifecycle_mutations (organization_id, applied_at DESC);
