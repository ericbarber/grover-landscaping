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

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerPortalPropertySummary {
    pub organization_id: String,
    pub account_id: String,
    pub property_id: String,
    pub property_display_name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerPortalVisitSummary {
    pub organization_id: String,
    pub account_id: String,
    pub property_id: String,
    pub service_date: String,
    pub window_start_epoch_seconds: i64,
    pub window_end_epoch_seconds: i64,
    pub time_zone: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_service_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_window_start_epoch_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_window_end_epoch_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_time_zone: Option<String>,
    pub service_title: String,
    pub service_scope: Vec<String>,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preparation_message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub customer_safe_reason: Option<String>,
    pub next_update_message: String,
    pub delivered_proof_available: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerPortalVisitCollection {
    pub properties: Vec<CustomerPortalPropertySummary>,
    pub visits: Vec<CustomerPortalVisitSummary>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerPortalPropertyAccessResult {
    Loaded(Vec<CustomerPortalPropertyAccess>),
    NotAuthorized,
    InvalidAuthorization,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerPortalVisitReadResult {
    Loaded(CustomerPortalVisitCollection),
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

    pub async fn list_confirmed_visits(&self, user_id: &str) -> CustomerPortalVisitReadResult {
        let Some(pool) = &self.pool else {
            return CustomerPortalVisitReadResult::Unavailable;
        };

        match list_confirmed_visits(pool, user_id.trim()).await {
            Ok((active_grant_count, valid_grant_count, collection)) => {
                if active_grant_count == 0 {
                    CustomerPortalVisitReadResult::NotAuthorized
                } else if active_grant_count != valid_grant_count {
                    CustomerPortalVisitReadResult::InvalidAuthorization
                } else {
                    CustomerPortalVisitReadResult::Loaded(collection)
                }
            }
            Err(error) => {
                tracing::error!(%error, user_id, "customer portal visit read failed");
                CustomerPortalVisitReadResult::Unavailable
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

const CUSTOMER_PORTAL_AUTHORIZATION_CTES: &str = r#"
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
        )
"#;

async fn list_authorized_properties(
    pool: &PgPool,
    user_id: &str,
) -> Result<(i64, i64, Vec<CustomerPortalPropertyAccess>), sqlx::Error> {
    let query = format!(
        "{CUSTOMER_PORTAL_AUTHORIZATION_CTES},
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
        "
    );
    let rows = sqlx::query(&query).bind(user_id).fetch_all(pool).await?;

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

async fn list_confirmed_visits(
    pool: &PgPool,
    user_id: &str,
) -> Result<(i64, i64, CustomerPortalVisitCollection), sqlx::Error> {
    let query = format!(
        "{CUSTOMER_PORTAL_AUTHORIZATION_CTES},
        authorized_properties AS (
            SELECT DISTINCT
                property.organization_id,
                property.account_id,
                property.id AS property_id,
                property.display_name AS property_display_name
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
        ),
        confirmed_visits AS (
            SELECT DISTINCT
                property.organization_id,
                property.account_id,
                property.property_id,
                TO_CHAR(
                    COALESCE(reschedule.window_start, visit.window_start)
                        AT TIME ZONE COALESCE(reschedule.time_zone, visit.time_zone),
                    'YYYY-MM-DD'
                ) AS service_date,
                EXTRACT(EPOCH FROM COALESCE(reschedule.window_start, visit.window_start))::BIGINT
                    AS window_start_epoch_seconds,
                EXTRACT(EPOCH FROM COALESCE(reschedule.window_end, visit.window_end))::BIGINT
                    AS window_end_epoch_seconds,
                COALESCE(reschedule.time_zone, visit.time_zone) AS time_zone,
                CASE WHEN reschedule.window_start IS NULL THEN NULL ELSE TO_CHAR(
                    visit.window_start AT TIME ZONE visit.time_zone,
                    'YYYY-MM-DD'
                ) END AS original_service_date,
                CASE WHEN reschedule.window_start IS NULL THEN NULL
                    ELSE EXTRACT(EPOCH FROM visit.window_start)::BIGINT
                END AS original_window_start_epoch_seconds,
                CASE WHEN reschedule.window_start IS NULL THEN NULL
                    ELSE EXTRACT(EPOCH FROM visit.window_end)::BIGINT
                END AS original_window_end_epoch_seconds,
                CASE WHEN reschedule.window_start IS NULL THEN NULL
                    ELSE visit.time_zone
                END AS original_time_zone,
                service.title AS service_title,
                service.included_scope AS service_scope,
                COALESCE(latest.event_kind, series.status) AS status,
                visit.customer_safe_arrival_note AS preparation_message,
                latest.customer_safe_reason,
                COALESCE(
                    latest.next_update_message,
                    'Your provider will share the next customer-visible service update here.'
                ) AS next_update_message
            FROM authorized_properties property
            JOIN owner_provider_relationship_activations activation
              ON activation.organization_id = property.organization_id
             AND activation.customer_account_id = property.account_id
             AND activation.customer_property_id = property.property_id
            JOIN owner_provider_active_relationships relationship
              ON relationship.activation_id = activation.id
             AND relationship.organization_id = activation.organization_id
             AND relationship.customer_account_id = activation.customer_account_id
             AND relationship.customer_property_id = activation.customer_property_id
             AND relationship.status = 'active'
            JOIN owner_provider_first_visit_series series
              ON series.activation_id = activation.id
             AND series.status = 'confirmed'
            JOIN owner_provider_first_visit_proposals visit
              ON visit.activation_id = activation.id
             AND visit.proposal_version = series.current_version
             AND visit.organization_id = activation.organization_id
             AND visit.customer_account_id = activation.customer_account_id
             AND visit.customer_property_id = activation.customer_property_id
            JOIN owner_provider_first_visit_decisions decision
              ON decision.activation_id = activation.id
             AND decision.proposal_id = visit.id
             AND decision.proposal_version = visit.proposal_version
             AND decision.owner_user_id = activation.owner_user_id
             AND decision.action = 'confirm'
            JOIN owner_provider_initial_service_proposals service
              ON service.id = activation.proposal_id
             AND service.organization_id = activation.organization_id
             AND service.status = 'accepted'
            LEFT JOIN owner_provider_service_releases release
              ON release.activation_id = activation.id
             AND release.first_visit_proposal_id = visit.id
             AND release.first_visit_proposal_version = visit.proposal_version
             AND release.initial_service_proposal_id = service.id
             AND release.organization_id = activation.organization_id
             AND release.customer_account_id = activation.customer_account_id
             AND release.customer_property_id = activation.customer_property_id
            LEFT JOIN LATERAL (
                SELECT event.event_version, event.event_kind,
                       event.customer_safe_reason, event.next_update_message
                FROM customer_service_day_events event
                WHERE event.release_id = release.id
                  AND event.organization_id = release.organization_id
                  AND event.customer_account_id = release.customer_account_id
                  AND event.customer_property_id = release.customer_property_id
                ORDER BY event.event_version DESC
                LIMIT 1
            ) latest ON TRUE
            LEFT JOIN LATERAL (
                SELECT event.window_start, event.window_end, event.time_zone
                FROM customer_service_day_events event
                WHERE event.release_id = release.id
                  AND event.organization_id = release.organization_id
                  AND event.customer_account_id = release.customer_account_id
                  AND event.customer_property_id = release.customer_property_id
                  AND event.event_kind = 'rescheduled'
                ORDER BY event.event_version DESC
                LIMIT 1
            ) reschedule ON TRUE
        ),
        portal_rows AS (
            SELECT
                'property'::TEXT AS row_kind,
                property.organization_id,
                property.account_id,
                property.property_id,
                property.property_display_name,
                NULL::TEXT AS service_date,
                NULL::BIGINT AS window_start_epoch_seconds,
                NULL::BIGINT AS window_end_epoch_seconds,
                NULL::TEXT AS time_zone,
                NULL::TEXT AS original_service_date,
                NULL::BIGINT AS original_window_start_epoch_seconds,
                NULL::BIGINT AS original_window_end_epoch_seconds,
                NULL::TEXT AS original_time_zone,
                NULL::TEXT AS service_title,
                NULL::TEXT[] AS service_scope,
                NULL::TEXT AS visit_status,
                NULL::TEXT AS preparation_message,
                NULL::TEXT AS customer_safe_reason,
                NULL::TEXT AS next_update_message
            FROM authorized_properties property
            UNION ALL
            SELECT
                'visit'::TEXT AS row_kind,
                visit.organization_id,
                visit.account_id,
                visit.property_id,
                NULL::TEXT AS property_display_name,
                visit.service_date,
                visit.window_start_epoch_seconds,
                visit.window_end_epoch_seconds,
                visit.time_zone,
                visit.original_service_date,
                visit.original_window_start_epoch_seconds,
                visit.original_window_end_epoch_seconds,
                visit.original_time_zone,
                visit.service_title,
                visit.service_scope,
                visit.status AS visit_status,
                visit.preparation_message,
                visit.customer_safe_reason,
                visit.next_update_message
            FROM confirmed_visits visit
        )
        SELECT
            validation.active_grant_count,
            validation.valid_grant_count,
            portal_row.row_kind,
            portal_row.organization_id,
            portal_row.account_id,
            portal_row.property_id,
            portal_row.property_display_name,
            portal_row.service_date,
            portal_row.window_start_epoch_seconds,
            portal_row.window_end_epoch_seconds,
            portal_row.time_zone,
            portal_row.original_service_date,
            portal_row.original_window_start_epoch_seconds,
            portal_row.original_window_end_epoch_seconds,
            portal_row.original_time_zone,
            portal_row.service_title,
            portal_row.service_scope,
            portal_row.visit_status,
            portal_row.preparation_message,
            portal_row.customer_safe_reason,
            portal_row.next_update_message
        FROM validation
        LEFT JOIN portal_rows portal_row ON TRUE
        ORDER BY
            portal_row.row_kind ASC,
            portal_row.service_date ASC,
            portal_row.window_start_epoch_seconds ASC,
            portal_row.property_display_name ASC,
            portal_row.property_id ASC
        "
    );
    let rows = sqlx::query(&query).bind(user_id).fetch_all(pool).await?;

    let active_grant_count = rows
        .first()
        .map(|row| row.get("active_grant_count"))
        .unwrap_or(0);
    let valid_grant_count = rows
        .first()
        .map(|row| row.get("valid_grant_count"))
        .unwrap_or(0);
    let mut properties = Vec::new();
    let mut visits = Vec::new();
    for row in rows {
        match row.get::<Option<String>, _>("row_kind").as_deref() {
            Some("property") => properties.push(CustomerPortalPropertySummary {
                organization_id: row.get("organization_id"),
                account_id: row.get("account_id"),
                property_id: row.get("property_id"),
                property_display_name: row.get("property_display_name"),
            }),
            Some("visit") => visits.push(CustomerPortalVisitSummary {
                organization_id: row.get("organization_id"),
                account_id: row.get("account_id"),
                property_id: row.get("property_id"),
                service_date: row.get("service_date"),
                window_start_epoch_seconds: row.get("window_start_epoch_seconds"),
                window_end_epoch_seconds: row.get("window_end_epoch_seconds"),
                time_zone: row.get("time_zone"),
                original_service_date: row.get("original_service_date"),
                original_window_start_epoch_seconds: row.get("original_window_start_epoch_seconds"),
                original_window_end_epoch_seconds: row.get("original_window_end_epoch_seconds"),
                original_time_zone: row.get("original_time_zone"),
                service_title: row.get("service_title"),
                service_scope: row.get("service_scope"),
                status: row.get("visit_status"),
                preparation_message: row.get("preparation_message"),
                customer_safe_reason: row.get("customer_safe_reason"),
                next_update_message: row.get("next_update_message"),
                delivered_proof_available: false,
            }),
            _ => {}
        }
    }

    Ok((
        active_grant_count,
        valid_grant_count,
        CustomerPortalVisitCollection { properties, visits },
    ))
}

#[cfg(test)]
mod tests {
    use super::{
        scope_includes_property, CustomerPortalAccessRepository,
        CustomerPortalPropertyAccessResult, CustomerPortalVisitCollection,
        CustomerPortalVisitReadResult, CustomerPortalVisitSummary,
    };

    #[tokio::test]
    async fn missing_persistence_fails_closed_as_unavailable() {
        assert_eq!(
            CustomerPortalAccessRepository::default()
                .list_authorized_properties("owner_1001")
                .await,
            CustomerPortalPropertyAccessResult::Unavailable
        );
        assert_eq!(
            CustomerPortalAccessRepository::default()
                .list_confirmed_visits("owner_1001")
                .await,
            CustomerPortalVisitReadResult::Unavailable
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

    #[test]
    fn customer_visit_serialization_contains_only_the_minimized_contract() {
        let value = serde_json::to_value(CustomerPortalVisitCollection {
            properties: Vec::new(),
            visits: vec![CustomerPortalVisitSummary {
                organization_id: "org_1001".to_string(),
                account_id: "account_1001".to_string(),
                property_id: "property_1001".to_string(),
                service_date: "2026-08-29".to_string(),
                window_start_epoch_seconds: 1_788_019_200,
                window_end_epoch_seconds: 1_788_026_400,
                time_zone: "America/Phoenix".to_string(),
                original_service_date: None,
                original_window_start_epoch_seconds: None,
                original_window_end_epoch_seconds: None,
                original_time_zone: None,
                service_title: "Initial yard care".to_string(),
                service_scope: vec!["Mow and edge turf".to_string()],
                status: "confirmed".to_string(),
                preparation_message: None,
                customer_safe_reason: None,
                next_update_message: "Your provider will share an update here.".to_string(),
                delivered_proof_available: false,
            }],
        })
        .expect("customer visit collection should serialize");
        let visit = value["visits"][0]
            .as_object()
            .expect("serialized visit should be an object");

        assert_eq!(visit.len(), 12);
        for private_field in [
            "activation_id",
            "proposal_id",
            "provider_actor_user_id",
            "owner_user_id",
            "crew_id",
            "route_position",
            "billing_notes",
            "customer_safe_arrival_note",
            "release_id",
            "service_job_id",
            "event_version",
        ] {
            assert!(!visit.contains_key(private_field));
        }
    }
}
