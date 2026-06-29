CREATE TABLE IF NOT EXISTS property_portfolios (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    portfolio_type TEXT NOT NULL CHECK (
        portfolio_type IN (
            'individual_owner',
            'property_management_company',
            'hoa',
            'commercial_client'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_property_links (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL REFERENCES property_portfolios(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (portfolio_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_portfolios_account
    ON property_portfolios (account_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_property_links_portfolio
    ON portfolio_property_links (portfolio_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_property_links_property
    ON portfolio_property_links (property_id, organization_id);
