CREATE TABLE IF NOT EXISTS owner_provider_initial_service_proposal_messages (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL REFERENCES owner_provider_initial_service_proposals(id) ON DELETE RESTRICT,
    assessment_id TEXT NOT NULL REFERENCES owner_provider_assessments(id) ON DELETE RESTRICT,
    owner_user_id TEXT NOT NULL,
    property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE RESTRICT,
    invitation_id TEXT NOT NULL REFERENCES owner_provider_invitations(id) ON DELETE RESTRICT,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    author_user_id TEXT NOT NULL,
    author_role TEXT NOT NULL CHECK (author_role IN ('owner', 'provider')),
    message_kind TEXT NOT NULL CHECK (message_kind IN ('owner_question', 'owner_change_request', 'provider_response')),
    customer_safe_body TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(customer_safe_body)) BETWEEN 1 AND 2000),
    proposal_version_snapshot BIGINT NOT NULL CHECK (proposal_version_snapshot > 0),
    series_version_snapshot BIGINT NOT NULL CHECK (series_version_snapshot >= proposal_version_snapshot),
    in_reply_to_message_id TEXT REFERENCES owner_provider_initial_service_proposal_messages(id) ON DELETE RESTRICT,
    related_proposal_id TEXT REFERENCES owner_provider_initial_service_proposals(id) ON DELETE RESTRICT,
    idempotency_key TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (author_user_id, idempotency_key),
    CHECK (
        (author_role = 'owner'
            AND message_kind IN ('owner_question', 'owner_change_request')
            AND in_reply_to_message_id IS NULL
            AND related_proposal_id IS NULL)
        OR
        (author_role = 'provider'
            AND message_kind = 'provider_response'
            AND in_reply_to_message_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_proposal_messages_assessment
    ON owner_provider_initial_service_proposal_messages (assessment_id, created_at, id);

CREATE INDEX IF NOT EXISTS idx_owner_provider_proposal_messages_proposal
    ON owner_provider_initial_service_proposal_messages (proposal_id, created_at, id);

CREATE OR REPLACE FUNCTION prevent_owner_provider_proposal_message_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'published owner-provider proposal messages are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_provider_proposal_message_immutable
    ON owner_provider_initial_service_proposal_messages;
CREATE TRIGGER owner_provider_proposal_message_immutable
    BEFORE UPDATE ON owner_provider_initial_service_proposal_messages
    FOR EACH ROW EXECUTE FUNCTION prevent_owner_provider_proposal_message_update();
