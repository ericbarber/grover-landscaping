CREATE TABLE IF NOT EXISTS owner_intake_media (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES owner_workspaces(owner_user_id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
    brief_id TEXT NOT NULL REFERENCES owner_yard_briefs(id) ON DELETE RESTRICT,
    shot_type TEXT NOT NULL CHECK (
        shot_type IN ('front_yard', 'back_yard', 'side_access', 'irrigation_or_concern', 'other')
    ),
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    upload_mode TEXT NOT NULL CHECK (upload_mode IN ('local-placeholder', 's3-presigned')),
    object_key TEXT NOT NULL,
    thumbnail_object_key TEXT,
    status TEXT NOT NULL CHECK (
        status IN ('pending_upload', 'processing', 'ready', 'rejected', 'replaced', 'deleted')
    ),
    file_size_bytes BIGINT,
    image_width_px INTEGER,
    image_height_px INTEGER,
    metadata_source TEXT,
    rejection_reason TEXT,
    replaces_media_id TEXT REFERENCES owner_intake_media(id) ON DELETE SET NULL,
    replaced_by_media_id TEXT REFERENCES owner_intake_media(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_intake_media_property
    ON owner_intake_media (owner_user_id, property_id, created_at DESC);

ALTER TABLE owner_acquisition_events
    DROP CONSTRAINT IF EXISTS owner_acquisition_events_event_kind_check;

ALTER TABLE owner_acquisition_events
    ADD CONSTRAINT owner_acquisition_events_event_kind_check CHECK (
        event_kind IN (
            'workspace_saved',
            'property_created',
            'property_updated',
            'property_archived',
            'yard_brief_saved',
            'intake_media_created',
            'intake_media_completed',
            'intake_media_rejected',
            'intake_media_deleted'
        )
    );
