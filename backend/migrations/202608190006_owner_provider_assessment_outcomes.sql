ALTER TABLE owner_provider_assessments
    ADD COLUMN IF NOT EXISTS outcome_reason_code TEXT,
    ADD COLUMN IF NOT EXISTS owner_visible_summary TEXT;

ALTER TABLE owner_provider_assessments
    DROP CONSTRAINT IF EXISTS owner_provider_assessments_outcome_check;

ALTER TABLE owner_provider_assessments
    ADD CONSTRAINT owner_provider_assessments_outcome_check CHECK (
        (
            status = 'completed'
            AND outcome_reason_code IS NULL
            AND CHAR_LENGTH(BTRIM(owner_visible_summary)) BETWEEN 1 AND 2000
        )
        OR
        (
            status = 'cannot_assess'
            AND outcome_reason_code IN (
                'insufficient_information', 'on_site_required', 'safety_concern',
                'outside_service_scope', 'qualified_specialist_required'
            )
            AND CHAR_LENGTH(BTRIM(owner_visible_summary)) BETWEEN 1 AND 2000
        )
        OR
        (
            status = 'cancelled'
            AND outcome_reason_code IN (
                'provider_unavailable', 'safety_concern', 'access_unavailable',
                'assessment_no_longer_needed'
            )
            AND CHAR_LENGTH(BTRIM(owner_visible_summary)) BETWEEN 1 AND 2000
        )
        OR
        (
            status NOT IN ('completed', 'cannot_assess', 'cancelled')
            AND outcome_reason_code IS NULL
            AND owner_visible_summary IS NULL
        )
    );
