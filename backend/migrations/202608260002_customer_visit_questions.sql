CREATE TABLE IF NOT EXISTS customer_service_visit_threads (
    customer_visit_reference TEXT PRIMARY KEY CHECK (
        customer_visit_reference ~ '^customer_visit_[0-9a-f]{32}$'
    ),
    release_id TEXT NOT NULL UNIQUE,
    organization_id TEXT NOT NULL,
    customer_account_id TEXT NOT NULL,
    customer_property_id TEXT NOT NULL,
    current_version BIGINT NOT NULL DEFAULT 0 CHECK (current_version >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (
        customer_visit_reference, organization_id,
        customer_account_id, customer_property_id
    ),
    FOREIGN KEY (
        release_id, organization_id, customer_account_id, customer_property_id
    ) REFERENCES owner_provider_service_releases(
        id, organization_id, customer_account_id, customer_property_id
    ) ON DELETE RESTRICT
);

INSERT INTO customer_service_visit_threads (
    customer_visit_reference, release_id, organization_id,
    customer_account_id, customer_property_id
)
SELECT
    'customer_visit_' || REPLACE(gen_random_uuid()::TEXT, '-', ''),
    release.id,
    release.organization_id,
    release.customer_account_id,
    release.customer_property_id
FROM owner_provider_service_releases release
ON CONFLICT (release_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_customer_service_visit_threads_provider_queue
    ON customer_service_visit_threads (
        organization_id, updated_at DESC, customer_visit_reference
    );

CREATE OR REPLACE FUNCTION protect_customer_service_visit_thread()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_visit_reference IS DISTINCT FROM OLD.customer_visit_reference
       OR NEW.release_id IS DISTINCT FROM OLD.release_id
       OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.customer_account_id IS DISTINCT FROM OLD.customer_account_id
       OR NEW.customer_property_id IS DISTINCT FROM OLD.customer_property_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'customer service visit thread identity is immutable';
    END IF;
    IF NEW.current_version <> OLD.current_version + 1
       OR NEW.updated_at < OLD.updated_at THEN
        RAISE EXCEPTION 'customer service visit thread version must advance exactly once';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_service_visit_thread_guard
    ON customer_service_visit_threads;
CREATE TRIGGER customer_service_visit_thread_guard
    BEFORE UPDATE ON customer_service_visit_threads
    FOR EACH ROW EXECUTE FUNCTION protect_customer_service_visit_thread();

CREATE TABLE IF NOT EXISTS customer_service_visit_messages (
    id TEXT PRIMARY KEY,
    customer_visit_reference TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    customer_account_id TEXT NOT NULL,
    customer_property_id TEXT NOT NULL,
    message_version BIGINT NOT NULL CHECK (message_version > 0),
    message_kind TEXT NOT NULL CHECK (
        message_kind IN ('customer_question', 'provider_response')
    ),
    author_role TEXT NOT NULL CHECK (author_role IN ('customer', 'provider')),
    author_user_id TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(author_user_id)) > 0),
    topic TEXT NOT NULL CHECK (
        topic IN ('timing', 'preparation', 'access', 'service_scope', 'other')
    ),
    customer_safe_body TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(customer_safe_body)) BETWEEN 1 AND 2000
    ),
    in_reply_to_message_id TEXT
        REFERENCES customer_service_visit_messages(id) ON DELETE RESTRICT,
    idempotency_key TEXT NOT NULL CHECK (
        CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (customer_visit_reference, message_version),
    UNIQUE (author_user_id, idempotency_key),
    FOREIGN KEY (
        customer_visit_reference, organization_id,
        customer_account_id, customer_property_id
    ) REFERENCES customer_service_visit_threads(
        customer_visit_reference, organization_id,
        customer_account_id, customer_property_id
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_service_visit_one_response
    ON customer_service_visit_messages (in_reply_to_message_id)
    WHERE message_kind = 'provider_response';

CREATE INDEX IF NOT EXISTS idx_customer_service_visit_messages_thread
    ON customer_service_visit_messages (
        customer_visit_reference, message_version ASC
    );

CREATE OR REPLACE FUNCTION prevent_customer_service_visit_message_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'customer service visit messages are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_service_visit_message_immutable
    ON customer_service_visit_messages;
CREATE TRIGGER customer_service_visit_message_immutable
    BEFORE UPDATE ON customer_service_visit_messages
    FOR EACH ROW EXECUTE FUNCTION prevent_customer_service_visit_message_update();
