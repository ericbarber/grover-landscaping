CREATE OR REPLACE FUNCTION enforce_atomic_delivered_completion_report_snapshot()
RETURNS TRIGGER AS $$
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
       AND (
           NEW.delivered_snapshot IS DISTINCT FROM OLD.delivered_snapshot
           OR NEW.delivered_snapshot_at IS DISTINCT FROM OLD.delivered_snapshot_at
       ) THEN
        RAISE EXCEPTION 'delivered completion report snapshots are immutable';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS completion_report_snapshot_atomicity
    ON job_completion_reports;
CREATE TRIGGER completion_report_snapshot_atomicity
    BEFORE INSERT OR UPDATE ON job_completion_reports
    FOR EACH ROW EXECUTE FUNCTION enforce_atomic_delivered_completion_report_snapshot();
