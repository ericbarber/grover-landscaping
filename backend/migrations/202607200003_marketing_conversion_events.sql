CREATE TABLE IF NOT EXISTS marketing_conversion_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL CHECK (event_name IN (
        'page_view', 'persona_selected', 'tour_step_selected', 'cta_clicked',
        'form_started', 'form_submitted', 'form_failed'
    )),
    persona TEXT NOT NULL CHECK (
        persona IN ('yard_owner', 'property_manager', 'landscaping_company', 'crew_lead')
    ),
    detail TEXT,
    source TEXT,
    medium TEXT,
    campaign TEXT,
    landing_path TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS marketing_conversion_events_funnel_idx
    ON marketing_conversion_events (event_name, persona, occurred_at DESC);

CREATE INDEX IF NOT EXISTS marketing_conversion_events_campaign_idx
    ON marketing_conversion_events (campaign, occurred_at DESC);
