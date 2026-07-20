CREATE TABLE IF NOT EXISTS marketing_leads (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    company_name TEXT,
    persona TEXT NOT NULL CHECK (
        persona IN ('yard_owner', 'property_manager', 'landscaping_company', 'crew_lead')
    ),
    team_size TEXT,
    intent TEXT NOT NULL CHECK (intent IN ('demo', 'portfolio_discussion', 'early_access')),
    message TEXT,
    source TEXT,
    medium TEXT,
    campaign TEXT,
    landing_path TEXT NOT NULL,
    consent_to_contact BOOLEAN NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS marketing_leads_created_at_idx
    ON marketing_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS marketing_leads_persona_status_idx
    ON marketing_leads (persona, status, created_at DESC);
