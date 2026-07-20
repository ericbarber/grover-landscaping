ALTER TABLE marketing_leads
    ADD COLUMN IF NOT EXISTS assigned_to TEXT,
    ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS marketing_lead_history (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES marketing_leads(id) ON DELETE CASCADE,
    actor_user_id TEXT NOT NULL,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    assigned_to TEXT,
    next_action_at TIMESTAMPTZ,
    note TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS marketing_lead_history_lead_idx
    ON marketing_lead_history (lead_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS marketing_leads_follow_up_idx
    ON marketing_leads (status, next_action_at, created_at DESC);
