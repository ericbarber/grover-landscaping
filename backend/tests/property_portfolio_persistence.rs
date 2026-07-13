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
    let display_name = "Portfolio Persistence Test";
    let portfolio_id =
        "portfolio_acct_portfolio_test_org_demo_landscaping_portfolio_persistence_test";

    sqlx::query("DELETE FROM portfolio_property_links WHERE property_id = $1 OR portfolio_id = $2")
        .bind(property_id)
        .bind(portfolio_id)
        .execute(&pool)
        .await
        .expect("test portfolio links should reset");
    sqlx::query("DELETE FROM property_portfolios WHERE id = $1")
        .bind(portfolio_id)
        .execute(&pool)
        .await
        .expect("test portfolio should reset");

    let repository = PropertyPortfolioRepository::from_pool(pool.clone());
    let portfolio = repository
        .create_portfolio(CreatePropertyPortfolioRequest {
            account_id: account_id.to_string(),
            organization_id: organization_id.to_string(),
            display_name: display_name.to_string(),
            portfolio_type: "individual_owner".to_string(),
        })
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
}
