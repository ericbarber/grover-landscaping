CREATE TABLE IF NOT EXISTS owner_provider_invitation_abuse_reports (
    id TEXT PRIMARY KEY,
    invitation_id TEXT REFERENCES owner_provider_invitations(id) ON DELETE SET NULL,
    invitation_reference_hash TEXT NOT NULL,
    reporter_user_id TEXT NOT NULL,
    reporter_email_fingerprint TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN (
            'spam',
            'harassment',
            'impersonation',
            'suspicious_contact',
            'unsafe_contact',
            'wrong_recipient'
        )
    ),
    customer_safe_description TEXT NOT NULL DEFAULT '',
    block_future_invitations BOOLEAN NOT NULL CHECK (block_future_invitations),
    severity TEXT NOT NULL CHECK (severity IN ('S1', 'S2')),
    assigned_function TEXT NOT NULL DEFAULT 'trust_and_safety' CHECK (
        assigned_function = 'trust_and_safety'
    ),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (
        status IN ('submitted', 'under_review', 'contained', 'resolved', 'dismissed')
    ),
    idempotency_key TEXT NOT NULL,
    evidence_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (invitation_id, reporter_user_id),
    UNIQUE (reporter_user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_invitation_abuse_queue
    ON owner_provider_invitation_abuse_reports (status, severity, created_at);

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
            'provider_invitation_expired',
            'provider_invitation_declined',
            'provider_invitation_opted_out',
            'provider_invitation_revoked',
            'provider_invitation_abuse_reported'
        )
    );
