CREATE TABLE IF NOT EXISTS owner_provider_assessments (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES owner_workspaces(owner_user_id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
    invitation_id TEXT NOT NULL UNIQUE REFERENCES owner_provider_invitations(id) ON DELETE RESTRICT,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    disclosure_grant_id TEXT NOT NULL REFERENCES owner_provider_disclosure_grants(id) ON DELETE RESTRICT,
    provider_actor_user_id TEXT NOT NULL,
    assessment_method TEXT NOT NULL CHECK (assessment_method IN ('remote', 'on_site')),
    status TEXT NOT NULL CHECK (
        status IN (
            'remote_review', 'window_proposed', 'owner_confirmed', 'in_progress',
            'completed', 'cannot_assess', 'cancelled'
        )
    ),
    proposed_window_start TIMESTAMPTZ,
    proposed_window_end TIMESTAMPTZ,
    time_zone TEXT,
    idempotency_key TEXT NOT NULL,
    version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider_actor_user_id, idempotency_key),
    CHECK (
        (
            assessment_method = 'remote'
            AND status <> 'window_proposed'
            AND proposed_window_start IS NULL
            AND proposed_window_end IS NULL
            AND time_zone IS NULL
        )
        OR
        (
            assessment_method = 'on_site'
            AND status <> 'remote_review'
            AND proposed_window_start IS NOT NULL
            AND proposed_window_end IS NOT NULL
            AND proposed_window_end > proposed_window_start
            AND proposed_window_end <= proposed_window_start + INTERVAL '8 hours'
            AND BTRIM(time_zone) <> ''
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_assessments_owner
    ON owner_provider_assessments (owner_user_id, property_id, updated_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_owner_provider_assessments_provider
    ON owner_provider_assessments (
        organization_id, provider_actor_user_id, status, updated_at DESC, id
    );

CREATE TABLE IF NOT EXISTS owner_provider_assessment_events (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL REFERENCES owner_provider_assessments(id) ON DELETE RESTRICT,
    actor_user_id TEXT NOT NULL,
    event_kind TEXT NOT NULL CHECK (
        event_kind IN (
            'started', 'window_proposed', 'window_confirmed', 'window_change_requested',
            'began', 'completed', 'cannot_assess', 'cancelled'
        )
    ),
    assessment_version BIGINT NOT NULL CHECK (assessment_version > 0),
    idempotency_key TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (actor_user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_assessment_events_assessment
    ON owner_provider_assessment_events (assessment_id, created_at, id);

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
            'provider_assessment_started',
            'provider_invitation_expired', 'provider_invitation_declined',
            'provider_invitation_opted_out', 'provider_invitation_revoked',
            'provider_invitation_abuse_reported'
        )
    );
