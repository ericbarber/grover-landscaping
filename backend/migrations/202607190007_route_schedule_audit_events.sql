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
            'crew_profile_updated',
            'crew_deactivated',
            'crew_reactivated',
            'property_identity_updated',
            'property_archived',
            'property_reactivated',
            'property_activated',
            'property_status_updated',
            'route_draft_saved',
            'route_published',
            'route_completed',
            'route_stop_assigned',
            'route_stop_removed',
            'route_stops_reordered',
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

INSERT INTO access_audit_events (
    id, actor_user_id, organization_id, event_kind, target_id, occurred_at
)
SELECT
    'audit_route_state_' || md5(plan.id),
    'system',
    crew.organization_id,
    CASE
        WHEN plan.status = 'published' THEN 'route_published'
        WHEN plan.status = 'completed' THEN 'route_completed'
        ELSE 'route_draft_saved'
    END,
    plan.id,
    CASE WHEN plan.status = 'draft' THEN plan.created_at ELSE plan.updated_at END
FROM day_plans plan
JOIN crews crew ON crew.id = plan.crew_id
ON CONFLICT (id) DO NOTHING;
