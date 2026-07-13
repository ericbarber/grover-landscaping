use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};

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

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PortfolioPropertyLinkResponse {
    pub id: String,
    pub portfolio_id: String,
    pub property_id: String,
    pub organization_id: String,
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
    ) -> Option<PropertyPortfolioResponse> {
        let request = normalize_create_portfolio_request(request);
        let id = portfolio_id(
            &request.account_id,
            &request.organization_id,
            &request.display_name,
        );

        if let Some(pool) = &self.pool {
            if let Ok(Some(portfolio)) = insert_property_portfolio(pool, &id, &request).await {
                return Some(portfolio);
            }
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
    ) -> Option<PortfolioPropertyLinkResponse> {
        let request = normalize_add_property_request(request);
        let id = portfolio_property_link_id(portfolio_id, &request.property_id);

        if let Some(pool) = &self.pool {
            if let Ok(link) =
                insert_portfolio_property_link(pool, &id, portfolio_id, &request).await
            {
                return link;
            }
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
    ) -> Vec<PropertyPortfolioResponse> {
        if organization_ids.is_empty() {
            return Vec::new();
        }

        if let Some(pool) = &self.pool {
            if let Ok(portfolios) =
                list_property_portfolios_for_account(pool, account_id, organization_ids).await
            {
                return portfolios;
            }
        }

        seed_portfolios_for_account(account_id, organization_ids)
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
) -> Result<Option<PropertyPortfolioResponse>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        INSERT INTO property_portfolios (
            id,
            account_id,
            organization_id,
            display_name,
            portfolio_type
        )
        VALUES ($1, $2, $3, $4, $5)
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
    .fetch_optional(pool)
    .await?;

    Ok(row.map(portfolio_response_from_row))
}

async fn insert_portfolio_property_link(
    pool: &PgPool,
    id: &str,
    portfolio_id: &str,
    request: &AddPropertyToPortfolioRequest,
) -> Result<Option<PortfolioPropertyLinkResponse>, sqlx::Error> {
    let inserted = sqlx::query(
        r#"
        WITH target_portfolio AS (
            SELECT id, organization_id
            FROM property_portfolios
            WHERE id = $2
              AND organization_id = $4
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
            $3,
            target_portfolio.organization_id
        FROM target_portfolio
        ON CONFLICT DO NOTHING
        RETURNING id, portfolio_id, property_id, organization_id
        "#,
    )
    .bind(id)
    .bind(portfolio_id)
    .bind(&request.property_id)
    .bind(&request.organization_id)
    .fetch_optional(pool)
    .await?;

    if let Some(row) = inserted {
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
    .fetch_optional(pool)
    .await?;

    Ok(existing.map(portfolio_property_link_response_from_row))
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

#[cfg(test)]
mod tests {
    use super::{
        is_valid_portfolio_type, portfolio_id, portfolio_property_link_id,
        seed_portfolios_for_account, storage_key, PropertyPortfolioRepository,
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
            .create_portfolio(CreatePropertyPortfolioRequest {
                account_id: " acct_1001 ".to_string(),
                organization_id: " org_demo_landscaping ".to_string(),
                display_name: " Sample Owner Homes ".to_string(),
                portfolio_type: "individual_owner".to_string(),
            })
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
}
