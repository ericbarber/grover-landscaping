ALTER TABLE owner_provider_invitation_delivery_attempts
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

UPDATE owner_provider_invitation_delivery_attempts
SET idempotency_key = 'initial:' || id
WHERE idempotency_key IS NULL;

ALTER TABLE owner_provider_invitation_delivery_attempts
    ALTER COLUMN idempotency_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_provider_invitation_delivery_idempotency
    ON owner_provider_invitation_delivery_attempts (invitation_id, idempotency_key);

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
            'provider_invitation_revoked'
        )
    );
