CREATE TABLE stop_progress_mutations (
    client_mutation_id UUID PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    actor_id TEXT NOT NULL,
    day_plan_id TEXT NOT NULL REFERENCES day_plans(id),
    stop_id TEXT NOT NULL REFERENCES day_plan_stops(id),
    requested_status TEXT NOT NULL
        CHECK (requested_status IN ('pending', 'in_progress', 'finished')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stop_progress_mutations_tenant_applied
    ON stop_progress_mutations (organization_id, applied_at DESC);
