ALTER TABLE owner_provider_organization_claim_review_events
    DROP CONSTRAINT IF EXISTS owner_provider_organization_claim_review_events_actor_function_check;

ALTER TABLE owner_provider_organization_claim_review_events
    ADD CONSTRAINT owner_provider_organization_claim_review_events_actor_function_check CHECK (
        actor_function IN ('provider_operations', 'checked_recipient')
    );

ALTER TABLE owner_provider_organization_claim_review_events
    ADD COLUMN IF NOT EXISTS appeal_of_review_event_id TEXT
        REFERENCES owner_provider_organization_claim_review_events(id) ON DELETE RESTRICT;

ALTER TABLE owner_provider_organization_claim_review_events
    ADD CONSTRAINT owner_provider_organization_claim_review_events_appeal_actor_check CHECK (
        (action = 'appeal_submitted'
            AND actor_function = 'checked_recipient'
            AND appeal_of_review_event_id IS NOT NULL)
        OR
        (action = 'appeal_decided'
            AND actor_function = 'provider_operations'
            AND appeal_of_review_event_id IS NOT NULL)
        OR
        (action NOT IN ('appeal_submitted', 'appeal_decided')
            AND actor_function = 'provider_operations'
            AND appeal_of_review_event_id IS NULL)
    );

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
            'provider_invitation_expired', 'provider_invitation_declined',
            'provider_invitation_opted_out', 'provider_invitation_revoked',
            'provider_invitation_abuse_reported'
        )
    );
