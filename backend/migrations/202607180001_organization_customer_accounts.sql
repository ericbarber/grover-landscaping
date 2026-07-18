CREATE TABLE IF NOT EXISTS organization_customer_accounts (
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'service_provider' CHECK (
        relationship_type IN ('service_provider', 'property_manager', 'owner')
    ),
    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'suspended', 'archived')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, account_id)
);

INSERT INTO organization_customer_accounts (organization_id, account_id)
VALUES
    ('org_demo_landscaping', 'acct_1001'),
    ('org_demo_landscaping', 'acct_1002')
ON CONFLICT (organization_id, account_id) DO NOTHING;
