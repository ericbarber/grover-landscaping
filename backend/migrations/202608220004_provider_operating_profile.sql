ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS supported_service_categories TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS supported_languages TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE organizations
    DROP CONSTRAINT IF EXISTS organizations_supported_service_categories_count_check,
    DROP CONSTRAINT IF EXISTS organizations_supported_languages_count_check;

ALTER TABLE organizations
    ADD CONSTRAINT organizations_supported_service_categories_count_check
        CHECK (cardinality(supported_service_categories) <= 8),
    ADD CONSTRAINT organizations_supported_languages_count_check
        CHECK (cardinality(supported_languages) <= 5);
