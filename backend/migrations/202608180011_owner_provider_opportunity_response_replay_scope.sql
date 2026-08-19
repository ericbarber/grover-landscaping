ALTER TABLE owner_provider_opportunity_responses
    ADD COLUMN IF NOT EXISTS expected_capability_version BIGINT;

UPDATE owner_provider_opportunity_responses response
SET expected_capability_version = capability.version
FROM owner_provider_invitation_response_capabilities capability
WHERE capability.id = response.capability_id
  AND response.expected_capability_version IS NULL;

ALTER TABLE owner_provider_opportunity_responses
    ALTER COLUMN expected_capability_version SET NOT NULL;

ALTER TABLE owner_provider_opportunity_responses
    DROP CONSTRAINT IF EXISTS owner_provider_opportunity_responses_expected_capability_version_check;

ALTER TABLE owner_provider_opportunity_responses
    ADD CONSTRAINT owner_provider_opportunity_responses_expected_capability_version_check
    CHECK (expected_capability_version > 0);
