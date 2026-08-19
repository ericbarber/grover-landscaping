CREATE TABLE IF NOT EXISTS owner_provider_organization_claim_review_events (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL REFERENCES owner_provider_invitation_organization_claims(id) ON DELETE CASCADE,
    actor_user_id TEXT NOT NULL,
    actor_function TEXT NOT NULL CHECK (actor_function = 'provider_operations'),
    action TEXT NOT NULL CHECK (
        action IN (
            'review_started',
            'cleared_for_bootstrap',
            'rejected',
            'dispute_paused',
            'appeal_submitted',
            'appeal_decided'
        )
    ),
    prior_status TEXT NOT NULL,
    resulting_status TEXT NOT NULL,
    reason_code TEXT,
    evidence_reference TEXT,
    expected_claim_version BIGINT NOT NULL CHECK (expected_claim_version > 0),
    idempotency_key TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (actor_user_id, idempotency_key),
    CHECK (
        (action = 'review_started' AND reason_code IS NULL AND evidence_reference IS NULL)
        OR
        (action <> 'review_started' AND reason_code IS NOT NULL AND evidence_reference IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_organization_claim_review_history
    ON owner_provider_organization_claim_review_events (claim_id, occurred_at, id);

CREATE INDEX IF NOT EXISTS idx_owner_provider_organization_claim_review_actor
    ON owner_provider_organization_claim_review_events (actor_user_id, occurred_at DESC);

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
            'provider_invitation_expired', 'provider_invitation_declined',
            'provider_invitation_opted_out', 'provider_invitation_revoked',
            'provider_invitation_abuse_reported'
        )
    );
