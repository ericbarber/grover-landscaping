CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_properties_unique_identity
    ON customer_properties (
        organization_id,
        account_id,
        LOWER(BTRIM(display_name)),
        LOWER(BTRIM(service_address))
    );
