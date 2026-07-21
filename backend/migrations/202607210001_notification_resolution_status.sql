ALTER TABLE notification_outbox
    DROP CONSTRAINT IF EXISTS notification_outbox_status_check;

ALTER TABLE notification_outbox
    ADD CONSTRAINT notification_outbox_status_check
    CHECK (status IN (
        'queued',
        'sending',
        'sent',
        'failed',
        'skipped',
        'dead_letter',
        'resolved'
    ));
