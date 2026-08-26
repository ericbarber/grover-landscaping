use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerPortalPropertyAccess {
    pub organization_id: String,
    pub account_id: String,
    pub property_id: String,
    pub property_display_name: String,
    pub property_status: String,
    pub effective_scope_type: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerPortalPropertyAccessResult {
    Loaded(Vec<CustomerPortalPropertyAccess>),
    NotAuthorized,
    InvalidAuthorization,
    Unavailable,
}

#[derive(Clone, Debug, Default)]
pub struct CustomerPortalAccessRepository {
    pool: Option<PgPool>,
}

impl CustomerPortalAccessRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn list_authorized_properties(
        &self,
        user_id: &str,
    ) -> CustomerPortalPropertyAccessResult {
        let Some(pool) = &self.pool else {
            return CustomerPortalPropertyAccessResult::Unavailable;
        };

        match list_authorized_properties(pool, user_id.trim()).await {
            Ok((active_grant_count, valid_grant_count, properties)) => {
                if active_grant_count == 0 {
                    CustomerPortalPropertyAccessResult::NotAuthorized
                } else if active_grant_count != valid_grant_count {
                    CustomerPortalPropertyAccessResult::InvalidAuthorization
                } else {
                    CustomerPortalPropertyAccessResult::Loaded(properties)
                }
            }
            Err(error) => {
                tracing::error!(%error, user_id, "customer portal authorization read failed");
                CustomerPortalPropertyAccessResult::Unavailable
            }
        }
    }
}

pub fn scope_includes_property(
    scope_type: &str,
    scope_id: &str,
    account_id: &str,
    property_id: &str,
) -> bool {
    match scope_type {
        "customer_account" => scope_id == account_id,
        "property" => scope_id == property_id,
        _ => false,
    }
}

async fn list_authorized_properties(
    pool: &PgPool,
    user_id: &str,
) -> Result<(i64, i64, Vec<CustomerPortalPropertyAccess>), sqlx::Error> {
    let rows = sqlx::query(
        r#"
        WITH active_grants AS (
            SELECT portal.*
            FROM customer_portal_access_grants portal
            WHERE portal.user_id = $1
              AND portal.status = 'active'
        ),
        valid_grants AS (
            SELECT DISTINCT portal.*
            FROM active_grants portal
            JOIN organizations organization
              ON organization.id = portal.organization_id
             AND organization.status = 'active'
            JOIN organization_customer_accounts relation
              ON relation.organization_id = portal.organization_id
             AND relation.account_id = portal.account_id
             AND relation.status = 'active'
            JOIN customer_properties provenance_property
              ON provenance_property.id = portal.property_id
             AND provenance_property.organization_id = portal.organization_id
             AND provenance_property.account_id = portal.account_id
            JOIN organization_memberships membership
              ON membership.organization_id = portal.organization_id
             AND membership.user_id = portal.user_id
             AND membership.role = portal.access_role
             AND membership.status = 'active'
             AND membership.scope_type = portal.scope_type
             AND membership.scope_id = portal.scope_id
            WHERE (
                portal.scope_type = 'customer_account'
                AND portal.scope_id = portal.account_id
            ) OR (
                portal.scope_type = 'property'
                AND portal.scope_id = portal.property_id
            )
        ),
        validation AS (
            SELECT
                (SELECT COUNT(*) FROM active_grants) AS active_grant_count,
                (SELECT COUNT(*) FROM valid_grants) AS valid_grant_count
        ),
        authorized_properties AS (
            SELECT
                property.organization_id,
                property.account_id,
                property.id AS property_id,
                property.display_name AS property_display_name,
                property.status AS property_status,
                CASE
                    WHEN BOOL_OR(grant.scope_type = 'customer_account')
                        THEN 'customer_account'
                    ELSE 'property'
                END AS effective_scope_type
            FROM valid_grants grant
            JOIN customer_properties property
              ON property.organization_id = grant.organization_id
             AND property.account_id = grant.account_id
             AND property.status <> 'archived'
             AND (
                 (grant.scope_type = 'customer_account'
                  AND grant.scope_id = property.account_id)
                 OR (grant.scope_type = 'property'
                     AND grant.scope_id = property.id)
             )
            GROUP BY
                property.organization_id,
                property.account_id,
                property.id,
                property.display_name,
                property.status
        )
        SELECT
            validation.active_grant_count,
            validation.valid_grant_count,
            property.organization_id,
            property.account_id,
            property.property_id,
            property.property_display_name,
            property.property_status,
            property.effective_scope_type
        FROM validation
        LEFT JOIN authorized_properties property ON TRUE
        ORDER BY property.property_display_name ASC, property.property_id ASC
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    let active_grant_count = rows
        .first()
        .map(|row| row.get("active_grant_count"))
        .unwrap_or(0);
    let valid_grant_count = rows
        .first()
        .map(|row| row.get("valid_grant_count"))
        .unwrap_or(0);
    let properties = rows
        .into_iter()
        .filter_map(|row| {
            let property_id = row.get::<Option<String>, _>("property_id")?;
            Some(CustomerPortalPropertyAccess {
                organization_id: row.get("organization_id"),
                account_id: row.get("account_id"),
                property_id,
                property_display_name: row.get("property_display_name"),
                property_status: row.get("property_status"),
                effective_scope_type: row.get("effective_scope_type"),
            })
        })
        .collect();

    Ok((active_grant_count, valid_grant_count, properties))
}

#[cfg(test)]
mod tests {
    use super::{
        scope_includes_property, CustomerPortalAccessRepository, CustomerPortalPropertyAccessResult,
    };

    #[tokio::test]
    async fn missing_persistence_fails_closed_as_unavailable() {
        assert_eq!(
            CustomerPortalAccessRepository::default()
                .list_authorized_properties("owner_1001")
                .await,
            CustomerPortalPropertyAccessResult::Unavailable
        );
    }

    #[test]
    fn account_scope_inherits_sibling_properties_only_in_its_account() {
        assert!(scope_includes_property(
            "customer_account",
            "account_1001",
            "account_1001",
            "property_2002",
        ));
        assert!(!scope_includes_property(
            "customer_account",
            "account_1001",
            "account_2002",
            "property_2002",
        ));
    }

    #[test]
    fn property_scope_does_not_inherit_sibling_properties() {
        assert!(scope_includes_property(
            "property",
            "property_1001",
            "account_1001",
            "property_1001",
        ));
        assert!(!scope_includes_property(
            "property",
            "property_1001",
            "account_1001",
            "property_2002",
        ));
    }

    #[test]
    fn unsupported_scope_fails_closed() {
        assert!(!scope_includes_property(
            "organization",
            "org_demo_landscaping",
            "account_1001",
            "property_1001",
        ));
    }
}
