use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{PgPool, Postgres, Row, Transaction};
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerRecommendationLineItem {
    pub service_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub service_description: Option<String>,
    pub quantity: u32,
    pub unit_price_cents: u32,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerRecommendationPublication {
    pub proposal_version: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub customer_safe_reason: Option<String>,
    pub currency_code: String,
    pub line_items: Vec<CustomerRecommendationLineItem>,
    pub total_cents: u64,
    pub published_at_epoch_seconds: i64,
    pub expires_at_epoch_seconds: i64,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct CustomerRecommendationSummary {
    pub customer_recommendation_reference: String,
    pub current_version: u64,
    pub lifecycle_status: String,
    pub current_publication: CustomerRecommendationPublication,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct CustomerRecommendationCollection {
    pub customer_visit_reference: String,
    pub recommendations: Vec<CustomerRecommendationSummary>,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct CustomerRecommendationDetail {
    pub customer_visit_reference: String,
    pub customer_recommendation_reference: String,
    pub current_version: u64,
    pub lifecycle_status: String,
    pub versions: Vec<CustomerRecommendationPublication>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerRecommendationListResult {
    Loaded(CustomerRecommendationCollection),
    NotAuthorized,
    InvalidAuthorization,
    NotFound,
    InvalidSnapshot,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerRecommendationDetailResult {
    Loaded(CustomerRecommendationDetail),
    NotAuthorized,
    InvalidAuthorization,
    NotFound,
    InvalidSnapshot,
    Unavailable,
}

#[derive(Clone, Debug, Default)]
pub struct CustomerVisitRecommendationRepository {
    pool: Option<PgPool>,
}

impl CustomerVisitRecommendationRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn list_for_visit(
        &self,
        actor_user_id: &str,
        customer_visit_reference: &str,
    ) -> CustomerRecommendationListResult {
        let Some(pool) = &self.pool else {
            return CustomerRecommendationListResult::Unavailable;
        };
        match load_for_visit(pool, actor_user_id.trim(), customer_visit_reference.trim()).await {
            Ok(result) => result,
            Err(error) => {
                tracing::error!(%error, actor_user_id, customer_visit_reference, "customer recommendation list failed");
                CustomerRecommendationListResult::Unavailable
            }
        }
    }

    pub async fn get_for_visit(
        &self,
        actor_user_id: &str,
        customer_visit_reference: &str,
        customer_recommendation_reference: &str,
    ) -> CustomerRecommendationDetailResult {
        let Some(pool) = &self.pool else {
            return CustomerRecommendationDetailResult::Unavailable;
        };
        match load_detail(
            pool,
            actor_user_id.trim(),
            customer_visit_reference.trim(),
            customer_recommendation_reference.trim(),
        )
        .await
        {
            Ok(result) => result,
            Err(error) => {
                tracing::error!(%error, actor_user_id, customer_visit_reference, customer_recommendation_reference, "customer recommendation detail failed");
                CustomerRecommendationDetailResult::Unavailable
            }
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum CustomerAuthorization {
    Valid,
    NotAuthorized,
    Invalid,
}

#[derive(Clone, Debug)]
struct VisitAuthority {
    organization_id: String,
    customer_account_id: String,
    customer_property_id: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct StoredSnapshot {
    snapshot_version: u32,
    proposal_version: u64,
    customer_safe_reason: Option<String>,
    currency_code: String,
    line_items: Vec<CustomerRecommendationLineItem>,
    total_cents: u64,
}

async fn customer_authorization(
    transaction: &mut Transaction<'_, Postgres>,
    actor_user_id: &str,
) -> Result<CustomerAuthorization, sqlx::Error> {
    if actor_user_id.is_empty() {
        return Ok(CustomerAuthorization::NotAuthorized);
    }
    let row = sqlx::query(
        "WITH active_grants AS (
             SELECT portal.* FROM customer_portal_access_grants portal
             WHERE portal.user_id = $1 AND portal.status = 'active'
         ), valid_grants AS (
             SELECT DISTINCT portal.* FROM active_grants portal
             JOIN organizations organization
               ON organization.id = portal.organization_id
              AND organization.status = 'active'
             JOIN organization_customer_accounts relation
               ON relation.organization_id = portal.organization_id
              AND relation.account_id = portal.account_id
              AND relation.status = 'active'
             JOIN customer_properties property
               ON property.id = portal.property_id
              AND property.organization_id = portal.organization_id
              AND property.account_id = portal.account_id
             JOIN organization_memberships membership
               ON membership.organization_id = portal.organization_id
              AND membership.user_id = portal.user_id
              AND membership.role = portal.access_role
              AND membership.status = 'active'
              AND membership.scope_type = portal.scope_type
              AND membership.scope_id = portal.scope_id
             WHERE (portal.scope_type = 'customer_account'
                    AND portal.scope_id = portal.account_id)
                OR (portal.scope_type = 'property'
                    AND portal.scope_id = portal.property_id)
         )
         SELECT (SELECT COUNT(*) FROM active_grants) AS active_count,
                (SELECT COUNT(*) FROM valid_grants) AS valid_count",
    )
    .bind(actor_user_id)
    .fetch_one(&mut **transaction)
    .await?;
    let active: i64 = row.get("active_count");
    let valid: i64 = row.get("valid_count");
    Ok(if active == 0 {
        CustomerAuthorization::NotAuthorized
    } else if active != valid {
        CustomerAuthorization::Invalid
    } else {
        CustomerAuthorization::Valid
    })
}

async fn visit_authority(
    transaction: &mut Transaction<'_, Postgres>,
    actor_user_id: &str,
    customer_visit_reference: &str,
) -> Result<Option<VisitAuthority>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT thread.organization_id, thread.customer_account_id,
                thread.customer_property_id
         FROM customer_service_visit_threads thread
         JOIN owner_provider_service_releases release
           ON release.id = thread.release_id
          AND release.organization_id = thread.organization_id
          AND release.customer_account_id = thread.customer_account_id
          AND release.customer_property_id = thread.customer_property_id
         JOIN owner_provider_active_relationships relationship
           ON relationship.activation_id = release.activation_id
          AND relationship.organization_id = thread.organization_id
          AND relationship.customer_account_id = thread.customer_account_id
          AND relationship.customer_property_id = thread.customer_property_id
          AND relationship.status = 'active'
         JOIN organizations organization
           ON organization.id = thread.organization_id AND organization.status = 'active'
         JOIN organization_customer_accounts relation
           ON relation.organization_id = thread.organization_id
          AND relation.account_id = thread.customer_account_id
          AND relation.status = 'active'
         JOIN customer_properties property
           ON property.id = thread.customer_property_id
          AND property.organization_id = thread.organization_id
          AND property.account_id = thread.customer_account_id
          AND property.status <> 'archived'
         WHERE thread.customer_visit_reference = $2
           AND EXISTS (
               SELECT 1 FROM customer_portal_access_grants portal
               JOIN organization_memberships membership
                 ON membership.organization_id = portal.organization_id
                AND membership.user_id = portal.user_id
                AND membership.role = portal.access_role
                AND membership.status = 'active'
                AND membership.scope_type = portal.scope_type
                AND membership.scope_id = portal.scope_id
               WHERE portal.user_id = $1 AND portal.status = 'active'
                 AND portal.organization_id = thread.organization_id
                 AND portal.account_id = thread.customer_account_id
                 AND ((portal.scope_type = 'customer_account'
                       AND portal.scope_id = thread.customer_account_id)
                      OR (portal.scope_type = 'property'
                          AND portal.scope_id = thread.customer_property_id))
           )",
    )
    .bind(actor_user_id)
    .bind(customer_visit_reference)
    .fetch_optional(&mut **transaction)
    .await?;
    Ok(row.map(|row| VisitAuthority {
        organization_id: row.get("organization_id"),
        customer_account_id: row.get("customer_account_id"),
        customer_property_id: row.get("customer_property_id"),
    }))
}

fn publication_from_row(row: &sqlx::postgres::PgRow) -> Option<CustomerRecommendationPublication> {
    let proposal_version = row.get::<i64, _>("proposal_version");
    let snapshot =
        serde_json::from_value::<StoredSnapshot>(row.get::<Value, _>("customer_snapshot")).ok()?;
    if snapshot.snapshot_version != 1
        || snapshot.proposal_version != proposal_version as u64
        || snapshot.currency_code != "USD"
        || snapshot.line_items.is_empty()
        || snapshot.line_items.len() > 25
        || snapshot
            .customer_safe_reason
            .as_deref()
            .is_some_and(|reason| reason.trim().is_empty() || reason.chars().count() > 2_000)
        || snapshot.line_items.iter().any(|item| {
            item.service_name.trim().is_empty()
                || item.quantity == 0
                || item.quantity > 999
                || item.unit_price_cents > 200_000_000
                || item
                    .service_description
                    .as_deref()
                    .is_some_and(|description| {
                        description.trim().is_empty() || description.chars().count() > 2_000
                    })
        })
    {
        return None;
    }
    let total = snapshot
        .line_items
        .iter()
        .map(|item| u64::from(item.quantity) * u64::from(item.unit_price_cents))
        .sum::<u64>();
    if total != snapshot.total_cents {
        return None;
    }
    Some(CustomerRecommendationPublication {
        proposal_version: snapshot.proposal_version,
        customer_safe_reason: snapshot.customer_safe_reason,
        currency_code: snapshot.currency_code,
        line_items: snapshot.line_items,
        total_cents: snapshot.total_cents,
        published_at_epoch_seconds: row.get("published_at_epoch_seconds"),
        expires_at_epoch_seconds: row.get("expires_at_epoch_seconds"),
    })
}

async fn prepare_authorized_visit(
    transaction: &mut Transaction<'_, Postgres>,
    actor_user_id: &str,
    customer_visit_reference: &str,
) -> Result<Result<VisitAuthority, CustomerAuthorization>, sqlx::Error> {
    let authorization = customer_authorization(transaction, actor_user_id).await?;
    if authorization != CustomerAuthorization::Valid {
        return Ok(Err(authorization));
    }
    Ok(
        match visit_authority(transaction, actor_user_id, customer_visit_reference).await? {
            Some(authority) => Ok(authority),
            None => Err(CustomerAuthorization::Valid),
        },
    )
}

async fn reconcile_expiration(
    transaction: &mut Transaction<'_, Postgres>,
    customer_visit_reference: &str,
) -> Result<(), sqlx::Error> {
    let rows = sqlx::query(
        "SELECT series.customer_recommendation_reference, series.current_version,
                publication.id AS publication_id
         FROM customer_visit_recommendation_series series
         JOIN customer_visit_recommendation_publications publication
           ON publication.customer_recommendation_reference =
              series.customer_recommendation_reference
          AND publication.proposal_version = series.current_version
         WHERE series.customer_visit_reference = $1
           AND series.lifecycle_status = 'pending'
           AND publication.expires_at <= NOW()
         FOR UPDATE OF series",
    )
    .bind(customer_visit_reference)
    .fetch_all(&mut **transaction)
    .await?;
    for row in rows {
        let reference = row.get::<String, _>("customer_recommendation_reference");
        let version = row.get::<i64, _>("current_version");
        sqlx::query(
            "INSERT INTO customer_visit_recommendation_events (
                 id, customer_recommendation_reference, publication_id,
                 proposal_version, actor_user_id, event_kind, idempotency_key
             ) VALUES ($1, $2, $3, $4, 'system_customer_recommendation_expiry',
                       'expired', $5)
             ON CONFLICT (actor_user_id, idempotency_key) DO NOTHING",
        )
        .bind(format!(
            "customer_recommendation_event_{}",
            Uuid::new_v4().simple()
        ))
        .bind(&reference)
        .bind(row.get::<String, _>("publication_id"))
        .bind(version)
        .bind(format!("recommendation-expiry-{reference}-{version}"))
        .execute(&mut **transaction)
        .await?;
        sqlx::query(
            "UPDATE customer_visit_recommendation_series
             SET lifecycle_status = 'expired', updated_at = NOW()
             WHERE customer_recommendation_reference = $1
               AND current_version = $2 AND lifecycle_status = 'pending'",
        )
        .bind(reference)
        .bind(version)
        .execute(&mut **transaction)
        .await?;
    }
    Ok(())
}

async fn load_for_visit(
    pool: &PgPool,
    actor_user_id: &str,
    customer_visit_reference: &str,
) -> Result<CustomerRecommendationListResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let authority =
        match prepare_authorized_visit(&mut transaction, actor_user_id, customer_visit_reference)
            .await?
        {
            Ok(authority) => authority,
            Err(CustomerAuthorization::NotAuthorized) => {
                return Ok(CustomerRecommendationListResult::NotAuthorized)
            }
            Err(CustomerAuthorization::Invalid) => {
                return Ok(CustomerRecommendationListResult::InvalidAuthorization)
            }
            Err(CustomerAuthorization::Valid) => {
                return Ok(CustomerRecommendationListResult::NotFound)
            }
        };
    reconcile_expiration(&mut transaction, customer_visit_reference).await?;
    let rows = sqlx::query(
        "SELECT series.customer_recommendation_reference, series.current_version,
                series.lifecycle_status, publication.proposal_version,
                publication.customer_snapshot,
                EXTRACT(EPOCH FROM publication.published_at)::BIGINT AS published_at_epoch_seconds,
                EXTRACT(EPOCH FROM publication.expires_at)::BIGINT AS expires_at_epoch_seconds
         FROM customer_visit_recommendation_series series
         JOIN customer_visit_recommendation_publications publication
           ON publication.customer_recommendation_reference = series.customer_recommendation_reference
          AND publication.proposal_version = series.current_version
         WHERE series.customer_visit_reference = $1
           AND series.organization_id = $2 AND series.customer_account_id = $3
           AND series.customer_property_id = $4
         ORDER BY publication.published_at DESC, series.customer_recommendation_reference",
    )
    .bind(customer_visit_reference)
    .bind(authority.organization_id)
    .bind(authority.customer_account_id)
    .bind(authority.customer_property_id)
    .fetch_all(&mut *transaction)
    .await?;
    let mut recommendations = Vec::with_capacity(rows.len());
    for row in rows {
        let Some(current_publication) = publication_from_row(&row) else {
            transaction.rollback().await?;
            return Ok(CustomerRecommendationListResult::InvalidSnapshot);
        };
        recommendations.push(CustomerRecommendationSummary {
            customer_recommendation_reference: row.get("customer_recommendation_reference"),
            current_version: row.get::<i64, _>("current_version") as u64,
            lifecycle_status: row.get("lifecycle_status"),
            current_publication,
        });
    }
    transaction.commit().await?;
    Ok(CustomerRecommendationListResult::Loaded(
        CustomerRecommendationCollection {
            customer_visit_reference: customer_visit_reference.to_string(),
            recommendations,
        },
    ))
}

async fn load_detail(
    pool: &PgPool,
    actor_user_id: &str,
    customer_visit_reference: &str,
    recommendation_reference: &str,
) -> Result<CustomerRecommendationDetailResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let authority =
        match prepare_authorized_visit(&mut transaction, actor_user_id, customer_visit_reference)
            .await?
        {
            Ok(authority) => authority,
            Err(CustomerAuthorization::NotAuthorized) => {
                return Ok(CustomerRecommendationDetailResult::NotAuthorized)
            }
            Err(CustomerAuthorization::Invalid) => {
                return Ok(CustomerRecommendationDetailResult::InvalidAuthorization)
            }
            Err(CustomerAuthorization::Valid) => {
                return Ok(CustomerRecommendationDetailResult::NotFound)
            }
        };
    reconcile_expiration(&mut transaction, customer_visit_reference).await?;
    let rows = sqlx::query(
        "SELECT series.customer_recommendation_reference, series.current_version,
                series.lifecycle_status, publication.proposal_version,
                publication.customer_snapshot,
                EXTRACT(EPOCH FROM publication.published_at)::BIGINT AS published_at_epoch_seconds,
                EXTRACT(EPOCH FROM publication.expires_at)::BIGINT AS expires_at_epoch_seconds
         FROM customer_visit_recommendation_series series
         JOIN customer_visit_recommendation_publications publication
           ON publication.customer_recommendation_reference = series.customer_recommendation_reference
         WHERE series.customer_visit_reference = $1
           AND series.customer_recommendation_reference = $2
           AND series.organization_id = $3 AND series.customer_account_id = $4
           AND series.customer_property_id = $5
         ORDER BY publication.proposal_version",
    )
    .bind(customer_visit_reference).bind(recommendation_reference)
    .bind(authority.organization_id).bind(authority.customer_account_id)
    .bind(authority.customer_property_id)
    .fetch_all(&mut *transaction).await?;
    let Some(first) = rows.first() else {
        transaction.rollback().await?;
        return Ok(CustomerRecommendationDetailResult::NotFound);
    };
    let mut versions = Vec::with_capacity(rows.len());
    for row in &rows {
        let Some(publication) = publication_from_row(row) else {
            transaction.rollback().await?;
            return Ok(CustomerRecommendationDetailResult::InvalidSnapshot);
        };
        versions.push(publication);
    }
    let result = CustomerRecommendationDetail {
        customer_visit_reference: customer_visit_reference.to_string(),
        customer_recommendation_reference: recommendation_reference.to_string(),
        current_version: first.get::<i64, _>("current_version") as u64,
        lifecycle_status: first.get("lifecycle_status"),
        versions,
    };
    transaction.commit().await?;
    Ok(CustomerRecommendationDetailResult::Loaded(result))
}

#[cfg(test)]
mod tests {
    use super::CustomerVisitRecommendationRepository;

    #[tokio::test]
    async fn missing_persistence_fails_closed() {
        let repository = CustomerVisitRecommendationRepository::default();
        assert!(matches!(
            repository.list_for_visit("owner", "visit").await,
            super::CustomerRecommendationListResult::Unavailable
        ));
        assert!(matches!(
            repository
                .get_for_visit("owner", "visit", "recommendation")
                .await,
            super::CustomerRecommendationDetailResult::Unavailable
        ));
    }
}
