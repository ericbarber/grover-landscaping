ALTER TABLE workspace_rollout_enrollments
    ADD COLUMN IF NOT EXISTS last_mutation_id TEXT;

ALTER TABLE workspace_rollout_events
    ADD COLUMN IF NOT EXISTS mutation_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_rollout_events_actor_mutation
    ON workspace_rollout_events (actor_user_id, mutation_id)
    WHERE mutation_id IS NOT NULL;

CREATE OR REPLACE FUNCTION validate_workspace_rollout_enrollment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_mutation_id IS NOT NULL
       AND char_length(trim(NEW.last_mutation_id)) NOT BETWEEN 8 AND 120 THEN
        RAISE EXCEPTION 'workspace rollout mutation id must contain 8 to 120 characters';
    END IF;

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

        IF NEW.last_mutation_id IS NOT NULL
           AND NEW.last_mutation_id IS NOT DISTINCT FROM OLD.last_mutation_id THEN
            RAISE EXCEPTION 'workspace rollout enrollment updates require a new mutation id';
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
        mutation_id,
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
        NEW.last_mutation_id,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
