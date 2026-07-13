use grover_landscaping_api::{
    property_portfolio_requests::{AddPropertyToPortfolioRequest, CreatePropertyPortfolioRequest},
    property_portfolios::PropertyPortfolioRepository,
};
use sqlx::postgres::PgPoolOptions;

mod common;

#[tokio::test]
async fn repository_persists_lists_and_links_property_portfolios() {
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

    let account_id = "acct_portfolio_test";
    let organization_id = "org_demo_landscaping";
    let property_id = "property_portfolio_test";
    let ungrouped_property_id = "property_portfolio_ungrouped";
    let grouped_job_id = "job_portfolio_test";
    let ungrouped_job_id = "job_portfolio_ungrouped";
    let other_account_id = "acct_other_portfolio_test";
    let other_portfolio_id = "portfolio_other_account_cross_link_test";
    let other_portfolio_link_id = "portfolio_link_other_account_cross_link_test";
    let display_name = "Portfolio Persistence Test";
    let actor_user_id = "user_property_portfolio_audit";
    let portfolio_id =
        "portfolio_acct_portfolio_test_org_demo_landscaping_portfolio_persistence_test";
    let portfolio_link_id =
        "portfolio_link_portfolio_acct_portfolio_test_org_demo_landscaping_portfolio_persistence_test_property_portfolio_test";

    sqlx::query(
        "DELETE FROM portfolio_property_links WHERE property_id = ANY($1) OR portfolio_id = ANY($2)",
    )
        .bind(vec![property_id, ungrouped_property_id])
        .bind(vec![portfolio_id, other_portfolio_id])
        .execute(&pool)
        .await
        .expect("test portfolio links should reset");
    sqlx::query("DELETE FROM access_audit_events WHERE actor_user_id = $1")
        .bind(actor_user_id)
        .execute(&pool)
        .await
        .expect("test audit rows should reset");
    sqlx::query("DELETE FROM property_portfolios WHERE id = ANY($1)")
        .bind(vec![portfolio_id, other_portfolio_id])
        .execute(&pool)
        .await
        .expect("test portfolio should reset");
    sqlx::query("DELETE FROM service_jobs WHERE id = ANY($1)")
        .bind(vec![grouped_job_id, ungrouped_job_id])
        .execute(&pool)
        .await
        .expect("test jobs should reset");
    sqlx::query("DELETE FROM customer_accounts WHERE id = ANY($1)")
        .bind(vec![account_id, other_account_id])
        .execute(&pool)
        .await
        .expect("test account should reset");

    sqlx::query(
        r#"
        INSERT INTO customer_accounts (
            id,
            customer_name,
            billing_model,
            payment_status,
            service_approval_status
        )
        VALUES ($1, 'Portfolio Persistence Customer', 'per_job', 'pending', 'approved')
        "#,
    )
    .bind(account_id)
    .execute(&pool)
    .await
    .expect("test account should be inserted");

    sqlx::query(
        r#"
        INSERT INTO customer_accounts (
            id,
            customer_name,
            billing_model,
            payment_status,
            service_approval_status
        )
        VALUES ($1, 'Other Portfolio Customer', 'per_job', 'pending', 'approved')
        "#,
    )
    .bind(other_account_id)
    .execute(&pool)
    .await
    .expect("other test account should be inserted");

    for (job_id, address) in [
        (grouped_job_id, "321 Grouped Oak Road"),
        (ungrouped_job_id, "654 Ungrouped Pine Road"),
    ] {
        sqlx::query(
            r#"
            INSERT INTO service_jobs (
                id,
                organization_id,
                customer_account_id,
                customer_name,
                property_address,
                status,
                scheduled_date,
                before_photos,
                after_photos,
                checklist_items,
                completed_checklist_items
            )
            VALUES ($1, $2, $3, 'Portfolio Persistence Customer', $4, 'scheduled', '2026-07-01', 0, 0, 4, 0)
            "#,
        )
        .bind(job_id)
        .bind(organization_id)
        .bind(account_id)
        .bind(address)
        .execute(&pool)
        .await
        .expect("test job should be inserted");
    }

    let repository = PropertyPortfolioRepository::from_pool(pool.clone());
    let portfolio = repository
        .create_portfolio(
            CreatePropertyPortfolioRequest {
                account_id: account_id.to_string(),
                organization_id: organization_id.to_string(),
                display_name: display_name.to_string(),
                portfolio_type: "individual_owner".to_string(),
            },
            actor_user_id,
        )
        .await
        .expect("portfolio should be created");

    assert_eq!(portfolio.id, portfolio_id);
    assert!(portfolio.persisted);
    assert_eq!(portfolio.property_count, 0);

    let link = repository
        .add_property(
            &portfolio.id,
            AddPropertyToPortfolioRequest {
                property_id: property_id.to_string(),
                organization_id: organization_id.to_string(),
            },
            actor_user_id,
        )
        .await
        .expect("property should be linked");

    assert_eq!(link.portfolio_id, portfolio.id);
    assert_eq!(link.property_id, property_id);
    assert!(link.persisted);

    let portfolios = repository
        .list_for_account(account_id, &[organization_id.to_string()])
        .await;

    let listed = portfolios
        .iter()
        .find(|portfolio| portfolio.id == portfolio_id)
        .expect("created portfolio should be listed");

    assert_eq!(listed.property_count, 1);
    assert!(listed.persisted);

    sqlx::query(
        r#"
        INSERT INTO property_portfolios (
            id,
            account_id,
            organization_id,
            display_name,
            portfolio_type
        )
        VALUES ($1, $2, $3, 'Other Account Portfolio', 'individual_owner')
        "#,
    )
    .bind(other_portfolio_id)
    .bind(other_account_id)
    .bind(organization_id)
    .execute(&pool)
    .await
    .expect("other account portfolio should be inserted");

    sqlx::query(
        r#"
        INSERT INTO portfolio_property_links (
            id,
            portfolio_id,
            property_id,
            organization_id
        )
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(other_portfolio_link_id)
    .bind(other_portfolio_id)
    .bind(ungrouped_property_id)
    .bind(organization_id)
    .execute(&pool)
    .await
    .expect("wrong-account property link should be inserted");

    let customer_read = repository
        .customer_portfolio_read(account_id, &[organization_id.to_string()])
        .await;

    let detail = customer_read
        .portfolios
        .iter()
        .find(|portfolio| portfolio.id == portfolio_id)
        .expect("created portfolio detail should be returned");

    assert!(customer_read.persisted);
    assert_eq!(detail.properties.len(), 1);
    assert_eq!(detail.properties[0].id, property_id);
    assert_eq!(customer_read.ungrouped_properties.len(), 1);
    assert_eq!(
        customer_read.ungrouped_properties[0].id,
        ungrouped_property_id
    );

    let audit_count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM access_audit_events
        WHERE actor_user_id = $1
          AND organization_id = $2
          AND event_kind = 'portfolio_changed'
          AND target_id = ANY($3)
        "#,
    )
    .bind(actor_user_id)
    .bind(organization_id)
    .bind(vec![portfolio_id, portfolio_link_id])
    .fetch_one(&pool)
    .await
    .expect("portfolio audit count should be available");
    assert_eq!(audit_count, 2);
}
