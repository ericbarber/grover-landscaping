use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{PgPool, Row};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct SaveOwnerWorkspaceRequest {
    pub display_name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerWorkspaceRecord {
    pub owner_user_id: String,
    pub verified_email: String,
    pub display_name: String,
    pub status: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateOwnerPropertyRequest {
    pub display_name: String,
    pub address_line_1: String,
    pub address_line_2: Option<String>,
    pub city: String,
    pub region: String,
    pub postal_code: String,
    pub country_code: Option<String>,
    pub coarse_area: Option<String>,
    pub address_status: String,
    pub authority_attested: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerPropertyRecord {
    pub property_id: String,
    pub owner_user_id: String,
    pub display_name: String,
    pub address_line_1: String,
    pub address_line_2: String,
    pub city: String,
    pub region: String,
    pub postal_code: String,
    pub country_code: String,
    pub coarse_area: String,
    pub address_status: String,
    pub authority_attested: bool,
    pub status: String,
    pub version: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct SaveOwnerYardBriefRequest {
    pub status: String,
    pub yard_areas: Vec<String>,
    pub care_goals: Vec<String>,
    pub cadence_preference: String,
    pub considerations: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerYardBriefRecord {
    pub brief_id: String,
    pub owner_user_id: String,
    pub property_id: String,
    pub version: i64,
    pub status: String,
    pub yard_areas: Vec<String>,
    pub care_goals: Vec<String>,
    pub cadence_preference: String,
    pub considerations: String,
    pub author_source: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerReadResult<T> {
    Loaded(T),
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerMutationResult<T> {
    Saved(T),
    NotFound,
    Duplicate,
    Unavailable,
}

#[derive(Default)]
struct LocalOwnerState {
    workspaces: HashMap<String, OwnerWorkspaceRecord>,
    properties: HashMap<String, OwnerPropertyRecord>,
    yard_briefs: HashMap<String, Vec<OwnerYardBriefRecord>>,
}

#[derive(Clone, Default)]
pub struct OwnerAcquisitionRepository {
    pool: Option<PgPool>,
    local: Arc<RwLock<LocalOwnerState>>,
}

impl OwnerAcquisitionRepository {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn from_pool(pool: PgPool) -> Self {
        Self {
            pool: Some(pool),
            local: Arc::default(),
        }
    }

    pub async fn get_workspace(
        &self,
        owner_user_id: &str,
    ) -> OwnerReadResult<OwnerWorkspaceRecord> {
        let Some(pool) = &self.pool else {
            return self
                .local
                .read()
                .await
                .workspaces
                .get(owner_user_id)
                .cloned()
                .map(OwnerReadResult::Loaded)
                .unwrap_or(OwnerReadResult::NotFound);
        };

        match sqlx::query(
            "SELECT owner_user_id, verified_email, display_name, status
             FROM owner_workspaces
             WHERE owner_user_id = $1",
        )
        .bind(owner_user_id)
        .fetch_optional(pool)
        .await
        {
            Ok(Some(row)) => OwnerReadResult::Loaded(workspace_from_row(&row, true)),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, "owner workspace read failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn save_workspace(
        &self,
        owner_user_id: &str,
        verified_email: &str,
        request: SaveOwnerWorkspaceRequest,
    ) -> OwnerMutationResult<OwnerWorkspaceRecord> {
        let record = OwnerWorkspaceRecord {
            owner_user_id: owner_user_id.to_string(),
            verified_email: normalize_email(verified_email),
            display_name: request.display_name.trim().to_string(),
            status: "active".to_string(),
            persisted: self.pool.is_some(),
        };
        let Some(pool) = &self.pool else {
            self.local
                .write()
                .await
                .workspaces
                .insert(owner_user_id.to_string(), record.clone());
            return OwnerMutationResult::Saved(record);
        };

        match save_workspace(pool, &record).await {
            Ok(saved) => OwnerMutationResult::Saved(saved),
            Err(error) => {
                tracing::error!(%error, owner_user_id, "owner workspace save failed");
                OwnerMutationResult::Unavailable
            }
        }
    }

    pub async fn list_properties(
        &self,
        owner_user_id: &str,
    ) -> OwnerReadResult<Vec<OwnerPropertyRecord>> {
        let Some(pool) = &self.pool else {
            let mut properties: Vec<_> = self
                .local
                .read()
                .await
                .properties
                .values()
                .filter(|property| property.owner_user_id == owner_user_id)
                .cloned()
                .collect();
            properties.sort_by(|left, right| left.display_name.cmp(&right.display_name));
            return OwnerReadResult::Loaded(properties);
        };

        match sqlx::query(
            "SELECT id, owner_user_id, display_name, address_line_1, address_line_2,
                    city, region, postal_code, country_code, coarse_area,
                    address_status, authority_attested_at IS NOT NULL AS authority_attested,
                    status, version
             FROM owner_properties
             WHERE owner_user_id = $1
             ORDER BY updated_at DESC, id",
        )
        .bind(owner_user_id)
        .fetch_all(pool)
        .await
        {
            Ok(rows) => OwnerReadResult::Loaded(
                rows.iter()
                    .map(|row| property_from_row(row, true))
                    .collect(),
            ),
            Err(error) => {
                tracing::error!(%error, owner_user_id, "owner property list failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn get_property(
        &self,
        owner_user_id: &str,
        property_id: &str,
    ) -> OwnerReadResult<OwnerPropertyRecord> {
        let Some(pool) = &self.pool else {
            return self
                .local
                .read()
                .await
                .properties
                .get(property_id)
                .filter(|property| property.owner_user_id == owner_user_id)
                .cloned()
                .map(OwnerReadResult::Loaded)
                .unwrap_or(OwnerReadResult::NotFound);
        };

        match sqlx::query(
            "SELECT id, owner_user_id, display_name, address_line_1, address_line_2,
                    city, region, postal_code, country_code, coarse_area,
                    address_status, authority_attested_at IS NOT NULL AS authority_attested,
                    status, version
             FROM owner_properties
             WHERE owner_user_id = $1 AND id = $2",
        )
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(pool)
        .await
        {
            Ok(Some(row)) => OwnerReadResult::Loaded(property_from_row(&row, true)),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner property read failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn create_property(
        &self,
        owner_user_id: &str,
        request: CreateOwnerPropertyRequest,
    ) -> OwnerMutationResult<OwnerPropertyRecord> {
        let property = normalized_property(owner_user_id, request, self.pool.is_some());
        let fingerprint = address_fingerprint(&property);
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            if !local.workspaces.contains_key(owner_user_id) {
                return OwnerMutationResult::NotFound;
            }
            if local.properties.values().any(|existing| {
                existing.owner_user_id == owner_user_id
                    && existing.status != "archived"
                    && address_fingerprint(existing) == fingerprint
            }) {
                return OwnerMutationResult::Duplicate;
            }
            local
                .properties
                .insert(property.property_id.clone(), property.clone());
            return OwnerMutationResult::Saved(property);
        };

        match create_property(pool, &property, &fingerprint).await {
            Ok(saved) => OwnerMutationResult::Saved(saved),
            Err(error) if is_unique_violation(&error) => OwnerMutationResult::Duplicate,
            Err(error) if is_foreign_key_violation(&error) => OwnerMutationResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, "owner property creation failed");
                OwnerMutationResult::Unavailable
            }
        }
    }

    pub async fn get_latest_yard_brief(
        &self,
        owner_user_id: &str,
        property_id: &str,
    ) -> OwnerReadResult<OwnerYardBriefRecord> {
        let Some(pool) = &self.pool else {
            let local = self.local.read().await;
            if !local
                .properties
                .get(property_id)
                .is_some_and(|property| property.owner_user_id == owner_user_id)
            {
                return OwnerReadResult::NotFound;
            }
            return local
                .yard_briefs
                .get(property_id)
                .and_then(|versions| versions.last())
                .cloned()
                .map(OwnerReadResult::Loaded)
                .unwrap_or(OwnerReadResult::NotFound);
        };

        match sqlx::query(
            "SELECT id, owner_user_id, property_id, version, status, yard_areas,
                    care_goals, cadence_preference, considerations, author_source
             FROM owner_yard_briefs
             WHERE owner_user_id = $1 AND property_id = $2
             ORDER BY version DESC
             LIMIT 1",
        )
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(pool)
        .await
        {
            Ok(Some(row)) => OwnerReadResult::Loaded(yard_brief_from_row(&row, true)),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner yard brief read failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn save_yard_brief(
        &self,
        owner_user_id: &str,
        property_id: &str,
        request: SaveOwnerYardBriefRequest,
    ) -> OwnerMutationResult<OwnerYardBriefRecord> {
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            if !local
                .properties
                .get(property_id)
                .is_some_and(|property| property.owner_user_id == owner_user_id)
            {
                return OwnerMutationResult::NotFound;
            }
            let versions = local
                .yard_briefs
                .entry(property_id.to_string())
                .or_default();
            let record = normalized_yard_brief(
                owner_user_id,
                property_id,
                versions.len() as i64 + 1,
                request,
                false,
            );
            versions.push(record.clone());
            return OwnerMutationResult::Saved(record);
        };

        match save_yard_brief(pool, owner_user_id, property_id, request).await {
            Ok(Some(saved)) => OwnerMutationResult::Saved(saved),
            Ok(None) => OwnerMutationResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner yard brief save failed");
                OwnerMutationResult::Unavailable
            }
        }
    }
}

pub fn validate_workspace_request(request: &SaveOwnerWorkspaceRequest) -> bool {
    let length = request.display_name.trim().chars().count();
    (2..=100).contains(&length)
}

pub fn validate_property_request(request: &CreateOwnerPropertyRequest) -> bool {
    let country = request.country_code.as_deref().unwrap_or("US").trim();
    (2..=100).contains(&request.display_name.trim().chars().count())
        && (5..=200).contains(&request.address_line_1.trim().chars().count())
        && request
            .address_line_2
            .as_deref()
            .is_none_or(|value| value.trim().chars().count() <= 200)
        && (2..=100).contains(&request.city.trim().chars().count())
        && (2..=100).contains(&request.region.trim().chars().count())
        && (3..=20).contains(&request.postal_code.trim().chars().count())
        && country.chars().count() == 2
        && request
            .coarse_area
            .as_deref()
            .is_none_or(|value| value.trim().chars().count() <= 120)
        && matches!(
            request.address_status.as_str(),
            "unconfirmed" | "owner_confirmed"
        )
        && request.authority_attested
}

pub fn validate_yard_brief_request(request: &SaveOwnerYardBriefRequest) -> bool {
    let valid_status = matches!(request.status.as_str(), "draft" | "ready");
    let valid_cadence = matches!(
        request.cadence_preference.as_str(),
        "provider_recommendation" | "one_time" | "weekly" | "every_two_weeks" | "monthly"
    );
    let valid_values = |values: &[String]| {
        values.len() <= 12
            && values.iter().all(|value| {
                let length = value.trim().chars().count();
                (2..=80).contains(&length)
            })
    };
    valid_status
        && valid_cadence
        && valid_values(&request.yard_areas)
        && valid_values(&request.care_goals)
        && request.considerations.trim().chars().count() <= 1_500
        && (request.status == "draft"
            || (!request.yard_areas.is_empty() && !request.care_goals.is_empty()))
}

fn normalized_property(
    owner_user_id: &str,
    request: CreateOwnerPropertyRequest,
    persisted: bool,
) -> OwnerPropertyRecord {
    OwnerPropertyRecord {
        property_id: format!("owner_property_{}", Uuid::new_v4()),
        owner_user_id: owner_user_id.to_string(),
        display_name: request.display_name.trim().to_string(),
        address_line_1: request.address_line_1.trim().to_string(),
        address_line_2: request
            .address_line_2
            .unwrap_or_default()
            .trim()
            .to_string(),
        city: request.city.trim().to_string(),
        region: request.region.trim().to_string(),
        postal_code: request.postal_code.trim().to_string(),
        country_code: request
            .country_code
            .unwrap_or_else(|| "US".to_string())
            .trim()
            .to_ascii_uppercase(),
        coarse_area: request.coarse_area.unwrap_or_default().trim().to_string(),
        address_status: request.address_status,
        authority_attested: request.authority_attested,
        status: "draft".to_string(),
        version: 1,
        persisted,
    }
}

fn normalized_yard_brief(
    owner_user_id: &str,
    property_id: &str,
    version: i64,
    request: SaveOwnerYardBriefRequest,
    persisted: bool,
) -> OwnerYardBriefRecord {
    let normalize_values = |values: Vec<String>| {
        values
            .into_iter()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
            .collect()
    };
    OwnerYardBriefRecord {
        brief_id: format!("owner_brief_{}", Uuid::new_v4()),
        owner_user_id: owner_user_id.to_string(),
        property_id: property_id.to_string(),
        version,
        status: request.status,
        yard_areas: normalize_values(request.yard_areas),
        care_goals: normalize_values(request.care_goals),
        cadence_preference: request.cadence_preference,
        considerations: request.considerations.trim().to_string(),
        author_source: "yard_owner".to_string(),
        persisted,
    }
}

fn normalize_email(value: &str) -> String {
    value.trim().to_ascii_lowercase()
}

fn address_fingerprint(property: &OwnerPropertyRecord) -> String {
    let normalized = [
        property.address_line_1.as_str(),
        property.address_line_2.as_str(),
        property.city.as_str(),
        property.region.as_str(),
        property.postal_code.as_str(),
        property.country_code.as_str(),
    ]
    .map(|value| {
        value
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
            .to_ascii_lowercase()
    })
    .join("|");
    format!("{:x}", Sha256::digest(normalized.as_bytes()))
}

async fn save_workspace(
    pool: &PgPool,
    record: &OwnerWorkspaceRecord,
) -> Result<OwnerWorkspaceRecord, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        "INSERT INTO owner_workspaces (
             owner_user_id, verified_email, display_name, status, email_verified_at
         ) VALUES ($1, $2, $3, 'active', NOW())
         ON CONFLICT (owner_user_id) DO UPDATE SET
             verified_email = EXCLUDED.verified_email,
             display_name = EXCLUDED.display_name,
             status = 'active',
             email_verified_at = NOW(),
             updated_at = NOW()
         RETURNING owner_user_id, verified_email, display_name, status",
    )
    .bind(&record.owner_user_id)
    .bind(&record.verified_email)
    .bind(&record.display_name)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, NULL, 'workspace_saved', $3)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(&record.owner_user_id)
    .bind(serde_json::json!({ "status": "active" }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(workspace_from_row(&row, true))
}

async fn create_property(
    pool: &PgPool,
    property: &OwnerPropertyRecord,
    fingerprint: &str,
) -> Result<OwnerPropertyRecord, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        "INSERT INTO owner_properties (
             id, owner_user_id, display_name, address_line_1, address_line_2,
             city, region, postal_code, country_code, coarse_area,
             address_status, address_fingerprint, authority_attested_at, status, version
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), 'draft', 1
         )
         RETURNING id, owner_user_id, display_name, address_line_1, address_line_2,
                   city, region, postal_code, country_code, coarse_area,
                   address_status, authority_attested_at IS NOT NULL AS authority_attested,
                   status, version",
    )
    .bind(&property.property_id)
    .bind(&property.owner_user_id)
    .bind(&property.display_name)
    .bind(&property.address_line_1)
    .bind(&property.address_line_2)
    .bind(&property.city)
    .bind(&property.region)
    .bind(&property.postal_code)
    .bind(&property.country_code)
    .bind(&property.coarse_area)
    .bind(&property.address_status)
    .bind(fingerprint)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'property_created', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(&property.owner_user_id)
    .bind(&property.property_id)
    .bind(serde_json::json!({
        "address_status": property.address_status,
        "coarse_area": property.coarse_area,
        "authority_attested": property.authority_attested,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(property_from_row(&row, true))
}

async fn save_yard_brief(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    request: SaveOwnerYardBriefRequest,
) -> Result<Option<OwnerYardBriefRecord>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let owned_property = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_properties
             WHERE id = $1 AND owner_user_id = $2 AND status <> 'archived'
         )",
    )
    .bind(property_id)
    .bind(owner_user_id)
    .fetch_one(&mut *transaction)
    .await?;
    if !owned_property {
        transaction.rollback().await?;
        return Ok(None);
    }

    sqlx::query("SELECT pg_advisory_xact_lock(hashtext($1))")
        .bind(format!("owner-yard-brief:{property_id}"))
        .execute(&mut *transaction)
        .await?;
    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) + 1
         FROM owner_yard_briefs
         WHERE property_id = $1",
    )
    .bind(property_id)
    .fetch_one(&mut *transaction)
    .await?;
    let record = normalized_yard_brief(owner_user_id, property_id, version, request, true);
    let row = sqlx::query(
        "INSERT INTO owner_yard_briefs (
             id, owner_user_id, property_id, version, status, yard_areas,
             care_goals, cadence_preference, considerations, author_source
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'yard_owner')
         RETURNING id, owner_user_id, property_id, version, status, yard_areas,
                   care_goals, cadence_preference, considerations, author_source",
    )
    .bind(&record.brief_id)
    .bind(owner_user_id)
    .bind(property_id)
    .bind(version)
    .bind(&record.status)
    .bind(&record.yard_areas)
    .bind(&record.care_goals)
    .bind(&record.cadence_preference)
    .bind(&record.considerations)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'yard_brief_saved', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(owner_user_id)
    .bind(property_id)
    .bind(serde_json::json!({
        "version": version,
        "status": record.status,
        "yard_area_count": record.yard_areas.len(),
        "care_goal_count": record.care_goals.len(),
    }))
    .execute(&mut *transaction)
    .await?;
    if record.status == "ready" {
        sqlx::query(
            "UPDATE owner_properties
             SET status = CASE WHEN status = 'draft' THEN 'profile_ready' ELSE status END,
                 version = version + 1,
                 updated_at = NOW()
             WHERE id = $1 AND owner_user_id = $2",
        )
        .bind(property_id)
        .bind(owner_user_id)
        .execute(&mut *transaction)
        .await?;
    }
    transaction.commit().await?;
    Ok(Some(yard_brief_from_row(&row, true)))
}

fn workspace_from_row(row: &sqlx::postgres::PgRow, persisted: bool) -> OwnerWorkspaceRecord {
    OwnerWorkspaceRecord {
        owner_user_id: row.get("owner_user_id"),
        verified_email: row.get("verified_email"),
        display_name: row.get("display_name"),
        status: row.get("status"),
        persisted,
    }
}

fn property_from_row(row: &sqlx::postgres::PgRow, persisted: bool) -> OwnerPropertyRecord {
    OwnerPropertyRecord {
        property_id: row.get("id"),
        owner_user_id: row.get("owner_user_id"),
        display_name: row.get("display_name"),
        address_line_1: row.get("address_line_1"),
        address_line_2: row.get("address_line_2"),
        city: row.get("city"),
        region: row.get("region"),
        postal_code: row.get("postal_code"),
        country_code: row.get("country_code"),
        coarse_area: row.get("coarse_area"),
        address_status: row.get("address_status"),
        authority_attested: row.get("authority_attested"),
        status: row.get("status"),
        version: row.get("version"),
        persisted,
    }
}

fn yard_brief_from_row(row: &sqlx::postgres::PgRow, persisted: bool) -> OwnerYardBriefRecord {
    OwnerYardBriefRecord {
        brief_id: row.get("id"),
        owner_user_id: row.get("owner_user_id"),
        property_id: row.get("property_id"),
        version: row.get("version"),
        status: row.get("status"),
        yard_areas: row.get("yard_areas"),
        care_goals: row.get("care_goals"),
        cadence_preference: row.get("cadence_preference"),
        considerations: row.get("considerations"),
        author_source: row.get("author_source"),
        persisted,
    }
}

fn is_unique_violation(error: &sqlx::Error) -> bool {
    error
        .as_database_error()
        .and_then(|database_error| database_error.code())
        .is_some_and(|code| code == "23505")
}

fn is_foreign_key_violation(error: &sqlx::Error) -> bool {
    error
        .as_database_error()
        .and_then(|database_error| database_error.code())
        .is_some_and(|code| code == "23503")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn property_request(address: &str) -> CreateOwnerPropertyRequest {
        CreateOwnerPropertyRequest {
            display_name: "Home".to_string(),
            address_line_1: address.to_string(),
            address_line_2: None,
            city: "Phoenix".to_string(),
            region: "AZ".to_string(),
            postal_code: "85004".to_string(),
            country_code: Some("us".to_string()),
            coarse_area: Some("Central Phoenix".to_string()),
            address_status: "owner_confirmed".to_string(),
            authority_attested: true,
        }
    }

    fn yard_brief_request(status: &str) -> SaveOwnerYardBriefRequest {
        SaveOwnerYardBriefRequest {
            status: status.to_string(),
            yard_areas: vec!["Front yard".to_string(), "Back yard".to_string()],
            care_goals: vec!["Routine upkeep".to_string()],
            cadence_preference: "every_two_weeks".to_string(),
            considerations: "Keep the side gate closed for the dog.".to_string(),
        }
    }

    #[test]
    fn validates_workspace_and_property_boundaries() {
        assert!(validate_workspace_request(&SaveOwnerWorkspaceRequest {
            display_name: "Morgan Reyes".to_string(),
        }));
        assert!(validate_property_request(&property_request(
            "123 Oak Street"
        )));
        let mut invalid = property_request("123 Oak Street");
        invalid.authority_attested = false;
        assert!(!validate_property_request(&invalid));
        assert!(validate_yard_brief_request(&yard_brief_request("ready")));
        let mut invalid_brief = yard_brief_request("ready");
        invalid_brief.care_goals.clear();
        assert!(!validate_yard_brief_request(&invalid_brief));
        invalid_brief.status = "draft".to_string();
        assert!(validate_yard_brief_request(&invalid_brief));
        invalid.authority_attested = true;
        invalid.address_status = "verified".to_string();
        assert!(!validate_property_request(&invalid));
    }

    #[tokio::test]
    async fn local_repository_is_self_scoped_and_rejects_owner_duplicates() {
        let repository = OwnerAcquisitionRepository::new();
        assert_eq!(
            repository
                .create_property("missing-owner", property_request("1 Missing Street"))
                .await,
            OwnerMutationResult::NotFound
        );
        let saved = repository
            .save_workspace(
                "owner-a",
                " MORGAN@EXAMPLE.COM ",
                SaveOwnerWorkspaceRequest {
                    display_name: "Morgan Reyes".to_string(),
                },
            )
            .await;
        assert!(matches!(
            saved,
            OwnerMutationResult::Saved(OwnerWorkspaceRecord {
                verified_email,
                persisted: false,
                ..
            }) if verified_email == "morgan@example.com"
        ));

        let OwnerMutationResult::Saved(property) = repository
            .create_property("owner-a", property_request("123 Oak Street"))
            .await
        else {
            panic!("first private property should be saved");
        };
        assert_eq!(
            repository
                .get_property("owner-b", &property.property_id)
                .await,
            OwnerReadResult::NotFound
        );
        assert_eq!(
            repository
                .create_property("owner-a", property_request("  123   OAK street "))
                .await,
            OwnerMutationResult::Duplicate
        );
        assert!(matches!(
            repository.list_properties("owner-a").await,
            OwnerReadResult::Loaded(properties) if properties.len() == 1
        ));
        assert!(matches!(
            repository.list_properties("owner-b").await,
            OwnerReadResult::Loaded(properties) if properties.is_empty()
        ));

        let OwnerMutationResult::Saved(first_brief) = repository
            .save_yard_brief(
                "owner-a",
                &property.property_id,
                yard_brief_request("draft"),
            )
            .await
        else {
            panic!("private yard brief should be saved");
        };
        assert_eq!(first_brief.version, 1);
        let OwnerMutationResult::Saved(second_brief) = repository
            .save_yard_brief(
                "owner-a",
                &property.property_id,
                yard_brief_request("ready"),
            )
            .await
        else {
            panic!("revised yard brief should be saved");
        };
        assert_eq!(second_brief.version, 2);
        assert_eq!(
            repository
                .get_latest_yard_brief("owner-b", &property.property_id)
                .await,
            OwnerReadResult::NotFound
        );
        assert!(matches!(
            repository
                .get_latest_yard_brief("owner-a", &property.property_id)
                .await,
            OwnerReadResult::Loaded(brief) if brief.version == 2 && brief.status == "ready"
        ));
    }
}
