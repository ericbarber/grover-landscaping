CREATE TABLE IF NOT EXISTS owner_workspaces (
    owner_user_id TEXT PRIMARY KEY,
    verified_email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'archived')
    ),
    email_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS owner_properties (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES owner_workspaces(owner_user_id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'US',
    coarse_area TEXT NOT NULL DEFAULT '',
    address_status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (
        address_status IN ('unconfirmed', 'owner_confirmed', 'correction_required')
    ),
    address_fingerprint TEXT NOT NULL,
    authority_attested_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'profile_ready',
            'connection_in_progress',
            'provider_setup',
            'active_care',
            'paused',
            'archived'
        )
    ),
    version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_properties_active_address
    ON owner_properties (owner_user_id, address_fingerprint)
    WHERE status <> 'archived';

CREATE INDEX IF NOT EXISTS idx_owner_properties_owner_status
    ON owner_properties (owner_user_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS owner_acquisition_events (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES owner_workspaces(owner_user_id) ON DELETE CASCADE,
    property_id TEXT REFERENCES owner_properties(id) ON DELETE SET NULL,
    event_kind TEXT NOT NULL CHECK (
        event_kind IN (
            'workspace_saved',
            'property_created',
            'property_updated',
            'property_archived'
        )
    ),
    event_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_acquisition_events_owner
    ON owner_acquisition_events (owner_user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_owner_acquisition_events_property
    ON owner_acquisition_events (property_id, occurred_at DESC)
    WHERE property_id IS NOT NULL;
