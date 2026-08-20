CREATE TABLE IF NOT EXISTS owner_provider_assessment_messages (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES owner_provider_assessments(id) ON DELETE RESTRICT,
    author_user_id TEXT NOT NULL,
    author_role TEXT NOT NULL CHECK (author_role IN ('owner', 'provider')),
    message_kind TEXT NOT NULL CHECK (
        message_kind IN (
            'owner_question', 'provider_answer', 'window_change_request',
            'additional_photo_request', 'clarification'
        )
    ),
    customer_safe_body TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(customer_safe_body)) BETWEEN 1 AND 2000
    ),
    visibility TEXT NOT NULL DEFAULT 'owner_provider' CHECK (visibility = 'owner_provider'),
    assessment_version_snapshot BIGINT NOT NULL CHECK (assessment_version_snapshot > 0),
    idempotency_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (author_user_id, idempotency_key),
    CHECK (
        (author_role = 'owner' AND message_kind IN (
            'owner_question', 'window_change_request', 'clarification'
        ))
        OR
        (author_role = 'provider' AND message_kind IN (
            'provider_answer', 'window_change_request',
            'additional_photo_request', 'clarification'
        ))
    )
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_assessment_messages_assessment
    ON owner_provider_assessment_messages (assessment_id, created_at, id);

CREATE TABLE IF NOT EXISTS owner_provider_assessment_private_notes (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES owner_provider_assessments(id) ON DELETE RESTRICT,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    author_user_id TEXT NOT NULL,
    note_kind TEXT NOT NULL CHECK (
        note_kind IN (
            'scope_basis', 'measurement', 'access', 'safety',
            'production_assumption', 'route_fit', 'other'
        )
    ),
    private_body TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(private_body)) BETWEEN 1 AND 4000
    ),
    visibility TEXT NOT NULL DEFAULT 'provider_private' CHECK (visibility = 'provider_private'),
    assessment_version_snapshot BIGINT NOT NULL CHECK (assessment_version_snapshot > 0),
    idempotency_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (author_user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_assessment_private_notes_provider
    ON owner_provider_assessment_private_notes (
        assessment_id, organization_id, created_at, id
    );

CREATE OR REPLACE VIEW owner_provider_assessment_owner_messages AS
SELECT id, assessment_id, author_role, message_kind, customer_safe_body,
       assessment_version_snapshot, created_at
FROM owner_provider_assessment_messages
WHERE visibility = 'owner_provider';

ALTER TABLE owner_provider_assessment_events
    DROP CONSTRAINT IF EXISTS owner_provider_assessment_events_event_kind_check;

ALTER TABLE owner_provider_assessment_events
    ADD CONSTRAINT owner_provider_assessment_events_event_kind_check CHECK (
        event_kind IN (
            'started', 'window_proposed', 'window_confirmed', 'window_change_requested',
            'began', 'completed', 'cannot_assess', 'cancelled',
            'customer_message_added', 'private_note_added'
        )
    );
