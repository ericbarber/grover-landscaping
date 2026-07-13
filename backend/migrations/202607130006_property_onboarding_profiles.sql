CREATE TABLE IF NOT EXISTS property_onboarding_profiles (
    property_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    service_address TEXT NOT NULL,
    access_notes TEXT,
    billing_contact_name TEXT NOT NULL,
    billing_contact_email TEXT NOT NULL,
    notification_contact_name TEXT NOT NULL,
    notification_email TEXT,
    notification_phone TEXT,
    onboarding_status TEXT NOT NULL CHECK (
        onboarding_status IN ('incomplete', 'active', 'blocked', 'archived')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (property_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_property_onboarding_profiles_account
    ON property_onboarding_profiles (account_id, organization_id, onboarding_status);
