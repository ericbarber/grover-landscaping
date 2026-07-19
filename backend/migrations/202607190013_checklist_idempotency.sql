CREATE TABLE checklist_mutations (
    client_mutation_id UUID PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    actor_id TEXT NOT NULL,
    job_id TEXT NOT NULL REFERENCES service_jobs(id),
    checklist_item_id TEXT NOT NULL REFERENCES job_checklist_items(id),
    requested_completed BOOLEAN NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_mutations_tenant_applied
    ON checklist_mutations (organization_id, applied_at DESC);
