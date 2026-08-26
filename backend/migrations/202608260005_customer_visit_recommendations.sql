ALTER TABLE owner_provider_service_releases
    ADD CONSTRAINT owner_provider_service_releases_recommendation_provenance_key
    UNIQUE (
        id, organization_id, customer_account_id, customer_property_id,
        service_job_id
    );

ALTER TABLE customer_service_visit_threads
    ADD CONSTRAINT customer_service_visit_threads_recommendation_provenance_key
    UNIQUE (
        customer_visit_reference, release_id, organization_id,
        customer_account_id, customer_property_id
    );

ALTER TABLE day_plan_stops
    ADD CONSTRAINT day_plan_stops_recommendation_provenance_key
    UNIQUE (id, day_plan_id, job_id);

ALTER TABLE day_plan_amendment_requests
    ADD CONSTRAINT day_plan_amendments_recommendation_provenance_key
    UNIQUE (id, day_plan_id, stop_id);

ALTER TABLE project_bids
    ADD CONSTRAINT project_bids_recommendation_provenance_key
    UNIQUE (id, day_plan_id, source_amendment_id, customer_account_id);

CREATE TABLE customer_visit_recommendation_series (
    customer_recommendation_reference TEXT PRIMARY KEY CHECK (
        customer_recommendation_reference ~ '^customer_recommendation_[0-9a-f]{32}$'
    ),
    customer_visit_reference TEXT NOT NULL,
    release_id TEXT NOT NULL,
    service_job_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    customer_account_id TEXT NOT NULL,
    customer_property_id TEXT NOT NULL,
    day_plan_id TEXT NOT NULL,
    day_plan_stop_id TEXT NOT NULL,
    source_amendment_id TEXT NOT NULL UNIQUE,
    current_version BIGINT NOT NULL DEFAULT 0 CHECK (current_version >= 0),
    lifecycle_status TEXT NOT NULL DEFAULT 'draft' CHECK (
        lifecycle_status IN (
            'draft', 'pending', 'approved', 'declined', 'revision_requested',
            'expired', 'withdrawn', 'scheduled', 'completed'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (
        customer_recommendation_reference, organization_id,
        customer_account_id, customer_property_id, service_job_id,
        day_plan_id, day_plan_stop_id, source_amendment_id
    ),
    FOREIGN KEY (
        customer_visit_reference, release_id, organization_id,
        customer_account_id, customer_property_id
    ) REFERENCES customer_service_visit_threads(
        customer_visit_reference, release_id, organization_id,
        customer_account_id, customer_property_id
    ) ON DELETE RESTRICT,
    FOREIGN KEY (
        release_id, organization_id, customer_account_id,
        customer_property_id, service_job_id
    ) REFERENCES owner_provider_service_releases(
        id, organization_id, customer_account_id,
        customer_property_id, service_job_id
    ) ON DELETE RESTRICT,
    FOREIGN KEY (day_plan_stop_id, day_plan_id, service_job_id)
        REFERENCES day_plan_stops(id, day_plan_id, job_id) ON DELETE RESTRICT,
    FOREIGN KEY (source_amendment_id, day_plan_id, day_plan_stop_id)
        REFERENCES day_plan_amendment_requests(id, day_plan_id, stop_id)
        ON DELETE RESTRICT,
    CHECK (
        (current_version = 0 AND lifecycle_status = 'draft')
        OR (current_version > 0 AND lifecycle_status <> 'draft')
    )
);

CREATE INDEX idx_customer_visit_recommendation_series_visit
    ON customer_visit_recommendation_series (
        customer_visit_reference, updated_at DESC,
        customer_recommendation_reference
    );

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

CREATE TRIGGER customer_visit_recommendation_series_guard
    BEFORE UPDATE ON customer_visit_recommendation_series
    FOR EACH ROW EXECUTE FUNCTION protect_customer_visit_recommendation_series();

CREATE TABLE customer_visit_recommendation_publications (
    id TEXT PRIMARY KEY CHECK (
        id ~ '^customer_recommendation_publication_[0-9a-f]{32}$'
    ),
    customer_recommendation_reference TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    customer_account_id TEXT NOT NULL,
    customer_property_id TEXT NOT NULL,
    service_job_id TEXT NOT NULL,
    day_plan_id TEXT NOT NULL,
    day_plan_stop_id TEXT NOT NULL,
    source_amendment_id TEXT NOT NULL,
    source_project_bid_id TEXT NOT NULL,
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    supersedes_publication_id TEXT
        REFERENCES customer_visit_recommendation_publications(id) ON DELETE RESTRICT,
    snapshot_version INTEGER NOT NULL DEFAULT 1 CHECK (snapshot_version = 1),
    customer_snapshot JSONB NOT NULL CHECK (JSONB_TYPEOF(customer_snapshot) = 'object'),
    snapshot_sha256 TEXT NOT NULL CHECK (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
    published_by_user_id TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(published_by_user_id)) > 0
    ),
    provider_idempotency_key TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(provider_idempotency_key)) BETWEEN 8 AND 128
    ),
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > published_at),
    UNIQUE (customer_recommendation_reference, proposal_version),
    UNIQUE (id, customer_recommendation_reference, proposal_version),
    UNIQUE (published_by_user_id, provider_idempotency_key),
    FOREIGN KEY (
        customer_recommendation_reference, organization_id,
        customer_account_id, customer_property_id, service_job_id,
        day_plan_id, day_plan_stop_id, source_amendment_id
    ) REFERENCES customer_visit_recommendation_series(
        customer_recommendation_reference, organization_id,
        customer_account_id, customer_property_id, service_job_id,
        day_plan_id, day_plan_stop_id, source_amendment_id
    ) ON DELETE RESTRICT,
    FOREIGN KEY (
        source_project_bid_id, day_plan_id, source_amendment_id,
        customer_account_id
    ) REFERENCES project_bids(
        id, day_plan_id, source_amendment_id, customer_account_id
    ) ON DELETE RESTRICT,
    CHECK (
        (proposal_version = 1 AND supersedes_publication_id IS NULL)
        OR (proposal_version > 1 AND supersedes_publication_id IS NOT NULL)
    )
);

CREATE INDEX idx_customer_visit_recommendation_publications_series
    ON customer_visit_recommendation_publications (
        customer_recommendation_reference, proposal_version DESC
    );

CREATE OR REPLACE FUNCTION validate_customer_visit_recommendation_publication()
RETURNS TRIGGER AS $$
DECLARE
    series_version BIGINT;
    series_status TEXT;
    prior_reference TEXT;
    prior_version BIGINT;
    exact_provider_scope BOOLEAN;
BEGIN
    SELECT current_version, lifecycle_status
      INTO series_version, series_status
      FROM customer_visit_recommendation_series
     WHERE customer_recommendation_reference = NEW.customer_recommendation_reference
     FOR UPDATE;

    IF NOT FOUND
       OR NEW.proposal_version <> series_version + 1
       OR (series_version = 0 AND series_status <> 'draft') THEN
        RAISE EXCEPTION 'recommendation publication version is not current';
    END IF;

    IF NEW.supersedes_publication_id IS NOT NULL THEN
        SELECT customer_recommendation_reference, proposal_version
          INTO prior_reference, prior_version
          FROM customer_visit_recommendation_publications
         WHERE id = NEW.supersedes_publication_id;
        IF prior_reference IS DISTINCT FROM NEW.customer_recommendation_reference
           OR prior_version IS DISTINCT FROM NEW.proposal_version - 1 THEN
            RAISE EXCEPTION 'recommendation publication supersession is not exact';
        END IF;
    END IF;

    SELECT EXISTS (
        SELECT 1
          FROM project_bids bid
          JOIN day_plans plan ON plan.id = bid.day_plan_id
          JOIN crews crew ON crew.id = plan.crew_id
         WHERE bid.id = NEW.source_project_bid_id
           AND bid.status = 'sent'
           AND crew.organization_id = NEW.organization_id
    ) INTO exact_provider_scope;
    IF NOT exact_provider_scope THEN
        RAISE EXCEPTION 'recommendation publication provider scope is invalid';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_visit_recommendation_publication_validation
    BEFORE INSERT ON customer_visit_recommendation_publications
    FOR EACH ROW EXECUTE FUNCTION validate_customer_visit_recommendation_publication();

CREATE OR REPLACE FUNCTION prevent_customer_visit_recommendation_publication_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'customer visit recommendation publications are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_visit_recommendation_publication_immutable
    BEFORE UPDATE ON customer_visit_recommendation_publications
    FOR EACH ROW EXECUTE FUNCTION prevent_customer_visit_recommendation_publication_update();

CREATE TABLE customer_visit_recommendation_decisions (
    id TEXT PRIMARY KEY CHECK (
        id ~ '^customer_recommendation_decision_[0-9a-f]{32}$'
    ),
    customer_recommendation_reference TEXT NOT NULL,
    publication_id TEXT NOT NULL UNIQUE,
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    actor_user_id TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(actor_user_id)) > 0),
    action TEXT NOT NULL CHECK (action IN ('approve', 'decline', 'request_revision')),
    reason_code TEXT CHECK (
        reason_code IS NULL OR CHAR_LENGTH(BTRIM(reason_code)) BETWEEN 1 AND 80
    ),
    customer_safe_note TEXT CHECK (
        customer_safe_note IS NULL
        OR CHAR_LENGTH(BTRIM(customer_safe_note)) BETWEEN 1 AND 2000
    ),
    affirmation_text_version TEXT CHECK (
        affirmation_text_version IS NULL
        OR CHAR_LENGTH(BTRIM(affirmation_text_version)) BETWEEN 1 AND 120
    ),
    idempotency_key TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128
    ),
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (actor_user_id, idempotency_key),
    FOREIGN KEY (
        publication_id, customer_recommendation_reference, proposal_version
    )
        REFERENCES customer_visit_recommendation_publications(
            id, customer_recommendation_reference, proposal_version
        ) ON DELETE RESTRICT,
    CHECK (
        (action = 'approve' AND affirmation_text_version IS NOT NULL)
        OR (action <> 'approve' AND affirmation_text_version IS NULL)
    ),
    CHECK (action <> 'request_revision' OR customer_safe_note IS NOT NULL)
);

CREATE OR REPLACE FUNCTION validate_customer_visit_recommendation_decision()
RETURNS TRIGGER AS $$
DECLARE
    current_series_version BIGINT;
    current_series_status TEXT;
    publication_expires_at TIMESTAMPTZ;
BEGIN
    SELECT series.current_version, series.lifecycle_status, publication.expires_at
      INTO current_series_version, current_series_status, publication_expires_at
      FROM customer_visit_recommendation_series series
      JOIN customer_visit_recommendation_publications publication
        ON publication.customer_recommendation_reference =
           series.customer_recommendation_reference
       AND publication.proposal_version = NEW.proposal_version
       AND publication.id = NEW.publication_id
     WHERE series.customer_recommendation_reference =
           NEW.customer_recommendation_reference
     FOR UPDATE OF series;

    IF NOT FOUND
       OR current_series_version <> NEW.proposal_version
       OR current_series_status <> 'pending'
       OR publication_expires_at <= NOW() THEN
        RAISE EXCEPTION 'recommendation decision version is not active';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_visit_recommendation_decision_validation
    BEFORE INSERT ON customer_visit_recommendation_decisions
    FOR EACH ROW EXECUTE FUNCTION validate_customer_visit_recommendation_decision();

CREATE OR REPLACE FUNCTION prevent_customer_visit_recommendation_record_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'customer visit recommendation records are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_visit_recommendation_decision_immutable
    BEFORE UPDATE ON customer_visit_recommendation_decisions
    FOR EACH ROW EXECUTE FUNCTION prevent_customer_visit_recommendation_record_update();

CREATE TABLE customer_visit_recommendation_messages (
    id TEXT PRIMARY KEY CHECK (
        id ~ '^customer_recommendation_message_[0-9a-f]{32}$'
    ),
    customer_recommendation_reference TEXT NOT NULL,
    publication_id TEXT NOT NULL,
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    message_version BIGINT NOT NULL CHECK (message_version > 0),
    message_kind TEXT NOT NULL CHECK (
        message_kind IN ('customer_question', 'provider_response')
    ),
    author_role TEXT NOT NULL CHECK (author_role IN ('customer', 'provider')),
    author_user_id TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(author_user_id)) > 0),
    customer_safe_body TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(customer_safe_body)) BETWEEN 1 AND 2000
    ),
    in_reply_to_message_id TEXT
        REFERENCES customer_visit_recommendation_messages(id) ON DELETE RESTRICT,
    idempotency_key TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (customer_recommendation_reference, proposal_version, message_version),
    UNIQUE (author_user_id, idempotency_key),
    FOREIGN KEY (
        publication_id, customer_recommendation_reference, proposal_version
    )
        REFERENCES customer_visit_recommendation_publications(
            id, customer_recommendation_reference, proposal_version
        ) ON DELETE RESTRICT,
    CHECK (
        (message_kind = 'customer_question'
            AND author_role = 'customer'
            AND in_reply_to_message_id IS NULL)
        OR
        (message_kind = 'provider_response'
            AND author_role = 'provider'
            AND in_reply_to_message_id IS NOT NULL)
    )
);

CREATE OR REPLACE FUNCTION validate_customer_visit_recommendation_message()
RETURNS TRIGGER AS $$
DECLARE
    current_series_version BIGINT;
    current_series_status TEXT;
    expected_message_version BIGINT;
    exact_reply BOOLEAN;
BEGIN
    SELECT current_version, lifecycle_status
      INTO current_series_version, current_series_status
      FROM customer_visit_recommendation_series
     WHERE customer_recommendation_reference =
           NEW.customer_recommendation_reference
     FOR UPDATE;

    IF NOT FOUND
       OR current_series_version <> NEW.proposal_version
       OR current_series_status <> 'pending' THEN
        RAISE EXCEPTION 'recommendation message version is not active';
    END IF;

    SELECT COALESCE(MAX(message_version), 0) + 1
      INTO expected_message_version
      FROM customer_visit_recommendation_messages
     WHERE customer_recommendation_reference =
           NEW.customer_recommendation_reference
       AND proposal_version = NEW.proposal_version;
    IF NEW.message_version <> expected_message_version THEN
        RAISE EXCEPTION 'recommendation message version must advance exactly once';
    END IF;

    IF NEW.message_kind = 'provider_response' THEN
        SELECT EXISTS (
            SELECT 1
              FROM customer_visit_recommendation_messages question
             WHERE question.id = NEW.in_reply_to_message_id
               AND question.customer_recommendation_reference =
                   NEW.customer_recommendation_reference
               AND question.publication_id = NEW.publication_id
               AND question.proposal_version = NEW.proposal_version
               AND question.message_kind = 'customer_question'
        ) INTO exact_reply;
        IF NOT exact_reply THEN
            RAISE EXCEPTION 'recommendation response must target an exact customer question';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_visit_recommendation_message_validation
    BEFORE INSERT ON customer_visit_recommendation_messages
    FOR EACH ROW EXECUTE FUNCTION validate_customer_visit_recommendation_message();

CREATE UNIQUE INDEX idx_customer_visit_recommendation_one_response
    ON customer_visit_recommendation_messages (in_reply_to_message_id)
    WHERE message_kind = 'provider_response';

CREATE INDEX idx_customer_visit_recommendation_messages_series
    ON customer_visit_recommendation_messages (
        customer_recommendation_reference, proposal_version, message_version
    );

CREATE TRIGGER customer_visit_recommendation_message_immutable
    BEFORE UPDATE ON customer_visit_recommendation_messages
    FOR EACH ROW EXECUTE FUNCTION prevent_customer_visit_recommendation_record_update();

CREATE TABLE customer_visit_recommendation_events (
    id TEXT PRIMARY KEY CHECK (
        id ~ '^customer_recommendation_event_[0-9a-f]{32}$'
    ),
    customer_recommendation_reference TEXT NOT NULL
        REFERENCES customer_visit_recommendation_series(
            customer_recommendation_reference
        ) ON DELETE RESTRICT,
    publication_id TEXT NOT NULL,
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    actor_user_id TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(actor_user_id)) > 0),
    event_kind TEXT NOT NULL CHECK (
        event_kind IN (
            'published', 'superseded', 'withdrawn', 'expired', 'approved',
            'declined', 'revision_requested', 'scheduled', 'completed'
        )
    ),
    idempotency_key TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128
    ),
    event_data JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
        JSONB_TYPEOF(event_data) = 'object'
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (actor_user_id, idempotency_key),
    FOREIGN KEY (
        publication_id, customer_recommendation_reference, proposal_version
    )
        REFERENCES customer_visit_recommendation_publications(
            id, customer_recommendation_reference, proposal_version
        ) ON DELETE RESTRICT
);

CREATE INDEX idx_customer_visit_recommendation_events_series
    ON customer_visit_recommendation_events (
        customer_recommendation_reference, proposal_version, created_at, id
    );

CREATE TRIGGER customer_visit_recommendation_event_immutable
    BEFORE UPDATE ON customer_visit_recommendation_events
    FOR EACH ROW EXECUTE FUNCTION prevent_customer_visit_recommendation_record_update();
