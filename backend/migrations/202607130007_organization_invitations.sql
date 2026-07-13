CREATE TABLE IF NOT EXISTS organization_invitations (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN (
            'organization_owner',
            'manager',
            'crew_lead',
            'crew_member',
            'property_owner',
            'property_manager',
            'support_admin'
        )
    ),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'accepted', 'revoked', 'expired')
    ),
    scope_type TEXT NOT NULL DEFAULT 'organization' CHECK (
        scope_type IN ('organization', 'region', 'branch', 'crew', 'portfolio', 'property')
    ),
    scope_id TEXT,
    token TEXT NOT NULL UNIQUE,
    membership_id TEXT NOT NULL REFERENCES organization_memberships(id) ON DELETE CASCADE,
    invited_by_user_id TEXT NOT NULL,
    accepted_by_user_id TEXT,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_invitations_organization
    ON organization_invitations (organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_organization_invitations_email
    ON organization_invitations (invitee_email, status, organization_id);
