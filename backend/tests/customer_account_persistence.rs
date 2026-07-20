use grover_landscaping_api::{
    accounts::{
        AccountRepository, CreateCustomerAccountRequest, CreateCustomerPropertyRequest,
        CustomerAccountArchiveError, CustomerPropertyMutationError, CustomerPropertyStatusError,
        UpdateCustomerAccountRequest, UpdateCustomerPropertyIdentityRequest,
        UpdateCustomerPropertyStatusRequest,
    },
    db::JobRepository,
    property_crew_assignments::{AssignPropertyCrewRequest, PropertyCrewAssignmentRepository},
};
mod common;

#[tokio::test]
async fn customer_account_archival_is_tenant_scoped_and_audited() {
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
            relationship_type: "owner".to_string(),
            customer_name: "Account Archive Test".to_string(),
            billing_model: "per_job".to_string(),
            payment_status: "not_required".to_string(),
            service_approval_status: "approved".to_string(),
            contracted_services_per_period: 1,
            billing_notes: None,
            primary_contact_name: Some("Archive Contact".to_string()),
            contact_email: Some("archive@example.com".to_string()),
            contact_phone: None,
            email_notifications_enabled: false,
            sms_notifications_enabled: false,
            quiet_hours_start: None,
            quiet_hours_end: None,
        })
        .await
        .expect("test account should be created");
    assert_eq!(created.relationship_type, "owner");

    assert_eq!(
        accounts
            .archive(
                &created.account_id,
                &["org_outside_tenant".to_string()],
                "outside-user",
            )
            .await,
        Err(CustomerAccountArchiveError::NotFound)
    );
    accounts
        .archive(
            &created.account_id,
            &["org_demo_landscaping".to_string()],
            "archive-test-user",
        )
        .await
        .expect("tenant manager should archive an unused account");
    assert!(!accounts
        .list(&["org_demo_landscaping".to_string()])
        .await
        .iter()
        .any(|account| account.account_id == created.account_id));
    assert!(accounts
        .list_archived(&["org_demo_landscaping".to_string()])
        .await
        .iter()
        .any(|account| account.account_id == created.account_id));
    assert_eq!(
        accounts
            .reactivate(
                &created.account_id,
                &["org_outside_tenant".to_string()],
                "outside-user",
            )
            .await,
        Err(CustomerAccountArchiveError::NotFound)
    );
    let reactivated = accounts
        .reactivate(
            &created.account_id,
            &["org_demo_landscaping".to_string()],
            "reactivate-test-user",
        )
        .await
        .expect("tenant manager should reactivate an archived account");
    assert_eq!(reactivated.account_id, created.account_id);
    assert!(accounts
        .list(&["org_demo_landscaping".to_string()])
        .await
        .iter()
        .any(|account| account.account_id == created.account_id));
    let audit_kinds: Vec<String> = sqlx::query_scalar(
        "SELECT event_kind FROM access_audit_events WHERE target_id = $1 ORDER BY occurred_at",
    )
    .bind(&created.account_id)
    .fetch_all(&pool)
    .await
    .expect("account lifecycle should be audited");
    assert_eq!(audit_kinds, ["account_archived", "account_reactivated"]);

    sqlx::query("DELETE FROM access_audit_events WHERE target_id = $1")
        .bind(&created.account_id)
        .execute(&pool)
        .await
        .expect("test audit should be cleaned up");
    sqlx::query("DELETE FROM customer_accounts WHERE id = $1")
        .bind(&created.account_id)
        .execute(&pool)
        .await
        .expect("test account should be cleaned up");
}

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
    sqlx::query(
        "DELETE FROM customer_accounts WHERE customer_name IN ('Account Update Test', 'Updated Account Test')",
    )
    .execute(&pool)
    .await
    .expect("prior account test fixtures should reset");
    let accounts = AccountRepository::from_pool(pool.clone());
    let created = accounts
        .create(CreateCustomerAccountRequest {
            organization_id: "org_demo_landscaping".to_string(),
            relationship_type: "service_provider".to_string(),
            customer_name: "Account Update Test".to_string(),
            billing_model: "per_job".to_string(),
            payment_status: "pending".to_string(),
            service_approval_status: "manager_review".to_string(),
            contracted_services_per_period: 1,
            billing_notes: None,
            primary_contact_name: None,
            contact_email: None,
            contact_phone: None,
            email_notifications_enabled: false,
            sms_notifications_enabled: false,
            quiet_hours_start: None,
            quiet_hours_end: None,
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
                primary_contact_name: Some("  Pat Customer  ".to_string()),
                contact_email: Some("  PAT@EXAMPLE.COM  ".to_string()),
                contact_phone: None,
                email_notifications_enabled: true,
                sms_notifications_enabled: false,
                quiet_hours_start: Some("20:00".to_string()),
                quiet_hours_end: Some("07:00".to_string()),
            },
        )
        .await
        .expect("tenant member should update the account");
    assert!(updated.persisted);
    assert_eq!(updated.customer_name, "Updated Account Test");
    assert_eq!(updated.billing_notes, "Billing is current.");
    assert_eq!(updated.primary_contact_name, "Pat Customer");
    assert_eq!(updated.contact_email, "pat@example.com");
    assert!(updated.email_notifications_enabled);
    assert_eq!(updated.quiet_hours_start, "20:00");
    assert_eq!(updated.quiet_hours_end, "07:00");

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
                primary_contact_name: None,
                contact_email: None,
                contact_phone: None,
                email_notifications_enabled: false,
                sms_notifications_enabled: false,
                quiet_hours_start: None,
                quiet_hours_end: None,
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

    let updated_property = accounts
        .update_property_identity(
            &created.account_id,
            &property.property_id,
            &["org_demo_landscaping".to_string()],
            UpdateCustomerPropertyIdentityRequest {
                display_name: "  Courtyard Service Area  ".to_string(),
                service_address: "  789 Property Test Avenue  ".to_string(),
            },
            "property-identity-test",
        )
        .await
        .expect("tenant member should update property identity");
    assert_eq!(updated_property.display_name, "Courtyard Service Area");
    assert_eq!(updated_property.service_address, "789 Property Test Avenue");
    assert_eq!(
        accounts
            .create_property(
                &created.account_id,
                CreateCustomerPropertyRequest {
                    organization_id: "org_demo_landscaping".to_string(),
                    display_name: "courtyard service area".to_string(),
                    service_address: "789 property test avenue".to_string(),
                },
            )
            .await,
        Err(CustomerPropertyMutationError::Duplicate)
    );
    assert_eq!(
        accounts
            .update_property_identity(
                &created.account_id,
                &property.property_id,
                &["org_outside_tenant".to_string()],
                UpdateCustomerPropertyIdentityRequest {
                    display_name: "Outside edit".to_string(),
                    service_address: "999 Outside Avenue".to_string(),
                },
                "outside-tenant",
            )
            .await,
        Err(CustomerPropertyMutationError::NotFound)
    );

    assert_eq!(
        accounts
            .update_property_status(
                &created.account_id,
                &property.property_id,
                &["org_demo_landscaping".to_string()],
                UpdateCustomerPropertyStatusRequest {
                    status: "active".to_string(),
                },
                "property-activation-test",
            )
            .await,
        Err(CustomerPropertyStatusError::NotReady)
    );
    let initial_readiness = accounts
        .property_activation_readiness(
            &created.account_id,
            &property.property_id,
            &["org_demo_landscaping".to_string()],
        )
        .await
        .expect("tenant member should read activation readiness");
    assert!(!initial_readiness.profile_ready);
    assert!(!initial_readiness.crew_ready);
    assert!(!initial_readiness.ready);
    let initial_progress = accounts
        .account_onboarding_progress(&created.account_id, &["org_demo_landscaping".to_string()])
        .await
        .expect("tenant member should read account onboarding progress");
    assert!(initial_progress.customer_details_ready);
    assert_eq!(initial_progress.property_count, 1);
    assert_eq!(initial_progress.service_ready_property_count, 0);
    assert_eq!(initial_progress.active_property_count, 0);
    assert_eq!(initial_progress.properties_needing_attention.len(), 1);
    assert_eq!(
        initial_progress.properties_needing_attention[0].reasons,
        vec!["operational_profile_incomplete", "crew_unassigned"]
    );
    assert!(!initial_progress.complete);
    sqlx::query(
        r#"INSERT INTO property_onboarding_profiles (
            property_id, account_id, organization_id, service_address,
            billing_contact_name, billing_contact_email,
            notification_contact_name, notification_email, onboarding_status
        ) VALUES ($1, $2, 'org_demo_landscaping', $3, 'Billing Contact',
            'billing@example.com', 'Notification Contact',
            'notify@example.com', 'active')"#,
    )
    .bind(&property.property_id)
    .bind(&created.account_id)
    .bind(&updated_property.service_address)
    .execute(&pool)
    .await
    .expect("test onboarding profile should be created");

    let assignments = PropertyCrewAssignmentRepository::from_pool(pool.clone());
    let assignment = assignments
        .assign_crew(
            &property.property_id,
            AssignPropertyCrewRequest {
                crew_id: "crew_1001".to_string(),
                organization_id: "org_demo_landscaping".to_string(),
                assigned_at: None,
            },
            "property-lifecycle-test",
        )
        .await
        .expect("active property should accept a crew assignment");
    assert!(assignment.active);
    let ready = accounts
        .property_activation_readiness(
            &created.account_id,
            &property.property_id,
            &["org_demo_landscaping".to_string()],
        )
        .await
        .expect("tenant member should read completed activation readiness");
    assert!(ready.profile_ready);
    assert!(ready.crew_ready);
    assert!(ready.ready);
    let service_ready_progress = accounts
        .account_onboarding_progress(&created.account_id, &["org_demo_landscaping".to_string()])
        .await
        .expect("tenant member should read service-ready account progress");
    assert_eq!(service_ready_progress.service_ready_property_count, 1);
    assert_eq!(service_ready_progress.active_property_count, 0);
    assert_eq!(
        service_ready_progress.properties_needing_attention[0].reasons,
        vec!["activation_pending"]
    );
    assert!(!service_ready_progress.complete);

    let activated = accounts
        .update_property_status(
            &created.account_id,
            &property.property_id,
            &["org_demo_landscaping".to_string()],
            UpdateCustomerPropertyStatusRequest {
                status: "active".to_string(),
            },
            "property-activation-test",
        )
        .await
        .expect("ready onboarding property should activate");
    assert_eq!(activated.status, "active");
    let complete_progress = accounts
        .account_onboarding_progress(&created.account_id, &["org_demo_landscaping".to_string()])
        .await
        .expect("tenant member should read completed account progress");
    assert_eq!(complete_progress.active_property_count, 1);
    assert!(complete_progress.properties_needing_attention.is_empty());
    assert!(complete_progress.complete);

    let archived = accounts
        .update_property_status(
            &created.account_id,
            &property.property_id,
            &["org_demo_landscaping".to_string()],
            UpdateCustomerPropertyStatusRequest {
                status: "archived".to_string(),
            },
            "property-lifecycle-test",
        )
        .await
        .expect("tenant member should archive the property");
    assert_eq!(archived.status, "archived");
    let history = assignments
        .list_for_property(&property.property_id, &["org_demo_landscaping".to_string()])
        .await;
    assert_eq!(history.len(), 1);
    assert!(!history[0].active);
    assert!(history[0].ended_at.is_some());

    let reactivated = accounts
        .update_property_status(
            &created.account_id,
            &property.property_id,
            &["org_demo_landscaping".to_string()],
            UpdateCustomerPropertyStatusRequest {
                status: "onboarding".to_string(),
            },
            "property-lifecycle-test",
        )
        .await
        .expect("tenant member should reactivate the property");
    assert_eq!(reactivated.status, "onboarding");
    assert_eq!(
        accounts
            .update_property_status(
                &created.account_id,
                &property.property_id,
                &["org_outside_tenant".to_string()],
                UpdateCustomerPropertyStatusRequest {
                    status: "archived".to_string(),
                },
                "outside-tenant",
            )
            .await,
        Err(CustomerPropertyStatusError::NotFound)
    );

    sqlx::query("DELETE FROM property_onboarding_profiles WHERE property_id = $1")
        .bind(&property.property_id)
        .execute(&pool)
        .await
        .expect("test property onboarding profile should be cleaned up");
    sqlx::query("DELETE FROM property_crew_assignments WHERE property_id = $1")
        .bind(&property.property_id)
        .execute(&pool)
        .await
        .expect("test property crew assignments should be cleaned up");
    sqlx::query("DELETE FROM access_audit_events WHERE target_id = $1")
        .bind(&property.property_id)
        .execute(&pool)
        .await
        .expect("test property audit events should be cleaned up");
    sqlx::query("DELETE FROM customer_accounts WHERE id = $1")
        .bind(&created.account_id)
        .execute(&pool)
        .await
        .expect("test account should be cleaned up");
}
