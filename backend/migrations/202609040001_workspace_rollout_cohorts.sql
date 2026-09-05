CREATE TABLE IF NOT EXISTS workspace_rollout_enrollments (
    id TEXT PRIMARY KEY,
    subject_user_id TEXT NOT NULL,
    persona_id TEXT NOT NULL CHECK (persona_id IN (
        'yard-owner',
        'property-manager',
        'crew-lead',
        'crew-member',
        'company-owner',
        'company-manager',
        'support'
    )),
    organization_id TEXT,
    scope_type TEXT NOT NULL CHECK (char_length(trim(scope_type)) BETWEEN 1 AND 80),
    scope_id TEXT,
    enabled_unit TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
    changed_by TEXT NOT NULL,
    change_reason TEXT NOT NULL CHECK (char_length(trim(change_reason)) BETWEEN 4 AND 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE NULLS NOT DISTINCT (
        subject_user_id,
        persona_id,
        organization_id,
        scope_type,
        scope_id
    ),
    CHECK (
        (persona_id = 'yard-owner' AND enabled_unit IN ('u1', 'u2', 'u3', 'u4'))
        OR (persona_id = 'property-manager' AND enabled_unit IN ('p1', 'p2', 'p3', 'p4'))
        OR (persona_id = 'crew-lead' AND enabled_unit IN ('c1', 'c2', 'c3', 'c4'))
        OR (persona_id = 'crew-member' AND enabled_unit IN ('cm1', 'cm2', 'cm3', 'cm4'))
        OR (persona_id = 'company-owner' AND enabled_unit IN ('o1', 'o2', 'o3', 'o4'))
        OR (persona_id = 'company-manager' AND enabled_unit IN ('m1', 'm2', 'm3', 'm4'))
        OR (persona_id = 'support' AND enabled_unit IN ('s1', 's2', 's3', 's4'))
    )
);

CREATE INDEX IF NOT EXISTS idx_workspace_rollout_enrollments_subject
    ON workspace_rollout_enrollments (subject_user_id, status, persona_id);

CREATE TABLE IF NOT EXISTS workspace_rollout_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enrollment_id TEXT NOT NULL REFERENCES workspace_rollout_enrollments(id) ON DELETE RESTRICT,
    event_kind TEXT NOT NULL CHECK (event_kind IN (
        'enabled',
        'advanced',
        'created_suspended',
        'suspended',
        'resumed'
    )),
    actor_user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    previous_unit TEXT,
    enabled_unit TEXT NOT NULL,
    previous_status TEXT,
    status TEXT NOT NULL,
    version BIGINT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_rollout_events_enrollment
    ON workspace_rollout_events (enrollment_id, occurred_at DESC, id DESC);

CREATE OR REPLACE FUNCTION workspace_rollout_unit_rank(persona TEXT, unit_id TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE
        WHEN persona = 'yard-owner' THEN array_position(ARRAY['u1', 'u2', 'u3', 'u4'], unit_id)
        WHEN persona = 'property-manager' THEN array_position(ARRAY['p1', 'p2', 'p3', 'p4'], unit_id)
        WHEN persona = 'crew-lead' THEN array_position(ARRAY['c1', 'c2', 'c3', 'c4'], unit_id)
        WHEN persona = 'crew-member' THEN array_position(ARRAY['cm1', 'cm2', 'cm3', 'cm4'], unit_id)
        WHEN persona = 'company-owner' THEN array_position(ARRAY['o1', 'o2', 'o3', 'o4'], unit_id)
        WHEN persona = 'company-manager' THEN array_position(ARRAY['m1', 'm2', 'm3', 'm4'], unit_id)
        WHEN persona = 'support' THEN array_position(ARRAY['s1', 's2', 's3', 's4'], unit_id)
        ELSE NULL
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION validate_workspace_rollout_enrollment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.id IS DISTINCT FROM OLD.id
           OR NEW.subject_user_id IS DISTINCT FROM OLD.subject_user_id
           OR NEW.persona_id IS DISTINCT FROM OLD.persona_id
           OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
           OR NEW.scope_type IS DISTINCT FROM OLD.scope_type
           OR NEW.scope_id IS DISTINCT FROM OLD.scope_id
           OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'workspace rollout enrollment identity and scope are immutable';
        END IF;

        IF NEW.version <> OLD.version + 1 THEN
            RAISE EXCEPTION 'workspace rollout enrollment updates require the next exact version';
        END IF;

        IF workspace_rollout_unit_rank(NEW.persona_id, NEW.enabled_unit)
           < workspace_rollout_unit_rank(OLD.persona_id, OLD.enabled_unit) THEN
            RAISE EXCEPTION 'workspace rollout units cannot be downgraded; suspend instead';
        END IF;

        IF NEW.enabled_unit IS NOT DISTINCT FROM OLD.enabled_unit
           AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'workspace rollout enrollment update must change unit or status';
        END IF;

        NEW.updated_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_workspace_rollout_enrollment_change_trigger
    ON workspace_rollout_enrollments;
CREATE TRIGGER validate_workspace_rollout_enrollment_change_trigger
BEFORE UPDATE ON workspace_rollout_enrollments
FOR EACH ROW EXECUTE FUNCTION validate_workspace_rollout_enrollment_change();

CREATE OR REPLACE FUNCTION record_workspace_rollout_event()
RETURNS TRIGGER AS $$
DECLARE
    next_event_kind TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        next_event_kind := CASE WHEN NEW.status = 'active' THEN 'enabled' ELSE 'created_suspended' END;
    ELSIF OLD.status = 'active' AND NEW.status = 'suspended' THEN
        next_event_kind := 'suspended';
    ELSIF OLD.status = 'suspended' AND NEW.status = 'active' THEN
        next_event_kind := 'resumed';
    ELSE
        next_event_kind := 'advanced';
    END IF;

    INSERT INTO workspace_rollout_events (
        enrollment_id,
        event_kind,
        actor_user_id,
        reason,
        previous_unit,
        enabled_unit,
        previous_status,
        status,
        version,
        occurred_at
    ) VALUES (
        NEW.id,
        next_event_kind,
        NEW.changed_by,
        NEW.change_reason,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.enabled_unit ELSE NULL END,
        NEW.enabled_unit,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
        NEW.status,
        NEW.version,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS record_workspace_rollout_event_trigger
    ON workspace_rollout_enrollments;
CREATE TRIGGER record_workspace_rollout_event_trigger
AFTER INSERT OR UPDATE ON workspace_rollout_enrollments
FOR EACH ROW EXECUTE FUNCTION record_workspace_rollout_event();

CREATE OR REPLACE FUNCTION reject_workspace_rollout_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'workspace rollout events are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reject_workspace_rollout_event_mutation_trigger
    ON workspace_rollout_events;
CREATE TRIGGER reject_workspace_rollout_event_mutation_trigger
BEFORE UPDATE OR DELETE ON workspace_rollout_events
FOR EACH ROW EXECUTE FUNCTION reject_workspace_rollout_event_mutation();
