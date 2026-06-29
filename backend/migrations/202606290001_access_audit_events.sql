CREATE TABLE IF NOT EXISTS access_audit_events (
    id TEXT PRIMARY KEY,
    actor_user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    event_kind TEXT NOT NULL CHECK (
        event_kind IN (
            'login',
            'invite_accepted',
            'role_changed',
            'account_viewed',
            'portfolio_changed',
            'crew_assignment_changed',
            'bid_approved',
            'report_delivered'
        )
    ),
    target_id TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_audit_events_actor
    ON access_audit_events (actor_user_id, organization_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_audit_events_organization
    ON access_audit_events (organization_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_audit_events_target
    ON access_audit_events (target_id, organization_id, event_kind);
