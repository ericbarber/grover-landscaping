ALTER TABLE organization_memberships
    DROP CONSTRAINT IF EXISTS organization_memberships_scope_type_check;

ALTER TABLE organization_memberships
    ADD CONSTRAINT organization_memberships_scope_type_check CHECK (
        scope_type IN (
            'organization', 'region', 'branch', 'crew', 'portfolio', 'property',
            'customer_account'
        )
    );

ALTER TABLE customer_portal_access_grants
    ADD COLUMN IF NOT EXISTS scope_type TEXT NOT NULL DEFAULT 'property',
    ADD COLUMN IF NOT EXISTS scope_id TEXT;

UPDATE customer_portal_access_grants
SET scope_id = property_id
WHERE scope_id IS NULL;

ALTER TABLE customer_portal_access_grants
    ALTER COLUMN scope_id SET NOT NULL,
    DROP CONSTRAINT IF EXISTS customer_portal_access_grants_scope_type_check,
    DROP CONSTRAINT IF EXISTS customer_portal_access_grants_scope_identity_check;

ALTER TABLE customer_portal_access_grants
    ADD CONSTRAINT customer_portal_access_grants_scope_type_check CHECK (
        scope_type IN ('customer_account', 'property')
    ),
    ADD CONSTRAINT customer_portal_access_grants_scope_identity_check CHECK (
        (scope_type = 'customer_account' AND scope_id = account_id)
        OR (scope_type = 'property' AND scope_id = property_id)
    );

UPDATE organization_memberships membership
SET scope_type = 'customer_account',
    scope_id = activation.customer_account_id,
    updated_at = NOW()
FROM owner_provider_relationship_activations activation
JOIN customer_portal_access_grants portal
  ON portal.activation_id = activation.id
WHERE membership.id = activation.owner_membership_id
  AND membership.organization_id = activation.organization_id
  AND membership.user_id = activation.owner_user_id
  AND membership.role = 'property_owner'
  AND membership.status = 'active'
  AND membership.scope_type = 'property'
  AND membership.scope_id = activation.customer_property_id
  AND portal.organization_id = activation.organization_id
  AND portal.account_id = activation.customer_account_id
  AND portal.property_id = activation.customer_property_id
  AND portal.user_id = activation.owner_user_id
  AND portal.access_role = 'property_owner'
  AND portal.status = 'active'
  AND portal.scope_type = 'property'
  AND portal.scope_id = activation.customer_property_id;

UPDATE customer_portal_access_grants portal
SET scope_type = 'customer_account',
    scope_id = activation.customer_account_id
FROM owner_provider_relationship_activations activation
JOIN organization_memberships membership
  ON membership.id = activation.owner_membership_id
WHERE portal.activation_id = activation.id
  AND portal.organization_id = activation.organization_id
  AND portal.account_id = activation.customer_account_id
  AND portal.property_id = activation.customer_property_id
  AND portal.user_id = activation.owner_user_id
  AND portal.access_role = 'property_owner'
  AND portal.status = 'active'
  AND portal.scope_type = 'property'
  AND portal.scope_id = activation.customer_property_id
  AND membership.organization_id = activation.organization_id
  AND membership.user_id = activation.owner_user_id
  AND membership.role = 'property_owner'
  AND membership.status = 'active'
  AND membership.scope_type = 'customer_account'
  AND membership.scope_id = activation.customer_account_id;

CREATE INDEX IF NOT EXISTS idx_customer_portal_access_grants_scope
    ON customer_portal_access_grants (
        user_id, status, organization_id, account_id, scope_type, scope_id
    );
