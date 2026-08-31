CREATE OR REPLACE FUNCTION enforce_atomic_delivered_completion_report_snapshot()
RETURNS TRIGGER AS $$
DECLARE
    expected_privacy_redaction JSONB;
BEGIN
    IF NEW.report_status = 'delivered'
       AND (
           NEW.delivered_snapshot IS NULL
           OR NEW.delivered_snapshot_at IS NULL
           OR NEW.delivered_at IS NULL
           OR NEW.share_token IS NULL
       ) THEN
        RAISE EXCEPTION 'delivered completion reports require an atomic customer snapshot';
    END IF;

    IF TG_OP = 'UPDATE'
       AND OLD.report_status = 'delivered'
       AND NEW.delivered_snapshot IS DISTINCT FROM OLD.delivered_snapshot THEN
        expected_privacy_redaction := jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        OLD.delivered_snapshot,
                                        '{photo_evidence}',
                                        '[]'::jsonb,
                                        true
                                    ),
                                    '{before_photos}',
                                    '0'::jsonb,
                                    true
                                ),
                                '{after_photos}',
                                '0'::jsonb,
                                true
                            ),
                            '{issue_photos}',
                            '0'::jsonb,
                            true
                        ),
                        '{snapshot_metadata,evidence,total_photo_evidence}',
                        '0'::jsonb,
                        true
                    ),
                    '{snapshot_metadata,evidence,before_photos}',
                    '0'::jsonb,
                    true
                ),
                '{snapshot_metadata,evidence,after_photos}',
                '0'::jsonb,
                true
            ),
            '{snapshot_metadata,evidence,issue_photos}',
            '0'::jsonb,
            true
        );

        IF NEW.delivered_snapshot IS DISTINCT FROM expected_privacy_redaction
           OR NEW.delivered_snapshot_at IS DISTINCT FROM OLD.delivered_snapshot_at THEN
            RAISE EXCEPTION 'delivered completion report snapshots are immutable';
        END IF;
    ELSIF TG_OP = 'UPDATE'
       AND OLD.report_status = 'delivered'
       AND NEW.delivered_snapshot_at IS DISTINCT FROM OLD.delivered_snapshot_at THEN
        RAISE EXCEPTION 'delivered completion report snapshots are immutable';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
