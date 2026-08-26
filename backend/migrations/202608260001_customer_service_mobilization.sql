CREATE TABLE IF NOT EXISTS owner_provider_service_releases (
    id TEXT PRIMARY KEY,
    activation_id TEXT NOT NULL UNIQUE
        REFERENCES owner_provider_relationship_activations(id) ON DELETE RESTRICT,
    first_visit_proposal_id TEXT NOT NULL UNIQUE
        REFERENCES owner_provider_first_visit_proposals(id) ON DELETE RESTRICT,
    first_visit_proposal_version BIGINT NOT NULL CHECK (first_visit_proposal_version > 0),
    initial_service_proposal_id TEXT NOT NULL
        REFERENCES owner_provider_initial_service_proposals(id) ON DELETE RESTRICT,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    customer_account_id TEXT NOT NULL REFERENCES customer_accounts(id) ON DELETE RESTRICT,
    customer_property_id TEXT NOT NULL REFERENCES customer_properties(id) ON DELETE RESTRICT,
    service_job_id TEXT NOT NULL UNIQUE REFERENCES service_jobs(id) ON DELETE RESTRICT,
    released_by_user_id TEXT NOT NULL,
    released_by_membership_id TEXT NOT NULL
        REFERENCES organization_memberships(id) ON DELETE RESTRICT,
    idempotency_key TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128
    ),
    released_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (released_by_user_id, idempotency_key),
    UNIQUE (id, organization_id, customer_account_id, customer_property_id),
    FOREIGN KEY (organization_id, customer_account_id)
        REFERENCES organization_customer_accounts(organization_id, account_id)
        ON DELETE RESTRICT,
    FOREIGN KEY (customer_property_id, organization_id, customer_account_id)
        REFERENCES customer_properties(id, organization_id, account_id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_service_releases_property
    ON owner_provider_service_releases (
        organization_id, customer_account_id, customer_property_id, released_at DESC
    );

CREATE OR REPLACE FUNCTION prevent_owner_provider_service_release_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'owner-provider service releases are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_provider_service_release_immutable
    ON owner_provider_service_releases;
CREATE TRIGGER owner_provider_service_release_immutable
    BEFORE UPDATE ON owner_provider_service_releases
    FOR EACH ROW EXECUTE FUNCTION prevent_owner_provider_service_release_update();

CREATE TABLE IF NOT EXISTS customer_service_day_events (
    id TEXT PRIMARY KEY,
    release_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    customer_account_id TEXT NOT NULL,
    customer_property_id TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    actor_membership_id TEXT NOT NULL
        REFERENCES organization_memberships(id) ON DELETE RESTRICT,
    event_version BIGINT NOT NULL CHECK (event_version > 0),
    event_kind TEXT NOT NULL CHECK (
        event_kind IN (
            'en_route', 'care_in_progress', 'weather_delay', 'rescheduled',
            'complete_proof_pending'
        )
    ),
    customer_safe_reason TEXT CHECK (
        customer_safe_reason IS NULL
        OR CHAR_LENGTH(BTRIM(customer_safe_reason)) BETWEEN 1 AND 500
    ),
    next_update_message TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(next_update_message)) BETWEEN 1 AND 500
    ),
    window_start TIMESTAMPTZ,
    window_end TIMESTAMPTZ,
    time_zone TEXT CHECK (
        time_zone IS NULL OR CHAR_LENGTH(BTRIM(time_zone)) BETWEEN 1 AND 80
    ),
    idempotency_key TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (release_id, event_version),
    UNIQUE (actor_user_id, idempotency_key),
    FOREIGN KEY (
        release_id, organization_id, customer_account_id, customer_property_id
    ) REFERENCES owner_provider_service_releases(
        id, organization_id, customer_account_id, customer_property_id
    ) ON DELETE RESTRICT,
    CHECK (
        (event_kind = 'weather_delay' AND customer_safe_reason IS NOT NULL)
        OR (event_kind <> 'weather_delay' AND customer_safe_reason IS NULL)
    ),
    CHECK (
        (
            event_kind = 'rescheduled'
            AND window_start IS NOT NULL
            AND window_end IS NOT NULL
            AND time_zone IS NOT NULL
            AND window_end > window_start
            AND window_end <= window_start + INTERVAL '4 hours'
        ) OR (
            event_kind <> 'rescheduled'
            AND window_start IS NULL
            AND window_end IS NULL
            AND time_zone IS NULL
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_customer_service_day_events_release
    ON customer_service_day_events (release_id, event_version DESC);

CREATE OR REPLACE FUNCTION prevent_customer_service_day_event_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'customer service-day events are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_service_day_event_immutable
    ON customer_service_day_events;
CREATE TRIGGER customer_service_day_event_immutable
    BEFORE UPDATE ON customer_service_day_events
    FOR EACH ROW EXECUTE FUNCTION prevent_customer_service_day_event_update();
