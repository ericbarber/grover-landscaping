ALTER TABLE owner_provider_assessments
    DROP CONSTRAINT IF EXISTS owner_provider_assessments_status_check;

ALTER TABLE owner_provider_assessments
    ADD CONSTRAINT owner_provider_assessments_status_check CHECK (
        status IN (
            'remote_review', 'window_proposed', 'window_change_requested',
            'owner_confirmed', 'in_progress', 'completed', 'cannot_assess', 'cancelled'
        )
    );

ALTER TABLE owner_provider_assessment_events
    DROP CONSTRAINT IF EXISTS owner_provider_assessment_events_event_kind_check;

ALTER TABLE owner_provider_assessment_events
    ADD CONSTRAINT owner_provider_assessment_events_event_kind_check CHECK (
        event_kind IN (
            'started', 'window_proposed', 'window_confirmed', 'window_change_requested',
            'began', 'completed', 'cannot_assess', 'cancelled',
            'customer_message_added', 'private_note_added'
        )
    );
