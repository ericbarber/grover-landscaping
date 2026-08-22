ALTER TABLE owner_provider_invitations
    DROP CONSTRAINT IF EXISTS owner_provider_invitations_status_check;

ALTER TABLE owner_provider_invitations
    ADD CONSTRAINT owner_provider_invitations_status_check CHECK (
        status IN (
            'pending_delivery',
            'delivered',
            'opened',
            'failed',
            'expired',
            'declined',
            'opted_out',
            'revoked',
            'activated'
        )
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'customer_properties_activation_identity'
          AND conrelid = 'customer_properties'::REGCLASS
    ) THEN
        ALTER TABLE customer_properties
            ADD CONSTRAINT customer_properties_activation_identity
            UNIQUE (id, organization_id, account_id);
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS owner_provider_relationship_activations (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES owner_workspaces(owner_user_id) ON DELETE RESTRICT,
    owner_property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE RESTRICT,
    invitation_id TEXT NOT NULL REFERENCES owner_provider_invitations(id) ON DELETE RESTRICT,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    assessment_id TEXT NOT NULL REFERENCES owner_provider_assessments(id) ON DELETE RESTRICT,
    proposal_id TEXT NOT NULL UNIQUE REFERENCES owner_provider_initial_service_proposals(id) ON DELETE RESTRICT,
    proposal_decision_id TEXT NOT NULL UNIQUE REFERENCES owner_provider_initial_service_proposal_decisions(id) ON DELETE RESTRICT,
    acceptance_snapshot_id TEXT NOT NULL UNIQUE REFERENCES owner_provider_initial_service_proposal_acceptance_snapshots(id) ON DELETE RESTRICT,
    acceptance_snapshot_sha256 TEXT NOT NULL CHECK (acceptance_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    customer_account_id TEXT NOT NULL REFERENCES customer_accounts(id) ON DELETE RESTRICT,
    customer_property_id TEXT NOT NULL,
    owner_membership_id TEXT NOT NULL REFERENCES organization_memberships(id) ON DELETE RESTRICT,
    activation_affirmation_text_version TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(activation_affirmation_text_version)) BETWEEN 1 AND 120
    ),
    owner_confirmed BOOLEAN NOT NULL CHECK (owner_confirmed),
    idempotency_key TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128),
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_user_id, idempotency_key),
    UNIQUE (owner_property_id),
    FOREIGN KEY (organization_id, customer_account_id)
        REFERENCES organization_customer_accounts(organization_id, account_id)
        ON DELETE RESTRICT,
    FOREIGN KEY (customer_property_id, organization_id, customer_account_id)
        REFERENCES customer_properties(id, organization_id, account_id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_relationship_activations_provider
    ON owner_provider_relationship_activations (organization_id, activated_at DESC);

CREATE OR REPLACE FUNCTION prevent_owner_provider_relationship_activation_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'owner-provider relationship activations are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_provider_relationship_activation_immutable
    ON owner_provider_relationship_activations;
CREATE TRIGGER owner_provider_relationship_activation_immutable
    BEFORE UPDATE ON owner_provider_relationship_activations
    FOR EACH ROW EXECUTE FUNCTION prevent_owner_provider_relationship_activation_update();

CREATE TABLE IF NOT EXISTS customer_portal_access_grants (
    id TEXT PRIMARY KEY,
    activation_id TEXT NOT NULL UNIQUE REFERENCES owner_provider_relationship_activations(id) ON DELETE RESTRICT,
    organization_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    access_role TEXT NOT NULL DEFAULT 'property_owner' CHECK (
        access_role IN ('property_owner', 'property_manager')
    ),
    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'revoked')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    CHECK (
        (status = 'active' AND revoked_at IS NULL)
        OR (status = 'revoked' AND revoked_at IS NOT NULL)
    ),
    UNIQUE (organization_id, account_id, property_id, user_id),
    FOREIGN KEY (organization_id, account_id)
        REFERENCES organization_customer_accounts(organization_id, account_id)
        ON DELETE RESTRICT,
    FOREIGN KEY (property_id, organization_id, account_id)
        REFERENCES customer_properties(id, organization_id, account_id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_customer_portal_access_grants_user
    ON customer_portal_access_grants (user_id, status, organization_id, account_id);

CREATE TABLE IF NOT EXISTS owner_provider_active_relationships (
    owner_property_id TEXT PRIMARY KEY REFERENCES owner_properties(id) ON DELETE RESTRICT,
    activation_id TEXT NOT NULL UNIQUE REFERENCES owner_provider_relationship_activations(id) ON DELETE RESTRICT,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    customer_account_id TEXT NOT NULL REFERENCES customer_accounts(id) ON DELETE RESTRICT,
    customer_property_id TEXT NOT NULL REFERENCES customer_properties(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    activated_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (status = 'active' AND ended_at IS NULL)
        OR (status = 'ended' AND ended_at IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS owner_provider_relationship_activation_events (
    id TEXT PRIMARY KEY,
    activation_id TEXT NOT NULL REFERENCES owner_provider_relationship_activations(id) ON DELETE RESTRICT,
    actor_user_id TEXT NOT NULL,
    event_kind TEXT NOT NULL CHECK (
        event_kind IN ('activated', 'competing_invitation_closed')
    ),
    target_id TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (JSONB_TYPEOF(event_data) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_provider_relationship_activation_event_once
    ON owner_provider_relationship_activation_events (activation_id, event_kind, target_id);

CREATE INDEX IF NOT EXISTS idx_owner_provider_relationship_activation_events
    ON owner_provider_relationship_activation_events (activation_id, created_at, id);
