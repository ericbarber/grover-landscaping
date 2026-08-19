CREATE TABLE IF NOT EXISTS owner_provider_invitation_organization_claims (
    id TEXT PRIMARY KEY,
    invitation_id TEXT NOT NULL REFERENCES owner_provider_invitations(id) ON DELETE CASCADE,
    recipient_check_id TEXT NOT NULL REFERENCES owner_provider_invitation_recipient_checks(id) ON DELETE CASCADE,
    actor_user_id TEXT NOT NULL,
    claim_kind TEXT NOT NULL CHECK (
        claim_kind IN ('existing_relationship', 'new_organization')
    ),
    proposed_display_name TEXT NOT NULL,
    normalized_name_fingerprint TEXT NOT NULL,
    organization_id TEXT REFERENCES organizations(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (
        status IN (
            'relationship_checked',
            'bootstrap_ready',
            'duplicate_review',
            'under_review',
            'claimed',
            'rejected',
            'disputed',
            'withdrawn'
        )
    ),
    authority_attested_at TIMESTAMPTZ,
    reason_code TEXT,
    assigned_function TEXT,
    evidence_reference TEXT,
    idempotency_key TEXT NOT NULL,
    version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (actor_user_id, idempotency_key),
    CHECK (
        (claim_kind = 'existing_relationship'
            AND organization_id IS NOT NULL
            AND status IN ('relationship_checked', 'claimed', 'disputed', 'withdrawn'))
        OR
        (claim_kind = 'new_organization'
            AND authority_attested_at IS NOT NULL
            AND (
                (status IN ('bootstrap_ready', 'duplicate_review', 'under_review', 'rejected', 'withdrawn')
                    AND organization_id IS NULL)
                OR (status IN ('claimed', 'disputed') AND organization_id IS NOT NULL)
            ))
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_provider_organization_claims_active
    ON owner_provider_invitation_organization_claims (invitation_id)
    WHERE status IN (
        'relationship_checked',
        'bootstrap_ready',
        'duplicate_review',
        'under_review',
        'claimed',
        'disputed'
    );

CREATE INDEX IF NOT EXISTS idx_owner_provider_organization_claims_review
    ON owner_provider_invitation_organization_claims (status, assigned_function, created_at)
    WHERE status IN ('duplicate_review', 'under_review', 'disputed');

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
            'provider_invitation_expired',
            'provider_invitation_declined',
            'provider_invitation_opted_out',
            'provider_invitation_revoked',
            'provider_invitation_abuse_reported'
        )
    );
