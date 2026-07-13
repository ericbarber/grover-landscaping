ALTER TABLE access_audit_events
    DROP CONSTRAINT IF EXISTS access_audit_events_event_kind_check;

ALTER TABLE access_audit_events
    ADD CONSTRAINT access_audit_events_event_kind_check
    CHECK (
        event_kind IN (
            'login',
            'invite_accepted',
            'role_changed',
            'account_viewed',
            'portfolio_changed',
            'crew_assignment_changed',
            'bid_approved',
            'bid_rejected',
            'bid_converted',
            'notification_retried',
            'notification_resolved',
            'report_delivered'
        )
    );
