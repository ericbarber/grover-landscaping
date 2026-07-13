use reqwest::{Client, Url};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{PgPool, Row};
use std::time::Duration;
use uuid::Uuid;

const DEFAULT_BATCH_SIZE: i64 = 10;
const DEFAULT_MAX_ATTEMPTS: i32 = 5;
const DEFAULT_POLL_SECONDS: u64 = 5;

#[derive(Clone, Debug)]
pub struct NotificationOutboxItem {
    pub id: String,
    pub channel: String,
    pub recipient: String,
    pub template_key: String,
    pub payload: Value,
    pub attempt_count: i32,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct NotificationHistoryItem {
    pub id: String,
    pub organization_id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub channel: String,
    pub recipient: String,
    pub template_key: String,
    pub status: String,
    pub attempt_count: i32,
    pub available_at: String,
    pub last_attempt_at: Option<String>,
    pub sent_at: Option<String>,
    pub last_error: Option<String>,
    pub provider_response_code: Option<i32>,
    pub provider_message_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, Default)]
pub struct NotificationHistoryFilter {
    pub organization_ids: Vec<String>,
    pub entity_type: Option<String>,
    pub status: Option<String>,
    pub limit: i64,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum NotificationRetryResult {
    Retried(Box<NotificationHistoryItem>),
    InvalidStatus,
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum NotificationResolveResult {
    Resolved(Box<NotificationHistoryItem>),
    InvalidStatus,
    NotFound,
    Unavailable,
}

pub fn validate_notification_recipient(channel: &str, recipient: &str) -> Result<(), String> {
    let recipient = recipient.trim();
    if recipient.is_empty() || recipient.chars().count() > 320 {
        return Err("recipient is required and cannot exceed 320 characters".to_string());
    }

    match channel {
        "email" if recipient.contains('@') && !recipient.contains(char::is_whitespace) => Ok(()),
        "sms"
            if recipient.starts_with('+')
                && recipient.len() >= 8
                && recipient.len() <= 16
                && recipient[1..]
                    .chars()
                    .all(|character| character.is_ascii_digit()) =>
        {
            Ok(())
        }
        "email" => Err("email recipient must be a valid email address".to_string()),
        "sms" => Err("sms recipient must use E.164 format, such as +16025550123".to_string()),
        _ => Err(format!("unsupported notification channel: {channel}")),
    }
}

#[derive(Clone, Debug, Default)]
pub struct NotificationOutboxRepository {
    pool: Option<PgPool>,
}

impl NotificationOutboxRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub fn is_persistent(&self) -> bool {
        self.pool.is_some()
    }

    pub async fn claim_batch(
        &self,
        limit: i64,
        max_attempts: i32,
    ) -> Result<Vec<NotificationOutboxItem>, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(Vec::new());
        };

        sqlx::query(
            r#"
            UPDATE notification_outbox
            SET status = 'dead_letter', updated_at = now()
            WHERE attempt_count >= $1
              AND (
                  status = 'failed'
                  OR (status = 'sending' AND updated_at < now() - interval '5 minutes')
              )
            "#,
        )
        .bind(max_attempts)
        .execute(pool)
        .await?;

        let rows = sqlx::query(
            r#"
            WITH candidates AS (
                SELECT id
                FROM notification_outbox
                WHERE (
                    status IN ('queued', 'failed')
                    AND available_at <= now()
                    AND attempt_count < $2
                ) OR (
                    status = 'sending'
                    AND updated_at < now() - interval '5 minutes'
                    AND attempt_count < $2
                )
                ORDER BY available_at, created_at, id
                FOR UPDATE SKIP LOCKED
                LIMIT $1
            )
            UPDATE notification_outbox outbox
            SET
                status = 'sending',
                attempt_count = outbox.attempt_count + 1,
                last_attempt_at = now(),
                updated_at = now()
            FROM candidates
            WHERE outbox.id = candidates.id
            RETURNING
                outbox.id,
                outbox.channel,
                outbox.recipient,
                outbox.template_key,
                outbox.payload,
                outbox.attempt_count
            "#,
        )
        .bind(limit)
        .bind(max_attempts)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|row| NotificationOutboxItem {
                id: row.get("id"),
                channel: row.get("channel"),
                recipient: row.get("recipient"),
                template_key: row.get("template_key"),
                payload: row.get("payload"),
                attempt_count: row.get("attempt_count"),
            })
            .collect())
    }

    pub async fn mark_sent(
        &self,
        id: &str,
        response_code: u16,
        provider_message_id: Option<&str>,
    ) -> Result<(), sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(());
        };

        sqlx::query(
            r#"
            UPDATE notification_outbox
            SET
                status = 'sent',
                provider_response_code = $2,
                provider_message_id = $3,
                sent_at = now(),
                last_error = NULL,
                updated_at = now()
            WHERE id = $1 AND status = 'sending'
            "#,
        )
        .bind(id)
        .bind(i32::from(response_code))
        .bind(provider_message_id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn mark_failed(
        &self,
        id: &str,
        attempt_count: i32,
        max_attempts: i32,
        error: &str,
        response_code: Option<u16>,
    ) -> Result<(), sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(());
        };
        let retry_seconds = retry_delay_seconds(attempt_count);
        let status = if attempt_count >= max_attempts {
            "dead_letter"
        } else {
            "failed"
        };

        sqlx::query(
            r#"
            UPDATE notification_outbox
            SET
                status = $2,
                provider_response_code = $3,
                last_error = $4,
                available_at = now() + make_interval(secs => $5),
                updated_at = now()
            WHERE id = $1 AND status = 'sending'
            "#,
        )
        .bind(id)
        .bind(status)
        .bind(response_code.map(i32::from))
        .bind(truncate_error(error))
        .bind(retry_seconds)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn list_history(
        &self,
        filter: NotificationHistoryFilter,
    ) -> Result<Vec<NotificationHistoryItem>, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(Vec::new());
        };
        if filter.organization_ids.is_empty() {
            return Ok(Vec::new());
        }
        let limit = filter.limit.clamp(1, 100);

        let rows = sqlx::query(
            r#"
            SELECT
                id,
                organization_id,
                entity_type,
                entity_id,
                channel,
                recipient,
                template_key,
                status,
                attempt_count,
                available_at::text AS available_at,
                last_attempt_at::text AS last_attempt_at,
                sent_at::text AS sent_at,
                last_error,
                provider_response_code,
                provider_message_id,
                created_at::text AS created_at,
                updated_at::text AS updated_at
            FROM notification_outbox
            WHERE ($1::text IS NULL OR entity_type = $1)
              AND ($2::text IS NULL OR status = $2)
              AND organization_id = ANY($3)
            ORDER BY created_at DESC, id DESC
            LIMIT $4
            "#,
        )
        .bind(filter.entity_type)
        .bind(filter.status)
        .bind(filter.organization_ids)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|row| NotificationHistoryItem {
                id: row.get("id"),
                organization_id: row.get("organization_id"),
                entity_type: row.get("entity_type"),
                entity_id: row.get("entity_id"),
                channel: row.get("channel"),
                recipient: row.get("recipient"),
                template_key: row.get("template_key"),
                status: row.get("status"),
                attempt_count: row.get("attempt_count"),
                available_at: row.get("available_at"),
                last_attempt_at: row.get("last_attempt_at"),
                sent_at: row.get("sent_at"),
                last_error: row.get("last_error"),
                provider_response_code: row.get("provider_response_code"),
                provider_message_id: row.get("provider_message_id"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            })
            .collect())
    }

    pub async fn retry_failed(
        &self,
        id: &str,
        organization_ids: &[String],
        actor_user_id: &str,
    ) -> Result<NotificationRetryResult, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(NotificationRetryResult::Unavailable);
        };
        if organization_ids.is_empty() {
            return Ok(NotificationRetryResult::NotFound);
        }

        let mut transaction = pool.begin().await?;
        let current = sqlx::query(
            "SELECT status, organization_id FROM notification_outbox WHERE id = $1 AND organization_id = ANY($2) FOR UPDATE",
        )
        .bind(id)
        .bind(organization_ids)
        .fetch_optional(&mut *transaction)
        .await?;

        let Some(current) = current else {
            transaction.rollback().await?;
            return Ok(NotificationRetryResult::NotFound);
        };

        let status: String = current.get("status");
        if !matches!(status.as_str(), "failed" | "dead_letter") {
            transaction.rollback().await?;
            return Ok(NotificationRetryResult::InvalidStatus);
        }

        sqlx::query(
            r#"
            UPDATE notification_outbox
            SET
                status = 'queued',
                attempt_count = 0,
                available_at = now(),
                last_attempt_at = NULL,
                sent_at = NULL,
                last_error = NULL,
                provider_response_code = NULL,
                provider_message_id = NULL,
                updated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(&mut *transaction)
        .await?;

        insert_notification_audit_event(
            &mut transaction,
            actor_user_id,
            current.get("organization_id"),
            "notification_retried",
            id,
        )
        .await?;

        transaction.commit().await?;

        let mut history = self
            .list_history(NotificationHistoryFilter {
                organization_ids: organization_ids.to_vec(),
                entity_type: None,
                status: None,
                limit: 100,
            })
            .await?;
        let Some(item) = history.drain(..).find(|item| item.id == id) else {
            return Ok(NotificationRetryResult::NotFound);
        };

        Ok(NotificationRetryResult::Retried(Box::new(item)))
    }

    pub async fn resolve_failed(
        &self,
        id: &str,
        organization_ids: &[String],
        actor_user_id: &str,
        reason: Option<&str>,
    ) -> Result<NotificationResolveResult, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(NotificationResolveResult::Unavailable);
        };
        if organization_ids.is_empty() {
            return Ok(NotificationResolveResult::NotFound);
        }

        let mut transaction = pool.begin().await?;
        let current = sqlx::query(
            "SELECT status, organization_id FROM notification_outbox WHERE id = $1 AND organization_id = ANY($2) FOR UPDATE",
        )
        .bind(id)
        .bind(organization_ids)
        .fetch_optional(&mut *transaction)
        .await?;

        let Some(current) = current else {
            transaction.rollback().await?;
            return Ok(NotificationResolveResult::NotFound);
        };

        let status: String = current.get("status");
        if !matches!(status.as_str(), "failed" | "dead_letter") {
            transaction.rollback().await?;
            return Ok(NotificationResolveResult::InvalidStatus);
        }

        let resolution_note = reason
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or("Manually resolved by manager");

        sqlx::query(
            r#"
            UPDATE notification_outbox
            SET
                status = 'skipped',
                available_at = now(),
                last_error = $2,
                updated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(resolution_note)
        .execute(&mut *transaction)
        .await?;

        insert_notification_audit_event(
            &mut transaction,
            actor_user_id,
            current.get("organization_id"),
            "notification_resolved",
            id,
        )
        .await?;

        transaction.commit().await?;

        let mut history = self
            .list_history(NotificationHistoryFilter {
                organization_ids: organization_ids.to_vec(),
                entity_type: None,
                status: None,
                limit: 100,
            })
            .await?;
        let Some(item) = history.drain(..).find(|item| item.id == id) else {
            return Ok(NotificationResolveResult::NotFound);
        };

        Ok(NotificationResolveResult::Resolved(Box::new(item)))
    }
}

async fn insert_notification_audit_event(
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

#[derive(Clone, Debug)]
pub enum NotificationDispatcherConfig {
    Disabled,
    Webhook(Box<WebhookDispatcherConfig>),
}

#[derive(Clone, Debug)]
pub struct WebhookDispatcherConfig {
    webhook_url: Url,
    bearer_token: Option<String>,
    public_app_url: Url,
    poll_interval: Duration,
    batch_size: i64,
    max_attempts: i32,
}

impl NotificationDispatcherConfig {
    pub fn from_env(production: bool) -> Result<Self, String> {
        let mode =
            std::env::var("NOTIFICATION_DISPATCH_MODE").unwrap_or_else(|_| "disabled".to_string());
        if mode == "disabled" {
            return Ok(Self::Disabled);
        }
        if mode != "webhook" {
            return Err(format!("unsupported NOTIFICATION_DISPATCH_MODE: {mode}"));
        }

        let webhook_url = required_url("NOTIFICATION_WEBHOOK_URL")?;
        let public_app_url = required_url("PUBLIC_APP_URL")?;
        if production && (webhook_url.scheme() != "https" || public_app_url.scheme() != "https") {
            return Err(
                "notification webhook and public app URLs must use HTTPS in production".to_string(),
            );
        }

        let poll_seconds = parse_positive_env("NOTIFICATION_POLL_SECONDS", DEFAULT_POLL_SECONDS)?;
        let batch_size =
            parse_positive_env("NOTIFICATION_BATCH_SIZE", DEFAULT_BATCH_SIZE as u64)? as i64;
        let max_attempts =
            parse_positive_env("NOTIFICATION_MAX_ATTEMPTS", DEFAULT_MAX_ATTEMPTS as u64)? as i32;

        Ok(Self::Webhook(Box::new(WebhookDispatcherConfig {
            webhook_url,
            bearer_token: std::env::var("NOTIFICATION_WEBHOOK_BEARER_TOKEN")
                .ok()
                .filter(|value| !value.trim().is_empty()),
            public_app_url,
            poll_interval: Duration::from_secs(poll_seconds),
            batch_size,
            max_attempts,
        })))
    }
}

#[derive(Debug, Serialize)]
struct WebhookDeliveryRequest<'a> {
    notification_id: &'a str,
    channel: &'a str,
    recipient: &'a str,
    template_key: &'a str,
    payload: Value,
}

#[derive(Debug, Deserialize)]
struct WebhookDeliveryResponse {
    message_id: Option<String>,
}

pub fn start_notification_dispatcher(
    repository: NotificationOutboxRepository,
    config: NotificationDispatcherConfig,
) -> Result<(), String> {
    let NotificationDispatcherConfig::Webhook(config) = config else {
        tracing::info!("notification dispatcher disabled");
        return Ok(());
    };

    if !repository.is_persistent() {
        return Err("notification webhook mode requires DATABASE_URL".to_string());
    }

    tokio::spawn(async move {
        let client = Client::new();
        loop {
            if let Err(error) = dispatch_once(
                &repository,
                &client,
                &config.webhook_url,
                config.bearer_token.as_deref(),
                &config.public_app_url,
                config.batch_size,
                config.max_attempts,
            )
            .await
            {
                tracing::error!(%error, "notification dispatcher cycle failed");
            }
            tokio::time::sleep(config.poll_interval).await;
        }
    });

    Ok(())
}

async fn dispatch_once(
    repository: &NotificationOutboxRepository,
    client: &Client,
    webhook_url: &Url,
    bearer_token: Option<&str>,
    public_app_url: &Url,
    batch_size: i64,
    max_attempts: i32,
) -> Result<(), sqlx::Error> {
    let notifications = repository.claim_batch(batch_size, max_attempts).await?;
    for notification in notifications {
        let payload = absolutize_share_url(notification.payload.clone(), public_app_url);
        let delivery = WebhookDeliveryRequest {
            notification_id: &notification.id,
            channel: &notification.channel,
            recipient: &notification.recipient,
            template_key: &notification.template_key,
            payload,
        };
        let mut request = client.post(webhook_url.clone()).json(&delivery);
        if let Some(token) = bearer_token {
            request = request.bearer_auth(token);
        }

        match request.send().await {
            Ok(response) if response.status().is_success() => {
                let status = response.status().as_u16();
                let receipt = response.json::<WebhookDeliveryResponse>().await.ok();
                let message_id = receipt.and_then(|item| item.message_id);
                repository
                    .mark_sent(&notification.id, status, message_id.as_deref())
                    .await?;
            }
            Ok(response) => {
                let status = response.status().as_u16();
                repository
                    .mark_failed(
                        &notification.id,
                        notification.attempt_count,
                        max_attempts,
                        &format!("provider returned HTTP {status}"),
                        Some(status),
                    )
                    .await?;
            }
            Err(error) => {
                repository
                    .mark_failed(
                        &notification.id,
                        notification.attempt_count,
                        max_attempts,
                        &error.to_string(),
                        None,
                    )
                    .await?;
            }
        }
    }

    Ok(())
}

fn absolutize_share_url(mut payload: Value, public_app_url: &Url) -> Value {
    let relative_url = payload
        .get("share_url")
        .and_then(Value::as_str)
        .filter(|value| value.starts_with('/'))
        .map(str::to_string);
    let Some(relative_url) = relative_url else {
        return payload;
    };

    if let Ok(url) = public_app_url.join(&relative_url) {
        payload["share_url"] = Value::String(url.to_string());
    }
    payload
}

fn required_url(name: &str) -> Result<Url, String> {
    let value = std::env::var(name).map_err(|_| format!("{name} is required in webhook mode"))?;
    Url::parse(&value).map_err(|error| format!("{name} must be a valid URL: {error}"))
}

fn parse_positive_env(name: &str, default: u64) -> Result<u64, String> {
    let value = std::env::var(name)
        .ok()
        .map(|value| value.parse::<u64>())
        .transpose()
        .map_err(|_| format!("{name} must be a positive integer"))?
        .unwrap_or(default);
    if value == 0 {
        return Err(format!("{name} must be greater than zero"));
    }
    Ok(value)
}

fn retry_delay_seconds(attempt_count: i32) -> i32 {
    let exponent = (attempt_count - 1).clamp(0, 6) as u32;
    (60_i32.saturating_mul(2_i32.saturating_pow(exponent))).min(3_600)
}

fn truncate_error(error: &str) -> String {
    error.chars().take(1_000).collect()
}

#[cfg(test)]
mod tests {
    use super::{absolutize_share_url, retry_delay_seconds};
    use reqwest::Url;
    use serde_json::json;

    #[test]
    fn retry_backoff_is_bounded_at_one_hour() {
        assert_eq!(retry_delay_seconds(1), 60);
        assert_eq!(retry_delay_seconds(2), 120);
        assert_eq!(retry_delay_seconds(10), 3_600);
    }

    #[test]
    fn delivery_payload_uses_absolute_customer_link() {
        let payload = absolutize_share_url(
            json!({ "share_url": "/bid-review/token-1" }),
            &Url::parse("https://app.example.com").unwrap(),
        );

        assert_eq!(
            payload["share_url"],
            "https://app.example.com/bid-review/token-1"
        );
    }
}
