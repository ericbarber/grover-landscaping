ALTER TABLE owner_provider_organization_claim_review_events
    DROP CONSTRAINT IF EXISTS owner_provider_organization_claim_review_e_actor_function_check;

ALTER TABLE owner_provider_organization_claim_review_events
    DROP CONSTRAINT IF EXISTS owner_provider_organization_claim_review_events_actor_function_;

ALTER TABLE owner_provider_organization_claim_review_events
    DROP CONSTRAINT IF EXISTS owner_provider_claim_review_actor_function_check;

ALTER TABLE owner_provider_organization_claim_review_events
    ADD CONSTRAINT owner_provider_claim_review_actor_function_check CHECK (
        actor_function IN ('provider_operations', 'checked_recipient')
    );
