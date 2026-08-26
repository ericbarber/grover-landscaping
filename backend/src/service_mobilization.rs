use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
pub struct ReleaseInitialServiceRequest {
    pub expected_first_visit_version: i64,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
pub struct PublishCustomerServiceDayEventRequest {
    pub expected_event_version: i64,
    pub status: String,
    pub customer_safe_reason: Option<String>,
    pub next_update_message: String,
    pub window_start_epoch_seconds: Option<i64>,
    pub window_end_epoch_seconds: Option<i64>,
    pub time_zone: Option<String>,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct ServiceWorkReleaseRecord {
    pub release_id: String,
    pub activation_id: String,
    pub organization_id: String,
    pub customer_account_id: String,
    pub customer_property_id: String,
    pub first_visit_proposal_version: i64,
    pub service_job_id: String,
    pub released_at_epoch_seconds: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct CustomerServiceDayEventRecord {
    pub release_id: String,
    pub event_version: i64,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub customer_safe_reason: Option<String>,
    pub next_update_message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_start_epoch_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_end_epoch_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_zone: Option<String>,
    pub created_at_epoch_seconds: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ServiceWorkReleaseWriteResult {
    Released(ServiceWorkReleaseRecord),
    Replayed(ServiceWorkReleaseRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerServiceDayEventWriteResult {
    Published(CustomerServiceDayEventRecord),
    Replayed(CustomerServiceDayEventRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, Default)]
pub struct ServiceMobilizationRepository {
    pool: Option<PgPool>,
}

impl ServiceMobilizationRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn release_initial_service(
        &self,
        actor_user_id: &str,
        activation_id: &str,
        request: ReleaseInitialServiceRequest,
    ) -> ServiceWorkReleaseWriteResult {
        if actor_user_id.trim().is_empty()
            || activation_id.trim().is_empty()
            || !validate_release_request(&request)
        {
            return ServiceWorkReleaseWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return ServiceWorkReleaseWriteResult::Unavailable;
        };
        match release_initial_service(pool, actor_user_id.trim(), activation_id.trim(), request)
            .await
        {
            Ok(result) => result,
            Err(error) => {
                tracing::error!(%error, actor_user_id, activation_id, "service work release failed");
                ServiceWorkReleaseWriteResult::Unavailable
            }
        }
    }

    pub async fn publish_customer_service_day_event(
        &self,
        actor_user_id: &str,
        release_id: &str,
        request: PublishCustomerServiceDayEventRequest,
    ) -> CustomerServiceDayEventWriteResult {
        if actor_user_id.trim().is_empty()
            || release_id.trim().is_empty()
            || !validate_service_day_event_request(&request)
        {
            return CustomerServiceDayEventWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return CustomerServiceDayEventWriteResult::Unavailable;
        };
        match publish_customer_service_day_event(
            pool,
            actor_user_id.trim(),
            release_id.trim(),
            request,
        )
        .await
        {
            Ok(result) => result,
            Err(error) => {
                tracing::error!(%error, actor_user_id, release_id, "customer service-day event publication failed");
                CustomerServiceDayEventWriteResult::Unavailable
            }
        }
    }
}

fn valid_idempotency_key(value: &str) -> bool {
    let value = value.trim();
    (8..=128).contains(&value.chars().count())
        && value
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_release_request(request: &ReleaseInitialServiceRequest) -> bool {
    request.expected_first_visit_version > 0 && valid_idempotency_key(&request.idempotency_key)
}

pub fn validate_service_day_event_request(request: &PublishCustomerServiceDayEventRequest) -> bool {
    let next_update = request.next_update_message.trim();
    let base_valid = request.expected_event_version >= 0
        && valid_idempotency_key(&request.idempotency_key)
        && (1..=500).contains(&next_update.chars().count());
    if !base_valid {
        return false;
    }
    match request.status.as_str() {
        "weather_delay" => {
            request
                .customer_safe_reason
                .as_deref()
                .is_some_and(|reason| (1..=500).contains(&reason.trim().chars().count()))
                && request.window_start_epoch_seconds.is_none()
                && request.window_end_epoch_seconds.is_none()
                && request.time_zone.is_none()
        }
        "rescheduled" => {
            let Some(start) = request.window_start_epoch_seconds else {
                return false;
            };
            let Some(end) = request.window_end_epoch_seconds else {
                return false;
            };
            request.customer_safe_reason.is_none()
                && end > start
                && end <= start + 14_400
                && start > current_epoch_seconds()
                && request
                    .time_zone
                    .as_deref()
                    .is_some_and(|time_zone| (1..=80).contains(&time_zone.trim().chars().count()))
        }
        "en_route" | "care_in_progress" | "complete_proof_pending" => {
            request.customer_safe_reason.is_none()
                && request.window_start_epoch_seconds.is_none()
                && request.window_end_epoch_seconds.is_none()
                && request.time_zone.is_none()
        }
        _ => false,
    }
}

pub fn service_day_transition_allowed(current: &str, next: &str) -> bool {
    matches!(
        (current, next),
        ("confirmed", "en_route" | "weather_delay" | "rescheduled")
            | (
                "en_route",
                "care_in_progress" | "weather_delay" | "rescheduled"
            )
            | ("weather_delay", "en_route" | "rescheduled")
            | ("rescheduled", "en_route" | "weather_delay" | "rescheduled")
            | ("care_in_progress", "complete_proof_pending")
    )
}

fn current_epoch_seconds() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

fn release_from_row(row: &sqlx::postgres::PgRow) -> ServiceWorkReleaseRecord {
    ServiceWorkReleaseRecord {
        release_id: row.get("release_id"),
        activation_id: row.get("activation_id"),
        organization_id: row.get("organization_id"),
        customer_account_id: row.get("customer_account_id"),
        customer_property_id: row.get("customer_property_id"),
        first_visit_proposal_version: row.get("first_visit_proposal_version"),
        service_job_id: row.get("service_job_id"),
        released_at_epoch_seconds: row.get("released_at_epoch_seconds"),
        persisted: true,
    }
}

const RELEASE_SELECT: &str = r#"
    SELECT release.id AS release_id, release.activation_id,
           release.organization_id, release.customer_account_id,
           release.customer_property_id, release.first_visit_proposal_version,
           release.service_job_id,
           EXTRACT(EPOCH FROM release.released_at)::BIGINT AS released_at_epoch_seconds
    FROM owner_provider_service_releases release
"#;

async fn load_release_in_transaction(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    release_id: &str,
) -> Result<ServiceWorkReleaseRecord, sqlx::Error> {
    let query = format!("{RELEASE_SELECT} WHERE release.id = $1");
    let row = sqlx::query(&query)
        .bind(release_id)
        .fetch_one(&mut **transaction)
        .await?;
    Ok(release_from_row(&row))
}

async fn release_initial_service(
    pool: &PgPool,
    actor_user_id: &str,
    activation_id: &str,
    request: ReleaseInitialServiceRequest,
) -> Result<ServiceWorkReleaseWriteResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    sqlx::query("SELECT pg_advisory_xact_lock(hashtext($1))")
        .bind(format!("owner-provider-service-release:{activation_id}"))
        .execute(&mut *transaction)
        .await?;

    let replay_query = format!(
        "{RELEASE_SELECT}
         WHERE release.released_by_user_id = $1 AND release.idempotency_key = $2"
    );
    if let Some(row) = sqlx::query(&replay_query)
        .bind(actor_user_id)
        .bind(request.idempotency_key.trim())
        .fetch_optional(&mut *transaction)
        .await?
    {
        let record = release_from_row(&row);
        let exact = record.activation_id == activation_id
            && record.first_visit_proposal_version == request.expected_first_visit_version;
        transaction.commit().await?;
        return Ok(if exact {
            ServiceWorkReleaseWriteResult::Replayed(record)
        } else {
            ServiceWorkReleaseWriteResult::Conflict
        });
    }

    let authority = sqlx::query(
        "SELECT activation.organization_id, activation.customer_account_id,
                activation.customer_property_id, activation.proposal_id,
                series.status AS first_visit_status,
                series.current_version AS first_visit_version,
                visit.id AS first_visit_proposal_id,
                decision.id AS confirmation_decision_id,
                EXISTS (
                    SELECT 1 FROM pg_timezone_names time_zone
                    WHERE time_zone.name = visit.time_zone
                ) AS valid_time_zone,
                account.customer_name, property.service_address,
                membership.id AS membership_id
         FROM owner_provider_relationship_activations activation
         JOIN owner_provider_active_relationships relationship
           ON relationship.activation_id = activation.id
          AND relationship.status = 'active'
         JOIN organizations organization
           ON organization.id = activation.organization_id
          AND organization.status = 'active'
         JOIN organization_customer_accounts account_relation
           ON account_relation.organization_id = activation.organization_id
          AND account_relation.account_id = activation.customer_account_id
          AND account_relation.status = 'active'
         JOIN customer_accounts account
           ON account.id = activation.customer_account_id
         JOIN customer_properties property
           ON property.id = activation.customer_property_id
          AND property.organization_id = activation.organization_id
          AND property.account_id = activation.customer_account_id
          AND property.status <> 'archived'
         JOIN owner_provider_initial_service_proposals service
           ON service.id = activation.proposal_id
          AND service.organization_id = activation.organization_id
          AND service.status = 'accepted'
         JOIN owner_provider_first_visit_series series
           ON series.activation_id = activation.id
         JOIN owner_provider_first_visit_proposals visit
           ON visit.activation_id = activation.id
          AND visit.proposal_version = series.current_version
         LEFT JOIN owner_provider_first_visit_decisions decision
           ON decision.activation_id = activation.id
          AND decision.proposal_id = visit.id
          AND decision.proposal_version = visit.proposal_version
          AND decision.action = 'confirm'
         JOIN organization_memberships membership
           ON membership.organization_id = activation.organization_id
          AND membership.user_id = $2
          AND membership.status = 'active'
          AND membership.role IN ('organization_owner', 'manager')
          AND membership.scope_type = 'organization'
          AND membership.scope_id = activation.organization_id
         WHERE activation.id = $1
         ORDER BY CASE membership.role WHEN 'organization_owner' THEN 0 ELSE 1 END,
                  membership.id
         LIMIT 1
         FOR UPDATE OF activation, series",
    )
    .bind(activation_id)
    .bind(actor_user_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(authority) = authority else {
        transaction.rollback().await?;
        return Ok(ServiceWorkReleaseWriteResult::NotFound);
    };
    if authority.get::<String, _>("first_visit_status") != "confirmed"
        || authority.get::<i64, _>("first_visit_version") != request.expected_first_visit_version
        || authority
            .get::<Option<String>, _>("first_visit_proposal_id")
            .is_none()
        || authority
            .get::<Option<String>, _>("confirmation_decision_id")
            .is_none()
        || !authority.get::<bool, _>("valid_time_zone")
    {
        transaction.rollback().await?;
        return Ok(ServiceWorkReleaseWriteResult::InvalidState);
    }
    let existing_query = format!("{RELEASE_SELECT} WHERE release.activation_id = $1");
    if sqlx::query(&existing_query)
        .bind(activation_id)
        .fetch_optional(&mut *transaction)
        .await?
        .is_some()
    {
        transaction.rollback().await?;
        return Ok(ServiceWorkReleaseWriteResult::InvalidState);
    }

    let service_job_id = format!("job_{}", Uuid::new_v4().simple());
    sqlx::query(
        "INSERT INTO service_jobs (
             id, organization_id, customer_account_id, customer_name,
             property_address, status, scheduled_date
         ) VALUES (
             $1, $2, $3, $4, $5, 'scheduled',
             TO_CHAR(
                 (SELECT window_start AT TIME ZONE time_zone
                  FROM owner_provider_first_visit_proposals WHERE id = $6),
                 'YYYY-MM-DD'
             )
         )",
    )
    .bind(&service_job_id)
    .bind(authority.get::<String, _>("organization_id"))
    .bind(authority.get::<String, _>("customer_account_id"))
    .bind(authority.get::<String, _>("customer_name"))
    .bind(authority.get::<String, _>("service_address"))
    .bind(authority.get::<String, _>("first_visit_proposal_id"))
    .execute(&mut *transaction)
    .await?;
    for (suffix, label, sort_order) in [
        ("before_photos", "Capture before photos", 1),
        ("approved_service", "Complete approved service", 2),
        ("after_photos", "Capture after photos", 3),
        ("completion_notes", "Submit completion notes", 4),
    ] {
        sqlx::query(
            "INSERT INTO job_checklist_items (id, job_id, label, sort_order)
             VALUES ($1, $2, $3, $4)",
        )
        .bind(format!("{service_job_id}_{suffix}"))
        .bind(&service_job_id)
        .bind(label)
        .bind(sort_order)
        .execute(&mut *transaction)
        .await?;
    }

    let release_id = format!("owner_provider_service_release_{}", Uuid::new_v4().simple());
    sqlx::query(
        "INSERT INTO owner_provider_service_releases (
             id, activation_id, first_visit_proposal_id,
             first_visit_proposal_version, initial_service_proposal_id,
             organization_id, customer_account_id, customer_property_id,
             service_job_id, released_by_user_id, released_by_membership_id,
             idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
    )
    .bind(&release_id)
    .bind(activation_id)
    .bind(authority.get::<String, _>("first_visit_proposal_id"))
    .bind(request.expected_first_visit_version)
    .bind(authority.get::<String, _>("proposal_id"))
    .bind(authority.get::<String, _>("organization_id"))
    .bind(authority.get::<String, _>("customer_account_id"))
    .bind(authority.get::<String, _>("customer_property_id"))
    .bind(&service_job_id)
    .bind(actor_user_id)
    .bind(authority.get::<String, _>("membership_id"))
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    let record = load_release_in_transaction(&mut transaction, &release_id).await?;
    transaction.commit().await?;
    Ok(ServiceWorkReleaseWriteResult::Released(record))
}

fn event_from_row(row: &sqlx::postgres::PgRow) -> CustomerServiceDayEventRecord {
    CustomerServiceDayEventRecord {
        release_id: row.get("release_id"),
        event_version: row.get("event_version"),
        status: row.get("event_kind"),
        customer_safe_reason: row.get("customer_safe_reason"),
        next_update_message: row.get("next_update_message"),
        window_start_epoch_seconds: row.get("window_start_epoch_seconds"),
        window_end_epoch_seconds: row.get("window_end_epoch_seconds"),
        time_zone: row.get("time_zone"),
        created_at_epoch_seconds: row.get("created_at_epoch_seconds"),
        persisted: true,
    }
}

const EVENT_SELECT: &str = r#"
    SELECT event.release_id, event.event_version, event.event_kind,
           event.customer_safe_reason, event.next_update_message,
           EXTRACT(EPOCH FROM event.window_start)::BIGINT AS window_start_epoch_seconds,
           EXTRACT(EPOCH FROM event.window_end)::BIGINT AS window_end_epoch_seconds,
           event.time_zone,
           EXTRACT(EPOCH FROM event.created_at)::BIGINT AS created_at_epoch_seconds
    FROM customer_service_day_events event
"#;

async fn publish_customer_service_day_event(
    pool: &PgPool,
    actor_user_id: &str,
    release_id: &str,
    request: PublishCustomerServiceDayEventRequest,
) -> Result<CustomerServiceDayEventWriteResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    sqlx::query("SELECT pg_advisory_xact_lock(hashtext($1))")
        .bind(format!("customer-service-day:{release_id}"))
        .execute(&mut *transaction)
        .await?;

    let replay_query = format!(
        "{EVENT_SELECT}
         WHERE event.actor_user_id = $1 AND event.idempotency_key = $2"
    );
    if let Some(row) = sqlx::query(&replay_query)
        .bind(actor_user_id)
        .bind(request.idempotency_key.trim())
        .fetch_optional(&mut *transaction)
        .await?
    {
        let record = event_from_row(&row);
        let exact = record.release_id == release_id
            && record.event_version == request.expected_event_version + 1
            && record.status == request.status
            && record.customer_safe_reason.as_deref()
                == request.customer_safe_reason.as_deref().map(str::trim)
            && record.next_update_message == request.next_update_message.trim()
            && record.window_start_epoch_seconds == request.window_start_epoch_seconds
            && record.window_end_epoch_seconds == request.window_end_epoch_seconds
            && record.time_zone.as_deref() == request.time_zone.as_deref().map(str::trim);
        transaction.commit().await?;
        return Ok(if exact {
            CustomerServiceDayEventWriteResult::Replayed(record)
        } else {
            CustomerServiceDayEventWriteResult::Conflict
        });
    }

    let authority = sqlx::query(
        "SELECT release.organization_id, release.customer_account_id,
                release.customer_property_id, release.service_job_id,
                job.status AS job_status,
                membership.id AS membership_id,
                COALESCE(latest.event_version, 0) AS current_event_version,
                COALESCE(latest.event_kind, 'confirmed') AS current_status
         FROM owner_provider_service_releases release
         JOIN owner_provider_relationship_activations activation
           ON activation.id = release.activation_id
          AND activation.organization_id = release.organization_id
          AND activation.customer_account_id = release.customer_account_id
          AND activation.customer_property_id = release.customer_property_id
         JOIN owner_provider_active_relationships relationship
           ON relationship.activation_id = activation.id
          AND relationship.status = 'active'
         JOIN organizations organization
           ON organization.id = release.organization_id
          AND organization.status = 'active'
         JOIN organization_customer_accounts account_relation
           ON account_relation.organization_id = release.organization_id
          AND account_relation.account_id = release.customer_account_id
          AND account_relation.status = 'active'
         JOIN customer_properties property
           ON property.id = release.customer_property_id
          AND property.organization_id = release.organization_id
          AND property.account_id = release.customer_account_id
          AND property.status <> 'archived'
         JOIN service_jobs job
           ON job.id = release.service_job_id
          AND job.organization_id = release.organization_id
          AND job.customer_account_id = release.customer_account_id
         JOIN organization_memberships membership
           ON membership.organization_id = release.organization_id
          AND membership.user_id = $2
          AND membership.status = 'active'
          AND membership.role IN ('organization_owner', 'manager')
          AND membership.scope_type = 'organization'
          AND membership.scope_id = release.organization_id
         LEFT JOIN LATERAL (
             SELECT event.event_version, event.event_kind
             FROM customer_service_day_events event
             WHERE event.release_id = release.id
             ORDER BY event.event_version DESC
             LIMIT 1
         ) latest ON TRUE
         WHERE release.id = $1
         ORDER BY CASE membership.role WHEN 'organization_owner' THEN 0 ELSE 1 END,
                  membership.id
         LIMIT 1
         FOR UPDATE OF release, job",
    )
    .bind(release_id)
    .bind(actor_user_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(authority) = authority else {
        transaction.rollback().await?;
        return Ok(CustomerServiceDayEventWriteResult::NotFound);
    };
    let current_version = authority.get::<i64, _>("current_event_version");
    let current_status = authority.get::<String, _>("current_status");
    let job_status = authority.get::<String, _>("job_status");
    if current_version != request.expected_event_version
        || !service_day_transition_allowed(&current_status, &request.status)
        || (request.status == "care_in_progress" && job_status != "in_progress")
        || (request.status == "complete_proof_pending" && job_status != "completed")
        || (matches!(request.status.as_str(), "weather_delay" | "rescheduled")
            && job_status == "completed")
    {
        transaction.rollback().await?;
        return Ok(CustomerServiceDayEventWriteResult::InvalidState);
    }
    if request.status == "rescheduled" {
        let valid_time_zone = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (
                 SELECT 1 FROM pg_timezone_names time_zone WHERE time_zone.name = $1
             )",
        )
        .bind(request.time_zone.as_deref().map(str::trim))
        .fetch_one(&mut *transaction)
        .await?;
        if !valid_time_zone {
            transaction.rollback().await?;
            return Ok(CustomerServiceDayEventWriteResult::Conflict);
        }
    }

    let next_version = current_version + 1;
    let event_id = format!("customer_service_day_event_{}", Uuid::new_v4().simple());
    sqlx::query(
        "INSERT INTO customer_service_day_events (
             id, release_id, organization_id, customer_account_id,
             customer_property_id, actor_user_id, actor_membership_id,
             event_version, event_kind, customer_safe_reason,
             next_update_message, window_start, window_end, time_zone,
             idempotency_key
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
             CASE WHEN $12::BIGINT IS NULL THEN NULL ELSE TO_TIMESTAMP($12) END,
             CASE WHEN $13::BIGINT IS NULL THEN NULL ELSE TO_TIMESTAMP($13) END,
             $14, $15
         )",
    )
    .bind(&event_id)
    .bind(release_id)
    .bind(authority.get::<String, _>("organization_id"))
    .bind(authority.get::<String, _>("customer_account_id"))
    .bind(authority.get::<String, _>("customer_property_id"))
    .bind(actor_user_id)
    .bind(authority.get::<String, _>("membership_id"))
    .bind(next_version)
    .bind(&request.status)
    .bind(request.customer_safe_reason.as_deref().map(str::trim))
    .bind(request.next_update_message.trim())
    .bind(request.window_start_epoch_seconds)
    .bind(request.window_end_epoch_seconds)
    .bind(request.time_zone.as_deref().map(str::trim))
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    if request.status == "rescheduled" {
        sqlx::query(
            "UPDATE service_jobs
             SET scheduled_date = TO_CHAR(TO_TIMESTAMP($2) AT TIME ZONE $3, 'YYYY-MM-DD'),
                 updated_at = NOW()
             WHERE id = $1",
        )
        .bind(authority.get::<String, _>("service_job_id"))
        .bind(request.window_start_epoch_seconds)
        .bind(request.time_zone.as_deref().map(str::trim))
        .execute(&mut *transaction)
        .await?;
    }
    let event_query = format!("{EVENT_SELECT} WHERE event.id = $1");
    let row = sqlx::query(&event_query)
        .bind(&event_id)
        .fetch_one(&mut *transaction)
        .await?;
    let record = event_from_row(&row);
    transaction.commit().await?;
    Ok(CustomerServiceDayEventWriteResult::Published(record))
}

#[cfg(test)]
mod tests {
    use super::{
        service_day_transition_allowed, validate_release_request,
        validate_service_day_event_request, PublishCustomerServiceDayEventRequest,
        ReleaseInitialServiceRequest, ServiceMobilizationRepository, ServiceWorkReleaseWriteResult,
    };
    use std::time::{SystemTime, UNIX_EPOCH};

    #[tokio::test]
    async fn missing_persistence_fails_release_closed() {
        assert_eq!(
            ServiceMobilizationRepository::default()
                .release_initial_service(
                    "manager_1",
                    "activation_1",
                    ReleaseInitialServiceRequest {
                        expected_first_visit_version: 1,
                        idempotency_key: "release-key-001".to_string(),
                    },
                )
                .await,
            ServiceWorkReleaseWriteResult::Unavailable
        );
    }

    #[test]
    fn release_and_event_validation_is_bounded() {
        assert!(validate_release_request(&ReleaseInitialServiceRequest {
            expected_first_visit_version: 1,
            idempotency_key: "release-key-001".to_string(),
        }));
        let future = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should follow the epoch")
            .as_secs() as i64
            + 86_400;
        assert!(validate_service_day_event_request(
            &PublishCustomerServiceDayEventRequest {
                expected_event_version: 0,
                status: "rescheduled".to_string(),
                customer_safe_reason: None,
                next_update_message: "Your new arrival window is confirmed.".to_string(),
                window_start_epoch_seconds: Some(future),
                window_end_epoch_seconds: Some(future + 7_200),
                time_zone: Some("America/Phoenix".to_string()),
                idempotency_key: "service-day-event-001".to_string(),
            }
        ));
    }

    #[test]
    fn customer_status_transitions_are_allowlisted() {
        assert!(service_day_transition_allowed("confirmed", "en_route"));
        assert!(service_day_transition_allowed(
            "care_in_progress",
            "complete_proof_pending"
        ));
        assert!(!service_day_transition_allowed(
            "confirmed",
            "complete_proof_pending"
        ));
        assert!(!service_day_transition_allowed(
            "complete_proof_pending",
            "en_route"
        ));
    }
}
