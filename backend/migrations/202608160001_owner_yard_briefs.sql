CREATE TABLE IF NOT EXISTS owner_yard_briefs (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES owner_workspaces(owner_user_id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
    version BIGINT NOT NULL CHECK (version > 0),
    status TEXT NOT NULL CHECK (status IN ('draft', 'ready')),
    yard_areas TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    care_goals TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    cadence_preference TEXT NOT NULL CHECK (
        cadence_preference IN (
            'provider_recommendation',
            'one_time',
            'weekly',
            'every_two_weeks',
            'monthly'
        )
    ),
    considerations TEXT NOT NULL DEFAULT '',
    author_source TEXT NOT NULL DEFAULT 'yard_owner' CHECK (author_source = 'yard_owner'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (property_id, version)
);

CREATE INDEX IF NOT EXISTS idx_owner_yard_briefs_latest
    ON owner_yard_briefs (owner_user_id, property_id, version DESC);

ALTER TABLE owner_acquisition_events
    DROP CONSTRAINT IF EXISTS owner_acquisition_events_event_kind_check;

ALTER TABLE owner_acquisition_events
    ADD CONSTRAINT owner_acquisition_events_event_kind_check CHECK (
        event_kind IN (
            'workspace_saved',
            'property_created',
            'property_updated',
            'property_archived',
            'yard_brief_saved'
        )
    );
