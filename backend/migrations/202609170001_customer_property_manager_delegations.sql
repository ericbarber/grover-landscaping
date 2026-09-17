CREATE TABLE IF NOT EXISTS customer_property_manager_invitations (
    id TEXT PRIMARY KEY,
    activation_id TEXT NOT NULL REFERENCES owner_provider_relationship_activations(id)
        ON DELETE RESTRICT,
    organization_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    owner_user_id TEXT NOT NULL REFERENCES owner_workspaces(owner_user_id)
        ON DELETE RESTRICT,
    recipient_email TEXT NOT NULL CHECK (
        recipient_email = LOWER(BTRIM(recipient_email))
        AND CHAR_LENGTH(recipient_email) BETWEEN 5 AND 254
        AND recipient_email LIKE '%@%'
    ),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'accepted', 'revoked', 'expired')
    ),
    idempotency_key TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128
    ),
    accepted_user_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    CHECK (expires_at > created_at),
    CHECK (
        (status = 'pending' AND accepted_user_id IS NULL
            AND accepted_at IS NULL AND revoked_at IS NULL)
        OR (status = 'accepted' AND accepted_user_id IS NOT NULL
            AND accepted_at IS NOT NULL AND revoked_at IS NULL)
        OR (status = 'revoked' AND revoked_at IS NOT NULL)
        OR (status = 'expired' AND accepted_user_id IS NULL
            AND accepted_at IS NULL AND revoked_at IS NULL)
    ),
    UNIQUE (owner_user_id, idempotency_key),
    UNIQUE (
        id, activation_id, organization_id, account_id, property_id,
        accepted_user_id
    ),
    FOREIGN KEY (organization_id, account_id)
        REFERENCES organization_customer_accounts(organization_id, account_id)
        ON DELETE RESTRICT,
    FOREIGN KEY (property_id, organization_id, account_id)
        REFERENCES customer_properties(id, organization_id, account_id)
        ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_pm_one_open_invitation
    ON customer_property_manager_invitations (
        activation_id, recipient_email
    )
    WHERE status IN ('pending', 'accepted');

CREATE INDEX IF NOT EXISTS idx_customer_pm_invitations_owner
    ON customer_property_manager_invitations (
        owner_user_id, activation_id, status, created_at DESC
    );

ALTER TABLE customer_portal_access_grants
    DROP CONSTRAINT IF EXISTS customer_portal_access_grants_activation_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_portal_owner_activation_once
    ON customer_portal_access_grants (activation_id)
    WHERE access_role = 'property_owner';

ALTER TABLE customer_portal_access_grants
    ADD COLUMN IF NOT EXISTS delegation_invitation_id TEXT;

ALTER TABLE customer_portal_access_grants
    ADD CONSTRAINT customer_portal_manager_delegation_source CHECK (
        (access_role = 'property_owner' AND delegation_invitation_id IS NULL)
        OR (access_role = 'property_manager'
            AND delegation_invitation_id IS NOT NULL
            AND scope_type = 'property'
            AND scope_id = property_id)
    ) NOT VALID;

ALTER TABLE customer_portal_access_grants
    ADD CONSTRAINT customer_portal_manager_invitation_identity FOREIGN KEY (
        delegation_invitation_id, activation_id, organization_id,
        account_id, property_id, user_id
    ) REFERENCES customer_property_manager_invitations (
        id, activation_id, organization_id, account_id, property_id,
        accepted_user_id
    ) ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_portal_manager_invitation_once
    ON customer_portal_access_grants (delegation_invitation_id)
    WHERE delegation_invitation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS customer_property_manager_access_events (
    id TEXT PRIMARY KEY,
    invitation_id TEXT NOT NULL REFERENCES customer_property_manager_invitations(id)
        ON DELETE RESTRICT,
    actor_user_id TEXT NOT NULL,
    event_kind TEXT NOT NULL CHECK (
        event_kind IN ('invited', 'accepted', 'revoked', 'expired')
    ),
    event_data JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
        JSONB_TYPEOF(event_data) = 'object'
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (invitation_id, event_kind)
);
