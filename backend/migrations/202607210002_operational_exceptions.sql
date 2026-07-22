CREATE TABLE operational_exceptions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'delay', 'staffing', 'access', 'weather', 'equipment', 'safety', 'customer_escalation'
    )),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
    description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
    affected_resource_type TEXT CHECK (
        affected_resource_type IS NULL
        OR affected_resource_type IN ('route', 'job', 'property', 'crew', 'stop')
    ),
    affected_resource_id TEXT,
    assigned_user_id TEXT,
    reported_by_user_id TEXT NOT NULL,
    resolved_by_user_id TEXT,
    resolution_note TEXT CHECK (resolution_note IS NULL OR char_length(resolution_note) <= 2000),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ((affected_resource_type IS NULL) = (affected_resource_id IS NULL)),
    CHECK (
        (status = 'resolved' AND resolved_by_user_id IS NOT NULL AND resolved_at IS NOT NULL)
        OR (status <> 'resolved' AND resolved_by_user_id IS NULL AND resolved_at IS NULL)
    )
);

CREATE INDEX idx_operational_exceptions_manager_queue
    ON operational_exceptions (organization_id, status, priority, created_at DESC);

CREATE INDEX idx_operational_exceptions_category
    ON operational_exceptions (organization_id, category, created_at DESC);

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
            'account_archived', 'account_reactivated',
            'account_relationship_updated', 'portfolio_changed',
            'crew_assignment_changed', 'crew_profile_updated',
            'crew_hierarchy_updated', 'crew_deactivated', 'crew_reactivated',
            'property_identity_updated', 'property_archived',
            'property_reactivated', 'property_activated', 'property_status_updated',
            'route_draft_saved', 'route_published', 'route_completed',
            'route_stop_assigned', 'route_stop_removed', 'route_stops_reordered',
            'job_reassigned', 'dispatch_customer_notified', 'bid_approved',
            'bid_rejected', 'bid_converted', 'notification_retried',
            'notification_resolved', 'report_review_started',
            'report_changes_requested', 'report_resubmitted', 'report_delivered',
            'photo_processing_retried', 'photo_processing_resolved',
            'photo_erasure_deletion_retried', 'photo_erasure_deletion_resolved',
            'customer_privacy_exported', 'customer_photo_evidence_erased',
            'operational_exception_created'
        )
    );
