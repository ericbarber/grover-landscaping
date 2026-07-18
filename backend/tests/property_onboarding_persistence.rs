use grover_landscaping_api::property_onboarding::{
    PropertyOnboardingRepository, UpsertPropertyOnboardingRequest,
};
use sqlx::postgres::PgPoolOptions;

mod common;

fn request(status: &str, address: &str) -> UpsertPropertyOnboardingRequest {
    UpsertPropertyOnboardingRequest {
        account_id: "acct_1001".to_string(),
        organization_id: "org_demo_landscaping".to_string(),
        service_address: address.to_string(),
        access_notes: Some("Use the side gate before 8 AM.".to_string()),
        billing_contact_name: "Property Onboarding Customer".to_string(),
        billing_contact_email: "billing-onboarding@example.com".to_string(),
        notification_contact_name: "Property Onboarding Customer".to_string(),
        notification_email: Some("notify-onboarding@example.com".to_string()),
        notification_phone: Some("+16025550123".to_string()),
        onboarding_status: status.to_string(),
    }
}

#[tokio::test]
async fn repository_persists_updates_and_reads_property_onboarding() {
    let Some(config) = common::database_config() else {
        return;
    };

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("migrations should run");

    let property_id = "property_onboarding_test";
    let organization_id = "org_demo_landscaping";

    sqlx::query("DELETE FROM property_onboarding_profiles WHERE property_id = $1")
        .bind(property_id)
        .execute(&pool)
        .await
        .expect("test onboarding profile should reset");
    sqlx::query(
        r#"INSERT INTO customer_properties (
            id, organization_id, account_id, display_name, service_address
        ) VALUES ($1, $2, 'acct_1001', 'Onboarding Test Property', '111 New Property Lane')
        ON CONFLICT (id) DO UPDATE SET
            organization_id = EXCLUDED.organization_id,
            account_id = EXCLUDED.account_id,
            status = 'onboarding'"#,
    )
    .bind(property_id)
    .bind(organization_id)
    .execute(&pool)
    .await
    .expect("test property should exist");

    let repository = PropertyOnboardingRepository::from_pool(pool.clone());
    let created = repository
        .upsert(property_id, request("incomplete", "111 New Property Lane"))
        .await
        .expect("profile should be created");

    assert!(created.persisted);
    assert_eq!(created.onboarding_status, "incomplete");
    assert_eq!(created.service_address, "111 New Property Lane");

    let updated = repository
        .upsert(property_id, request("active", "222 Updated Property Lane"))
        .await
        .expect("profile should be updated");

    assert!(updated.persisted);
    assert_eq!(updated.onboarding_status, "active");
    assert_eq!(updated.service_address, "222 Updated Property Lane");

    let read = repository
        .get(property_id, &[organization_id.to_string()])
        .await
        .expect("profile should be read");

    assert_eq!(read.property_id, property_id);
    assert_eq!(read.service_address, "222 Updated Property Lane");
    assert_eq!(read.notification_phone.as_deref(), Some("+16025550123"));

    assert!(repository
        .get(property_id, &["org_other".to_string()])
        .await
        .is_none());

    let mismatched = repository
        .upsert(
            property_id,
            UpsertPropertyOnboardingRequest {
                account_id: "acct_1002".to_string(),
                ..request("active", "333 Mismatched Property Lane")
            },
        )
        .await;
    assert!(mismatched.is_none());

    sqlx::query("DELETE FROM customer_properties WHERE id = $1")
        .bind(property_id)
        .execute(&pool)
        .await
        .expect("test property should be cleaned up");
}
