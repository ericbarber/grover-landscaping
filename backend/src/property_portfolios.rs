use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::property_portfolio_requests::{
    AddPropertyToPortfolioRequest, CreatePropertyPortfolioRequest,
};

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PropertyPortfolio {
    pub id: String,
    pub account_id: String,
    pub organization_id: String,
    pub display_name: String,
    pub portfolio_type: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PortfolioPropertyLink {
    pub id: String,
    pub portfolio_id: String,
    pub property_id: String,
    pub organization_id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PropertyPortfolioResponse {
    pub id: String,
    pub account_id: String,
    pub organization_id: String,
    pub display_name: String,
    pub portfolio_type: String,
    pub property_count: u32,
    pub persisted: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PropertyPortfolioListResult {
    Loaded(Vec<PropertyPortfolioResponse>),
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerPropertyPortfolioReadResult {
    Loaded(CustomerPropertyPortfolioReadResponse),
    Unavailable,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PortfolioPropertyLinkResponse {
    pub id: String,
    pub portfolio_id: String,
    pub property_id: String,
    pub organization_id: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerPropertyProfileResponse {
    pub id: String,
    pub account_id: String,
    pub organization_id: String,
    pub display_name: String,
    pub address: String,
    pub last_service_date: Option<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerPropertyPortfolioDetailResponse {
    pub id: String,
    pub account_id: String,
    pub organization_id: String,
    pub display_name: String,
    pub portfolio_type: String,
    pub property_count: u32,
    pub properties: Vec<CustomerPropertyProfileResponse>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerPropertyPortfolioReadResponse {
    pub account_id: String,
    pub organization_ids: Vec<String>,
    pub portfolios: Vec<CustomerPropertyPortfolioDetailResponse>,
    pub ungrouped_properties: Vec<CustomerPropertyProfileResponse>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Default)]
pub struct PropertyPortfolioRepository {
    pool: Option<PgPool>,
}

impl PropertyPortfolioRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn create_portfolio(
        &self,
        request: CreatePropertyPortfolioRequest,
        actor_user_id: &str,
    ) -> Option<PropertyPortfolioResponse> {
        let request = normalize_create_portfolio_request(request);
        let id = portfolio_id(
            &request.account_id,
            &request.organization_id,
            &request.display_name,
        );

        if let Some(pool) = &self.pool {
            return insert_property_portfolio(pool, &id, &request, actor_user_id)
                .await
                .ok()
                .flatten();
        }

        Some(PropertyPortfolioResponse {
            id,
            account_id: request.account_id,
            organization_id: request.organization_id,
            display_name: request.display_name,
            portfolio_type: request.portfolio_type,
            property_count: 0,
            persisted: false,
        })
    }

    pub async fn add_property(
        &self,
        portfolio_id: &str,
        request: AddPropertyToPortfolioRequest,
        actor_user_id: &str,
    ) -> Option<PortfolioPropertyLinkResponse> {
        let request = normalize_add_property_request(request);
        let id = portfolio_property_link_id(portfolio_id, &request.property_id);

        if let Some(pool) = &self.pool {
            return insert_portfolio_property_link(
                pool,
                &id,
                portfolio_id,
                &request,
                actor_user_id,
            )
            .await
            .ok()
            .flatten();
        }

        Some(PortfolioPropertyLinkResponse {
            id,
            portfolio_id: portfolio_id.to_string(),
            property_id: request.property_id,
            organization_id: request.organization_id,
            persisted: false,
        })
    }

    pub async fn list_for_account(
        &self,
        account_id: &str,
        organization_ids: &[String],
    ) -> PropertyPortfolioListResult {
        if organization_ids.is_empty() {
            return PropertyPortfolioListResult::Loaded(Vec::new());
        }

        if let Some(pool) = &self.pool {
            return match list_property_portfolios_for_account(pool, account_id, organization_ids)
                .await
            {
                Ok(portfolios) => PropertyPortfolioListResult::Loaded(portfolios),
                Err(error) => {
                    tracing::error!(%error, account_id, "persisted property-portfolio list failed");
                    PropertyPortfolioListResult::Unavailable
                }
            };
        }

        PropertyPortfolioListResult::Loaded(seed_portfolios_for_account(
            account_id,
            organization_ids,
        ))
    }

    pub async fn customer_portfolio_read(
        &self,
        account_id: &str,
        organization_ids: &[String],
    ) -> CustomerPropertyPortfolioReadResult {
        if organization_ids.is_empty() {
            return CustomerPropertyPortfolioReadResult::Loaded(
                CustomerPropertyPortfolioReadResponse {
                    account_id: account_id.to_string(),
                    organization_ids: Vec::new(),
                    portfolios: Vec::new(),
                    ungrouped_properties: Vec::new(),
                    persisted: false,
                },
            );
        }

        if let Some(pool) = &self.pool {
            return match customer_portfolio_read_for_account(pool, account_id, organization_ids)
                .await
            {
                Ok(read) => CustomerPropertyPortfolioReadResult::Loaded(read),
                Err(error) => {
                    tracing::error!(%error, account_id, "persisted customer portfolio read failed");
                    CustomerPropertyPortfolioReadResult::Unavailable
                }
            };
        }

        CustomerPropertyPortfolioReadResult::Loaded(seed_customer_portfolio_read(
            account_id,
            organization_ids,
        ))
    }
}

pub fn is_valid_portfolio_type(portfolio_type: &str) -> bool {
    matches!(
        portfolio_type,
        "individual_owner" | "property_management_company" | "hoa" | "commercial_client"
    )
}

fn normalize_create_portfolio_request(
    request: CreatePropertyPortfolioRequest,
) -> CreatePropertyPortfolioRequest {
    CreatePropertyPortfolioRequest {
        account_id: request.account_id.trim().to_string(),
        organization_id: request.organization_id.trim().to_string(),
        display_name: request.display_name.trim().to_string(),
        portfolio_type: request.portfolio_type.trim().to_string(),
    }
}

fn normalize_add_property_request(
    request: AddPropertyToPortfolioRequest,
) -> AddPropertyToPortfolioRequest {
    AddPropertyToPortfolioRequest {
        property_id: request.property_id.trim().to_string(),
        organization_id: request.organization_id.trim().to_string(),
    }
}

fn portfolio_id(account_id: &str, organization_id: &str, display_name: &str) -> String {
    format!(
        "portfolio_{}_{}_{}",
        storage_key(account_id),
        storage_key(organization_id),
        storage_key(display_name)
    )
}

fn portfolio_property_link_id(portfolio_id: &str, property_id: &str) -> String {
    format!(
        "portfolio_link_{}_{}",
        storage_key(portfolio_id),
        storage_key(property_id)
    )
}

fn storage_key(value: &str) -> String {
    let normalized: String = value
        .trim()
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() {
                character.to_ascii_lowercase()
            } else {
                '_'
            }
        })
        .collect();

    normalized
        .split('_')
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("_")
}

async fn insert_property_portfolio(
    pool: &PgPool,
    id: &str,
    request: &CreatePropertyPortfolioRequest,
    actor_user_id: &str,
) -> Result<Option<PropertyPortfolioResponse>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let row = sqlx::query(
        r#"
        INSERT INTO property_portfolios (
            id,
            account_id,
            organization_id,
            display_name,
            portfolio_type
        )
        SELECT $1, relation.account_id, relation.organization_id, $4, $5
        FROM organization_customer_accounts relation
        WHERE relation.account_id = $2
          AND relation.organization_id = $3
          AND relation.status = 'active'
        ON CONFLICT (account_id, organization_id, display_name) DO UPDATE SET
            portfolio_type = EXCLUDED.portfolio_type
        RETURNING
            id,
            account_id,
            organization_id,
            display_name,
            portfolio_type,
            (
                SELECT COUNT(*)::int
                FROM portfolio_property_links link
                WHERE link.portfolio_id = property_portfolios.id
                  AND link.organization_id = property_portfolios.organization_id
            ) AS property_count
        "#,
    )
    .bind(id)
    .bind(&request.account_id)
    .bind(&request.organization_id)
    .bind(&request.display_name)
    .bind(&request.portfolio_type)
    .fetch_optional(&mut *tx)
    .await?;

    if row.is_some() {
        insert_portfolio_audit_event(
            &mut tx,
            actor_user_id,
            &request.organization_id,
            "portfolio_changed",
            id,
        )
        .await?;
    }

    tx.commit().await?;
    Ok(row.map(portfolio_response_from_row))
}

async fn insert_portfolio_property_link(
    pool: &PgPool,
    id: &str,
    portfolio_id: &str,
    request: &AddPropertyToPortfolioRequest,
    actor_user_id: &str,
) -> Result<Option<PortfolioPropertyLinkResponse>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let inserted = sqlx::query(
        r#"
        WITH target_portfolio AS (
            SELECT portfolio.id, portfolio.organization_id, portfolio.account_id
            FROM property_portfolios portfolio
            WHERE portfolio.id = $2
              AND portfolio.organization_id = $4
        ),
        target_property AS (
            SELECT property.id, property.organization_id, property.account_id
            FROM customer_properties property
            WHERE property.id = $3
              AND property.organization_id = $4
              AND property.status <> 'archived'
        )
        INSERT INTO portfolio_property_links (
            id,
            portfolio_id,
            property_id,
            organization_id
        )
        SELECT
            $1,
            target_portfolio.id,
            target_property.id,
            target_portfolio.organization_id
        FROM target_portfolio
        JOIN target_property
          ON target_property.organization_id = target_portfolio.organization_id
         AND target_property.account_id = target_portfolio.account_id
        ON CONFLICT DO NOTHING
        RETURNING id, portfolio_id, property_id, organization_id
        "#,
    )
    .bind(id)
    .bind(portfolio_id)
    .bind(&request.property_id)
    .bind(&request.organization_id)
    .fetch_optional(&mut *tx)
    .await?;

    if let Some(row) = inserted {
        insert_portfolio_audit_event(
            &mut tx,
            actor_user_id,
            &request.organization_id,
            "portfolio_changed",
            id,
        )
        .await?;
        tx.commit().await?;
        return Ok(Some(portfolio_property_link_response_from_row(row)));
    }

    let existing = sqlx::query(
        r#"
        SELECT id, portfolio_id, property_id, organization_id
        FROM portfolio_property_links
        WHERE portfolio_id = $1
          AND property_id = $2
          AND organization_id = $3
        "#,
    )
    .bind(portfolio_id)
    .bind(&request.property_id)
    .bind(&request.organization_id)
    .fetch_optional(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(existing.map(portfolio_property_link_response_from_row))
}

async fn insert_portfolio_audit_event(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    actor_user_id: &str,
    organization_id: &str,
    event_kind: &str,
    target_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO access_audit_events (
            id,
            actor_user_id,
            organization_id,
            event_kind,
            target_id,
            occurred_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        "#,
    )
    .bind(format!("audit_{}_{}", event_kind, Uuid::new_v4().simple()))
    .bind(actor_user_id)
    .bind(organization_id)
    .bind(event_kind)
    .bind(target_id)
    .execute(&mut **transaction)
    .await?;

    Ok(())
}

async fn list_property_portfolios_for_account(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
) -> Result<Vec<PropertyPortfolioResponse>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            portfolio.id,
            portfolio.account_id,
            portfolio.organization_id,
            portfolio.display_name,
            portfolio.portfolio_type,
            COUNT(link.id)::int AS property_count
        FROM property_portfolios portfolio
        LEFT JOIN portfolio_property_links link
          ON link.portfolio_id = portfolio.id
         AND link.organization_id = portfolio.organization_id
        WHERE portfolio.account_id = $1
          AND portfolio.organization_id = ANY($2)
        GROUP BY
            portfolio.id,
            portfolio.account_id,
            portfolio.organization_id,
            portfolio.display_name,
            portfolio.portfolio_type
        ORDER BY portfolio.display_name ASC, portfolio.id ASC
        "#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(portfolio_response_from_row).collect())
}

fn portfolio_response_from_row(row: sqlx::postgres::PgRow) -> PropertyPortfolioResponse {
    PropertyPortfolioResponse {
        id: row.get("id"),
        account_id: row.get("account_id"),
        organization_id: row.get("organization_id"),
        display_name: row.get("display_name"),
        portfolio_type: row.get("portfolio_type"),
        property_count: row.get::<i32, _>("property_count") as u32,
        persisted: true,
    }
}

fn portfolio_property_link_response_from_row(
    row: sqlx::postgres::PgRow,
) -> PortfolioPropertyLinkResponse {
    PortfolioPropertyLinkResponse {
        id: row.get("id"),
        portfolio_id: row.get("portfolio_id"),
        property_id: row.get("property_id"),
        organization_id: row.get("organization_id"),
        persisted: true,
    }
}

async fn customer_portfolio_read_for_account(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
) -> Result<CustomerPropertyPortfolioReadResponse, sqlx::Error> {
    let portfolio_rows = sqlx::query(
        r#"
        SELECT
            portfolio.id,
            portfolio.account_id,
            portfolio.organization_id,
            portfolio.display_name,
            portfolio.portfolio_type
        FROM property_portfolios portfolio
        WHERE portfolio.account_id = $1
          AND portfolio.organization_id = ANY($2)
        ORDER BY portfolio.display_name ASC, portfolio.id ASC
        "#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;

    let property_rows = sqlx::query(
        r#"
        SELECT
            property.id AS property_id,
            property.account_id,
            property.organization_id,
            property.display_name,
            property.service_address AS property_address,
            service.last_service_date,
            linked_portfolio.id AS portfolio_id
        FROM customer_properties property
        LEFT JOIN LATERAL (
            SELECT MAX(job.scheduled_date) AS last_service_date
            FROM service_jobs job
            WHERE job.customer_account_id = property.account_id
              AND job.organization_id = property.organization_id
              AND job.property_address = property.service_address
        ) service ON TRUE
        LEFT JOIN portfolio_property_links link
          ON link.property_id = property.id
         AND link.organization_id = property.organization_id
        LEFT JOIN property_portfolios linked_portfolio
          ON linked_portfolio.id = link.portfolio_id
         AND linked_portfolio.organization_id = property.organization_id
         AND linked_portfolio.account_id = property.account_id
        WHERE property.account_id = $1
          AND property.organization_id = ANY($2)
          AND property.status <> 'archived'
        ORDER BY property.display_name ASC, property.id ASC
        "#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;

    let property_links: Vec<(CustomerPropertyProfileResponse, Option<String>)> = property_rows
        .into_iter()
        .map(|row| {
            let property_id: String = row.get("property_id");
            let property_address: String = row.get("property_address");
            (
                CustomerPropertyProfileResponse {
                    id: property_id.clone(),
                    account_id: row.get("account_id"),
                    organization_id: row.get("organization_id"),
                    display_name: row.get("display_name"),
                    address: property_address,
                    last_service_date: row.get("last_service_date"),
                    persisted: true,
                },
                row.get("portfolio_id"),
            )
        })
        .collect();

    let portfolios = portfolio_rows
        .into_iter()
        .map(|row| {
            let portfolio_id: String = row.get("id");
            let properties = property_links
                .iter()
                .filter(|(_, linked_portfolio_id)| {
                    linked_portfolio_id.as_deref() == Some(portfolio_id.as_str())
                })
                .map(|(property, _)| property.clone())
                .collect::<Vec<_>>();

            CustomerPropertyPortfolioDetailResponse {
                id: portfolio_id,
                account_id: row.get("account_id"),
                organization_id: row.get("organization_id"),
                display_name: row.get("display_name"),
                portfolio_type: row.get("portfolio_type"),
                property_count: properties.len() as u32,
                properties,
                persisted: true,
            }
        })
        .collect::<Vec<_>>();

    let ungrouped_properties = property_links
        .into_iter()
        .filter_map(|(property, linked_portfolio_id)| {
            if linked_portfolio_id.is_none() {
                Some(property)
            } else {
                None
            }
        })
        .collect();

    Ok(CustomerPropertyPortfolioReadResponse {
        account_id: account_id.to_string(),
        organization_ids: organization_ids.to_vec(),
        portfolios,
        ungrouped_properties,
        persisted: true,
    })
}

fn seed_portfolios_for_account(
    account_id: &str,
    organization_ids: &[String],
) -> Vec<PropertyPortfolioResponse> {
    if account_id != "acct_1001"
        || !organization_ids
            .iter()
            .any(|organization_id| organization_id == "org_demo_landscaping")
    {
        return Vec::new();
    }

    vec![PropertyPortfolioResponse {
        id: "portfolio_acct_1001_demo".to_string(),
        account_id: account_id.to_string(),
        organization_id: "org_demo_landscaping".to_string(),
        display_name: "Sample owner homes".to_string(),
        portfolio_type: "individual_owner".to_string(),
        property_count: 1,
        persisted: false,
    }]
}

fn seed_customer_portfolio_read(
    account_id: &str,
    organization_ids: &[String],
) -> CustomerPropertyPortfolioReadResponse {
    let organization_ids = organization_ids.to_vec();

    if !organization_ids
        .iter()
        .any(|organization_id| organization_id == "org_demo_landscaping")
    {
        return CustomerPropertyPortfolioReadResponse {
            account_id: account_id.to_string(),
            organization_ids,
            portfolios: Vec::new(),
            ungrouped_properties: Vec::new(),
            persisted: false,
        };
    }

    if account_id == "acct_1001" {
        let property = CustomerPropertyProfileResponse {
            id: "property_1001".to_string(),
            account_id: account_id.to_string(),
            organization_id: "org_demo_landscaping".to_string(),
            display_name: "123 Oak Street".to_string(),
            address: "123 Oak Street".to_string(),
            last_service_date: Some("2026-06-15".to_string()),
            persisted: false,
        };

        return CustomerPropertyPortfolioReadResponse {
            account_id: account_id.to_string(),
            organization_ids,
            portfolios: vec![CustomerPropertyPortfolioDetailResponse {
                id: "portfolio_acct_1001_demo".to_string(),
                account_id: account_id.to_string(),
                organization_id: "org_demo_landscaping".to_string(),
                display_name: "Sample owner homes".to_string(),
                portfolio_type: "individual_owner".to_string(),
                property_count: 1,
                properties: vec![property],
                persisted: false,
            }],
            ungrouped_properties: Vec::new(),
            persisted: false,
        };
    }

    if account_id == "acct_1002" {
        return CustomerPropertyPortfolioReadResponse {
            account_id: account_id.to_string(),
            organization_ids,
            portfolios: Vec::new(),
            ungrouped_properties: vec![CustomerPropertyProfileResponse {
                id: "property_1002".to_string(),
                account_id: account_id.to_string(),
                organization_id: "org_demo_landscaping".to_string(),
                display_name: "456 Maple Avenue".to_string(),
                address: "456 Maple Avenue".to_string(),
                last_service_date: Some("2026-06-15".to_string()),
                persisted: false,
            }],
            persisted: false,
        };
    }

    CustomerPropertyPortfolioReadResponse {
        account_id: account_id.to_string(),
        organization_ids,
        portfolios: Vec::new(),
        ungrouped_properties: Vec::new(),
        persisted: false,
    }
}

#[cfg(test)]
mod tests {
    use super::{
        is_valid_portfolio_type, portfolio_id, portfolio_property_link_id,
        seed_customer_portfolio_read, seed_portfolios_for_account, storage_key,
        PropertyPortfolioRepository,
    };

    use crate::property_portfolio_requests::{
        AddPropertyToPortfolioRequest, CreatePropertyPortfolioRequest,
    };

    #[test]
    fn accepts_supported_portfolio_types() {
        assert!(is_valid_portfolio_type("individual_owner"));
        assert!(is_valid_portfolio_type("property_management_company"));
        assert!(is_valid_portfolio_type("hoa"));
        assert!(is_valid_portfolio_type("commercial_client"));
    }

    #[test]
    fn rejects_unknown_portfolio_types() {
        assert!(!is_valid_portfolio_type("crew_owned"));
        assert!(!is_valid_portfolio_type("unknown"));
    }

    #[test]
    fn portfolio_ids_are_stable_and_storage_safe() {
        assert_eq!(storage_key(" Sample Owner Homes "), "sample_owner_homes");
        assert_eq!(
            portfolio_id("acct_1001", "org_demo_landscaping", "Sample Owner Homes"),
            "portfolio_acct_1001_org_demo_landscaping_sample_owner_homes"
        );
        assert_eq!(
            portfolio_property_link_id("portfolio_1001", "property 1001"),
            "portfolio_link_portfolio_1001_property_1001"
        );
    }

    #[tokio::test]
    async fn repository_returns_local_portfolio_when_database_is_unavailable() {
        let repository = PropertyPortfolioRepository::default();

        let response = repository
            .create_portfolio(
                CreatePropertyPortfolioRequest {
                    account_id: " acct_1001 ".to_string(),
                    organization_id: " org_demo_landscaping ".to_string(),
                    display_name: " Sample Owner Homes ".to_string(),
                    portfolio_type: "individual_owner".to_string(),
                },
                "actor_1001",
            )
            .await
            .expect("local portfolio response should be returned");

        assert_eq!(
            response.id,
            "portfolio_acct_1001_org_demo_landscaping_sample_owner_homes"
        );
        assert_eq!(response.account_id, "acct_1001");
        assert!(!response.persisted);
    }

    #[tokio::test]
    async fn repository_returns_local_property_link_when_database_is_unavailable() {
        let repository = PropertyPortfolioRepository::default();

        let response = repository
            .add_property(
                "portfolio_1001",
                AddPropertyToPortfolioRequest {
                    property_id: " property_1001 ".to_string(),
                    organization_id: " org_demo_landscaping ".to_string(),
                },
                "actor_1001",
            )
            .await
            .expect("local link response should be returned");

        assert_eq!(response.portfolio_id, "portfolio_1001");
        assert_eq!(response.property_id, "property_1001");
        assert!(!response.persisted);
    }

    #[test]
    fn seed_portfolios_are_scoped_to_account_and_organization() {
        assert_eq!(
            seed_portfolios_for_account("acct_1001", &["org_demo_landscaping".to_string()]).len(),
            1
        );
        assert!(seed_portfolios_for_account("acct_1001", &["org_other".to_string()]).is_empty());
    }

    #[test]
    fn seed_customer_read_includes_grouped_and_ungrouped_properties() {
        let grouped =
            seed_customer_portfolio_read("acct_1001", &["org_demo_landscaping".to_string()]);
        assert_eq!(grouped.portfolios.len(), 1);
        assert_eq!(grouped.portfolios[0].properties[0].id, "property_1001");
        assert!(grouped.ungrouped_properties.is_empty());

        let ungrouped =
            seed_customer_portfolio_read("acct_1002", &["org_demo_landscaping".to_string()]);
        assert!(ungrouped.portfolios.is_empty());
        assert_eq!(ungrouped.ungrouped_properties[0].id, "property_1002");
    }

    #[tokio::test]
    async fn repository_returns_local_customer_read_when_database_is_unavailable() {
        let repository = PropertyPortfolioRepository::default();

        let response = repository
            .customer_portfolio_read("acct_1001", &["org_demo_landscaping".to_string()])
            .await;

        assert_eq!(response.account_id, "acct_1001");
        assert_eq!(response.portfolios[0].property_count, 1);
        assert!(!response.persisted);
    }
}
