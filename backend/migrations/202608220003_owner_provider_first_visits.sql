CREATE TABLE IF NOT EXISTS owner_provider_first_visit_series (
    activation_id TEXT PRIMARY KEY REFERENCES owner_provider_relationship_activations(id) ON DELETE RESTRICT,
    current_version BIGINT NOT NULL DEFAULT 0 CHECK (current_version >= 0),
    status TEXT NOT NULL DEFAULT 'awaiting_provider' CHECK (
        status IN ('awaiting_provider', 'proposed', 'change_requested', 'confirmed', 'cancelled')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    CHECK (
        (status = 'confirmed' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL)
        OR (status = 'cancelled' AND cancelled_at IS NOT NULL)
        OR (status NOT IN ('confirmed', 'cancelled') AND confirmed_at IS NULL AND cancelled_at IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS owner_provider_first_visit_proposals (
    id TEXT PRIMARY KEY,
    activation_id TEXT NOT NULL REFERENCES owner_provider_relationship_activations(id) ON DELETE RESTRICT,
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    provider_actor_user_id TEXT NOT NULL,
    verified_email_fingerprint TEXT NOT NULL CHECK (
        verified_email_fingerprint ~ '^[0-9a-f]{64}$'
    ),
    invitation_id TEXT NOT NULL REFERENCES owner_provider_invitations(id) ON DELETE RESTRICT,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    owner_property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE RESTRICT,
    customer_account_id TEXT NOT NULL REFERENCES customer_accounts(id) ON DELETE RESTRICT,
    customer_property_id TEXT NOT NULL REFERENCES customer_properties(id) ON DELETE RESTRICT,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    time_zone TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(time_zone)) BETWEEN 1 AND 80),
    customer_safe_arrival_note TEXT CHECK (
        customer_safe_arrival_note IS NULL
        OR CHAR_LENGTH(BTRIM(customer_safe_arrival_note)) BETWEEN 1 AND 1000
    ),
    idempotency_key TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (window_end > window_start),
    CHECK (window_end <= window_start + INTERVAL '4 hours'),
    UNIQUE (activation_id, proposal_version),
    UNIQUE (provider_actor_user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_first_visit_proposals_current
    ON owner_provider_first_visit_proposals (activation_id, proposal_version DESC);

CREATE OR REPLACE FUNCTION prevent_owner_provider_first_visit_proposal_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'owner-provider first-visit proposals are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_provider_first_visit_proposal_immutable
    ON owner_provider_first_visit_proposals;
CREATE TRIGGER owner_provider_first_visit_proposal_immutable
    BEFORE UPDATE ON owner_provider_first_visit_proposals
    FOR EACH ROW EXECUTE FUNCTION prevent_owner_provider_first_visit_proposal_update();

CREATE TABLE IF NOT EXISTS owner_provider_first_visit_decisions (
    id TEXT PRIMARY KEY,
    activation_id TEXT NOT NULL REFERENCES owner_provider_relationship_activations(id) ON DELETE RESTRICT,
    proposal_id TEXT NOT NULL UNIQUE REFERENCES owner_provider_first_visit_proposals(id) ON DELETE RESTRICT,
    owner_user_id TEXT NOT NULL REFERENCES owner_workspaces(owner_user_id) ON DELETE RESTRICT,
    action TEXT NOT NULL CHECK (action IN ('confirm', 'request_change')),
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    customer_safe_note TEXT CHECK (
        customer_safe_note IS NULL
        OR CHAR_LENGTH(BTRIM(customer_safe_note)) BETWEEN 1 AND 1000
    ),
    confirmation_affirmation_text_version TEXT CHECK (
        confirmation_affirmation_text_version IS NULL
        OR CHAR_LENGTH(BTRIM(confirmation_affirmation_text_version)) BETWEEN 1 AND 120
    ),
    idempotency_key TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128),
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (action = 'confirm' AND confirmation_affirmation_text_version IS NOT NULL)
        OR (action = 'request_change' AND confirmation_affirmation_text_version IS NULL
            AND customer_safe_note IS NOT NULL)
    ),
    UNIQUE (owner_user_id, idempotency_key),
    UNIQUE (activation_id, proposal_version)
);

CREATE OR REPLACE FUNCTION prevent_owner_provider_first_visit_decision_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'owner-provider first-visit decisions are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_provider_first_visit_decision_immutable
    ON owner_provider_first_visit_decisions;
CREATE TRIGGER owner_provider_first_visit_decision_immutable
    BEFORE UPDATE ON owner_provider_first_visit_decisions
    FOR EACH ROW EXECUTE FUNCTION prevent_owner_provider_first_visit_decision_update();

CREATE TABLE IF NOT EXISTS owner_provider_first_visit_events (
    id TEXT PRIMARY KEY,
    activation_id TEXT NOT NULL REFERENCES owner_provider_relationship_activations(id) ON DELETE RESTRICT,
    proposal_id TEXT NOT NULL REFERENCES owner_provider_first_visit_proposals(id) ON DELETE RESTRICT,
    actor_user_id TEXT NOT NULL,
    event_kind TEXT NOT NULL CHECK (
        event_kind IN ('window_proposed', 'window_confirmed', 'window_change_requested')
    ),
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    event_data JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (JSONB_TYPEOF(event_data) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (activation_id, event_kind, proposal_version)
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_first_visit_events
    ON owner_provider_first_visit_events (activation_id, created_at, id);
