#[path = "postgres_day_plans.rs"]
mod postgres_day_plans;

use crate::db::DatabaseConfig;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanStop {
    pub id: String,
    pub job_id: String,
    pub customer_name: String,
    pub property_address: String,
    pub stop_order: u32,
    pub job_status: String,
    pub stop_status: String,
    pub estimated_drive_minutes: u32,
    pub estimated_service_minutes: u32,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanSummary {
    pub id: String,
    pub crew_id: String,
    pub crew_name: String,
    pub organization_id: String,
    pub service_date: String,
    pub status: String,
    pub route_status: String,
    pub stops: Vec<DayPlanStop>,
}

#[derive(Clone, Debug)]
pub enum TodayDayPlanResult {
    Found(DayPlanSummary),
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug)]
pub enum PersistedMutationResult<T> {
    Applied(T),
    NotFound,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PersistedReadResult<T> {
    Loaded(T),
    Unavailable,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct CrewSummary {
    pub id: String,
    pub name: String,
    pub organization_id: String,
    pub branch_id: Option<String>,
    pub territory_id: Option<String>,
    pub status: String,
    pub daily_stop_capacity: u32,
    pub lead_membership_id: Option<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct OrganizationBranchSummary {
    pub id: String,
    pub organization_id: String,
    pub name: String,
    pub code: String,
    pub time_zone: String,
    pub service_area_label: Option<String>,
    pub status: String,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct ServiceTerritorySummary {
    pub id: String,
    pub organization_id: String,
    pub branch_id: String,
    pub name: String,
    pub status: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct CreateOrganizationBranchRequest {
    pub name: String,
    pub code: String,
    pub time_zone: String,
    pub service_area_label: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CreateOrganizationBranchResult {
    Created(OrganizationBranchSummary),
    DuplicateCode,
    Unavailable,
}

#[derive(Clone, Debug, Deserialize)]
pub struct CreateServiceTerritoryRequest {
    pub branch_id: String,
    pub name: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CreateServiceTerritoryResult {
    Created(ServiceTerritorySummary),
    BranchNotFound,
    DuplicateName,
    Unavailable,
}

#[derive(Clone, Debug, Deserialize)]
pub struct UpdateHierarchyStatusRequest {
    pub status: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum UpdateBranchStatusResult {
    Updated(OrganizationBranchSummary),
    OperationalConflict,
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum UpdateTerritoryStatusResult {
    Updated(ServiceTerritorySummary),
    OperationalConflict,
    NotFound,
    Unavailable,
}

pub fn validate_create_service_territory_request(
    request: &CreateServiceTerritoryRequest,
) -> Result<(), &'static str> {
    if request.branch_id.trim().is_empty() || request.branch_id.chars().count() > 120 {
        return Err("territory_branch_invalid");
    }
    if request.name.trim().is_empty() || request.name.trim().chars().count() > 120 {
        return Err("territory_name_invalid");
    }
    Ok(())
}

pub fn validate_create_organization_branch_request(
    request: &CreateOrganizationBranchRequest,
) -> Result<(), &'static str> {
    let name = request.name.trim();
    let code = request.code.trim();
    if name.is_empty() || name.chars().count() > 120 {
        return Err("branch_name_invalid");
    }
    if code.is_empty()
        || code.chars().count() > 20
        || !code
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || character == '_')
    {
        return Err("branch_code_invalid");
    }
    if !matches!(
        request.time_zone.trim(),
        "America/Phoenix"
            | "America/Los_Angeles"
            | "America/Denver"
            | "America/Chicago"
            | "America/New_York"
    ) {
        return Err("branch_time_zone_invalid");
    }
    if request.service_area_label.as_deref().is_some_and(|label| {
        let label = label.trim();
        label.is_empty() || label.chars().count() > 120
    }) {
        return Err("branch_service_area_invalid");
    }
    Ok(())
}

#[derive(Clone, Debug, Deserialize)]
pub struct CreateCrewRequest {
    pub name: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct UpdateCrewRequest {
    pub name: String,
    pub status: String,
    pub daily_stop_capacity: Option<u32>,
    pub lead_membership_id: Option<String>,
    pub branch_id: Option<String>,
    pub territory_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum UpdateCrewResult {
    Updated(CrewSummary),
    OperationalConflict,
    InvalidHierarchy,
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, Deserialize)]
pub struct CreateDayPlanRequest {
    pub crew_id: String,
    pub service_date: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct AssignDayPlanStopRequest {
    pub job_id: String,
    pub estimated_drive_minutes: Option<u32>,
    pub estimated_service_minutes: Option<u32>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct ReorderDayPlanStopsRequest {
    pub stop_ids: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AmendmentService {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub default_duration_minutes: Option<u32>,
    pub default_price_cents: Option<u32>,
    pub requires_manager_approval: bool,
}

#[derive(Clone, Debug, Deserialize)]
pub struct CreateDayPlanAmendmentRequest {
    pub amendment_type: String,
    pub requested_by_crew_id: String,
    pub stop_id: Option<String>,
    pub service: Option<AmendmentService>,
    pub note: Option<String>,
    pub client_mutation_id: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct ReviewDayPlanAmendmentRequest {
    pub decision: String,
    pub manager_note: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanAmendmentResponse {
    pub id: String,
    pub day_plan_id: String,
    pub amendment_type: String,
    pub status: String,
    pub requested_by_crew_id: String,
    pub stop_id: Option<String>,
    pub service: Option<AmendmentService>,
    pub note: Option<String>,
    pub requires_bid: bool,
    pub manager_note: Option<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanAmendmentReviewResponse {
    pub id: String,
    pub day_plan_id: String,
    pub status: String,
    pub manager_note: Option<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanMutationResponse {
    pub id: String,
    pub crew_id: String,
    pub service_date: String,
    pub status: String,
    pub route_status: String,
    pub time_zone: String,
    pub service_area_label: Option<String>,
    pub stop_capacity: u32,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanStopMutationResponse {
    pub day_plan_id: String,
    pub stop_id: String,
    pub job_id: String,
    pub stop_order: u32,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanStopRemovalResponse {
    pub day_plan_id: String,
    pub stop_id: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanStopReorderResponse {
    pub day_plan_id: String,
    pub stop_ids: Vec<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Default)]
pub struct DayPlanRepository {
    pool: Option<PgPool>,
}

impl DayPlanRepository {
    #[allow(dead_code)]
    pub fn new() -> Self {
        let pool = DatabaseConfig::from_env().and_then(|config| {
            PgPoolOptions::new()
                .max_connections(5)
                .connect_lazy(&config.database_url)
                .ok()
        });

        Self { pool }
    }

    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn organization_id_for_crew(
        &self,
        crew_id: &str,
    ) -> PersistedReadResult<Option<String>> {
        if let Some(pool) = &self.pool {
            return match postgres_day_plans::organization_id_for_crew(pool, crew_id).await {
                Ok(organization_id) => PersistedReadResult::Loaded(organization_id),
                Err(error) => {
                    tracing::error!(%error, crew_id, "persisted crew ownership lookup failed");
                    PersistedReadResult::Unavailable
                }
            };
        }

        PersistedReadResult::Loaded(seed_organization_id_for_crew(crew_id))
    }

    pub async fn list_crews(
        &self,
        organization_ids: &[String],
    ) -> PersistedReadResult<Vec<CrewSummary>> {
        if organization_ids.is_empty() {
            return PersistedReadResult::Loaded(Vec::new());
        }
        let Some(pool) = &self.pool else {
            return PersistedReadResult::Loaded(seed_crews(organization_ids));
        };
        let rows = match sqlx::query(
            r#"SELECT id, name, organization_id, branch_id, territory_id, status, daily_stop_capacity, lead_membership_id
            FROM crews
            WHERE organization_id = ANY($1)
              AND status = 'active'
            ORDER BY name, id"#,
        )
        .bind(organization_ids)
        .fetch_all(pool)
        .await
        {
            Ok(rows) => rows,
            Err(error) => {
                tracing::error!(%error, "persisted crew list failed");
                return PersistedReadResult::Unavailable;
            }
        };
        PersistedReadResult::Loaded(
            rows.into_iter()
                .map(|row| CrewSummary {
                    id: row.get("id"),
                    name: row.get("name"),
                    organization_id: row.get("organization_id"),
                    branch_id: row.get("branch_id"),
                    territory_id: row.get("territory_id"),
                    status: row.get("status"),
                    daily_stop_capacity: row.get::<i32, _>("daily_stop_capacity") as u32,
                    lead_membership_id: row.get("lead_membership_id"),
                    persisted: true,
                })
                .collect(),
        )
    }

    pub async fn list_organization_branches(
        &self,
        organization_ids: &[String],
    ) -> PersistedReadResult<Vec<OrganizationBranchSummary>> {
        if organization_ids.is_empty() {
            return PersistedReadResult::Loaded(Vec::new());
        }
        let Some(pool) = &self.pool else {
            return PersistedReadResult::Loaded(Vec::new());
        };
        match sqlx::query(
            r#"
            SELECT id, organization_id, name, code, time_zone, service_area_label, status
            FROM organization_branches
            WHERE organization_id = ANY($1)
            ORDER BY organization_id, status, name, id
            "#,
        )
        .bind(organization_ids)
        .fetch_all(pool)
        .await
        {
            Ok(rows) => PersistedReadResult::Loaded(
                rows.into_iter()
                    .map(|row| OrganizationBranchSummary {
                        id: row.get("id"),
                        organization_id: row.get("organization_id"),
                        name: row.get("name"),
                        code: row.get("code"),
                        time_zone: row.get("time_zone"),
                        service_area_label: row.get("service_area_label"),
                        status: row.get("status"),
                    })
                    .collect(),
            ),
            Err(error) => {
                tracing::error!(%error, "persisted organization branch list failed");
                PersistedReadResult::Unavailable
            }
        }
    }

    pub async fn create_organization_branch(
        &self,
        organization_id: &str,
        actor_user_id: &str,
        request: &CreateOrganizationBranchRequest,
    ) -> CreateOrganizationBranchResult {
        let Some(pool) = &self.pool else {
            return CreateOrganizationBranchResult::Unavailable;
        };
        let id = format!("branch_{}", Uuid::new_v4().simple());
        let mut tx = match pool.begin().await {
            Ok(tx) => tx,
            Err(_) => return CreateOrganizationBranchResult::Unavailable,
        };
        let row = sqlx::query(
            r#"
            INSERT INTO organization_branches (
                id, organization_id, name, code, time_zone, service_area_label
            )
            SELECT $1, organization.id, $3, $4, $5, $6
            FROM organizations organization
            WHERE organization.id = $2 AND organization.status = 'active'
            ON CONFLICT (organization_id, code) DO NOTHING
            RETURNING id, organization_id, name, code, time_zone, service_area_label, status
            "#,
        )
        .bind(&id)
        .bind(organization_id)
        .bind(request.name.trim())
        .bind(request.code.trim().to_ascii_uppercase())
        .bind(request.time_zone.trim())
        .bind(request.service_area_label.as_deref().map(str::trim))
        .fetch_optional(&mut *tx)
        .await;
        let row = match row {
            Ok(Some(row)) => row,
            Ok(None) => return CreateOrganizationBranchResult::DuplicateCode,
            Err(_) => return CreateOrganizationBranchResult::Unavailable,
        };
        if sqlx::query(
            r#"
            INSERT INTO access_audit_events (
                id, actor_user_id, organization_id, event_kind, target_id, occurred_at, metadata
            ) VALUES (
                $1, $2, $3, 'branch_created', $4, NOW(),
                jsonb_build_object('code', $5::text, 'time_zone', $6::text)
            )
            "#,
        )
        .bind(format!("audit_branch_created_{}", Uuid::new_v4().simple()))
        .bind(actor_user_id)
        .bind(organization_id)
        .bind(&id)
        .bind(request.code.trim().to_ascii_uppercase())
        .bind(request.time_zone.trim())
        .execute(&mut *tx)
        .await
        .is_err()
            || tx.commit().await.is_err()
        {
            return CreateOrganizationBranchResult::Unavailable;
        }
        CreateOrganizationBranchResult::Created(OrganizationBranchSummary {
            id: row.get("id"),
            organization_id: row.get("organization_id"),
            name: row.get("name"),
            code: row.get("code"),
            time_zone: row.get("time_zone"),
            service_area_label: row.get("service_area_label"),
            status: row.get("status"),
        })
    }

    pub async fn create_service_territory(
        &self,
        organization_id: &str,
        actor_user_id: &str,
        request: &CreateServiceTerritoryRequest,
    ) -> CreateServiceTerritoryResult {
        let Some(pool) = &self.pool else {
            return CreateServiceTerritoryResult::Unavailable;
        };
        let id = format!("territory_{}", Uuid::new_v4().simple());
        let mut tx = match pool.begin().await {
            Ok(tx) => tx,
            Err(_) => return CreateServiceTerritoryResult::Unavailable,
        };
        let branch_exists = sqlx::query_scalar::<_, bool>(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM organization_branches
                WHERE id = $1 AND organization_id = $2 AND status = 'active'
            )
            "#,
        )
        .bind(request.branch_id.trim())
        .bind(organization_id)
        .fetch_one(&mut *tx)
        .await;
        if !matches!(branch_exists, Ok(true)) {
            return match branch_exists {
                Ok(false) => CreateServiceTerritoryResult::BranchNotFound,
                _ => CreateServiceTerritoryResult::Unavailable,
            };
        }
        let row = sqlx::query(
            r#"
            INSERT INTO service_territories (
                id, organization_id, branch_id, name
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT (organization_id, branch_id, name) DO NOTHING
            RETURNING id, organization_id, branch_id, name, status
            "#,
        )
        .bind(&id)
        .bind(organization_id)
        .bind(request.branch_id.trim())
        .bind(request.name.trim())
        .fetch_optional(&mut *tx)
        .await;
        let row = match row {
            Ok(Some(row)) => row,
            Ok(None) => return CreateServiceTerritoryResult::DuplicateName,
            Err(_) => return CreateServiceTerritoryResult::Unavailable,
        };
        if sqlx::query(
            r#"
            INSERT INTO access_audit_events (
                id, actor_user_id, organization_id, event_kind, target_id, occurred_at, metadata
            ) VALUES (
                $1, $2, $3, 'territory_created', $4, NOW(),
                jsonb_build_object('branch_id', $5::text)
            )
            "#,
        )
        .bind(format!(
            "audit_territory_created_{}",
            Uuid::new_v4().simple()
        ))
        .bind(actor_user_id)
        .bind(organization_id)
        .bind(&id)
        .bind(request.branch_id.trim())
        .execute(&mut *tx)
        .await
        .is_err()
            || tx.commit().await.is_err()
        {
            return CreateServiceTerritoryResult::Unavailable;
        }
        CreateServiceTerritoryResult::Created(ServiceTerritorySummary {
            id: row.get("id"),
            organization_id: row.get("organization_id"),
            branch_id: row.get("branch_id"),
            name: row.get("name"),
            status: row.get("status"),
        })
    }

    pub async fn update_organization_branch_status(
        &self,
        organization_id: &str,
        branch_id: &str,
        actor_user_id: &str,
        status: &str,
    ) -> UpdateBranchStatusResult {
        let Some(pool) = &self.pool else {
            return UpdateBranchStatusResult::Unavailable;
        };
        let mut tx = match pool.begin().await {
            Ok(tx) => tx,
            Err(_) => return UpdateBranchStatusResult::Unavailable,
        };
        if status == "inactive" {
            let has_active_scope: bool = match sqlx::query_scalar(
                r#"
                SELECT EXISTS (
                    SELECT 1 FROM crews
                    WHERE organization_id = $1 AND branch_id = $2 AND status = 'active'
                ) OR EXISTS (
                    SELECT 1 FROM service_territories
                    WHERE organization_id = $1 AND branch_id = $2 AND status = 'active'
                )
                "#,
            )
            .bind(organization_id)
            .bind(branch_id)
            .fetch_one(&mut *tx)
            .await
            {
                Ok(value) => value,
                Err(_) => return UpdateBranchStatusResult::Unavailable,
            };
            if has_active_scope {
                return UpdateBranchStatusResult::OperationalConflict;
            }
        }
        let row = match sqlx::query(
            r#"
            UPDATE organization_branches
            SET status = $3, updated_at = NOW()
            WHERE id = $1 AND organization_id = $2
            RETURNING id, organization_id, name, code, time_zone, service_area_label, status
            "#,
        )
        .bind(branch_id)
        .bind(organization_id)
        .bind(status)
        .fetch_optional(&mut *tx)
        .await
        {
            Ok(Some(row)) => row,
            Ok(None) => return UpdateBranchStatusResult::NotFound,
            Err(_) => return UpdateBranchStatusResult::Unavailable,
        };
        if sqlx::query(
            r#"
            INSERT INTO access_audit_events (
                id, actor_user_id, organization_id, event_kind, target_id, occurred_at, metadata
            ) VALUES (
                $1, $2, $3, 'branch_status_updated', $4, NOW(),
                jsonb_build_object('status', $5::text)
            )
            "#,
        )
        .bind(format!(
            "audit_branch_status_updated_{}",
            Uuid::new_v4().simple()
        ))
        .bind(actor_user_id)
        .bind(organization_id)
        .bind(branch_id)
        .bind(status)
        .execute(&mut *tx)
        .await
        .is_err()
            || tx.commit().await.is_err()
        {
            return UpdateBranchStatusResult::Unavailable;
        }
        UpdateBranchStatusResult::Updated(OrganizationBranchSummary {
            id: row.get("id"),
            organization_id: row.get("organization_id"),
            name: row.get("name"),
            code: row.get("code"),
            time_zone: row.get("time_zone"),
            service_area_label: row.get("service_area_label"),
            status: row.get("status"),
        })
    }

    pub async fn update_service_territory_status(
        &self,
        organization_id: &str,
        territory_id: &str,
        actor_user_id: &str,
        status: &str,
    ) -> UpdateTerritoryStatusResult {
        let Some(pool) = &self.pool else {
            return UpdateTerritoryStatusResult::Unavailable;
        };
        let mut tx = match pool.begin().await {
            Ok(tx) => tx,
            Err(_) => return UpdateTerritoryStatusResult::Unavailable,
        };
        if status == "inactive" {
            let has_active_crews: bool = match sqlx::query_scalar(
                r#"
                SELECT EXISTS (
                    SELECT 1 FROM crews
                    WHERE organization_id = $1 AND territory_id = $2 AND status = 'active'
                )
                "#,
            )
            .bind(organization_id)
            .bind(territory_id)
            .fetch_one(&mut *tx)
            .await
            {
                Ok(value) => value,
                Err(_) => return UpdateTerritoryStatusResult::Unavailable,
            };
            if has_active_crews {
                return UpdateTerritoryStatusResult::OperationalConflict;
            }
        }
        let row = match sqlx::query(
            r#"
            UPDATE service_territories territory
            SET status = $3, updated_at = NOW()
            FROM organization_branches branch
            WHERE territory.id = $1
              AND territory.organization_id = $2
              AND branch.id = territory.branch_id
              AND branch.organization_id = territory.organization_id
              AND ($3 <> 'active' OR branch.status = 'active')
            RETURNING territory.id, territory.organization_id, territory.branch_id,
                      territory.name, territory.status
            "#,
        )
        .bind(territory_id)
        .bind(organization_id)
        .bind(status)
        .fetch_optional(&mut *tx)
        .await
        {
            Ok(Some(row)) => row,
            Ok(None) => return UpdateTerritoryStatusResult::NotFound,
            Err(_) => return UpdateTerritoryStatusResult::Unavailable,
        };
        if sqlx::query(
            r#"
            INSERT INTO access_audit_events (
                id, actor_user_id, organization_id, event_kind, target_id, occurred_at, metadata
            ) VALUES (
                $1, $2, $3, 'territory_status_updated', $4, NOW(),
                jsonb_build_object('status', $5::text, 'branch_id', $6::text)
            )
            "#,
        )
        .bind(format!(
            "audit_territory_status_updated_{}",
            Uuid::new_v4().simple()
        ))
        .bind(actor_user_id)
        .bind(organization_id)
        .bind(territory_id)
        .bind(status)
        .bind(row.get::<String, _>("branch_id"))
        .execute(&mut *tx)
        .await
        .is_err()
            || tx.commit().await.is_err()
        {
            return UpdateTerritoryStatusResult::Unavailable;
        }
        UpdateTerritoryStatusResult::Updated(ServiceTerritorySummary {
            id: row.get("id"),
            organization_id: row.get("organization_id"),
            branch_id: row.get("branch_id"),
            name: row.get("name"),
            status: row.get("status"),
        })
    }

    pub async fn list_service_territories(
        &self,
        organization_ids: &[String],
    ) -> PersistedReadResult<Vec<ServiceTerritorySummary>> {
        if organization_ids.is_empty() {
            return PersistedReadResult::Loaded(Vec::new());
        }
        let Some(pool) = &self.pool else {
            return PersistedReadResult::Loaded(Vec::new());
        };
        match sqlx::query(
            r#"
            SELECT id, organization_id, branch_id, name, status
            FROM service_territories
            WHERE organization_id = ANY($1)
            ORDER BY organization_id, branch_id, status, name, id
            "#,
        )
        .bind(organization_ids)
        .fetch_all(pool)
        .await
        {
            Ok(rows) => PersistedReadResult::Loaded(
                rows.into_iter()
                    .map(|row| ServiceTerritorySummary {
                        id: row.get("id"),
                        organization_id: row.get("organization_id"),
                        branch_id: row.get("branch_id"),
                        name: row.get("name"),
                        status: row.get("status"),
                    })
                    .collect(),
            ),
            Err(error) => {
                tracing::error!(%error, "persisted service territory list failed");
                PersistedReadResult::Unavailable
            }
        }
    }

    pub async fn create_crew(
        &self,
        organization_id: &str,
        request: CreateCrewRequest,
    ) -> PersistedMutationResult<CrewSummary> {
        let name = request.name.trim();
        if validate_create_crew_name(name).is_err() {
            return PersistedMutationResult::Conflict;
        }
        let id = format!("crew_{}", Uuid::new_v4().simple());
        if let Some(pool) = &self.pool {
            return match postgres_day_plans::create_crew(pool, &id, organization_id, name).await {
                Ok(Some(crew)) => PersistedMutationResult::Applied(crew),
                Ok(None) => PersistedMutationResult::Conflict,
                Err(error) => {
                    tracing::error!(%error, organization_id, "persisted crew creation failed");
                    PersistedMutationResult::Unavailable
                }
            };
        }
        PersistedMutationResult::Applied(CrewSummary {
            id,
            name: name.to_string(),
            organization_id: organization_id.to_string(),
            branch_id: None,
            territory_id: None,
            status: "active".to_string(),
            daily_stop_capacity: 10,
            lead_membership_id: None,
            persisted: false,
        })
    }

    pub async fn list_organization_crews(
        &self,
        organization_id: &str,
    ) -> PersistedReadResult<Vec<CrewSummary>> {
        if let Some(pool) = &self.pool {
            return match postgres_day_plans::list_organization_crews(pool, organization_id).await {
                Ok(crews) => PersistedReadResult::Loaded(crews),
                Err(error) => {
                    tracing::error!(%error, organization_id, "persisted organization crew list failed");
                    PersistedReadResult::Unavailable
                }
            };
        }
        PersistedReadResult::Loaded(seed_crews(&[organization_id.to_string()]))
    }

    pub async fn update_crew(
        &self,
        organization_id: &str,
        crew_id: &str,
        actor_user_id: &str,
        request: UpdateCrewRequest,
    ) -> UpdateCrewResult {
        let name = request.name.trim();
        let status = request.status.trim();
        let daily_stop_capacity = request.daily_stop_capacity.unwrap_or(10);
        if validate_create_crew_name(name).is_err()
            || !matches!(status, "active" | "inactive")
            || !(1..=100).contains(&daily_stop_capacity)
        {
            return UpdateCrewResult::NotFound;
        }
        if let Some(pool) = &self.pool {
            return postgres_day_plans::update_crew(
                pool,
                organization_id,
                crew_id,
                actor_user_id,
                name,
                status,
                daily_stop_capacity,
                request.lead_membership_id.as_deref(),
                request.branch_id.as_deref(),
                request.territory_id.as_deref(),
            )
            .await
            .unwrap_or_else(|error| {
                tracing::error!(%error, organization_id, crew_id, "persisted crew update failed");
                UpdateCrewResult::Unavailable
            });
        }
        let Some(mut crew) = seed_crews(&[organization_id.to_string()])
            .into_iter()
            .find(|crew| crew.id == crew_id)
        else {
            return UpdateCrewResult::NotFound;
        };
        crew.name = name.to_string();
        crew.status = status.to_string();
        crew.daily_stop_capacity = daily_stop_capacity;
        crew.lead_membership_id = request.lead_membership_id;
        if let (Some(branch_id), Some(territory_id)) = (request.branch_id, request.territory_id) {
            crew.branch_id = Some(branch_id);
            crew.territory_id = Some(territory_id);
        }
        UpdateCrewResult::Updated(crew)
    }

    pub async fn organization_id_for_day_plan(
        &self,
        day_plan_id: &str,
    ) -> PersistedReadResult<Option<String>> {
        if let Some(pool) = &self.pool {
            return match postgres_day_plans::organization_id_for_day_plan(pool, day_plan_id).await {
                Ok(organization_id) => PersistedReadResult::Loaded(organization_id),
                Err(error) => {
                    tracing::error!(%error, day_plan_id, "persisted day-plan ownership lookup failed");
                    PersistedReadResult::Unavailable
                }
            };
        }

        let organization_id = day_plan_parts_from_id(day_plan_id)
            .and_then(|(_, crew_id)| seed_organization_id_for_crew(&crew_id));
        PersistedReadResult::Loaded(organization_id)
    }

    pub async fn create_draft_day_plan(
        &self,
        request: CreateDayPlanRequest,
    ) -> PersistedMutationResult<DayPlanMutationResponse> {
        self.create_draft_day_plan_as(request, "system").await
    }

    pub async fn create_draft_day_plan_as(
        &self,
        request: CreateDayPlanRequest,
        actor_user_id: &str,
    ) -> PersistedMutationResult<DayPlanMutationResponse> {
        let request = normalize_create_day_plan_request(request);
        let id = draft_day_plan_id(&request.crew_id, &request.service_date);

        if let Some(pool) = &self.pool {
            return match postgres_day_plans::create_draft_day_plan(
                pool,
                &id,
                &request.crew_id,
                &request.service_date,
                actor_user_id,
            )
            .await
            {
                Ok(Some(day_plan)) => PersistedMutationResult::Applied(day_plan),
                Ok(None) => match sqlx::query_scalar::<_, bool>(
                    "SELECT EXISTS(SELECT 1 FROM crews WHERE id = $1 AND status = 'active')",
                )
                .bind(&request.crew_id)
                .fetch_one(pool)
                .await
                {
                    Ok(true) => PersistedMutationResult::Conflict,
                    Ok(false) => PersistedMutationResult::NotFound,
                    Err(error) => {
                        tracing::error!(%error, crew_id = request.crew_id, "persisted route draft recovery failed");
                        PersistedMutationResult::Unavailable
                    }
                },
                Err(error) => {
                    tracing::error!(%error, crew_id = request.crew_id, "persisted route draft creation failed");
                    PersistedMutationResult::Unavailable
                }
            };
        }

        PersistedMutationResult::Applied(draft_day_plan_response(&request, false))
    }

    pub async fn publish_day_plan(
        &self,
        id: &str,
    ) -> PersistedMutationResult<DayPlanMutationResponse> {
        self.publish_day_plan_as(id, "system").await
    }

    pub async fn publish_day_plan_as(
        &self,
        id: &str,
        actor_user_id: &str,
    ) -> PersistedMutationResult<DayPlanMutationResponse> {
        if let Some(pool) = &self.pool {
            return match postgres_day_plans::publish_day_plan(pool, id, actor_user_id).await {
                Ok(Some(day_plan)) => PersistedMutationResult::Applied(day_plan),
                Ok(None) => {
                    match postgres_day_plans::organization_id_for_day_plan(pool, id).await {
                        Ok(Some(_)) => PersistedMutationResult::Conflict,
                        Ok(None) => PersistedMutationResult::NotFound,
                        Err(error) => {
                            tracing::error!(%error, day_plan_id = id, "persisted route publication recovery failed");
                            PersistedMutationResult::Unavailable
                        }
                    }
                }
                Err(error) => {
                    tracing::error!(%error, day_plan_id = id, "persisted route publication failed");
                    PersistedMutationResult::Unavailable
                }
            };
        }

        PersistedMutationResult::Applied(local_published_day_plan_response(id))
    }

    pub async fn assign_stop(
        &self,
        day_plan_id: &str,
        request: AssignDayPlanStopRequest,
    ) -> PersistedMutationResult<DayPlanStopMutationResponse> {
        self.assign_stop_as(day_plan_id, request, "system").await
    }

    pub async fn assign_stop_as(
        &self,
        day_plan_id: &str,
        request: AssignDayPlanStopRequest,
        actor_user_id: &str,
    ) -> PersistedMutationResult<DayPlanStopMutationResponse> {
        let stop_id = draft_stop_id(day_plan_id, &request.job_id);

        if let Some(pool) = &self.pool {
            return match postgres_day_plans::assign_stop(
                pool,
                day_plan_id,
                &stop_id,
                &request,
                actor_user_id,
            )
            .await
            {
                Ok(Some(response)) => PersistedMutationResult::Applied(response),
                Ok(None) => PersistedMutationResult::Conflict,
                Err(error) => {
                    tracing::error!(%error, day_plan_id, "persisted route stop assignment failed");
                    PersistedMutationResult::Unavailable
                }
            };
        }

        PersistedMutationResult::Applied(DayPlanStopMutationResponse {
            day_plan_id: day_plan_id.to_string(),
            stop_id,
            job_id: request.job_id,
            stop_order: 0,
            persisted: false,
        })
    }

    pub async fn remove_stop(
        &self,
        day_plan_id: &str,
        stop_id: &str,
    ) -> PersistedMutationResult<DayPlanStopRemovalResponse> {
        self.remove_stop_as(day_plan_id, stop_id, "system").await
    }

    pub async fn remove_stop_as(
        &self,
        day_plan_id: &str,
        stop_id: &str,
        actor_user_id: &str,
    ) -> PersistedMutationResult<DayPlanStopRemovalResponse> {
        if let Some(pool) = &self.pool {
            return match postgres_day_plans::remove_stop(pool, day_plan_id, stop_id, actor_user_id)
                .await
            {
                Ok(true) => PersistedMutationResult::Applied(DayPlanStopRemovalResponse {
                    day_plan_id: day_plan_id.to_string(),
                    stop_id: stop_id.to_string(),
                    persisted: true,
                }),
                Ok(false) => PersistedMutationResult::Conflict,
                Err(error) => {
                    tracing::error!(%error, day_plan_id, stop_id, "persisted route stop removal failed");
                    PersistedMutationResult::Unavailable
                }
            };
        }

        PersistedMutationResult::Applied(DayPlanStopRemovalResponse {
            day_plan_id: day_plan_id.to_string(),
            stop_id: stop_id.to_string(),
            persisted: false,
        })
    }

    pub async fn reorder_stops(
        &self,
        day_plan_id: &str,
        request: ReorderDayPlanStopsRequest,
    ) -> PersistedMutationResult<DayPlanStopReorderResponse> {
        self.reorder_stops_as(day_plan_id, request, "system").await
    }

    pub async fn reorder_stops_as(
        &self,
        day_plan_id: &str,
        request: ReorderDayPlanStopsRequest,
        actor_user_id: &str,
    ) -> PersistedMutationResult<DayPlanStopReorderResponse> {
        if let Some(pool) = &self.pool {
            return match postgres_day_plans::reorder_stops(
                pool,
                day_plan_id,
                &request.stop_ids,
                actor_user_id,
            )
            .await
            {
                Ok(true) => PersistedMutationResult::Applied(DayPlanStopReorderResponse {
                    day_plan_id: day_plan_id.to_string(),
                    stop_ids: request.stop_ids,
                    persisted: true,
                }),
                Ok(false) => PersistedMutationResult::NotFound,
                Err(error) => {
                    tracing::error!(%error, day_plan_id, "persisted route stop reorder failed");
                    PersistedMutationResult::Unavailable
                }
            };
        }

        PersistedMutationResult::Applied(DayPlanStopReorderResponse {
            day_plan_id: day_plan_id.to_string(),
            stop_ids: request.stop_ids,
            persisted: false,
        })
    }

    pub async fn today_for_crew(&self, crew_id: &str) -> TodayDayPlanResult {
        if let Some(pool) = &self.pool {
            return match postgres_day_plans::today_for_crew(pool, crew_id).await {
                Ok(Some(day_plan)) => TodayDayPlanResult::Found(day_plan),
                Ok(None) => TodayDayPlanResult::NotFound,
                Err(error) => {
                    tracing::error!(%error, crew_id, "persisted crew day plan read failed");
                    TodayDayPlanResult::Unavailable
                }
            };
        }

        TodayDayPlanResult::Found(seed_day_plan(crew_id))
    }

    pub async fn create_amendment(
        &self,
        day_plan_id: &str,
        request: CreateDayPlanAmendmentRequest,
    ) -> PersistedMutationResult<DayPlanAmendmentResponse> {
        let response = local_amendment_response(day_plan_id, request);

        if let Some(pool) = &self.pool {
            return match postgres_day_plans::create_amendment(pool, &response).await {
                Ok(Some(persisted)) => PersistedMutationResult::Applied(persisted),
                Ok(None) => match postgres_day_plans::list_amendments(pool, day_plan_id).await {
                    Ok(amendments) => amendments
                        .into_iter()
                        .find(|amendment| amendment.id == response.id)
                        .map(PersistedMutationResult::Applied)
                        .unwrap_or(PersistedMutationResult::Conflict),
                    Err(error) => {
                        tracing::error!(%error, day_plan_id, "persisted route amendment recovery failed");
                        PersistedMutationResult::Unavailable
                    }
                },
                Err(error) => {
                    tracing::error!(%error, day_plan_id, "persisted route amendment creation failed");
                    PersistedMutationResult::Unavailable
                }
            };
        }

        PersistedMutationResult::Applied(response)
    }

    pub async fn list_amendments(
        &self,
        day_plan_id: &str,
    ) -> PersistedReadResult<Vec<DayPlanAmendmentResponse>> {
        if let Some(pool) = &self.pool {
            return match postgres_day_plans::list_amendments(pool, day_plan_id).await {
                Ok(amendments) => PersistedReadResult::Loaded(amendments),
                Err(error) => {
                    tracing::error!(%error, day_plan_id, "persisted route amendment list failed");
                    PersistedReadResult::Unavailable
                }
            };
        }

        PersistedReadResult::Loaded(Vec::new())
    }

    pub async fn review_amendment(
        &self,
        day_plan_id: &str,
        amendment_id: &str,
        request: ReviewDayPlanAmendmentRequest,
    ) -> PersistedMutationResult<DayPlanAmendmentReviewResponse> {
        let status = amendment_review_status(&request.decision)
            .expect("review request must be validated before repository use")
            .to_string();

        if let Some(pool) = &self.pool {
            return match postgres_day_plans::review_amendment(
                pool,
                day_plan_id,
                amendment_id,
                &status,
                request.manager_note.as_deref(),
            )
            .await
            {
                Ok(Some(response)) => PersistedMutationResult::Applied(response),
                Ok(None) => match postgres_day_plans::list_amendments(pool, day_plan_id).await {
                    Ok(amendments) if amendments.iter().any(|item| item.id == amendment_id) => {
                        PersistedMutationResult::Conflict
                    }
                    Ok(_) => PersistedMutationResult::NotFound,
                    Err(error) => {
                        tracing::error!(%error, day_plan_id, amendment_id, "persisted route amendment review recovery failed");
                        PersistedMutationResult::Unavailable
                    }
                },
                Err(error) => {
                    tracing::error!(%error, day_plan_id, amendment_id, "persisted route amendment review failed");
                    PersistedMutationResult::Unavailable
                }
            };
        }

        PersistedMutationResult::Applied(DayPlanAmendmentReviewResponse {
            id: amendment_id.to_string(),
            day_plan_id: day_plan_id.to_string(),
            status,
            manager_note: request.manager_note,
            persisted: false,
        })
    }
}

pub fn normalize_create_day_plan_request(request: CreateDayPlanRequest) -> CreateDayPlanRequest {
    CreateDayPlanRequest {
        crew_id: request.crew_id.trim().to_string(),
        service_date: request.service_date.trim().to_string(),
    }
}

pub fn validate_create_crew_name(name: &str) -> Result<(), String> {
    let length = name.trim().chars().count();
    if length < 2 {
        return Err("crew name must contain at least two characters".to_string());
    }
    if length > 120 {
        return Err("crew name cannot exceed 120 characters".to_string());
    }
    Ok(())
}

pub fn validate_create_day_plan_request(request: &CreateDayPlanRequest) -> Result<(), String> {
    if request.crew_id.trim().is_empty() {
        return Err("crew_id is required".to_string());
    }

    if request.service_date.trim().is_empty() {
        return Err("service_date is required".to_string());
    }

    if !is_valid_service_date(&request.service_date) {
        return Err("service_date must use YYYY-MM-DD".to_string());
    }

    Ok(())
}

fn is_valid_service_date(service_date: &str) -> bool {
    let mut parts = service_date.split('-');
    let (Some(year), Some(month), Some(day), None) =
        (parts.next(), parts.next(), parts.next(), parts.next())
    else {
        return false;
    };

    if year.len() != 4 || month.len() != 2 || day.len() != 2 {
        return false;
    }

    if !year.bytes().all(|byte| byte.is_ascii_digit())
        || !month.bytes().all(|byte| byte.is_ascii_digit())
        || !day.bytes().all(|byte| byte.is_ascii_digit())
    {
        return false;
    }

    let Ok(year) = year.parse::<u32>() else {
        return false;
    };
    let Ok(month) = month.parse::<u32>() else {
        return false;
    };
    let Ok(day) = day.parse::<u32>() else {
        return false;
    };

    if year == 0 {
        return false;
    }

    let max_day = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if is_leap_year(year) => 29,
        2 => 28,
        _ => return false,
    };

    (1..=max_day).contains(&day)
}

fn is_leap_year(year: u32) -> bool {
    (year.is_multiple_of(4) && !year.is_multiple_of(100)) || year.is_multiple_of(400)
}

pub fn validate_amendment_review(request: &ReviewDayPlanAmendmentRequest) -> Result<(), String> {
    if amendment_review_status(&request.decision).is_none() {
        return Err(format!(
            "unsupported amendment decision: {}",
            request.decision
        ));
    }

    if request
        .manager_note
        .as_deref()
        .is_some_and(|note| note.trim().is_empty())
    {
        return Err("manager_note cannot be blank".to_string());
    }

    Ok(())
}

fn amendment_review_status(decision: &str) -> Option<&'static str> {
    match decision {
        "approve" => Some("approved"),
        "reject" => Some("rejected"),
        "send_to_bid_review" => Some("bid_review"),
        _ => None,
    }
}

pub fn validate_amendment_request(request: &CreateDayPlanAmendmentRequest) -> Result<(), String> {
    if request
        .client_mutation_id
        .as_deref()
        .is_some_and(|id| Uuid::parse_str(id).is_err())
    {
        return Err("client_mutation_id must be a UUID when provided".to_string());
    }
    if request.requested_by_crew_id.trim().is_empty() {
        return Err("requested_by_crew_id is required".to_string());
    }

    if request
        .note
        .as_deref()
        .is_some_and(|note| note.trim().is_empty())
    {
        return Err("note cannot be blank".to_string());
    }

    match request.amendment_type.as_str() {
        "add_stop" if request.stop_id.is_none() && request.service.is_none() => Ok(()),
        "remove_stop" if request.stop_id.is_some() && request.service.is_none() => Ok(()),
        "add_service" if request.stop_id.is_some() && request.service.is_some() => {
            let service = request.service.as_ref().expect("service checked above");
            if service.id.trim().is_empty() || service.name.trim().is_empty() {
                Err("service id and name are required".to_string())
            } else {
                Ok(())
            }
        }
        "add_stop" | "remove_stop" | "add_service" => Err(format!(
            "amendment fields do not match amendment_type {}",
            request.amendment_type
        )),
        _ => Err(format!(
            "unsupported amendment_type: {}",
            request.amendment_type
        )),
    }
}

fn local_amendment_response(
    day_plan_id: &str,
    request: CreateDayPlanAmendmentRequest,
) -> DayPlanAmendmentResponse {
    let mutation_uuid = request
        .client_mutation_id
        .as_deref()
        .and_then(|id| Uuid::parse_str(id).ok());
    let nonce = mutation_uuid.map(|id| id.as_u128()).unwrap_or_else(|| {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0)
    });
    let requires_bid = request.amendment_type == "add_service"
        && request
            .service
            .as_ref()
            .is_some_and(|service| service.requires_manager_approval);

    DayPlanAmendmentResponse {
        id: mutation_uuid
            .map(|id| format!("amendment_offline_{}", id.simple()))
            .unwrap_or_else(|| {
                format!(
                    "amendment_{}_{}_{}",
                    day_plan_id.replace(|character: char| !character.is_ascii_alphanumeric(), "_"),
                    request.amendment_type,
                    nonce
                )
            }),
        day_plan_id: day_plan_id.to_string(),
        amendment_type: request.amendment_type,
        status: "submitted".to_string(),
        requested_by_crew_id: request.requested_by_crew_id,
        stop_id: request.stop_id,
        service: request.service,
        note: request.note,
        requires_bid,
        manager_note: None,
        persisted: false,
    }
}

pub fn draft_day_plan_id(crew_id: &str, service_date: &str) -> String {
    format!("day_plan_{}_{}", service_date.replace('-', "_"), crew_id)
}

pub fn draft_stop_id(day_plan_id: &str, job_id: &str) -> String {
    format!("stop_{day_plan_id}_{job_id}")
}

#[cfg(test)]
pub fn local_draft_day_plan_response(request: &CreateDayPlanRequest) -> DayPlanMutationResponse {
    draft_day_plan_response(request, false)
}

pub fn local_published_day_plan_response(id: &str) -> DayPlanMutationResponse {
    let (service_date, crew_id) = day_plan_parts_from_id(id).unwrap_or_default();

    DayPlanMutationResponse {
        id: id.to_string(),
        crew_id,
        service_date,
        status: "published".to_string(),
        route_status: "manual".to_string(),
        time_zone: "America/Phoenix".to_string(),
        service_area_label: Some("Phoenix metro".to_string()),
        stop_capacity: 12,
        persisted: false,
    }
}

fn draft_day_plan_response(
    request: &CreateDayPlanRequest,
    persisted: bool,
) -> DayPlanMutationResponse {
    DayPlanMutationResponse {
        id: draft_day_plan_id(&request.crew_id, &request.service_date),
        crew_id: request.crew_id.clone(),
        service_date: request.service_date.clone(),
        status: "draft".to_string(),
        route_status: "manual".to_string(),
        time_zone: "America/Phoenix".to_string(),
        service_area_label: Some("Phoenix metro".to_string()),
        stop_capacity: 12,
        persisted,
    }
}

fn day_plan_parts_from_id(id: &str) -> Option<(String, String)> {
    let parts: Vec<&str> = id.strip_prefix("day_plan_")?.split('_').collect();
    if parts.len() < 4 {
        return None;
    }

    let service_date = format!("{}-{}-{}", parts[0], parts[1], parts[2]);
    let crew_id = parts[3..].join("_");

    Some((service_date, crew_id))
}

fn seed_day_plan(crew_id: &str) -> DayPlanSummary {
    DayPlanSummary {
        id: "day_plan_2026_06_15_crew_1001".to_string(),
        crew_id: crew_id.to_string(),
        crew_name: "North Route Crew".to_string(),
        organization_id: "org_demo_landscaping".to_string(),
        service_date: "2026-06-15".to_string(),
        status: "published".to_string(),
        route_status: "manual".to_string(),
        stops: vec![
            DayPlanStop {
                id: "stop_1001".to_string(),
                job_id: "job_1001".to_string(),
                customer_name: "Sample Customer".to_string(),
                property_address: "123 Oak Street".to_string(),
                stop_order: 1,
                job_status: "scheduled".to_string(),
                stop_status: "pending".to_string(),
                estimated_drive_minutes: 12,
                estimated_service_minutes: 45,
            },
            DayPlanStop {
                id: "stop_1002".to_string(),
                job_id: "job_1002".to_string(),
                customer_name: "Demo Property Owner".to_string(),
                property_address: "456 Maple Avenue".to_string(),
                stop_order: 2,
                job_status: "in_progress".to_string(),
                stop_status: "pending".to_string(),
                estimated_drive_minutes: 8,
                estimated_service_minutes: 60,
            },
        ],
    }
}

fn seed_organization_id_for_crew(crew_id: &str) -> Option<String> {
    if crew_id == "crew_1001" {
        Some("org_demo_landscaping".to_string())
    } else {
        None
    }
}

fn seed_crews(organization_ids: &[String]) -> Vec<CrewSummary> {
    if !organization_ids
        .iter()
        .any(|id| id == "org_demo_landscaping")
    {
        return Vec::new();
    }
    vec![CrewSummary {
        id: "crew_1001".to_string(),
        name: "North Route Crew".to_string(),
        organization_id: "org_demo_landscaping".to_string(),
        branch_id: None,
        territory_id: None,
        status: "active".to_string(),
        daily_stop_capacity: 10,
        lead_membership_id: None,
        persisted: false,
    }]
}

#[cfg(test)]
mod tests {
    use super::{
        draft_day_plan_id, draft_stop_id, local_draft_day_plan_response,
        local_published_day_plan_response, normalize_create_day_plan_request, seed_day_plan,
        validate_amendment_request, validate_amendment_review, validate_create_crew_name,
        validate_create_day_plan_request, validate_create_organization_branch_request,
        validate_create_service_territory_request, AmendmentService, AssignDayPlanStopRequest,
        CreateCrewRequest, CreateDayPlanAmendmentRequest, CreateDayPlanRequest,
        CreateOrganizationBranchRequest, CreateServiceTerritoryRequest, DayPlanRepository,
        PersistedMutationResult, PersistedReadResult, ReorderDayPlanStopsRequest,
        ReviewDayPlanAmendmentRequest, TodayDayPlanResult,
    };

    #[test]
    fn branch_creation_validation_accepts_supported_owner_inputs() {
        assert!(
            validate_create_organization_branch_request(&CreateOrganizationBranchRequest {
                name: "East Valley".to_string(),
                code: "east_1".to_string(),
                time_zone: "America/Phoenix".to_string(),
                service_area_label: Some("Mesa and Tempe".to_string()),
            },)
            .is_ok()
        );
        assert_eq!(
            validate_create_organization_branch_request(&CreateOrganizationBranchRequest {
                name: "East Valley".to_string(),
                code: "east valley!".to_string(),
                time_zone: "UTC".to_string(),
                service_area_label: None,
            },),
            Err("branch_code_invalid")
        );
    }

    #[test]
    fn territory_creation_validation_requires_branch_and_name() {
        assert!(
            validate_create_service_territory_request(&CreateServiceTerritoryRequest {
                branch_id: "branch_1001".to_string(),
                name: "East Valley".to_string(),
            })
            .is_ok()
        );
        assert_eq!(
            validate_create_service_territory_request(&CreateServiceTerritoryRequest {
                branch_id: " ".to_string(),
                name: "East Valley".to_string(),
            }),
            Err("territory_branch_invalid")
        );
    }

    #[test]
    fn seeded_day_plan_keeps_ordered_stops() {
        let day_plan = seed_day_plan("crew_1001");

        assert_eq!(day_plan.stops.len(), 2);
        assert_eq!(day_plan.stops[0].stop_order, 1);
        assert_eq!(day_plan.stops[1].stop_order, 2);
    }

    #[test]
    fn seeded_day_plan_includes_stop_status() {
        let day_plan = seed_day_plan("crew_1001");

        assert_eq!(day_plan.stops[0].stop_status, "pending");
        assert_eq!(day_plan.stops[1].stop_status, "pending");
    }

    #[test]
    fn create_day_plan_validation_normalizes_target_fields() {
        let request = normalize_create_day_plan_request(CreateDayPlanRequest {
            crew_id: " crew_1001 ".to_string(),
            service_date: " 2026-06-16 ".to_string(),
        });

        assert_eq!(request.crew_id, "crew_1001");
        assert_eq!(request.service_date, "2026-06-16");
    }

    #[test]
    fn create_day_plan_validation_rejects_blank_targets() {
        let request = CreateDayPlanRequest {
            crew_id: "   ".to_string(),
            service_date: "2026-06-16".to_string(),
        };

        assert!(validate_create_day_plan_request(&request).is_err());

        let request = CreateDayPlanRequest {
            crew_id: "crew_1001".to_string(),
            service_date: "   ".to_string(),
        };

        assert!(validate_create_day_plan_request(&request).is_err());
    }

    #[test]
    fn create_day_plan_validation_rejects_invalid_service_dates() {
        for service_date in ["2026/06/16", "2026-13-16", "2026-02-30", "0000-06-16"] {
            let request = CreateDayPlanRequest {
                crew_id: "crew_1001".to_string(),
                service_date: service_date.to_string(),
            };

            assert!(validate_create_day_plan_request(&request).is_err());
        }
    }

    #[test]
    fn create_day_plan_validation_accepts_leap_day() {
        let request = CreateDayPlanRequest {
            crew_id: "crew_1001".to_string(),
            service_date: "2028-02-29".to_string(),
        };

        assert!(validate_create_day_plan_request(&request).is_ok());
    }

    #[test]
    fn amendment_validation_requires_stop_context_for_remove_requests() {
        let request = CreateDayPlanAmendmentRequest {
            amendment_type: "remove_stop".to_string(),
            requested_by_crew_id: "crew_1001".to_string(),
            stop_id: None,
            service: None,
            note: Some("Skip inaccessible property".to_string()),
            client_mutation_id: None,
        };

        assert!(validate_amendment_request(&request).is_err());
    }

    #[test]
    fn amendment_review_validation_accepts_bid_routing() {
        let request = ReviewDayPlanAmendmentRequest {
            decision: "send_to_bid_review".to_string(),
            manager_note: Some("Prepare a customer estimate.".to_string()),
        };

        assert!(validate_amendment_review(&request).is_ok());
    }

    #[test]
    fn amendment_review_validation_rejects_unknown_decisions() {
        let request = ReviewDayPlanAmendmentRequest {
            decision: "defer".to_string(),
            manager_note: None,
        };

        assert!(validate_amendment_review(&request).is_err());
    }

    #[test]
    fn amendment_validation_accepts_complete_extra_service_requests() {
        let request = CreateDayPlanAmendmentRequest {
            amendment_type: "add_service".to_string(),
            requested_by_crew_id: "crew_1001".to_string(),
            stop_id: Some("stop_1001".to_string()),
            service: Some(AmendmentService {
                id: "service_sprinkler_repair".to_string(),
                name: "Sprinkler repair".to_string(),
                description: None,
                default_duration_minutes: Some(30),
                default_price_cents: Some(8500),
                requires_manager_approval: true,
            }),
            note: Some("Broken sprinkler head".to_string()),
            client_mutation_id: None,
        };

        assert!(validate_amendment_request(&request).is_ok());
    }

    #[test]
    fn amendment_validation_rejects_invalid_client_mutation_ids() {
        let request = CreateDayPlanAmendmentRequest {
            amendment_type: "add_stop".to_string(),
            requested_by_crew_id: "crew_1001".to_string(),
            stop_id: None,
            service: None,
            note: Some("Customer requested an additional visit".to_string()),
            client_mutation_id: Some("not-a-uuid".to_string()),
        };

        assert_eq!(
            validate_amendment_request(&request),
            Err("client_mutation_id must be a UUID when provided".to_string())
        );
    }

    #[test]
    fn draft_day_plan_ids_are_stable_for_crew_and_date() {
        assert_eq!(
            draft_day_plan_id("crew_1001", "2026-06-16"),
            "day_plan_2026_06_16_crew_1001"
        );
    }

    #[test]
    fn draft_stop_ids_are_stable_for_day_plan_and_job() {
        assert_eq!(
            draft_stop_id("day_plan_2026_06_16_crew_1001", "job_1002"),
            "stop_day_plan_2026_06_16_crew_1001_job_1002"
        );
    }

    #[test]
    fn local_draft_day_plan_responses_are_manual_drafts() {
        let request = CreateDayPlanRequest {
            crew_id: "crew_1001".to_string(),
            service_date: "2026-06-16".to_string(),
        };

        let response = local_draft_day_plan_response(&request);

        assert_eq!(response.status, "draft");
        assert_eq!(response.route_status, "manual");
        assert_eq!(response.time_zone, "America/Phoenix");
        assert_eq!(
            response.service_area_label.as_deref(),
            Some("Phoenix metro")
        );
        assert_eq!(response.stop_capacity, 12);
        assert!(!response.persisted);
    }

    #[test]
    fn crew_creation_requires_a_bounded_name() {
        assert!(validate_create_crew_name("North Route").is_ok());
        assert!(validate_create_crew_name(" ").is_err());
        assert!(validate_create_crew_name(&"x".repeat(121)).is_err());
    }

    #[tokio::test]
    async fn repository_creates_trimmed_local_crew_without_database_pool() {
        let PersistedMutationResult::Applied(crew) = DayPlanRepository::default()
            .create_crew(
                "org_demo_landscaping",
                CreateCrewRequest {
                    name: " North Route ".to_string(),
                },
            )
            .await
        else {
            panic!("local crew should be created");
        };

        assert_eq!(crew.name, "North Route");
        assert_eq!(crew.organization_id, "org_demo_landscaping");
        assert!(!crew.persisted);
    }

    #[test]
    fn local_published_day_plan_responses_parse_stable_ids() {
        let response = local_published_day_plan_response("day_plan_2026_06_16_crew_1001");

        assert_eq!(response.id, "day_plan_2026_06_16_crew_1001");
        assert_eq!(response.crew_id, "crew_1001");
        assert_eq!(response.service_date, "2026-06-16");
        assert_eq!(response.status, "published");
        assert_eq!(response.route_status, "manual");
        assert!(!response.persisted);
    }

    #[tokio::test]
    async fn repository_normalizes_created_draft_targets_without_database_pool() {
        let repository = DayPlanRepository::default();
        let request = CreateDayPlanRequest {
            crew_id: " crew_1001 ".to_string(),
            service_date: " 2026-06-16 ".to_string(),
        };

        let PersistedMutationResult::Applied(response) =
            repository.create_draft_day_plan(request).await
        else {
            panic!("no-database draft creation should retain demo behavior");
        };

        assert_eq!(response.id, "day_plan_2026_06_16_crew_1001");
        assert_eq!(response.crew_id, "crew_1001");
        assert_eq!(response.service_date, "2026-06-16");
    }

    #[tokio::test]
    async fn repository_returns_seed_day_plan_without_database_pool() {
        let repository = DayPlanRepository::default();

        let day_plan = repository.today_for_crew("crew_2001").await;
        let TodayDayPlanResult::Found(day_plan) = day_plan else {
            panic!("no-database repository should retain the seeded demo route");
        };

        assert_eq!(day_plan.crew_id, "crew_2001");
        assert_eq!(day_plan.status, "published");
        assert_eq!(day_plan.stops.len(), 2);
        assert_eq!(day_plan.stops[0].stop_status, "pending");
    }

    #[tokio::test]
    async fn repository_resolves_seed_day_plan_organization_without_database_pool() {
        let repository = DayPlanRepository::default();

        assert_eq!(
            repository.organization_id_for_crew("crew_1001").await,
            PersistedReadResult::Loaded(Some("org_demo_landscaping".to_string()))
        );
        assert_eq!(
            repository
                .organization_id_for_day_plan("day_plan_2026_06_15_crew_1001")
                .await,
            PersistedReadResult::Loaded(Some("org_demo_landscaping".to_string()))
        );
        assert_eq!(
            repository.organization_id_for_crew("crew_unknown").await,
            PersistedReadResult::Loaded(None)
        );
    }

    #[tokio::test]
    async fn repository_assign_stop_falls_back_without_database_pool() {
        let repository = DayPlanRepository::default();
        let request = AssignDayPlanStopRequest {
            job_id: "job_2001".to_string(),
            estimated_drive_minutes: Some(14),
            estimated_service_minutes: Some(45),
        };

        let PersistedMutationResult::Applied(response) = repository
            .assign_stop("day_plan_2026_06_16_crew_1001", request)
            .await
        else {
            panic!("no-database assignment should retain demo behavior");
        };

        assert_eq!(response.day_plan_id, "day_plan_2026_06_16_crew_1001");
        assert_eq!(
            response.stop_id,
            "stop_day_plan_2026_06_16_crew_1001_job_2001"
        );
        assert_eq!(response.job_id, "job_2001");
        assert_eq!(response.stop_order, 0);
        assert!(!response.persisted);
    }

    #[tokio::test]
    async fn repository_remove_stop_falls_back_without_database_pool() {
        let repository = DayPlanRepository::default();

        let PersistedMutationResult::Applied(response) = repository
            .remove_stop("day_plan_2026_06_16_crew_1001", "stop_1001")
            .await
        else {
            panic!("no-database removal should retain demo behavior");
        };

        assert_eq!(response.day_plan_id, "day_plan_2026_06_16_crew_1001");
        assert_eq!(response.stop_id, "stop_1001");
        assert!(!response.persisted);
    }

    #[tokio::test]
    async fn repository_reorder_stops_falls_back_without_database_pool() {
        let repository = DayPlanRepository::default();
        let request = ReorderDayPlanStopsRequest {
            stop_ids: vec!["stop_1002".to_string(), "stop_1001".to_string()],
        };

        let PersistedMutationResult::Applied(response) = repository
            .reorder_stops("day_plan_2026_06_16_crew_1001", request)
            .await
        else {
            panic!("no-database reorder should retain demo behavior");
        };

        assert_eq!(response.day_plan_id, "day_plan_2026_06_16_crew_1001");
        assert_eq!(
            response.stop_ids,
            vec!["stop_1002".to_string(), "stop_1001".to_string()]
        );
        assert!(!response.persisted);
    }
}
