CREATE TABLE IF NOT EXISTS owner_provider_invitation_recipient_checks (
    id TEXT PRIMARY KEY,
    invitation_id TEXT NOT NULL UNIQUE REFERENCES owner_provider_invitations(id) ON DELETE CASCADE,
    recipient_user_id TEXT NOT NULL,
    verified_email_fingerprint TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'checked' CHECK (
        status IN ('checked', 'disputed', 'revoked')
    ),
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_invitation_recipient_checks_user
    ON owner_provider_invitation_recipient_checks (recipient_user_id, status, checked_at DESC);

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
            'provider_invitation_expired',
            'provider_invitation_declined',
            'provider_invitation_opted_out',
            'provider_invitation_revoked',
            'provider_invitation_abuse_reported'
        )
    );
