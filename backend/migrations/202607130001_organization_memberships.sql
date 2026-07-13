CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    organization_type TEXT NOT NULL CHECK (
        organization_type IN (
            'yard_care_company',
            'property_management_company',
            'homeowner',
            'platform'
        )
    ),
    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'suspended', 'archived')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_memberships (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
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
    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('invited', 'active', 'suspended', 'archived')
    ),
    scope_type TEXT NOT NULL DEFAULT 'organization' CHECK (
        scope_type IN ('organization', 'region', 'branch', 'crew', 'portfolio', 'property')
    ),
    scope_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id, role, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_memberships_user
    ON organization_memberships (user_id, status, organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_memberships_organization
    ON organization_memberships (organization_id, status, role);

INSERT INTO organizations (id, display_name, organization_type, status)
VALUES
    ('org_demo_landscaping', 'Grover Demo Landscaping', 'yard_care_company', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organization_memberships (
    id,
    organization_id,
    user_id,
    role,
    status,
    scope_type,
    scope_id
)
VALUES
    (
        'membership_local_owner_demo',
        'org_demo_landscaping',
        'local-development-user',
        'organization_owner',
        'active',
        'organization',
        'org_demo_landscaping'
    )
ON CONFLICT (organization_id, user_id, role, scope_type, scope_id) DO NOTHING;
