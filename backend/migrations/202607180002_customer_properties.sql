CREATE TABLE IF NOT EXISTS customer_properties (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    service_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'onboarding' CHECK (
        status IN ('onboarding', 'active', 'blocked', 'archived')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (organization_id, account_id)
        REFERENCES organization_customer_accounts (organization_id, account_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customer_properties_account
    ON customer_properties (organization_id, account_id, status, display_name);

INSERT INTO customer_properties (
    id, organization_id, account_id, display_name, service_address, status
)
VALUES
    ('property_1001', 'org_demo_landscaping', 'acct_1001', 'Sample Customer Home', '123 Oak Street', 'active'),
    ('property_1002', 'org_demo_landscaping', 'acct_1001', 'Backyard Renovation Area', '123 Oak Street', 'active')
ON CONFLICT (id) DO NOTHING;
