ALTER TABLE job_photos
    ADD COLUMN IF NOT EXISTS erased_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS erased_by_user_id TEXT,
    ADD COLUMN IF NOT EXISTS erasure_reason TEXT,
    ADD COLUMN IF NOT EXISTS erasure_original_object_key TEXT,
    ADD COLUMN IF NOT EXISTS erasure_original_thumbnail_object_key TEXT;

CREATE INDEX IF NOT EXISTS idx_job_photos_erased_at
    ON job_photos (erased_at DESC)
    WHERE erased_at IS NOT NULL;

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
