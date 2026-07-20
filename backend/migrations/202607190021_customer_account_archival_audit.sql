ALTER TABLE access_audit_events
    DROP CONSTRAINT IF EXISTS access_audit_events_event_kind_check;

ALTER TABLE access_audit_events
    ADD CONSTRAINT access_audit_events_event_kind_check
    CHECK (
        event_kind IN (
            'login', 'organization_bootstrapped', 'organization_profile_updated',
            'branch_created', 'branch_status_updated', 'territory_created',
            'territory_status_updated', 'invite_accepted', 'invitation_revoked',
            'invitation_reissued', 'role_changed', 'membership_profile_updated',
            'membership_suspended', 'membership_reactivated', 'account_viewed',
            'account_archived', 'portfolio_changed', 'crew_assignment_changed',
            'crew_profile_updated', 'crew_hierarchy_updated', 'crew_deactivated',
            'crew_reactivated', 'property_identity_updated', 'property_archived',
            'property_reactivated', 'property_activated', 'property_status_updated',
            'route_draft_saved', 'route_published', 'route_completed',
            'route_stop_assigned', 'route_stop_removed', 'route_stops_reordered',
            'job_reassigned', 'dispatch_customer_notified', 'bid_approved',
            'bid_rejected', 'bid_converted', 'notification_retried',
            'notification_resolved', 'report_review_started',
            'report_changes_requested', 'report_resubmitted', 'report_delivered',
            'photo_processing_retried', 'photo_processing_resolved',
            'customer_privacy_exported', 'customer_photo_evidence_erased'
        )
    );
