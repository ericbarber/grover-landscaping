use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, Row, Transaction};
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
pub struct CreateCustomerVisitQuestionRequest {
    pub expected_thread_version: i64,
    pub topic: String,
    pub customer_safe_body: String,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
pub struct CreateProviderVisitResponseRequest {
    pub expected_thread_version: i64,
    pub in_reply_to_message_id: String,
    pub customer_safe_body: String,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerVisitMessageRecord {
    pub message_id: String,
    pub message_version: i64,
    pub message_kind: String,
    pub author_role: String,
    pub topic: String,
    pub customer_safe_body: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub in_reply_to_message_id: Option<String>,
    pub created_at_epoch_seconds: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerVisitThreadRecord {
    pub customer_visit_reference: String,
    pub current_version: i64,
    pub messages: Vec<CustomerVisitMessageRecord>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct ProviderVisitThreadSummary {
    pub customer_visit_reference: String,
    pub customer_name: String,
    pub property_display_name: String,
    pub service_date: String,
    pub service_title: String,
    pub current_version: i64,
    pub awaiting_provider_response: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latest_message: Option<CustomerVisitMessageRecord>,
    pub updated_at_epoch_seconds: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct ProviderVisitThreadQueue {
    pub threads: Vec<ProviderVisitThreadSummary>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerVisitThreadReadResult {
    Loaded(CustomerVisitThreadRecord),
    NotAuthorized,
    InvalidAuthorization,
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerVisitMessageWriteResult {
    Created(CustomerVisitMessageRecord),
    Replayed(CustomerVisitMessageRecord),
    NotAuthorized,
    InvalidAuthorization,
    NotFound,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ProviderVisitThreadListResult {
    Loaded(ProviderVisitThreadQueue),
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, Default)]
pub struct CustomerVisitCommunicationRepository {
    pool: Option<PgPool>,
}

impl CustomerVisitCommunicationRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn get_customer_thread(
        &self,
        actor_user_id: &str,
        customer_visit_reference: &str,
    ) -> CustomerVisitThreadReadResult {
        if actor_user_id.trim().is_empty() || customer_visit_reference.trim().is_empty() {
            return CustomerVisitThreadReadResult::NotFound;
        }
        let Some(pool) = &self.pool else {
            return CustomerVisitThreadReadResult::Unavailable;
        };
        match load_customer_thread(pool, actor_user_id.trim(), customer_visit_reference.trim())
            .await
        {
            Ok(result) => result,
            Err(error) => {
                tracing::error!(
                    %error,
                    actor_user_id,
                    customer_visit_reference,
                    "customer visit thread load failed"
                );
                CustomerVisitThreadReadResult::Unavailable
            }
        }
    }

    pub async fn get_provider_thread(
        &self,
        actor_user_id: &str,
        customer_visit_reference: &str,
    ) -> CustomerVisitThreadReadResult {
        if actor_user_id.trim().is_empty() || customer_visit_reference.trim().is_empty() {
            return CustomerVisitThreadReadResult::NotFound;
        }
        let Some(pool) = &self.pool else {
            return CustomerVisitThreadReadResult::Unavailable;
        };
        match load_provider_thread(pool, actor_user_id.trim(), customer_visit_reference.trim())
            .await
        {
            Ok(Some(record)) => CustomerVisitThreadReadResult::Loaded(record),
            Ok(None) => CustomerVisitThreadReadResult::NotFound,
            Err(error) => {
                tracing::error!(
                    %error,
                    actor_user_id,
                    customer_visit_reference,
                    "provider visit thread load failed"
                );
                CustomerVisitThreadReadResult::Unavailable
            }
        }
    }

    pub async fn list_provider_threads(
        &self,
        actor_user_id: &str,
    ) -> ProviderVisitThreadListResult {
        if actor_user_id.trim().is_empty() {
            return ProviderVisitThreadListResult::NotFound;
        }
        let Some(pool) = &self.pool else {
            return ProviderVisitThreadListResult::Unavailable;
        };
        match list_provider_threads(pool, actor_user_id.trim()).await {
            Ok(Some(queue)) => ProviderVisitThreadListResult::Loaded(queue),
            Ok(None) => ProviderVisitThreadListResult::NotFound,
            Err(error) => {
                tracing::error!(%error, actor_user_id, "provider visit thread queue load failed");
                ProviderVisitThreadListResult::Unavailable
            }
        }
    }

    pub async fn create_customer_question(
        &self,
        actor_user_id: &str,
        customer_visit_reference: &str,
        request: CreateCustomerVisitQuestionRequest,
    ) -> CustomerVisitMessageWriteResult {
        if actor_user_id.trim().is_empty()
            || customer_visit_reference.trim().is_empty()
            || !validate_customer_question_request(&request)
        {
            return CustomerVisitMessageWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return CustomerVisitMessageWriteResult::Unavailable;
        };
        match create_customer_question(
            pool,
            actor_user_id.trim(),
            customer_visit_reference.trim(),
            request,
        )
        .await
        {
            Ok(result) => result,
            Err(error) => {
                tracing::error!(
                    %error,
                    actor_user_id,
                    customer_visit_reference,
                    "customer visit question creation failed"
                );
                CustomerVisitMessageWriteResult::Unavailable
            }
        }
    }

    pub async fn create_provider_response(
        &self,
        actor_user_id: &str,
        customer_visit_reference: &str,
        request: CreateProviderVisitResponseRequest,
    ) -> CustomerVisitMessageWriteResult {
        if actor_user_id.trim().is_empty()
            || customer_visit_reference.trim().is_empty()
            || !validate_provider_response_request(&request)
        {
            return CustomerVisitMessageWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return CustomerVisitMessageWriteResult::Unavailable;
        };
        match create_provider_response(
            pool,
            actor_user_id.trim(),
            customer_visit_reference.trim(),
            request,
        )
        .await
        {
            Ok(result) => result,
            Err(error) => {
                tracing::error!(
                    %error,
                    actor_user_id,
                    customer_visit_reference,
                    "provider visit response creation failed"
                );
                CustomerVisitMessageWriteResult::Unavailable
            }
        }
    }
}

#[derive(Clone, Debug)]
struct ThreadAuthority {
    customer_visit_reference: String,
    organization_id: String,
    customer_account_id: String,
    customer_property_id: String,
    current_version: i64,
}

struct NewMessage<'a> {
    actor_user_id: &'a str,
    message_kind: &'a str,
    author_role: &'a str,
    topic: &'a str,
    customer_safe_body: &'a str,
    in_reply_to_message_id: Option<&'a str>,
    idempotency_key: &'a str,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum CustomerAuthorization {
    Valid,
    NotAuthorized,
    Invalid,
}

fn valid_idempotency_key(value: &str) -> bool {
    let value = value.trim();
    (8..=128).contains(&value.chars().count())
        && value
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

fn valid_body(value: &str) -> bool {
    (1..=2000).contains(&value.trim().chars().count())
}

fn valid_topic(value: &str) -> bool {
    matches!(
        value,
        "timing" | "preparation" | "access" | "service_scope" | "other"
    )
}

pub fn validate_customer_question_request(request: &CreateCustomerVisitQuestionRequest) -> bool {
    request.expected_thread_version >= 0
        && valid_topic(&request.topic)
        && valid_body(&request.customer_safe_body)
        && valid_idempotency_key(&request.idempotency_key)
}

pub fn validate_provider_response_request(request: &CreateProviderVisitResponseRequest) -> bool {
    request.expected_thread_version >= 0
        && !request.in_reply_to_message_id.trim().is_empty()
        && valid_body(&request.customer_safe_body)
        && valid_idempotency_key(&request.idempotency_key)
}

async fn customer_authorization(
    transaction: &mut Transaction<'_, Postgres>,
    actor_user_id: &str,
) -> Result<CustomerAuthorization, sqlx::Error> {
    let row = sqlx::query(
        "WITH active_grants AS (
             SELECT portal.*
             FROM customer_portal_access_grants portal
             WHERE portal.user_id = $1 AND portal.status = 'active'
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
             WHERE (portal.scope_type = 'customer_account'
                    AND portal.scope_id = portal.account_id)
                OR (portal.scope_type = 'property'
                    AND portal.scope_id = portal.property_id)
         )
         SELECT (SELECT COUNT(*) FROM active_grants) AS active_grant_count,
                (SELECT COUNT(*) FROM valid_grants) AS valid_grant_count",
    )
    .bind(actor_user_id)
    .fetch_one(&mut **transaction)
    .await?;
    let active: i64 = row.get("active_grant_count");
    let valid: i64 = row.get("valid_grant_count");
    Ok(if active == 0 {
        CustomerAuthorization::NotAuthorized
    } else if active != valid {
        CustomerAuthorization::Invalid
    } else {
        CustomerAuthorization::Valid
    })
}

async fn lock_customer_thread(
    transaction: &mut Transaction<'_, Postgres>,
    actor_user_id: &str,
    customer_visit_reference: &str,
) -> Result<Option<ThreadAuthority>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT thread.customer_visit_reference, thread.organization_id,
                thread.customer_account_id, thread.customer_property_id,
                thread.current_version
         FROM customer_service_visit_threads thread
         JOIN owner_provider_service_releases release
           ON release.id = thread.release_id
          AND release.organization_id = thread.organization_id
          AND release.customer_account_id = thread.customer_account_id
          AND release.customer_property_id = thread.customer_property_id
         JOIN owner_provider_relationship_activations activation
           ON activation.id = release.activation_id
          AND activation.organization_id = thread.organization_id
          AND activation.customer_account_id = thread.customer_account_id
          AND activation.customer_property_id = thread.customer_property_id
         JOIN owner_provider_active_relationships relationship
           ON relationship.activation_id = activation.id
          AND relationship.status = 'active'
         JOIN organizations organization
           ON organization.id = thread.organization_id
          AND organization.status = 'active'
         JOIN organization_customer_accounts account_relation
           ON account_relation.organization_id = thread.organization_id
          AND account_relation.account_id = thread.customer_account_id
          AND account_relation.status = 'active'
         JOIN customer_properties property
           ON property.id = thread.customer_property_id
          AND property.organization_id = thread.organization_id
          AND property.account_id = thread.customer_account_id
          AND property.status <> 'archived'
         WHERE thread.customer_visit_reference = $2
           AND EXISTS (
               SELECT 1
               FROM customer_portal_access_grants portal
               JOIN organization_memberships membership
                 ON membership.organization_id = portal.organization_id
                AND membership.user_id = portal.user_id
                AND membership.role = portal.access_role
                AND membership.status = 'active'
                AND membership.scope_type = portal.scope_type
                AND membership.scope_id = portal.scope_id
               WHERE portal.user_id = $1
                 AND portal.status = 'active'
                 AND portal.organization_id = thread.organization_id
                 AND portal.account_id = thread.customer_account_id
                 AND ((portal.scope_type = 'customer_account'
                       AND portal.scope_id = thread.customer_account_id)
                      OR (portal.scope_type = 'property'
                          AND portal.scope_id = thread.customer_property_id))
           )
         FOR UPDATE OF thread",
    )
    .bind(actor_user_id)
    .bind(customer_visit_reference)
    .fetch_optional(&mut **transaction)
    .await?;
    Ok(row.map(|row| ThreadAuthority {
        customer_visit_reference: row.get("customer_visit_reference"),
        organization_id: row.get("organization_id"),
        customer_account_id: row.get("customer_account_id"),
        customer_property_id: row.get("customer_property_id"),
        current_version: row.get("current_version"),
    }))
}

async fn lock_provider_thread(
    transaction: &mut Transaction<'_, Postgres>,
    actor_user_id: &str,
    customer_visit_reference: &str,
) -> Result<Option<ThreadAuthority>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT thread.customer_visit_reference, thread.organization_id,
                thread.customer_account_id, thread.customer_property_id,
                thread.current_version
         FROM customer_service_visit_threads thread
         JOIN owner_provider_service_releases release
           ON release.id = thread.release_id
          AND release.organization_id = thread.organization_id
          AND release.customer_account_id = thread.customer_account_id
          AND release.customer_property_id = thread.customer_property_id
         JOIN owner_provider_relationship_activations activation
           ON activation.id = release.activation_id
          AND activation.organization_id = thread.organization_id
          AND activation.customer_account_id = thread.customer_account_id
          AND activation.customer_property_id = thread.customer_property_id
         JOIN owner_provider_active_relationships relationship
           ON relationship.activation_id = activation.id
          AND relationship.status = 'active'
         JOIN organizations organization
           ON organization.id = thread.organization_id
          AND organization.status = 'active'
         JOIN organization_customer_accounts account_relation
           ON account_relation.organization_id = thread.organization_id
          AND account_relation.account_id = thread.customer_account_id
          AND account_relation.status = 'active'
         JOIN customer_properties property
           ON property.id = thread.customer_property_id
          AND property.organization_id = thread.organization_id
          AND property.account_id = thread.customer_account_id
          AND property.status <> 'archived'
         JOIN organization_memberships membership
           ON membership.organization_id = thread.organization_id
          AND membership.user_id = $1
          AND membership.status = 'active'
          AND membership.role IN ('organization_owner', 'manager')
          AND membership.scope_type = 'organization'
          AND membership.scope_id = thread.organization_id
         WHERE thread.customer_visit_reference = $2
         ORDER BY CASE membership.role WHEN 'organization_owner' THEN 0 ELSE 1 END,
                  membership.id
         LIMIT 1
         FOR UPDATE OF thread",
    )
    .bind(actor_user_id)
    .bind(customer_visit_reference)
    .fetch_optional(&mut **transaction)
    .await?;
    Ok(row.map(|row| ThreadAuthority {
        customer_visit_reference: row.get("customer_visit_reference"),
        organization_id: row.get("organization_id"),
        customer_account_id: row.get("customer_account_id"),
        customer_property_id: row.get("customer_property_id"),
        current_version: row.get("current_version"),
    }))
}

const MESSAGE_SELECT: &str = r#"
    SELECT message.id AS message_id, message.customer_visit_reference,
           message.message_version,
           message.message_kind, message.author_role, message.topic,
           message.customer_safe_body, message.in_reply_to_message_id,
           EXTRACT(EPOCH FROM message.created_at)::BIGINT AS created_at_epoch_seconds
    FROM customer_service_visit_messages message
"#;

fn message_from_row(row: &sqlx::postgres::PgRow) -> CustomerVisitMessageRecord {
    CustomerVisitMessageRecord {
        message_id: row.get("message_id"),
        message_version: row.get("message_version"),
        message_kind: row.get("message_kind"),
        author_role: row.get("author_role"),
        topic: row.get("topic"),
        customer_safe_body: row.get("customer_safe_body"),
        in_reply_to_message_id: row.get("in_reply_to_message_id"),
        created_at_epoch_seconds: row.get("created_at_epoch_seconds"),
        persisted: true,
    }
}

async fn load_thread_record(
    transaction: &mut Transaction<'_, Postgres>,
    authority: &ThreadAuthority,
) -> Result<CustomerVisitThreadRecord, sqlx::Error> {
    let query = format!(
        "{MESSAGE_SELECT}
         WHERE message.customer_visit_reference = $1
         ORDER BY message.message_version ASC"
    );
    let messages = sqlx::query(&query)
        .bind(&authority.customer_visit_reference)
        .fetch_all(&mut **transaction)
        .await?
        .iter()
        .map(message_from_row)
        .collect();
    Ok(CustomerVisitThreadRecord {
        customer_visit_reference: authority.customer_visit_reference.clone(),
        current_version: authority.current_version,
        messages,
        persisted: true,
    })
}

async fn load_customer_thread(
    pool: &PgPool,
    actor_user_id: &str,
    customer_visit_reference: &str,
) -> Result<CustomerVisitThreadReadResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    match customer_authorization(&mut transaction, actor_user_id).await? {
        CustomerAuthorization::NotAuthorized => {
            transaction.rollback().await?;
            return Ok(CustomerVisitThreadReadResult::NotAuthorized);
        }
        CustomerAuthorization::Invalid => {
            transaction.rollback().await?;
            return Ok(CustomerVisitThreadReadResult::InvalidAuthorization);
        }
        CustomerAuthorization::Valid => {}
    }
    let Some(authority) =
        lock_customer_thread(&mut transaction, actor_user_id, customer_visit_reference).await?
    else {
        transaction.rollback().await?;
        return Ok(CustomerVisitThreadReadResult::NotFound);
    };
    let record = load_thread_record(&mut transaction, &authority).await?;
    transaction.commit().await?;
    Ok(CustomerVisitThreadReadResult::Loaded(record))
}

async fn load_provider_thread(
    pool: &PgPool,
    actor_user_id: &str,
    customer_visit_reference: &str,
) -> Result<Option<CustomerVisitThreadRecord>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let Some(authority) =
        lock_provider_thread(&mut transaction, actor_user_id, customer_visit_reference).await?
    else {
        transaction.rollback().await?;
        return Ok(None);
    };
    let record = load_thread_record(&mut transaction, &authority).await?;
    transaction.commit().await?;
    Ok(Some(record))
}

async fn list_provider_threads(
    pool: &PgPool,
    actor_user_id: &str,
) -> Result<Option<ProviderVisitThreadQueue>, sqlx::Error> {
    let has_membership = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
             SELECT 1
             FROM organization_memberships membership
             JOIN organizations organization
               ON organization.id = membership.organization_id
              AND organization.status = 'active'
             WHERE membership.user_id = $1
               AND membership.status = 'active'
               AND membership.role IN ('organization_owner', 'manager')
               AND membership.scope_type = 'organization'
               AND membership.scope_id = membership.organization_id
         )",
    )
    .bind(actor_user_id)
    .fetch_one(pool)
    .await?;
    if !has_membership {
        return Ok(None);
    }

    let rows = sqlx::query(
        "SELECT DISTINCT ON (thread.customer_visit_reference)
                thread.customer_visit_reference, account.customer_name,
                property.display_name AS property_display_name,
                TO_CHAR(visit.window_start AT TIME ZONE visit.time_zone, 'YYYY-MM-DD')
                    AS service_date,
                service.title AS service_title,
                thread.current_version,
                EXTRACT(EPOCH FROM thread.updated_at)::BIGINT
                    AS updated_at_epoch_seconds,
                latest.id AS message_id,
                latest.message_version, latest.message_kind,
                latest.author_role, latest.topic, latest.customer_safe_body,
                latest.in_reply_to_message_id,
                EXTRACT(EPOCH FROM latest.created_at)::BIGINT
                    AS created_at_epoch_seconds
         FROM customer_service_visit_threads thread
         JOIN owner_provider_service_releases release
           ON release.id = thread.release_id
          AND release.organization_id = thread.organization_id
          AND release.customer_account_id = thread.customer_account_id
          AND release.customer_property_id = thread.customer_property_id
         JOIN owner_provider_relationship_activations activation
           ON activation.id = release.activation_id
          AND activation.organization_id = thread.organization_id
          AND activation.customer_account_id = thread.customer_account_id
          AND activation.customer_property_id = thread.customer_property_id
         JOIN owner_provider_active_relationships relationship
           ON relationship.activation_id = activation.id
          AND relationship.status = 'active'
         JOIN organizations organization
           ON organization.id = thread.organization_id
          AND organization.status = 'active'
         JOIN organization_customer_accounts account_relation
           ON account_relation.organization_id = thread.organization_id
          AND account_relation.account_id = thread.customer_account_id
          AND account_relation.status = 'active'
         JOIN customer_properties property
           ON property.id = thread.customer_property_id
          AND property.organization_id = thread.organization_id
          AND property.account_id = thread.customer_account_id
          AND property.status <> 'archived'
         JOIN customer_accounts account
           ON account.id = thread.customer_account_id
         JOIN owner_provider_first_visit_proposals visit
           ON visit.id = release.first_visit_proposal_id
          AND visit.activation_id = release.activation_id
          AND visit.proposal_version = release.first_visit_proposal_version
         JOIN owner_provider_initial_service_proposals service
           ON service.id = release.initial_service_proposal_id
          AND service.organization_id = release.organization_id
         JOIN organization_memberships membership
           ON membership.organization_id = thread.organization_id
          AND membership.user_id = $1
          AND membership.status = 'active'
          AND membership.role IN ('organization_owner', 'manager')
          AND membership.scope_type = 'organization'
          AND membership.scope_id = thread.organization_id
         LEFT JOIN LATERAL (
             SELECT message.*
             FROM customer_service_visit_messages message
             WHERE message.customer_visit_reference = thread.customer_visit_reference
             ORDER BY message.message_version DESC
             LIMIT 1
         ) latest ON TRUE
         ORDER BY thread.customer_visit_reference,
                  CASE membership.role WHEN 'organization_owner' THEN 0 ELSE 1 END,
                  membership.id",
    )
    .bind(actor_user_id)
    .fetch_all(pool)
    .await?;
    let mut threads = rows
        .into_iter()
        .map(|row| {
            let latest_message = row
                .get::<Option<String>, _>("message_id")
                .map(|message_id| CustomerVisitMessageRecord {
                    message_id,
                    message_version: row.get("message_version"),
                    message_kind: row.get("message_kind"),
                    author_role: row.get("author_role"),
                    topic: row.get("topic"),
                    customer_safe_body: row.get("customer_safe_body"),
                    in_reply_to_message_id: row.get("in_reply_to_message_id"),
                    created_at_epoch_seconds: row.get("created_at_epoch_seconds"),
                    persisted: true,
                });
            ProviderVisitThreadSummary {
                customer_visit_reference: row.get("customer_visit_reference"),
                customer_name: row.get("customer_name"),
                property_display_name: row.get("property_display_name"),
                service_date: row.get("service_date"),
                service_title: row.get("service_title"),
                current_version: row.get("current_version"),
                awaiting_provider_response: latest_message
                    .as_ref()
                    .is_some_and(|message| message.message_kind == "customer_question"),
                latest_message,
                updated_at_epoch_seconds: row.get("updated_at_epoch_seconds"),
                persisted: true,
            }
        })
        .collect::<Vec<_>>();
    threads.sort_by(|left, right| {
        right
            .awaiting_provider_response
            .cmp(&left.awaiting_provider_response)
            .then_with(|| {
                right
                    .updated_at_epoch_seconds
                    .cmp(&left.updated_at_epoch_seconds)
            })
            .then_with(|| {
                left.customer_visit_reference
                    .cmp(&right.customer_visit_reference)
            })
    });
    Ok(Some(ProviderVisitThreadQueue { threads }))
}

async fn replay_message(
    transaction: &mut Transaction<'_, Postgres>,
    actor_user_id: &str,
    idempotency_key: &str,
) -> Result<Option<(String, CustomerVisitMessageRecord)>, sqlx::Error> {
    let query = format!(
        "{MESSAGE_SELECT}
         WHERE message.author_user_id = $1 AND message.idempotency_key = $2"
    );
    sqlx::query(&query)
        .bind(actor_user_id)
        .bind(idempotency_key)
        .fetch_optional(&mut **transaction)
        .await
        .map(|row| row.map(|row| (row.get("customer_visit_reference"), message_from_row(&row))))
}

async fn insert_message(
    transaction: &mut Transaction<'_, Postgres>,
    authority: &ThreadAuthority,
    message: NewMessage<'_>,
) -> Result<CustomerVisitMessageRecord, sqlx::Error> {
    let message_id = format!("customer_visit_message_{}", Uuid::new_v4().simple());
    let message_version = authority.current_version + 1;
    let query = "INSERT INTO customer_service_visit_messages (
             id, customer_visit_reference, organization_id,
             customer_account_id, customer_property_id, message_version,
             message_kind, author_role, author_user_id, topic,
             customer_safe_body, in_reply_to_message_id, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id AS message_id, message_version, message_kind,
                   author_role, topic, customer_safe_body,
                   in_reply_to_message_id,
                   EXTRACT(EPOCH FROM created_at)::BIGINT AS created_at_epoch_seconds";
    let row = sqlx::query(query)
        .bind(&message_id)
        .bind(&authority.customer_visit_reference)
        .bind(&authority.organization_id)
        .bind(&authority.customer_account_id)
        .bind(&authority.customer_property_id)
        .bind(message_version)
        .bind(message.message_kind)
        .bind(message.author_role)
        .bind(message.actor_user_id)
        .bind(message.topic)
        .bind(message.customer_safe_body)
        .bind(message.in_reply_to_message_id)
        .bind(message.idempotency_key)
        .fetch_one(&mut **transaction)
        .await?;
    sqlx::query(
        "UPDATE customer_service_visit_threads
         SET current_version = current_version + 1, updated_at = NOW()
         WHERE customer_visit_reference = $1",
    )
    .bind(&authority.customer_visit_reference)
    .execute(&mut **transaction)
    .await?;
    Ok(message_from_row(&row))
}

async fn create_customer_question(
    pool: &PgPool,
    actor_user_id: &str,
    customer_visit_reference: &str,
    request: CreateCustomerVisitQuestionRequest,
) -> Result<CustomerVisitMessageWriteResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    sqlx::query("SELECT pg_advisory_xact_lock(hashtext($1))")
        .bind(format!(
            "customer-visit-message:{actor_user_id}:{}",
            request.idempotency_key.trim()
        ))
        .execute(&mut *transaction)
        .await?;
    match customer_authorization(&mut transaction, actor_user_id).await? {
        CustomerAuthorization::NotAuthorized => {
            transaction.rollback().await?;
            return Ok(CustomerVisitMessageWriteResult::NotAuthorized);
        }
        CustomerAuthorization::Invalid => {
            transaction.rollback().await?;
            return Ok(CustomerVisitMessageWriteResult::InvalidAuthorization);
        }
        CustomerAuthorization::Valid => {}
    }
    let Some(authority) =
        lock_customer_thread(&mut transaction, actor_user_id, customer_visit_reference).await?
    else {
        transaction.rollback().await?;
        return Ok(CustomerVisitMessageWriteResult::NotFound);
    };
    if let Some((replay_reference, replay)) = replay_message(
        &mut transaction,
        actor_user_id,
        request.idempotency_key.trim(),
    )
    .await?
    {
        let exact = replay_reference == customer_visit_reference
            && replay.message_version == request.expected_thread_version + 1
            && replay.message_kind == "customer_question"
            && replay.topic == request.topic
            && replay.customer_safe_body == request.customer_safe_body.trim()
            && replay.in_reply_to_message_id.is_none();
        transaction.commit().await?;
        return Ok(if exact {
            CustomerVisitMessageWriteResult::Replayed(replay)
        } else {
            CustomerVisitMessageWriteResult::Conflict
        });
    }
    if authority.current_version != request.expected_thread_version {
        transaction.rollback().await?;
        return Ok(CustomerVisitMessageWriteResult::Conflict);
    }
    let record = insert_message(
        &mut transaction,
        &authority,
        NewMessage {
            actor_user_id,
            message_kind: "customer_question",
            author_role: "customer",
            topic: &request.topic,
            customer_safe_body: request.customer_safe_body.trim(),
            in_reply_to_message_id: None,
            idempotency_key: request.idempotency_key.trim(),
        },
    )
    .await?;
    transaction.commit().await?;
    Ok(CustomerVisitMessageWriteResult::Created(record))
}

async fn create_provider_response(
    pool: &PgPool,
    actor_user_id: &str,
    customer_visit_reference: &str,
    request: CreateProviderVisitResponseRequest,
) -> Result<CustomerVisitMessageWriteResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    sqlx::query("SELECT pg_advisory_xact_lock(hashtext($1))")
        .bind(format!(
            "customer-visit-message:{actor_user_id}:{}",
            request.idempotency_key.trim()
        ))
        .execute(&mut *transaction)
        .await?;
    let Some(authority) =
        lock_provider_thread(&mut transaction, actor_user_id, customer_visit_reference).await?
    else {
        transaction.rollback().await?;
        return Ok(CustomerVisitMessageWriteResult::NotFound);
    };
    if let Some((replay_reference, replay)) = replay_message(
        &mut transaction,
        actor_user_id,
        request.idempotency_key.trim(),
    )
    .await?
    {
        let exact = replay_reference == customer_visit_reference
            && replay.message_version == request.expected_thread_version + 1
            && replay.message_kind == "provider_response"
            && replay.customer_safe_body == request.customer_safe_body.trim()
            && replay.in_reply_to_message_id.as_deref()
                == Some(request.in_reply_to_message_id.trim());
        transaction.commit().await?;
        return Ok(if exact {
            CustomerVisitMessageWriteResult::Replayed(replay)
        } else {
            CustomerVisitMessageWriteResult::Conflict
        });
    }
    if authority.current_version != request.expected_thread_version {
        transaction.rollback().await?;
        return Ok(CustomerVisitMessageWriteResult::Conflict);
    }
    let reply_query = format!(
        "{MESSAGE_SELECT}
         WHERE message.id = $1
           AND message.customer_visit_reference = $2
           AND message.message_kind = 'customer_question'"
    );
    let Some(reply_row) = sqlx::query(&reply_query)
        .bind(request.in_reply_to_message_id.trim())
        .bind(customer_visit_reference)
        .fetch_optional(&mut *transaction)
        .await?
    else {
        transaction.rollback().await?;
        return Ok(CustomerVisitMessageWriteResult::Conflict);
    };
    let reply = message_from_row(&reply_row);
    let already_answered = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
             SELECT 1 FROM customer_service_visit_messages
             WHERE in_reply_to_message_id = $1
               AND message_kind = 'provider_response'
         )",
    )
    .bind(&reply.message_id)
    .fetch_one(&mut *transaction)
    .await?;
    if already_answered {
        transaction.rollback().await?;
        return Ok(CustomerVisitMessageWriteResult::Conflict);
    }
    let record = insert_message(
        &mut transaction,
        &authority,
        NewMessage {
            actor_user_id,
            message_kind: "provider_response",
            author_role: "provider",
            topic: &reply.topic,
            customer_safe_body: request.customer_safe_body.trim(),
            in_reply_to_message_id: Some(&reply.message_id),
            idempotency_key: request.idempotency_key.trim(),
        },
    )
    .await?;
    transaction.commit().await?;
    Ok(CustomerVisitMessageWriteResult::Created(record))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn customer_question_validation_keeps_initial_contract_bounded() {
        let valid = CreateCustomerVisitQuestionRequest {
            expected_thread_version: 0,
            topic: "timing".to_string(),
            customer_safe_body: "Should I leave the side gate open?".to_string(),
            idempotency_key: "visit-question-001".to_string(),
        };
        assert!(validate_customer_question_request(&valid));
        assert!(!validate_customer_question_request(
            &CreateCustomerVisitQuestionRequest {
                topic: "billing".to_string(),
                ..valid.clone()
            }
        ));
        assert!(!validate_customer_question_request(
            &CreateCustomerVisitQuestionRequest {
                customer_safe_body: " ".to_string(),
                ..valid
            }
        ));
    }

    #[test]
    fn provider_response_requires_exact_reply_and_retry_key() {
        let valid = CreateProviderVisitResponseRequest {
            expected_thread_version: 1,
            in_reply_to_message_id: "customer_visit_message_1".to_string(),
            customer_safe_body: "Please leave it unlocked for the arrival window.".to_string(),
            idempotency_key: "visit-response-001".to_string(),
        };
        assert!(validate_provider_response_request(&valid));
        assert!(!validate_provider_response_request(
            &CreateProviderVisitResponseRequest {
                in_reply_to_message_id: " ".to_string(),
                ..valid.clone()
            }
        ));
        assert!(!validate_provider_response_request(
            &CreateProviderVisitResponseRequest {
                idempotency_key: "short".to_string(),
                ..valid
            }
        ));
    }
}
