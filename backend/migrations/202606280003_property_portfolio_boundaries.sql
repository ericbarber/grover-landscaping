CREATE UNIQUE INDEX IF NOT EXISTS idx_property_portfolios_account_display_name
    ON property_portfolios (account_id, organization_id, display_name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_property_links_one_group
    ON portfolio_property_links (property_id, organization_id);
