use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
pub struct AssignPropertyCrewRequest {
    pub crew_id: String,
    pub organization_id: String,
    pub assigned_at: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PropertyCrewAssignmentResponse {
    pub id: String,
    pub property_id: String,
    pub crew_id: String,
    pub organization_id: String,
    pub active: bool,
    pub assigned_at: String,
    pub ended_at: Option<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Default)]
pub struct PropertyCrewAssignmentRepository {
    pool: Option<PgPool>,
}

impl PropertyCrewAssignmentRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn assign_crew(
        &self,
        property_id: &str,
        request: AssignPropertyCrewRequest,
        actor_user_id: &str,
    ) -> Option<PropertyCrewAssignmentResponse> {
        let request = normalize_assign_property_crew_request(request);
        let assigned_at = request
            .assigned_at
            .clone()
            .unwrap_or_else(|| "now".to_string());
        let id = assignment_id(property_id, &request.crew_id);

        if let Some(pool) = &self.pool {
            return insert_property_crew_assignment(
                pool,
                &id,
                property_id,
                &assigned_at,
                &request,
                actor_user_id,
            )
            .await
            .ok()
            .flatten();
        }

        Some(PropertyCrewAssignmentResponse {
            id,
            property_id: property_id.trim().to_string(),
            crew_id: request.crew_id,
            organization_id: request.organization_id,
            active: true,
            assigned_at,
            ended_at: None,
            persisted: false,
        })
    }

    pub async fn list_for_property(
        &self,
        property_id: &str,
        organization_ids: &[String],
    ) -> Vec<PropertyCrewAssignmentResponse> {
        if organization_ids.is_empty() {
            return Vec::new();
        }

        if let Some(pool) = &self.pool {
            return list_property_crew_assignments(pool, property_id, organization_ids)
                .await
                .unwrap_or_default();
        }

        seed_property_assignments(property_id, organization_ids, false)
    }

    pub async fn list_active_for_crew(
        &self,
        crew_id: &str,
        organization_ids: &[String],
    ) -> Vec<PropertyCrewAssignmentResponse> {
        if organization_ids.is_empty() {
            return Vec::new();
        }

        if let Some(pool) = &self.pool {
            return list_active_property_crew_assignments(pool, crew_id, organization_ids)
                .await
                .unwrap_or_default();
        }

        seed_property_assignments_for_crew(crew_id, organization_ids)
    }
}

pub fn is_valid_assign_property_crew_request(request: &AssignPropertyCrewRequest) -> bool {
    !request.crew_id.trim().is_empty()
        && !request.organization_id.trim().is_empty()
        && request
            .assigned_at
            .as_deref()
            .map(|assigned_at| !assigned_at.trim().is_empty())
            .unwrap_or(true)
}

fn normalize_assign_property_crew_request(
    request: AssignPropertyCrewRequest,
) -> AssignPropertyCrewRequest {
    AssignPropertyCrewRequest {
        crew_id: request.crew_id.trim().to_string(),
        organization_id: request.organization_id.trim().to_string(),
        assigned_at: request.assigned_at.and_then(|assigned_at| {
            let trimmed = assigned_at.trim().to_string();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed)
            }
        }),
    }
}

fn assignment_id(property_id: &str, crew_id: &str) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    format!(
        "property_crew_assignment_{}_{}_{}",
        storage_key(property_id),
        storage_key(crew_id),
        nonce
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

async fn insert_property_crew_assignment(
    pool: &PgPool,
    id: &str,
    property_id: &str,
    assigned_at: &str,
    request: &AssignPropertyCrewRequest,
    actor_user_id: &str,
) -> Result<Option<PropertyCrewAssignmentResponse>, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let crew_and_property_are_assignable: bool = sqlx::query_scalar(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM crews crew
            JOIN customer_properties property
              ON property.id = $3
             AND property.organization_id = crew.organization_id
             AND property.status <> 'archived'
            WHERE crew.id = $1
              AND crew.organization_id = $2
        )
        "#,
    )
    .bind(&request.crew_id)
    .bind(&request.organization_id)
    .bind(property_id.trim())
    .fetch_one(&mut *tx)
    .await?;

    if !crew_and_property_are_assignable {
        tx.commit().await?;
        return Ok(None);
    }

    sqlx::query(
        r#"
        UPDATE property_crew_assignments
        SET active = FALSE,
            ended_at = $3::timestamptz
        WHERE property_id = $1
          AND organization_id = $2
          AND active = TRUE
        "#,
    )
    .bind(property_id.trim())
    .bind(&request.organization_id)
    .bind(assigned_at)
    .execute(&mut *tx)
    .await?;

    let row = sqlx::query(
        r#"
        INSERT INTO property_crew_assignments (
            id,
            property_id,
            crew_id,
            organization_id,
            active,
            assigned_at
        )
        VALUES ($1, $2, $3, $4, TRUE, $5::timestamptz)
        RETURNING
            id,
            property_id,
            crew_id,
            organization_id,
            active,
            assigned_at::text AS assigned_at,
            ended_at::text AS ended_at
        "#,
    )
    .bind(id)
    .bind(property_id.trim())
    .bind(&request.crew_id)
    .bind(&request.organization_id)
    .bind(assigned_at)
    .fetch_one(&mut *tx)
    .await?;

    insert_crew_assignment_audit_event(
        &mut tx,
        actor_user_id,
        &request.organization_id,
        "crew_assignment_changed",
        id,
    )
    .await?;

    tx.commit().await?;
    Ok(Some(assignment_response_from_row(row)))
}

async fn insert_crew_assignment_audit_event(
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

async fn list_property_crew_assignments(
    pool: &PgPool,
    property_id: &str,
    organization_ids: &[String],
) -> Result<Vec<PropertyCrewAssignmentResponse>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            id,
            property_id,
            crew_id,
            organization_id,
            active,
            assigned_at::text AS assigned_at,
            ended_at::text AS ended_at
        FROM property_crew_assignments
        WHERE property_id = $1
          AND organization_id = ANY($2)
        ORDER BY assigned_at DESC, id DESC
        "#,
    )
    .bind(property_id.trim())
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(assignment_response_from_row).collect())
}

async fn list_active_property_crew_assignments(
    pool: &PgPool,
    crew_id: &str,
    organization_ids: &[String],
) -> Result<Vec<PropertyCrewAssignmentResponse>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            id,
            property_id,
            crew_id,
            organization_id,
            active,
            assigned_at::text AS assigned_at,
            ended_at::text AS ended_at
        FROM property_crew_assignments
        WHERE crew_id = $1
          AND organization_id = ANY($2)
          AND active = TRUE
        ORDER BY assigned_at DESC, property_id ASC
        "#,
    )
    .bind(crew_id.trim())
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(assignment_response_from_row).collect())
}

fn assignment_response_from_row(row: sqlx::postgres::PgRow) -> PropertyCrewAssignmentResponse {
    PropertyCrewAssignmentResponse {
        id: row.get("id"),
        property_id: row.get("property_id"),
        crew_id: row.get("crew_id"),
        organization_id: row.get("organization_id"),
        active: row.get("active"),
        assigned_at: row.get("assigned_at"),
        ended_at: row.get("ended_at"),
        persisted: true,
    }
}

fn seed_property_assignments(
    property_id: &str,
    organization_ids: &[String],
    persisted: bool,
) -> Vec<PropertyCrewAssignmentResponse> {
    if property_id != "property_1001"
        || !organization_ids
            .iter()
            .any(|organization_id| organization_id == "org_demo_landscaping")
    {
        return Vec::new();
    }

    vec![PropertyCrewAssignmentResponse {
        id: "property_crew_assignment_property_1001_crew_1001_seed".to_string(),
        property_id: "property_1001".to_string(),
        crew_id: "crew_1001".to_string(),
        organization_id: "org_demo_landscaping".to_string(),
        active: true,
        assigned_at: "2026-06-15 00:00:00+00".to_string(),
        ended_at: None,
        persisted,
    }]
}

fn seed_property_assignments_for_crew(
    crew_id: &str,
    organization_ids: &[String],
) -> Vec<PropertyCrewAssignmentResponse> {
    seed_property_assignments("property_1001", organization_ids, false)
        .into_iter()
        .filter(|assignment| assignment.crew_id == crew_id && assignment.active)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::{
        is_valid_assign_property_crew_request, seed_property_assignments_for_crew, storage_key,
        AssignPropertyCrewRequest, PropertyCrewAssignmentRepository,
    };

    #[test]
    fn validates_assignment_request_required_fields() {
        assert!(is_valid_assign_property_crew_request(
            &AssignPropertyCrewRequest {
                crew_id: "crew_1001".to_string(),
                organization_id: "org_demo_landscaping".to_string(),
                assigned_at: Some("2026-06-15T08:00:00Z".to_string()),
            },
        ));
        assert!(!is_valid_assign_property_crew_request(
            &AssignPropertyCrewRequest {
                crew_id: " ".to_string(),
                organization_id: "org_demo_landscaping".to_string(),
                assigned_at: None,
            },
        ));
        assert!(!is_valid_assign_property_crew_request(
            &AssignPropertyCrewRequest {
                crew_id: "crew_1001".to_string(),
                organization_id: " ".to_string(),
                assigned_at: None,
            },
        ));
    }

    #[test]
    fn storage_keys_are_stable() {
        assert_eq!(storage_key(" Property 1001 "), "property_1001");
    }

    #[tokio::test]
    async fn repository_returns_local_assignment_when_database_is_unavailable() {
        let repository = PropertyCrewAssignmentRepository::default();

        let response = repository
            .assign_crew(
                " property_1001 ",
                AssignPropertyCrewRequest {
                    crew_id: " crew_1001 ".to_string(),
                    organization_id: " org_demo_landscaping ".to_string(),
                    assigned_at: Some("2026-06-15T08:00:00Z".to_string()),
                },
                "actor_1001",
            )
            .await
            .expect("local assignment response should be returned");

        assert_eq!(response.property_id, "property_1001");
        assert_eq!(response.crew_id, "crew_1001");
        assert!(response.active);
        assert!(!response.persisted);
    }

    #[test]
    fn seeded_active_assignments_are_scoped_to_crew_and_organization() {
        assert_eq!(
            seed_property_assignments_for_crew("crew_1001", &["org_demo_landscaping".to_string()])
                .len(),
            1
        );
        assert!(
            seed_property_assignments_for_crew("crew_1001", &["org_other".to_string()]).is_empty()
        );
    }
}
