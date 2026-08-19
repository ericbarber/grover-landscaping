CREATE TABLE IF NOT EXISTS owner_provider_opportunity_responses (
    id TEXT PRIMARY KEY,
    capability_id TEXT NOT NULL REFERENCES owner_provider_invitation_response_capabilities(id) ON DELETE CASCADE,
    invitation_id TEXT NOT NULL REFERENCES owner_provider_invitations(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (
        action IN ('preliminary_question', 'express_interest', 'decline', 'report')
    ),
    response_code TEXT NOT NULL,
    assigned_function TEXT,
    status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'routed')),
    idempotency_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (actor_user_id, idempotency_key),
    UNIQUE (capability_id, action),
    CHECK (
        (action = 'preliminary_question' AND response_code IN (
            'service_fit', 'coarse_area_fit', 'cadence_support', 'assessment_method'
        ) AND assigned_function IS NULL AND status = 'recorded')
        OR
        (action = 'express_interest' AND response_code = 'ready_for_owner_disclosure'
            AND assigned_function IS NULL AND status = 'recorded')
        OR
        (action = 'decline' AND response_code IN (
            'service_area_mismatch', 'capacity_unavailable',
            'service_fit_mismatch', 'not_accepting_assessments'
        ) AND assigned_function IS NULL AND status = 'recorded')
        OR
        (action = 'report' AND response_code IN (
            'suspicious_contact', 'unsafe_contact', 'wrong_recipient', 'impersonation'
        ) AND assigned_function = 'trust_and_safety' AND status = 'routed')
    )
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_opportunity_responses_invitation
    ON owner_provider_opportunity_responses (invitation_id, created_at, id);

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
            'provider_invitation_response_capability_issued',
            'provider_invitation_response_capability_reconciled',
            'provider_invitation_opportunity_response_recorded',
            'provider_invitation_expired', 'provider_invitation_declined',
            'provider_invitation_opted_out', 'provider_invitation_revoked',
            'provider_invitation_abuse_reported'
        )
    );
