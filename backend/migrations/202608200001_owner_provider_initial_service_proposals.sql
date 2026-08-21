CREATE TABLE IF NOT EXISTS owner_provider_initial_service_proposals (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    property_id TEXT NOT NULL REFERENCES owner_properties(id) ON DELETE RESTRICT,
    invitation_id TEXT NOT NULL REFERENCES owner_provider_invitations(id) ON DELETE RESTRICT,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    disclosure_grant_id TEXT NOT NULL REFERENCES owner_provider_disclosure_grants(id) ON DELETE RESTRICT,
    assessment_id TEXT NOT NULL REFERENCES owner_provider_assessments(id) ON DELETE RESTRICT,
    provider_actor_user_id TEXT NOT NULL,
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    status TEXT NOT NULL CHECK (status IN ('sent', 'superseded', 'accepted', 'declined', 'expired')),
    title TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(title)) BETWEEN 1 AND 160),
    customer_summary TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(customer_summary)) BETWEEN 1 AND 2000),
    included_scope TEXT[] NOT NULL CHECK (CARDINALITY(included_scope) BETWEEN 1 AND 40),
    exclusions TEXT[] NOT NULL CHECK (CARDINALITY(exclusions) BETWEEN 1 AND 40),
    cadence_code TEXT NOT NULL CHECK (cadence_code IN ('weekly', 'every_two_weeks', 'monthly', 'one_time', 'custom')),
    cadence_detail TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(cadence_detail)) BETWEEN 1 AND 500),
    arrival_policy TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(arrival_policy)) BETWEEN 1 AND 1000),
    weather_policy TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(weather_policy)) BETWEEN 1 AND 1000),
    cancellation_policy TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(cancellation_policy)) BETWEEN 1 AND 1000),
    proof_expectation TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(proof_expectation)) BETWEEN 1 AND 1000),
    price_amount_minor BIGINT NOT NULL CHECK (price_amount_minor >= 0),
    price_basis TEXT NOT NULL CHECK (price_basis IN ('per_visit', 'monthly', 'fixed')),
    currency_code TEXT NOT NULL CHECK (currency_code ~ '^[A-Z]{3}$'),
    annualized_monthly_minor BIGINT CHECK (annualized_monthly_minor >= 0),
    revision_note TEXT CHECK (revision_note IS NULL OR CHAR_LENGTH(BTRIM(revision_note)) BETWEEN 1 AND 1000),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > issued_at),
    idempotency_key TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assessment_id, proposal_version),
    UNIQUE (provider_actor_user_id, idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_provider_proposal_one_open
    ON owner_provider_initial_service_proposals (assessment_id)
    WHERE status = 'sent';

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_provider_proposal_one_accepted
    ON owner_provider_initial_service_proposals (assessment_id)
    WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_owner_provider_proposal_owner
    ON owner_provider_initial_service_proposals (owner_user_id, property_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_owner_provider_proposal_provider
    ON owner_provider_initial_service_proposals (organization_id, provider_actor_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION prevent_owner_provider_proposal_content_update()
RETURNS TRIGGER AS $$
BEGIN
    IF ROW(
        OLD.owner_user_id, OLD.property_id, OLD.invitation_id, OLD.organization_id,
        OLD.disclosure_grant_id, OLD.assessment_id, OLD.provider_actor_user_id,
        OLD.proposal_version, OLD.title, OLD.customer_summary, OLD.included_scope,
        OLD.exclusions, OLD.cadence_code, OLD.cadence_detail, OLD.arrival_policy,
        OLD.weather_policy, OLD.cancellation_policy, OLD.proof_expectation,
        OLD.price_amount_minor, OLD.price_basis, OLD.currency_code,
        OLD.annualized_monthly_minor, OLD.revision_note, OLD.issued_at, OLD.expires_at,
        OLD.idempotency_key
    ) IS DISTINCT FROM ROW(
        NEW.owner_user_id, NEW.property_id, NEW.invitation_id, NEW.organization_id,
        NEW.disclosure_grant_id, NEW.assessment_id, NEW.provider_actor_user_id,
        NEW.proposal_version, NEW.title, NEW.customer_summary, NEW.included_scope,
        NEW.exclusions, NEW.cadence_code, NEW.cadence_detail, NEW.arrival_policy,
        NEW.weather_policy, NEW.cancellation_policy, NEW.proof_expectation,
        NEW.price_amount_minor, NEW.price_basis, NEW.currency_code,
        NEW.annualized_monthly_minor, NEW.revision_note, NEW.issued_at, NEW.expires_at,
        NEW.idempotency_key
    ) THEN
        RAISE EXCEPTION 'published owner-provider proposal content is immutable';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_provider_proposal_content_immutable
    ON owner_provider_initial_service_proposals;
CREATE TRIGGER owner_provider_proposal_content_immutable
    BEFORE UPDATE ON owner_provider_initial_service_proposals
    FOR EACH ROW EXECUTE FUNCTION prevent_owner_provider_proposal_content_update();

CREATE TABLE IF NOT EXISTS owner_provider_initial_service_proposal_decisions (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL REFERENCES owner_provider_initial_service_proposals(id) ON DELETE RESTRICT,
    owner_user_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('accept', 'decline')),
    reason_code TEXT,
    customer_safe_note TEXT CHECK (customer_safe_note IS NULL OR CHAR_LENGTH(BTRIM(customer_safe_note)) BETWEEN 1 AND 2000),
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    affirmation_text_version TEXT,
    idempotency_key TEXT NOT NULL CHECK (CHAR_LENGTH(BTRIM(idempotency_key)) BETWEEN 8 AND 128),
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_user_id, idempotency_key),
    UNIQUE (proposal_id)
);

CREATE TABLE IF NOT EXISTS owner_provider_initial_service_proposal_acceptance_snapshots (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL UNIQUE REFERENCES owner_provider_initial_service_proposals(id) ON DELETE RESTRICT,
    decision_id TEXT NOT NULL UNIQUE REFERENCES owner_provider_initial_service_proposal_decisions(id) ON DELETE RESTRICT,
    owner_user_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    assessment_id TEXT NOT NULL,
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    snapshot JSONB NOT NULL CHECK (JSONB_TYPEOF(snapshot) = 'object'),
    snapshot_sha256 TEXT NOT NULL CHECK (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS owner_provider_initial_service_proposal_events (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL REFERENCES owner_provider_initial_service_proposals(id) ON DELETE RESTRICT,
    actor_user_id TEXT NOT NULL,
    event_kind TEXT NOT NULL CHECK (event_kind IN ('sent', 'superseded', 'expired', 'accepted', 'declined')),
    proposal_version BIGINT NOT NULL CHECK (proposal_version > 0),
    idempotency_key TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (JSONB_TYPEOF(event_data) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (actor_user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_owner_provider_proposal_events
    ON owner_provider_initial_service_proposal_events (proposal_id, created_at, id);
