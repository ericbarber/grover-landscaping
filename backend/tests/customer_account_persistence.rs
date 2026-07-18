use grover_landscaping_api::{
    accounts::{AccountRepository, CreateCustomerAccountRequest, UpdateCustomerAccountRequest},
    db::JobRepository,
};
mod common;

#[tokio::test]
async fn customer_account_updates_are_persisted_and_tenant_scoped() {
    let Some(config) = common::database_config() else {
        return;
    };
    let jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let pool = jobs
        .pool()
        .expect("connected repository should expose its pool");
    let accounts = AccountRepository::from_pool(pool.clone());
    let created = accounts
        .create(CreateCustomerAccountRequest {
            organization_id: "org_demo_landscaping".to_string(),
            customer_name: "Account Update Test".to_string(),
            billing_model: "per_job".to_string(),
            payment_status: "pending".to_string(),
            service_approval_status: "manager_review".to_string(),
            contracted_services_per_period: 1,
            billing_notes: None,
        })
        .await
        .expect("test account should be created");

    let updated = accounts
        .update(
            &created.account_id,
            &["org_demo_landscaping".to_string()],
            UpdateCustomerAccountRequest {
                customer_name: "Updated Account Test".to_string(),
                billing_model: "monthly_plan".to_string(),
                payment_status: "paid".to_string(),
                service_approval_status: "approved".to_string(),
                contracted_services_per_period: 4,
                billing_notes: Some("  Billing is current.  ".to_string()),
            },
        )
        .await
        .expect("tenant member should update the account");
    assert!(updated.persisted);
    assert_eq!(updated.customer_name, "Updated Account Test");
    assert_eq!(updated.billing_notes, "Billing is current.");

    assert!(accounts
        .update(
            &created.account_id,
            &["org_outside_tenant".to_string()],
            UpdateCustomerAccountRequest {
                customer_name: "Cross Tenant Change".to_string(),
                billing_model: "per_job".to_string(),
                payment_status: "pending".to_string(),
                service_approval_status: "blocked".to_string(),
                contracted_services_per_period: 0,
                billing_notes: None,
            },
        )
        .await
        .is_none());

    let property = accounts
        .create_property(
            &created.account_id,
            grover_landscaping_api::accounts::CreateCustomerPropertyRequest {
                organization_id: "org_demo_landscaping".to_string(),
                display_name: "Account Test Property".to_string(),
                service_address: "789 Property Test Avenue".to_string(),
            },
        )
        .await
        .expect("tenant member should create a property");
    assert!(property.persisted);
    assert_eq!(property.account_id, created.account_id);

    let properties = accounts
        .list_properties(&created.account_id, &["org_demo_landscaping".to_string()])
        .await;
    assert_eq!(properties.len(), 1);
    assert_eq!(properties[0].property_id, property.property_id);
    assert!(accounts
        .list_properties(&created.account_id, &["org_outside_tenant".to_string()])
        .await
        .is_empty());

    sqlx::query("DELETE FROM customer_accounts WHERE id = $1")
        .bind(&created.account_id)
        .execute(&pool)
        .await
        .expect("test account should be cleaned up");
}
