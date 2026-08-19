CREATE TABLE IF NOT EXISTS owner_provider_disclosure_receipts (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES owner_workspaces(owner_user_id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
    invitation_id TEXT NOT NULL REFERENCES owner_provider_invitations(id) ON DELETE RESTRICT,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    recipient_actor_user_id TEXT NOT NULL,
    capability_id TEXT NOT NULL REFERENCES owner_provider_invitation_response_capabilities(id) ON DELETE RESTRICT,
    brief_id TEXT NOT NULL REFERENCES owner_yard_briefs(id) ON DELETE RESTRICT,
    brief_version BIGINT NOT NULL CHECK (brief_version > 0),
    purpose TEXT NOT NULL CHECK (purpose = 'yard_assessment'),
    approved_categories TEXT[] NOT NULL,
    withheld_categories TEXT[] NOT NULL,
    selected_media_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    consent_text_version TEXT NOT NULL,
    retention_notice_version TEXT NOT NULL,
    grant_version BIGINT NOT NULL CHECK (grant_version > 0),
    owner_affirmed_at TIMESTAMPTZ NOT NULL,
    idempotency_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_user_id, idempotency_key),
    UNIQUE (invitation_id, grant_version),
    CHECK (cardinality(approved_categories) > 0),
    CHECK (cardinality(approved_categories) + cardinality(withheld_categories) = 5),
    CHECK (NOT approved_categories && withheld_categories),
    CHECK (
        ('exact_address' = ANY(approved_categories)) <> ('exact_address' = ANY(withheld_categories))
        AND ('yard_brief' = ANY(approved_categories)) <> ('yard_brief' = ANY(withheld_categories))
        AND ('selected_yard_photos' = ANY(approved_categories)) <> ('selected_yard_photos' = ANY(withheld_categories))
        AND ('owner_contact' = ANY(approved_categories)) <> ('owner_contact' = ANY(withheld_categories))
        AND ('access_considerations' = ANY(approved_categories)) <> ('access_considerations' = ANY(withheld_categories))
    ),
    CHECK (
        ('selected_yard_photos' = ANY(approved_categories) AND cardinality(selected_media_ids) > 0)
        OR ('selected_yard_photos' = ANY(withheld_categories) AND cardinality(selected_media_ids) = 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_disclosure_receipts_owner
    ON owner_provider_disclosure_receipts (owner_user_id, property_id, created_at DESC);

CREATE TABLE IF NOT EXISTS owner_provider_disclosure_grants (
    id TEXT PRIMARY KEY,
    receipt_id TEXT NOT NULL UNIQUE REFERENCES owner_provider_disclosure_receipts(id) ON DELETE RESTRICT,
    owner_user_id TEXT NOT NULL REFERENCES owner_workspaces(owner_user_id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
    invitation_id TEXT NOT NULL REFERENCES owner_provider_invitations(id) ON DELETE RESTRICT,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    recipient_actor_user_id TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose = 'yard_assessment'),
    approved_categories TEXT[] NOT NULL,
    brief_id TEXT NOT NULL REFERENCES owner_yard_briefs(id) ON DELETE RESTRICT,
    brief_version BIGINT NOT NULL CHECK (brief_version > 0),
    selected_media_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired', 'suspended')),
    effective_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (cardinality(approved_categories) > 0),
    CHECK (approved_categories <@ ARRAY[
        'exact_address', 'yard_brief', 'selected_yard_photos',
        'owner_contact', 'access_considerations'
    ]::TEXT[]),
    CHECK (
        ('selected_yard_photos' = ANY(approved_categories) AND cardinality(selected_media_ids) > 0)
        OR (NOT ('selected_yard_photos' = ANY(approved_categories)) AND cardinality(selected_media_ids) = 0)
    ),
    CHECK (expires_at > effective_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_provider_disclosure_grant_active_invitation
    ON owner_provider_disclosure_grants (invitation_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_owner_provider_disclosure_grant_provider
    ON owner_provider_disclosure_grants (organization_id, recipient_actor_user_id, status, expires_at);

CREATE TABLE IF NOT EXISTS owner_provider_disclosure_grant_events (
    id TEXT PRIMARY KEY,
    grant_id TEXT NOT NULL REFERENCES owner_provider_disclosure_grants(id) ON DELETE RESTRICT,
    receipt_id TEXT NOT NULL REFERENCES owner_provider_disclosure_receipts(id) ON DELETE RESTRICT,
    actor_user_id TEXT NOT NULL,
    event_kind TEXT NOT NULL CHECK (event_kind IN ('created', 'revoked', 'expired', 'suspended', 'superseded')),
    reason_code TEXT,
    grant_version BIGINT NOT NULL CHECK (grant_version > 0),
    idempotency_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (actor_user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_disclosure_grant_events_grant
    ON owner_provider_disclosure_grant_events (grant_id, created_at, id);

ALTER TABLE owner_acquisition_events
    DROP CONSTRAINT IF EXISTS owner_acquisition_events_event_kind_check;

ALTER TABLE owner_acquisition_events
    ADD CONSTRAINT owner_acquisition_events_event_kind_check CHECK (
        event_kind IN (
            'workspace_saved', 'property_created', 'property_updated', 'property_archived',
            'yard_brief_saved', 'intake_media_created', 'intake_media_completed',
            'intake_media_rejected', 'intake_media_deleted', 'provider_invitation_created',
            'provider_invitation_delivery_requested', 'provider_invitation_delivery_retried',
            'provider_invitation_delivered', 'provider_invitation_failed',
            'provider_invitation_opened', 'provider_invitation_recipient_checked',
            'provider_invitation_organization_claim_created',
            'provider_invitation_organization_duplicate_review',
            'provider_invitation_organization_bootstrapped',
            'provider_invitation_organization_review_started',
            'provider_invitation_organization_review_dispositioned',
            'provider_invitation_organization_appealed',
            'provider_invitation_organization_appeal_decided',
            'provider_invitation_response_capability_issued',
            'provider_invitation_response_capability_reconciled',
            'provider_invitation_opportunity_response_recorded',
            'provider_disclosure_grant_created', 'provider_disclosure_grant_revoked',
            'provider_invitation_expired', 'provider_invitation_declined',
            'provider_invitation_opted_out', 'provider_invitation_revoked',
            'provider_invitation_abuse_reported'
        )
    );
