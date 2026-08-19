CREATE TABLE IF NOT EXISTS owner_provider_invitation_response_capabilities (
    id TEXT PRIMARY KEY,
    invitation_id TEXT NOT NULL REFERENCES owner_provider_invitations(id) ON DELETE CASCADE,
    recipient_check_id TEXT NOT NULL REFERENCES owner_provider_invitation_recipient_checks(id) ON DELETE CASCADE,
    claim_id TEXT NOT NULL REFERENCES owner_provider_invitation_organization_claims(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    actor_user_id TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
    brief_id TEXT NOT NULL REFERENCES owner_yard_briefs(id) ON DELETE RESTRICT,
    brief_version BIGINT NOT NULL CHECK (brief_version > 0),
    purpose TEXT NOT NULL CHECK (purpose = 'known_provider_yard_assessment_response'),
    allowed_actions TEXT[] NOT NULL CHECK (
        allowed_actions = ARRAY[
            'preliminary_question', 'express_interest', 'decline', 'report'
        ]::TEXT[]
    ),
    withheld_categories TEXT[] NOT NULL CHECK (
        withheld_categories = ARRAY[
            'exact_address', 'yard_photos', 'owner_contact',
            'access_considerations', 'pricing_and_work_authority'
        ]::TEXT[]
    ),
    status TEXT NOT NULL CHECK (
        status IN ('active', 'declined', 'revoked', 'expired', 'suspended', 'superseded')
    ),
    withheld_acknowledged_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    idempotency_key TEXT NOT NULL,
    version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (actor_user_id, idempotency_key),
    CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_provider_response_capability_active_invitation
    ON owner_provider_invitation_response_capabilities (invitation_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_owner_provider_response_capability_actor
    ON owner_provider_invitation_response_capabilities (actor_user_id, status, expires_at);

ALTER TABLE owner_acquisition_events
    DROP CONSTRAINT IF EXISTS owner_acquisition_events_event_kind_check;

ALTER TABLE owner_acquisition_events
    ADD CONSTRAINT owner_acquisition_events_event_kind_check CHECK (
        event_kind IN (
            'workspace_saved', 'property_created', 'property_updated',
            'property_archived', 'yard_brief_saved', 'intake_media_created',
            'intake_media_completed', 'intake_media_rejected',
            'intake_media_deleted', 'provider_invitation_created',
            'provider_invitation_delivery_requested',
            'provider_invitation_delivery_retried', 'provider_invitation_delivered',
            'provider_invitation_failed', 'provider_invitation_opened',
            'provider_invitation_recipient_checked',
            'provider_invitation_organization_claim_created',
            'provider_invitation_organization_duplicate_review',
            'provider_invitation_organization_bootstrapped',
            'provider_invitation_organization_review_started',
            'provider_invitation_organization_review_dispositioned',
            'provider_invitation_organization_appealed',
            'provider_invitation_organization_appeal_decided',
            'provider_invitation_response_capability_issued',
            'provider_invitation_response_capability_reconciled',
            'provider_invitation_expired', 'provider_invitation_declined',
            'provider_invitation_opted_out', 'provider_invitation_revoked',
            'provider_invitation_abuse_reported'
        )
    );
