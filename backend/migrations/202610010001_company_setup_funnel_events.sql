ALTER TABLE marketing_conversion_events
    DROP CONSTRAINT IF EXISTS marketing_conversion_events_event_name_check;

ALTER TABLE marketing_conversion_events
    ADD CONSTRAINT marketing_conversion_events_event_name_check
    CHECK (event_name IN (
        'page_view',
        'persona_selected',
        'tour_step_selected',
        'cta_clicked',
        'form_started',
        'form_submitted',
        'form_failed',
        'setup_stage_viewed',
        'setup_stage_started',
        'setup_stage_completed',
        'setup_stage_failed',
        'setup_resumed'
    ));
