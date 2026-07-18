ALTER TABLE access_audit_events
    DROP CONSTRAINT IF EXISTS access_audit_events_event_kind_check;

ALTER TABLE access_audit_events
    ADD CONSTRAINT access_audit_events_event_kind_check
    CHECK (
        event_kind IN (
            'login',
            'organization_bootstrapped',
            'organization_profile_updated',
            'invite_accepted',
            'invitation_revoked',
            'invitation_reissued',
            'role_changed',
            'membership_suspended',
            'membership_reactivated',
            'account_viewed',
            'portfolio_changed',
            'crew_assignment_changed',
            'bid_approved',
            'bid_rejected',
            'bid_converted',
            'notification_retried',
            'notification_resolved',
            'report_review_started',
            'report_changes_requested',
            'report_resubmitted',
            'report_delivered',
            'photo_processing_retried',
            'photo_processing_resolved',
            'customer_privacy_exported',
            'customer_photo_evidence_erased'
        )
    );
