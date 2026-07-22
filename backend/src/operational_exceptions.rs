use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use uuid::Uuid;

const CATEGORIES: [&str; 7] = [
    "delay",
    "staffing",
    "access",
    "weather",
    "equipment",
    "safety",
    "customer_escalation",
];
const PRIORITIES: [&str; 4] = ["low", "medium", "high", "critical"];
const STATUSES: [&str; 3] = ["open", "in_progress", "resolved"];
const RESOURCE_TYPES: [&str; 5] = ["route", "job", "property", "crew", "stop"];

#[derive(Clone, Debug, Deserialize)]
pub struct CreateOperationalExceptionRequest {
    pub organization_id: String,
    pub category: String,
    pub priority: String,
    pub title: String,
    pub description: Option<String>,
    pub affected_resource_type: Option<String>,
    pub affected_resource_id: Option<String>,
    pub assigned_user_id: Option<String>,
}

#[derive(Clone, Debug, Default)]
pub struct OperationalExceptionFilter {
    pub organization_ids: Vec<String>,
    pub organization_id: Option<String>,
    pub category: Option<String>,
    pub priority: Option<String>,
    pub status: Option<String>,
    pub limit: i64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct OperationalException {
    pub id: String,
    pub organization_id: String,
    pub category: String,
    pub priority: String,
    pub status: String,
    pub title: String,
    pub description: Option<String>,
    pub affected_resource_type: Option<String>,
    pub affected_resource_id: Option<String>,
    pub assigned_user_id: Option<String>,
    pub reported_by_user_id: String,
    pub resolved_by_user_id: Option<String>,
    pub resolution_note: Option<String>,
    pub resolved_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OperationalExceptionListResult {
    Loaded(Vec<OperationalException>),
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OperationalExceptionCreateResult {
    Created(Box<OperationalException>),
    Unavailable,
}

pub fn validate_create_operational_exception(
    request: &CreateOperationalExceptionRequest,
) -> Result<(), String> {
    validate_required_id("organization_id", &request.organization_id)?;
    validate_choice("category", &request.category, &CATEGORIES)?;
    validate_choice("priority", &request.priority, &PRIORITIES)?;
    validate_bounded_text("title", &request.title, 120, true)?;
    validate_optional_text("description", request.description.as_deref(), 2000)?;
    if let Some(assigned_user_id) = request.assigned_user_id.as_deref() {
        validate_required_id("assigned_user_id", assigned_user_id)?;
    }

    match (
        request.affected_resource_type.as_deref(),
        request.affected_resource_id.as_deref(),
    ) {
        (None, None) => Ok(()),
        (Some(resource_type), Some(resource_id)) => {
            validate_choice("affected_resource_type", resource_type, &RESOURCE_TYPES)?;
            validate_required_id("affected_resource_id", resource_id)
        }
        _ => Err(
            "affected_resource_type and affected_resource_id must be provided together".to_string(),
        ),
    }
}

pub fn validate_operational_exception_filter(
    filter: &OperationalExceptionFilter,
) -> Result<(), String> {
    if let Some(organization_id) = filter.organization_id.as_deref() {
        validate_required_id("organization_id", organization_id)?;
    }
    if let Some(category) = filter.category.as_deref() {
        validate_choice("category", category, &CATEGORIES)?;
    }
    if let Some(priority) = filter.priority.as_deref() {
        validate_choice("priority", priority, &PRIORITIES)?;
    }
    if let Some(status) = filter.status.as_deref() {
        validate_choice("status", status, &STATUSES)?;
    }
    if !(1..=100).contains(&filter.limit) {
        return Err("limit must be between 1 and 100".to_string());
    }
    Ok(())
}

fn validate_choice(field: &str, value: &str, choices: &[&str]) -> Result<(), String> {
    if choices.contains(&value) {
        Ok(())
    } else {
        Err(format!("{field} is not supported"))
    }
}

fn validate_required_id(field: &str, value: &str) -> Result<(), String> {
    validate_bounded_text(field, value, 200, true)?;
    if value != value.trim() || value.chars().any(char::is_whitespace) {
        return Err(format!("{field} must be a normalized identifier"));
    }
    Ok(())
}

fn validate_optional_text(field: &str, value: Option<&str>, max: usize) -> Result<(), String> {
    match value {
        Some(value) => validate_bounded_text(field, value, max, false),
        None => Ok(()),
    }
}

fn validate_bounded_text(
    field: &str,
    value: &str,
    max: usize,
    required: bool,
) -> Result<(), String> {
    let length = value.trim().chars().count();
    if (required && length == 0) || length > max {
        return Err(format!(
            "{field} must contain between 1 and {max} characters"
        ));
    }
    Ok(())
}

#[derive(Clone, Debug, Default)]
pub struct OperationalExceptionRepository {
    pool: Option<PgPool>,
}

impl OperationalExceptionRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn list(
        &self,
        filter: OperationalExceptionFilter,
    ) -> Result<OperationalExceptionListResult, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(OperationalExceptionListResult::Unavailable);
        };

        let rows = sqlx::query(
            r#"
            SELECT
                id, organization_id, category, priority, status, title, description,
                affected_resource_type, affected_resource_id, assigned_user_id,
                reported_by_user_id, resolved_by_user_id, resolution_note,
                resolved_at::text AS resolved_at, created_at::text AS created_at,
                updated_at::text AS updated_at
            FROM operational_exceptions
            WHERE organization_id = ANY($1)
              AND ($2::text IS NULL OR organization_id = $2)
              AND ($3::text IS NULL OR category = $3)
              AND ($4::text IS NULL OR priority = $4)
              AND ($5::text IS NULL OR status = $5)
            ORDER BY created_at DESC, id DESC
            LIMIT $6
            "#,
        )
        .bind(&filter.organization_ids)
        .bind(filter.organization_id.as_deref())
        .bind(filter.category.as_deref())
        .bind(filter.priority.as_deref())
        .bind(filter.status.as_deref())
        .bind(filter.limit)
        .fetch_all(pool)
        .await?;

        Ok(OperationalExceptionListResult::Loaded(
            rows.into_iter()
                .map(operational_exception_from_row)
                .collect(),
        ))
    }

    pub async fn create(
        &self,
        request: CreateOperationalExceptionRequest,
        actor_user_id: &str,
    ) -> Result<OperationalExceptionCreateResult, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(OperationalExceptionCreateResult::Unavailable);
        };
        let id = format!("exception_{}", Uuid::new_v4().simple());
        let mut transaction = pool.begin().await?;
        let row = sqlx::query(
            r#"
            INSERT INTO operational_exceptions (
                id, organization_id, category, priority, title, description,
                affected_resource_type, affected_resource_id, assigned_user_id,
                reported_by_user_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING
                id, organization_id, category, priority, status, title, description,
                affected_resource_type, affected_resource_id, assigned_user_id,
                reported_by_user_id, resolved_by_user_id, resolution_note,
                resolved_at::text AS resolved_at, created_at::text AS created_at,
                updated_at::text AS updated_at
            "#,
        )
        .bind(&id)
        .bind(request.organization_id.trim())
        .bind(&request.category)
        .bind(&request.priority)
        .bind(request.title.trim())
        .bind(request.description.as_deref().map(str::trim))
        .bind(request.affected_resource_type.as_deref())
        .bind(request.affected_resource_id.as_deref().map(str::trim))
        .bind(request.assigned_user_id.as_deref().map(str::trim))
        .bind(actor_user_id)
        .fetch_one(&mut *transaction)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO access_audit_events (
                id, actor_user_id, organization_id, event_kind, target_id, metadata, occurred_at
            )
            VALUES ($1, $2, $3, 'operational_exception_created', $4, $5, NOW())
            "#,
        )
        .bind(format!(
            "audit_exception_created_{}",
            Uuid::new_v4().simple()
        ))
        .bind(actor_user_id)
        .bind(request.organization_id.trim())
        .bind(&id)
        .bind(serde_json::json!({
            "category": request.category,
            "priority": request.priority,
            "affected_resource_type": request.affected_resource_type,
            "affected_resource_id": request.affected_resource_id,
        }))
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;
        Ok(OperationalExceptionCreateResult::Created(Box::new(
            operational_exception_from_row(row),
        )))
    }
}

fn operational_exception_from_row(row: sqlx::postgres::PgRow) -> OperationalException {
    OperationalException {
        id: row.get("id"),
        organization_id: row.get("organization_id"),
        category: row.get("category"),
        priority: row.get("priority"),
        status: row.get("status"),
        title: row.get("title"),
        description: row.get("description"),
        affected_resource_type: row.get("affected_resource_type"),
        affected_resource_id: row.get("affected_resource_id"),
        assigned_user_id: row.get("assigned_user_id"),
        reported_by_user_id: row.get("reported_by_user_id"),
        resolved_by_user_id: row.get("resolved_by_user_id"),
        resolution_note: row.get("resolution_note"),
        resolved_at: row.get("resolved_at"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

#[cfg(test)]
mod tests {
    use super::{
        validate_create_operational_exception, validate_operational_exception_filter,
        CreateOperationalExceptionRequest, OperationalExceptionFilter,
    };

    fn request() -> CreateOperationalExceptionRequest {
        CreateOperationalExceptionRequest {
            organization_id: "org_demo_landscaping".to_string(),
            category: "weather".to_string(),
            priority: "high".to_string(),
            title: "Lightning delay".to_string(),
            description: Some("Crew is sheltering until the storm passes.".to_string()),
            affected_resource_type: Some("route".to_string()),
            affected_resource_id: Some("day_plan_1001".to_string()),
            assigned_user_id: Some("user_manager_1001".to_string()),
        }
    }

    #[test]
    fn accepts_complete_exception_creation() {
        assert!(validate_create_operational_exception(&request()).is_ok());
    }

    #[test]
    fn rejects_unknown_values_and_partial_resource_context() {
        let mut invalid = request();
        invalid.category = "traffic".to_string();
        assert!(validate_create_operational_exception(&invalid).is_err());

        let mut invalid = request();
        invalid.priority = "urgent".to_string();
        assert!(validate_create_operational_exception(&invalid).is_err());

        let mut invalid = request();
        invalid.affected_resource_id = None;
        assert!(validate_create_operational_exception(&invalid).is_err());

        let mut invalid = request();
        invalid.assigned_user_id = Some(" ".to_string());
        assert!(validate_create_operational_exception(&invalid).is_err());
    }

    #[test]
    fn rejects_oversized_text_and_invalid_filters() {
        let mut invalid = request();
        invalid.title = "x".repeat(121);
        assert!(validate_create_operational_exception(&invalid).is_err());

        let filter = OperationalExceptionFilter {
            status: Some("closed".to_string()),
            limit: 101,
            ..OperationalExceptionFilter::default()
        };
        assert!(validate_operational_exception_filter(&filter).is_err());
    }
}
