CREATE TABLE IF NOT EXISTS owner_provider_invitations (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES owner_workspaces(owner_user_id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
    brief_id TEXT NOT NULL REFERENCES owner_yard_briefs(id) ON DELETE RESTRICT,
    brief_version BIGINT NOT NULL CHECK (brief_version > 0),
    provider_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_email_fingerprint TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    idempotency_key TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'yard_assessment' CHECK (purpose = 'yard_assessment'),
    owner_name_snapshot TEXT NOT NULL,
    coarse_area_snapshot TEXT NOT NULL,
    care_goals_snapshot TEXT[] NOT NULL,
    cadence_snapshot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_delivery' CHECK (
        status IN (
            'pending_delivery',
            'delivered',
            'opened',
            'failed',
            'expired',
            'declined',
            'opted_out',
            'revoked'
        )
    ),
    expires_at TIMESTAMPTZ NOT NULL,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    terminal_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_user_id, idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_provider_invitations_live_recipient
    ON owner_provider_invitations (property_id, recipient_email_fingerprint)
    WHERE status IN ('pending_delivery', 'delivered', 'opened');

CREATE INDEX IF NOT EXISTS idx_owner_provider_invitations_owner
    ON owner_provider_invitations (owner_user_id, property_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_owner_provider_invitations_expiry
    ON owner_provider_invitations (expires_at)
    WHERE status IN ('pending_delivery', 'delivered', 'opened');

CREATE TABLE IF NOT EXISTS owner_provider_invitation_delivery_attempts (
    id TEXT PRIMARY KEY,
    invitation_id TEXT NOT NULL REFERENCES owner_provider_invitations(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'delivered', 'failed', 'suppressed')
    ),
    provider_message_id TEXT,
    failure_code TEXT,
    attempted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (invitation_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_invitation_delivery_attempts_pending
    ON owner_provider_invitation_delivery_attempts (status, created_at)
    WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS owner_provider_recipient_suppressions (
    recipient_email_fingerprint TEXT PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('recipient_opt_out', 'abuse_block', 'hard_bounce')),
    source_invitation_id TEXT REFERENCES owner_provider_invitations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
            'provider_invitation_delivered',
            'provider_invitation_failed',
            'provider_invitation_opened',
            'provider_invitation_expired',
            'provider_invitation_declined',
            'provider_invitation_opted_out',
            'provider_invitation_revoked'
        )
    );
