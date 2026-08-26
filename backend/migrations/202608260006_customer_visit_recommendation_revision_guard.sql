CREATE OR REPLACE FUNCTION protect_customer_visit_recommendation_series()
RETURNS TRIGGER AS $$
BEGIN
    IF ROW(
        NEW.customer_recommendation_reference, NEW.customer_visit_reference,
        NEW.release_id, NEW.service_job_id, NEW.organization_id,
        NEW.customer_account_id, NEW.customer_property_id, NEW.day_plan_id,
        NEW.day_plan_stop_id, NEW.source_amendment_id, NEW.created_at
    ) IS DISTINCT FROM ROW(
        OLD.customer_recommendation_reference, OLD.customer_visit_reference,
        OLD.release_id, OLD.service_job_id, OLD.organization_id,
        OLD.customer_account_id, OLD.customer_property_id, OLD.day_plan_id,
        OLD.day_plan_stop_id, OLD.source_amendment_id, OLD.created_at
    ) THEN
        RAISE EXCEPTION 'customer visit recommendation identity is immutable';
    END IF;

    IF NEW.updated_at < OLD.updated_at THEN
        RAISE EXCEPTION 'customer visit recommendation time cannot move backward';
    END IF;

    IF NEW.current_version = OLD.current_version + 1 THEN
        IF NEW.lifecycle_status <> 'pending' THEN
            RAISE EXCEPTION 'a new recommendation version must become pending';
        END IF;
        IF NOT (
            (OLD.current_version = 0 AND OLD.lifecycle_status = 'draft')
            OR (OLD.current_version > 0
                AND OLD.lifecycle_status IN ('pending', 'revision_requested'))
        ) THEN
            RAISE EXCEPTION 'the prior recommendation state cannot be revised';
        END IF;
        IF OLD.current_version > 0 AND NOT EXISTS (
            SELECT 1
              FROM customer_visit_recommendation_events event
             WHERE event.customer_recommendation_reference =
                   NEW.customer_recommendation_reference
               AND event.proposal_version = OLD.current_version
               AND event.event_kind = 'superseded'
        ) THEN
            RAISE EXCEPTION 'a revised recommendation must supersede the prior version';
        END IF;
        IF NOT EXISTS (
            SELECT 1
              FROM customer_visit_recommendation_publications publication
              JOIN customer_visit_recommendation_events event
                ON event.publication_id = publication.id
               AND event.customer_recommendation_reference =
                   publication.customer_recommendation_reference
               AND event.proposal_version = publication.proposal_version
               AND event.event_kind = 'published'
             WHERE publication.customer_recommendation_reference =
                   NEW.customer_recommendation_reference
               AND publication.proposal_version = NEW.current_version
        ) THEN
            RAISE EXCEPTION 'a new recommendation version requires an immutable publication event';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.current_version <> OLD.current_version THEN
        RAISE EXCEPTION 'customer visit recommendation version must advance exactly once';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM customer_visit_recommendation_events event
         WHERE event.customer_recommendation_reference =
               NEW.customer_recommendation_reference
           AND event.proposal_version = NEW.current_version
           AND event.event_kind = NEW.lifecycle_status
    ) THEN
        RAISE EXCEPTION 'recommendation lifecycle transition requires an immutable event';
    END IF;

    IF NEW.lifecycle_status IN ('approved', 'declined', 'revision_requested')
       AND NOT EXISTS (
            SELECT 1
              FROM customer_visit_recommendation_decisions decision
             WHERE decision.customer_recommendation_reference =
                   NEW.customer_recommendation_reference
               AND decision.proposal_version = NEW.current_version
               AND decision.action = CASE NEW.lifecycle_status
                    WHEN 'approved' THEN 'approve'
                    WHEN 'declined' THEN 'decline'
                    ELSE 'request_revision'
               END
       ) THEN
        RAISE EXCEPTION 'recommendation customer transition requires an immutable decision';
    END IF;

    IF NOT (
        (OLD.lifecycle_status = 'pending'
            AND NEW.lifecycle_status IN (
                'approved', 'declined', 'revision_requested', 'expired', 'withdrawn'
            ))
        OR (OLD.lifecycle_status = 'approved' AND NEW.lifecycle_status = 'scheduled')
        OR (OLD.lifecycle_status = 'scheduled' AND NEW.lifecycle_status = 'completed')
    ) THEN
        RAISE EXCEPTION 'invalid customer visit recommendation lifecycle transition';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

