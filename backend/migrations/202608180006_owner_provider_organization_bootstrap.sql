ALTER TABLE owner_provider_invitation_organization_claims
    ADD COLUMN IF NOT EXISTS bootstrap_idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS bootstrap_membership_id TEXT REFERENCES organization_memberships(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS bootstrapped_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_provider_organization_claims_bootstrap_replay
    ON owner_provider_invitation_organization_claims (actor_user_id, bootstrap_idempotency_key)
    WHERE bootstrap_idempotency_key IS NOT NULL;

ALTER TABLE owner_provider_invitation_organization_claims
    ADD CONSTRAINT owner_provider_organization_claims_bootstrap_check CHECK (
        status <> 'claimed'
        OR claim_kind = 'existing_relationship'
        OR (
            organization_id IS NOT NULL
            AND bootstrap_membership_id IS NOT NULL
            AND bootstrap_idempotency_key IS NOT NULL
            AND bootstrapped_at IS NOT NULL
        )
    );

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
            'intake_media_deleted',
            'provider_invitation_created',
            'provider_invitation_delivery_requested',
            'provider_invitation_delivery_retried',
            'provider_invitation_delivered',
            'provider_invitation_failed',
            'provider_invitation_opened',
            'provider_invitation_recipient_checked',
            'provider_invitation_organization_claim_created',
            'provider_invitation_organization_duplicate_review',
            'provider_invitation_organization_bootstrapped',
            'provider_invitation_expired',
            'provider_invitation_declined',
            'provider_invitation_opted_out',
            'provider_invitation_revoked',
            'provider_invitation_abuse_reported'
        )
    );
