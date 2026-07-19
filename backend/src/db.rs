#[path = "postgres_completion_reports.rs"]
mod postgres_completion_reports;
#[path = "postgres_privacy.rs"]
mod postgres_privacy;
#[path = "postgres_read.rs"]
mod postgres_read;
#[path = "postgres_stop_progress.rs"]
mod postgres_stop_progress;
#[path = "postgres_write.rs"]
mod postgres_write;

use crate::{
    completion_reports::{
        CompletionReportActionResult, CompletionReportDeliveryNotificationResult,
        CompletionReportPersistence, CompletionReportResponse, PropertyCompletionReportSummary,
    },
    photo_storage::{PhotoStorageConfig, UploadedPhotoInspection},
    ChecklistItem, JobAddOn, JobDetail, JobSummary, PhotoEvidence, PhotoUploadMetadata,
    PhotoUploadRequest, PhotoUploadResponse,
};
use serde::Serialize;
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

pub use postgres_stop_progress::StopProgressWriteResult;
pub use postgres_write::ChecklistWriteResult;
pub use postgres_write::JobLifecycleWriteResult;

#[derive(Clone, Debug)]
pub struct DatabaseConfig {
    pub database_url: String,
}

impl DatabaseConfig {
    pub fn from_env() -> Option<Self> {
        std::env::var("DATABASE_URL")
            .ok()
            .map(|database_url| Self { database_url })
    }
}

#[derive(Clone, Debug, Default)]
pub struct JobRepository {
    pool: Option<PgPool>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PhotoProcessingJobRecord {
    pub id: String,
    pub photo_id: String,
    pub job_id: String,
    pub organization_id: String,
    pub task_type: String,
    pub status: String,
    pub attempt_count: i32,
    pub failure_reason: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PhotoProcessingClaim {
    pub id: String,
    pub photo_id: String,
    pub job_id: String,
    pub organization_id: String,
    pub task_type: String,
    pub upload_mode: String,
    pub object_key: String,
    pub thumbnail_object_key: String,
    pub attempt_count: i32,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PhotoErasureDeletionClaim {
    pub id: String,
    pub object_key: String,
    pub attempt_count: i32,
}

#[derive(Clone, Debug, Default)]
pub struct PhotoErasureDeletionHistoryFilter {
    pub organization_ids: Vec<String>,
    pub status: Option<String>,
    pub limit: i64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct PhotoErasureDeletionHistoryItem {
    pub id: String,
    pub account_id: String,
    pub organization_id: String,
    pub object_key: String,
    pub status: String,
    pub attempt_count: i32,
    pub available_at: String,
    pub last_attempt_at: Option<String>,
    pub completed_at: Option<String>,
    pub resolved_at: Option<String>,
    pub last_error: Option<String>,
    pub resolution_note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PhotoErasureDeletionRetryResult {
    Retried(Box<PhotoErasureDeletionHistoryItem>),
    InvalidStatus,
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PhotoErasureDeletionResolveResult {
    Resolved(Box<PhotoErasureDeletionHistoryItem>),
    InvalidStatus,
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, Default)]
pub struct PhotoProcessingHistoryFilter {
    pub organization_ids: Vec<String>,
    pub task_type: Option<String>,
    pub status: Option<String>,
    pub limit: i64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct PhotoProcessingHistoryItem {
    pub id: String,
    pub photo_id: String,
    pub job_id: String,
    pub organization_id: String,
    pub photo_type: String,
    pub file_name: String,
    pub task_type: String,
    pub status: String,
    pub attempt_count: i32,
    pub available_at: String,
    pub last_attempt_at: Option<String>,
    pub completed_at: Option<String>,
    pub resolved_at: Option<String>,
    pub last_error: Option<String>,
    pub failure_reason: Option<String>,
    pub resolution_note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PhotoProcessingRetryResult {
    Retried(Box<PhotoProcessingHistoryItem>),
    InvalidStatus,
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PhotoProcessingResolveResult {
    Resolved(Box<PhotoProcessingHistoryItem>),
    InvalidStatus,
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct CustomerPrivacyExport {
    pub account: CustomerPrivacyAccount,
    pub jobs: Vec<CustomerPrivacyJob>,
    pub photo_evidence: Vec<CustomerPrivacyPhotoEvidence>,
    pub completion_reports: Vec<CustomerPrivacyCompletionReport>,
    pub generated_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct CustomerPrivacyAccount {
    pub account_id: String,
    pub customer_name: String,
    pub billing_model: String,
    pub payment_status: String,
    pub service_approval_status: String,
    pub contracted_services_per_period: i32,
    pub completed_services_this_period: i32,
    pub period_start: Option<String>,
    pub period_end: Option<String>,
    pub billing_notes: Option<String>,
    pub organization_ids: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct CustomerPrivacyJob {
    pub job_id: String,
    pub organization_id: String,
    pub customer_name: String,
    pub property_address: String,
    pub status: String,
    pub scheduled_date: String,
    pub before_photos: i32,
    pub after_photos: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct CustomerPrivacyPhotoEvidence {
    pub photo_id: String,
    pub job_id: String,
    pub organization_id: String,
    pub photo_type: String,
    pub file_name: Option<String>,
    pub content_type: Option<String>,
    pub object_key: Option<String>,
    pub thumbnail_object_key: Option<String>,
    pub status: String,
    pub upload_mode: String,
    pub file_size_bytes: Option<i64>,
    pub image_width_px: Option<i32>,
    pub image_height_px: Option<i32>,
    pub metadata_source: Option<String>,
    pub uploaded_at: Option<String>,
    pub erased_at: Option<String>,
    pub erasure_reason: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct CustomerPrivacyCompletionReport {
    pub report_id: String,
    pub job_id: String,
    pub report_status: String,
    pub ready_for_customer: bool,
    pub sent_at: Option<String>,
    pub delivered_at: Option<String>,
    pub delivered_snapshot_at: Option<String>,
    pub delivered_snapshot_photo_count: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerPrivacyExportResult {
    Exported(Box<CustomerPrivacyExport>),
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct CustomerPhotoErasureSummary {
    pub account_id: String,
    pub status: &'static str,
    pub erased_photo_count: i64,
    pub affected_job_count: i64,
    pub redacted_completion_report_count: i64,
    pub deleted_object_key_count: i64,
    pub failed_object_key_count: i64,
    pub object_keys_pending_deletion: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerPhotoErasureResult {
    Erased(CustomerPhotoErasureSummary),
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum JobAddOnStatusUpdate {
    Updated(JobAddOn),
    InvalidStatus,
    InvalidTransition,
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug)]
pub enum JobDispatchAssignmentResult {
    Updated(JobDetail),
    JobNotFound,
    CrewNotFound,
    CrewCapacityExceeded { capacity: i32, projected: i64 },
    JobAlreadyStarted,
    Unavailable,
}

impl JobRepository {
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

    #[allow(dead_code)]
    pub async fn connect(
        config: &DatabaseConfig,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&config.database_url)
            .await?;

        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool: Some(pool) })
    }

    pub fn pool(&self) -> Option<PgPool> {
        self.pool.clone()
    }

    pub async fn is_database_healthy(&self) -> bool {
        let Some(pool) = &self.pool else {
            return false;
        };

        sqlx::query_scalar::<_, i32>("SELECT 1")
            .fetch_one(pool)
            .await
            .is_ok()
    }

    pub async fn organization_id_for_job(&self, job_id: &str) -> Option<String> {
        if let Some(pool) = &self.pool {
            if let Ok(organization_id) = postgres_read::organization_id_for_job(pool, job_id).await
            {
                return organization_id;
            }
        }

        seed_organization_id_for_job(job_id)
    }

    pub async fn organization_id_for_completion_report(&self, report_id: &str) -> Option<String> {
        if let Some(pool) = &self.pool {
            if let Ok(organization_id) =
                postgres_read::organization_id_for_completion_report(pool, report_id).await
            {
                return organization_id;
            }
        }

        let job_id = report_id.strip_prefix("report_")?;
        seed_organization_id_for_job(job_id)
    }

    pub async fn record_account_view(&self, job_id: &str, actor_user_id: &str) -> bool {
        let Some(pool) = &self.pool else {
            return false;
        };

        let audit_id = format!("audit_account_viewed_{}", Uuid::new_v4().simple());
        sqlx::query_scalar::<_, String>(
            r#"
            INSERT INTO access_audit_events (
                id,
                actor_user_id,
                organization_id,
                event_kind,
                target_id,
                occurred_at
            )
            SELECT $1, $2, organization_id, 'account_viewed', id, NOW()
            FROM service_jobs
            WHERE id = $3
            RETURNING id
            "#,
        )
        .bind(audit_id)
        .bind(actor_user_id)
        .bind(job_id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .is_some()
    }

    pub async fn list_jobs(&self) -> Vec<JobSummary> {
        if let Some(pool) = &self.pool {
            if let Ok(jobs) = postgres_read::list_jobs(pool).await {
                return jobs;
            }
        }

        seed_job_summaries()
    }

    pub async fn update_dispatch_assignment(
        &self,
        job_id: &str,
        crew_id: &str,
        scheduled_date: &str,
        actor_user_id: &str,
    ) -> JobDispatchAssignmentResult {
        let Some(pool) = &self.pool else {
            return JobDispatchAssignmentResult::Unavailable;
        };
        let mut tx = match pool.begin().await {
            Ok(tx) => tx,
            Err(_) => return JobDispatchAssignmentResult::Unavailable,
        };
        let current = match sqlx::query(
            "SELECT organization_id, assigned_crew_id, scheduled_date::text AS scheduled_date, status FROM service_jobs WHERE id = $1 FOR UPDATE",
        )
        .bind(job_id)
        .fetch_optional(&mut *tx)
        .await
        {
            Ok(Some(row)) => row,
            Ok(None) => return JobDispatchAssignmentResult::JobNotFound,
            Err(_) => return JobDispatchAssignmentResult::Unavailable,
        };
        let organization_id: String = current.get("organization_id");
        let old_crew_id: Option<String> = current.get("assigned_crew_id");
        let old_scheduled_date: String = current.get("scheduled_date");
        let status: String = current.get("status");
        if status != "scheduled" {
            return JobDispatchAssignmentResult::JobAlreadyStarted;
        }
        let crew_capacity = sqlx::query_scalar::<_, i32>(
            "SELECT daily_stop_capacity FROM crews WHERE id = $1 AND organization_id = $2 AND status = 'active' FOR UPDATE",
        )
        .bind(crew_id)
        .bind(&organization_id)
        .fetch_optional(&mut *tx)
        .await;
        let capacity = match crew_capacity {
            Ok(Some(capacity)) => capacity,
            Ok(None) => return JobDispatchAssignmentResult::CrewNotFound,
            Err(_) => return JobDispatchAssignmentResult::Unavailable,
        };
        let current_jobs = match sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM service_jobs
            WHERE assigned_crew_id = $1
              AND scheduled_date = $2::date
              AND id <> $3
              AND status <> 'completed'
            "#,
        )
        .bind(crew_id)
        .bind(scheduled_date)
        .bind(job_id)
        .fetch_one(&mut *tx)
        .await
        {
            Ok(count) => count,
            Err(_) => return JobDispatchAssignmentResult::Unavailable,
        };
        let projected = current_jobs + 1;
        if projected > i64::from(capacity) {
            return JobDispatchAssignmentResult::CrewCapacityExceeded {
                capacity,
                projected,
            };
        }
        if sqlx::query(
            "UPDATE service_jobs SET assigned_crew_id = $2, scheduled_date = $3::date, updated_at = NOW() WHERE id = $1",
        )
        .bind(job_id)
        .bind(crew_id)
        .bind(scheduled_date)
        .execute(&mut *tx)
        .await
        .is_err()
        {
            return JobDispatchAssignmentResult::Unavailable;
        }
        if sqlx::query(
            r#"
            INSERT INTO access_audit_events (
                id, actor_user_id, organization_id, event_kind, target_id, occurred_at, metadata
            ) VALUES (
                $1, $2, $3, 'job_reassigned', $4, NOW(),
                jsonb_build_object(
                    'old_crew_id', $5::text, 'new_crew_id', $6::text,
                    'old_scheduled_date', $7::text, 'new_scheduled_date', $8::text
                )
            )
            "#,
        )
        .bind(format!("audit_job_reassigned_{}", Uuid::new_v4().simple()))
        .bind(actor_user_id)
        .bind(&organization_id)
        .bind(job_id)
        .bind(old_crew_id)
        .bind(crew_id)
        .bind(old_scheduled_date)
        .bind(scheduled_date)
        .execute(&mut *tx)
        .await
        .is_err()
            || tx.commit().await.is_err()
        {
            return JobDispatchAssignmentResult::Unavailable;
        }

        match postgres_read::get_job(pool, job_id).await {
            Ok(Some(job)) => JobDispatchAssignmentResult::Updated(job),
            _ => JobDispatchAssignmentResult::Unavailable,
        }
    }

    pub async fn get_job(&self, id: String) -> JobDetail {
        if let Some(pool) = &self.pool {
            if let Ok(Some(job)) = postgres_read::get_job(pool, &id).await {
                return job;
            }
        }

        seed_job_detail(id)
    }

    pub async fn list_job_add_ons(&self, job_id: &str) -> Vec<JobAddOn> {
        if let Some(pool) = &self.pool {
            if let Ok(add_ons) = postgres_read::list_job_add_ons(pool, job_id).await {
                return add_ons;
            }
        }

        Vec::new()
    }

    pub async fn update_job_add_on_status(
        &self,
        job_id: &str,
        add_on_id: &str,
        status: &str,
    ) -> JobAddOnStatusUpdate {
        if !matches!(
            status,
            "scheduled" | "in_progress" | "completed" | "cancelled"
        ) {
            return JobAddOnStatusUpdate::InvalidStatus;
        }

        let Some(pool) = &self.pool else {
            return JobAddOnStatusUpdate::Unavailable;
        };
        let current = match postgres_read::get_job_add_on(pool, job_id, add_on_id).await {
            Ok(Some(add_on)) => add_on,
            Ok(None) => return JobAddOnStatusUpdate::NotFound,
            Err(_) => return JobAddOnStatusUpdate::Unavailable,
        };

        if !valid_add_on_transition(&current.status, status) {
            return JobAddOnStatusUpdate::InvalidTransition;
        }

        match postgres_write::update_job_add_on_status(pool, job_id, add_on_id, status).await {
            Ok(true) => match postgres_read::get_job_add_on(pool, job_id, add_on_id).await {
                Ok(Some(add_on)) => JobAddOnStatusUpdate::Updated(add_on),
                _ => JobAddOnStatusUpdate::Unavailable,
            },
            Ok(false) => match postgres_read::get_job_add_on(pool, job_id, add_on_id).await {
                Ok(Some(_)) => JobAddOnStatusUpdate::InvalidTransition,
                Ok(None) => JobAddOnStatusUpdate::NotFound,
                Err(_) => JobAddOnStatusUpdate::Unavailable,
            },
            Err(_) => JobAddOnStatusUpdate::Unavailable,
        }
    }

    pub async fn start_job(
        &self,
        id: &str,
        client_mutation_id: Option<&str>,
        actor_id: &str,
    ) -> JobLifecycleWriteResult {
        if let Some(pool) = &self.pool {
            if let Ok(result) =
                postgres_write::start_job(pool, id, client_mutation_id, actor_id).await
            {
                return result;
            }
        }
        JobLifecycleWriteResult::NotFound
    }

    pub async fn complete_job(
        &self,
        id: &str,
        client_mutation_id: Option<&str>,
        actor_id: &str,
    ) -> JobLifecycleWriteResult {
        if let Some(pool) = &self.pool {
            if let Ok(result) =
                postgres_write::complete_job(pool, id, client_mutation_id, actor_id).await
            {
                return result;
            }
        }
        JobLifecycleWriteResult::NotFound
    }

    pub async fn update_checklist_item(
        &self,
        job_id: &str,
        item_id: &str,
        completed: bool,
        client_mutation_id: Option<&str>,
        actor_id: &str,
    ) -> ChecklistWriteResult {
        if let Some(pool) = &self.pool {
            if let Ok(result) = postgres_write::update_checklist_item(
                pool,
                job_id,
                item_id,
                completed,
                client_mutation_id,
                actor_id,
            )
            .await
            {
                return result;
            }
        }
        ChecklistWriteResult::NotFound
    }

    pub async fn update_stop_progress(
        &self,
        day_plan_id: &str,
        stop_id: &str,
        status: &str,
        client_mutation_id: Option<&str>,
        actor_id: &str,
    ) -> StopProgressWriteResult {
        if let Some(pool) = &self.pool {
            if let Ok(result) = postgres_stop_progress::update_stop_progress(
                pool,
                day_plan_id,
                stop_id,
                status,
                client_mutation_id,
                actor_id,
            )
            .await
            {
                return result;
            }
        }

        StopProgressWriteResult::NotFound
    }

    pub async fn list_photo_evidence(&self, job_id: &str) -> Vec<PhotoEvidence> {
        if let Some(pool) = &self.pool {
            if let Ok(photos) =
                postgres_read::list_job_photos(pool, job_id, &PhotoStorageConfig::from_env()).await
            {
                return photos;
            }
        }

        Vec::new()
    }

    pub async fn persist_completion_report(
        &self,
        report: &CompletionReportResponse,
    ) -> CompletionReportPersistence {
        if let Some(pool) = &self.pool {
            if let Ok(persistence) =
                postgres_completion_reports::persist_completion_report(pool, report).await
            {
                return persistence;
            }
        }

        CompletionReportPersistence::default()
    }

    pub async fn job_id_for_report_share_token(&self, share_token: &str) -> Option<String> {
        if let Some(pool) = &self.pool {
            if let Ok(job_id) =
                postgres_completion_reports::job_id_for_share_token(pool, share_token).await
            {
                return job_id;
            }
        }

        None
    }

    pub async fn delivered_snapshot_for_report_share_token(
        &self,
        share_token: &str,
    ) -> Option<serde_json::Value> {
        if let Some(pool) = &self.pool {
            if let Ok(snapshot) =
                postgres_completion_reports::delivered_snapshot_for_share_token(pool, share_token)
                    .await
            {
                return snapshot;
            }
        }

        None
    }

    pub async fn list_delivered_completion_reports_for_property(
        &self,
        property_id: &str,
        organization_ids: &[String],
    ) -> Vec<PropertyCompletionReportSummary> {
        if organization_ids.is_empty() {
            return Vec::new();
        }

        if let Some(pool) = &self.pool {
            if let Ok(reports) = postgres_completion_reports::list_delivered_for_property(
                pool,
                property_id,
                organization_ids,
            )
            .await
            {
                return reports;
            }
        }

        Vec::new()
    }

    pub async fn store_delivered_completion_report_snapshot(
        &self,
        report_id: &str,
        report: &CompletionReportResponse,
    ) -> bool {
        if let Some(pool) = &self.pool {
            return postgres_completion_reports::store_delivered_snapshot(pool, report_id, report)
                .await
                .is_ok();
        }

        false
    }

    pub async fn queue_completion_report_delivery_notification(
        &self,
        report_id: &str,
        channel: &str,
        recipient: &str,
    ) -> CompletionReportDeliveryNotificationResult {
        let Some(pool) = &self.pool else {
            return CompletionReportDeliveryNotificationResult::Unavailable;
        };

        postgres_completion_reports::queue_delivery_notification(
            pool, report_id, channel, recipient,
        )
        .await
        .unwrap_or(CompletionReportDeliveryNotificationResult::Unavailable)
    }

    pub async fn start_completion_report_review(
        &self,
        report_id: &str,
        reviewer_user_id: &str,
    ) -> CompletionReportActionResult {
        let Some(pool) = &self.pool else {
            return CompletionReportActionResult::Unavailable;
        };

        postgres_completion_reports::start_completion_report_review(
            pool,
            report_id,
            reviewer_user_id,
        )
        .await
        .unwrap_or(CompletionReportActionResult::Unavailable)
    }

    pub async fn request_completion_report_changes(
        &self,
        report_id: &str,
        reviewer_user_id: &str,
        reason: Option<&str>,
    ) -> CompletionReportActionResult {
        let Some(pool) = &self.pool else {
            return CompletionReportActionResult::Unavailable;
        };

        postgres_completion_reports::request_completion_report_changes(
            pool,
            report_id,
            reviewer_user_id,
            reason,
        )
        .await
        .unwrap_or(CompletionReportActionResult::Unavailable)
    }

    pub async fn resubmit_completion_report(
        &self,
        report_id: &str,
        submitter_user_id: &str,
    ) -> CompletionReportActionResult {
        let Some(pool) = &self.pool else {
            return CompletionReportActionResult::Unavailable;
        };

        postgres_completion_reports::resubmit_completion_report(pool, report_id, submitter_user_id)
            .await
            .unwrap_or(CompletionReportActionResult::Unavailable)
    }

    pub async fn deliver_completion_report(
        &self,
        report_id: &str,
        delivery_user_id: &str,
    ) -> CompletionReportActionResult {
        let Some(pool) = &self.pool else {
            return CompletionReportActionResult::Unavailable;
        };

        postgres_completion_reports::deliver_completion_report(pool, report_id, delivery_user_id)
            .await
            .unwrap_or(CompletionReportActionResult::Unavailable)
    }

    pub async fn create_photo_upload(
        &self,
        job_id: String,
        request: PhotoUploadRequest,
    ) -> PhotoUploadResponse {
        let safe_file_name = request.file_name.replace('/', "-");
        let client_mutation_uuid = request
            .client_mutation_id
            .as_deref()
            .and_then(|id| Uuid::parse_str(id).ok());
        let upload_nonce = client_mutation_uuid
            .map(|id| id.as_u128())
            .unwrap_or_else(|| {
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .map(|duration| duration.as_nanos())
                    .unwrap_or(0)
            });
        let photo_id = client_mutation_uuid
            .map(|id| format!("photo_offline_{}", id.simple()))
            .unwrap_or_else(|| format!("photo_{}_{}_{}", job_id, request.photo_type, upload_nonce));
        let storage_ticket = PhotoStorageConfig::from_env().upload_ticket(
            &job_id,
            &request.photo_type,
            upload_nonce,
            &safe_file_name,
            &request.content_type,
        );

        if let Some(pool) = &self.pool {
            let _ = postgres_write::create_photo_upload(
                pool,
                &job_id,
                &request,
                &photo_id,
                &storage_ticket.object_key,
                &safe_file_name,
                storage_ticket.upload_mode,
                storage_ticket.thumbnail_object_key.as_deref(),
            )
            .await;
        }

        postgres_write::photo_upload_response(job_id, request, photo_id, storage_ticket)
    }

    pub async fn complete_photo_upload(
        &self,
        job_id: &str,
        photo_id: &str,
        metadata: PhotoUploadMetadata,
    ) -> String {
        if let Some(pool) = &self.pool {
            let mut upload_metadata = metadata;
            if let Ok(Some(location)) =
                postgres_read::photo_storage_location(pool, job_id, photo_id).await
            {
                let photo_storage = PhotoStorageConfig::from_env();
                match photo_storage
                    .uploaded_photo_inspection(&location.upload_mode, &location.object_key)
                    .await
                {
                    UploadedPhotoInspection::Extracted(server_metadata) => {
                        if let Some(thumbnail_object_key) = location.thumbnail_object_key.as_deref()
                        {
                            let thumbnail_generated = photo_storage
                                .generate_uploaded_thumbnail(
                                    &location.upload_mode,
                                    &location.object_key,
                                    thumbnail_object_key,
                                )
                                .await;
                            if !thumbnail_generated {
                                let _ = postgres_write::queue_photo_processing_job(
                                    pool,
                                    job_id,
                                    photo_id,
                                    "thumbnail_generation",
                                    "thumbnail_generation_unavailable",
                                )
                                .await;
                            }
                        }
                        upload_metadata = server_metadata;
                    }
                    UploadedPhotoInspection::Rejected(reason) => {
                        let _ = postgres_write::reject_photo_upload(pool, job_id, photo_id, reason)
                            .await;
                        return format!("Photo {photo_id} for job {job_id} has been rejected.");
                    }
                    UploadedPhotoInspection::Unavailable => {
                        if location.upload_mode == "s3-presigned"
                            && location.thumbnail_object_key.is_some()
                        {
                            let _ = postgres_write::queue_photo_processing_job(
                                pool,
                                job_id,
                                photo_id,
                                "thumbnail_generation",
                                "storage_inspection_unavailable",
                            )
                            .await;
                        }
                    }
                }
            }

            let _ = postgres_write::complete_photo_upload(pool, job_id, photo_id, &upload_metadata)
                .await;
        }

        format!("Photo {photo_id} for job {job_id} has been marked uploaded.")
    }

    #[allow(dead_code)]
    pub async fn reject_photo_upload(
        &self,
        job_id: &str,
        photo_id: &str,
        rejected_reason: &str,
    ) -> bool {
        let Some(pool) = &self.pool else {
            return false;
        };

        postgres_write::reject_photo_upload(pool, job_id, photo_id, rejected_reason)
            .await
            .unwrap_or(false)
    }

    #[allow(dead_code)]
    pub async fn queue_photo_processing_retry(
        &self,
        job_id: &str,
        photo_id: &str,
        task_type: &str,
        failure_reason: &str,
    ) -> Option<PhotoProcessingJobRecord> {
        let Some(pool) = &self.pool else {
            return None;
        };

        postgres_write::queue_photo_processing_job(
            pool,
            job_id,
            photo_id,
            task_type,
            failure_reason,
        )
        .await
        .ok()
        .flatten()
    }

    #[allow(dead_code)]
    pub async fn claim_photo_processing_batch(
        &self,
        limit: i64,
        max_attempts: i32,
    ) -> Vec<PhotoProcessingClaim> {
        let Some(pool) = &self.pool else {
            return Vec::new();
        };

        postgres_write::claim_photo_processing_jobs(pool, limit, max_attempts)
            .await
            .unwrap_or_default()
    }

    #[allow(dead_code)]
    pub async fn mark_photo_processing_completed(&self, processing_job_id: &str) -> bool {
        let Some(pool) = &self.pool else {
            return false;
        };

        postgres_write::mark_photo_processing_completed(pool, processing_job_id)
            .await
            .unwrap_or(false)
    }

    #[allow(dead_code)]
    pub async fn mark_photo_processing_failed(
        &self,
        processing_job_id: &str,
        attempt_count: i32,
        max_attempts: i32,
        error: &str,
    ) -> bool {
        let Some(pool) = &self.pool else {
            return false;
        };

        postgres_write::mark_photo_processing_failed(
            pool,
            processing_job_id,
            attempt_count,
            max_attempts,
            error,
        )
        .await
        .unwrap_or(false)
    }

    #[allow(dead_code)]
    pub async fn list_photo_processing_history(
        &self,
        filter: PhotoProcessingHistoryFilter,
    ) -> Result<Vec<PhotoProcessingHistoryItem>, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(Vec::new());
        };

        postgres_write::list_photo_processing_history(pool, filter).await
    }

    #[allow(dead_code)]
    pub async fn retry_photo_processing_job(
        &self,
        processing_job_id: &str,
        organization_ids: &[String],
        actor_user_id: &str,
    ) -> Result<PhotoProcessingRetryResult, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(PhotoProcessingRetryResult::Unavailable);
        };

        postgres_write::retry_photo_processing_job(
            pool,
            processing_job_id,
            organization_ids,
            actor_user_id,
        )
        .await
    }

    #[allow(dead_code)]
    pub async fn resolve_photo_processing_job(
        &self,
        processing_job_id: &str,
        organization_ids: &[String],
        actor_user_id: &str,
        reason: Option<&str>,
    ) -> Result<PhotoProcessingResolveResult, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(PhotoProcessingResolveResult::Unavailable);
        };

        postgres_write::resolve_photo_processing_job(
            pool,
            processing_job_id,
            organization_ids,
            actor_user_id,
            reason,
        )
        .await
    }

    #[allow(dead_code)]
    pub async fn export_customer_privacy_data(
        &self,
        account_id: &str,
        organization_ids: &[String],
        actor_user_id: &str,
    ) -> CustomerPrivacyExportResult {
        let Some(pool) = &self.pool else {
            return CustomerPrivacyExportResult::Unavailable;
        };

        postgres_privacy::export_customer_privacy_data(
            pool,
            account_id,
            organization_ids,
            actor_user_id,
        )
        .await
        .unwrap_or(CustomerPrivacyExportResult::Unavailable)
    }

    #[allow(dead_code)]
    pub async fn erase_customer_photo_evidence(
        &self,
        account_id: &str,
        organization_ids: &[String],
        actor_user_id: &str,
        reason: &str,
    ) -> CustomerPhotoErasureResult {
        let Some(pool) = &self.pool else {
            return CustomerPhotoErasureResult::Unavailable;
        };

        let result = postgres_privacy::erase_customer_photo_evidence(
            pool,
            account_id,
            organization_ids,
            actor_user_id,
            reason,
        )
        .await
        .unwrap_or(CustomerPhotoErasureResult::Unavailable);

        let CustomerPhotoErasureResult::Erased(mut summary) = result else {
            return result;
        };
        let deletion = PhotoStorageConfig::from_env()
            .delete_objects(&summary.object_keys_pending_deletion)
            .await;
        summary.deleted_object_key_count = deletion.deleted_object_key_count;
        summary.failed_object_key_count = deletion.failed_object_keys.len() as i64;
        summary.object_keys_pending_deletion = deletion.failed_object_keys;
        if !summary.object_keys_pending_deletion.is_empty() {
            let _ = postgres_privacy::queue_photo_erasure_deletion_jobs(
                pool,
                account_id,
                &summary.object_keys_pending_deletion,
                organization_ids,
            )
            .await;
        }

        CustomerPhotoErasureResult::Erased(summary)
    }

    pub async fn claim_photo_erasure_deletion_batch(
        &self,
        limit: i64,
        max_attempts: i32,
    ) -> Vec<PhotoErasureDeletionClaim> {
        let Some(pool) = &self.pool else {
            return Vec::new();
        };
        postgres_privacy::claim_photo_erasure_deletion_jobs(pool, limit, max_attempts)
            .await
            .unwrap_or_default()
    }

    pub async fn mark_photo_erasure_deletion_completed(&self, id: &str) -> bool {
        let Some(pool) = &self.pool else {
            return false;
        };
        postgres_privacy::mark_photo_erasure_deletion_completed(pool, id)
            .await
            .unwrap_or(false)
    }

    pub async fn mark_photo_erasure_deletion_failed(
        &self,
        id: &str,
        attempt_count: i32,
        max_attempts: i32,
        error: &str,
    ) -> bool {
        let Some(pool) = &self.pool else {
            return false;
        };
        postgres_privacy::mark_photo_erasure_deletion_failed(
            pool,
            id,
            attempt_count,
            max_attempts,
            error,
        )
        .await
        .unwrap_or(false)
    }

    pub async fn list_photo_erasure_deletion_history(
        &self,
        filter: PhotoErasureDeletionHistoryFilter,
    ) -> Result<Vec<PhotoErasureDeletionHistoryItem>, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(Vec::new());
        };
        postgres_privacy::list_photo_erasure_deletion_history(pool, filter).await
    }

    pub async fn retry_photo_erasure_deletion_job(
        &self,
        id: &str,
        organization_ids: &[String],
        actor_user_id: &str,
    ) -> Result<PhotoErasureDeletionRetryResult, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(PhotoErasureDeletionRetryResult::Unavailable);
        };
        postgres_privacy::retry_photo_erasure_deletion_job(
            pool,
            id,
            organization_ids,
            actor_user_id,
        )
        .await
    }

    pub async fn resolve_photo_erasure_deletion_job(
        &self,
        id: &str,
        organization_ids: &[String],
        actor_user_id: &str,
        reason: Option<&str>,
    ) -> Result<PhotoErasureDeletionResolveResult, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(PhotoErasureDeletionResolveResult::Unavailable);
        };
        postgres_privacy::resolve_photo_erasure_deletion_job(
            pool,
            id,
            organization_ids,
            actor_user_id,
            reason,
        )
        .await
    }

    #[allow(dead_code)]
    pub fn is_database_ready(&self) -> bool {
        self.pool.is_some()
    }
}

fn valid_add_on_transition(current: &str, next: &str) -> bool {
    current == next
        || matches!(
            (current, next),
            ("scheduled", "in_progress" | "cancelled") | ("in_progress", "completed" | "cancelled")
        )
}

fn seed_job_summaries() -> Vec<JobSummary> {
    vec![
        JobSummary {
            id: "job_1001".to_string(),
            organization_id: "org_demo_landscaping".to_string(),
            assigned_crew_id: Some("crew_1001".to_string()),
            customer_name: "Sample Customer".to_string(),
            property_address: "123 Oak Street".to_string(),
            status: "scheduled".to_string(),
            scheduled_date: "2026-06-15".to_string(),
            before_photos: 0,
            after_photos: 0,
            checklist_items: 4,
            completed_checklist_items: 0,
        },
        JobSummary {
            id: "job_1002".to_string(),
            organization_id: "org_demo_landscaping".to_string(),
            assigned_crew_id: Some("crew_1001".to_string()),
            customer_name: "Demo Property Owner".to_string(),
            property_address: "456 Maple Avenue".to_string(),
            status: "in_progress".to_string(),
            scheduled_date: "2026-06-15".to_string(),
            before_photos: 3,
            after_photos: 1,
            checklist_items: 4,
            completed_checklist_items: 2,
        },
    ]
}

fn seed_organization_id_for_job(job_id: &str) -> Option<String> {
    seed_job_summaries()
        .into_iter()
        .find(|job| job.id == job_id)
        .map(|job| job.organization_id)
}

fn seed_job_detail(id: String) -> JobDetail {
    let summary = seed_job_summaries()
        .into_iter()
        .find(|job| job.id == id)
        .unwrap_or(JobSummary {
            id,
            organization_id: "org_demo_landscaping".to_string(),
            assigned_crew_id: Some("crew_1001".to_string()),
            customer_name: "Sample Customer".to_string(),
            property_address: "123 Oak Street".to_string(),
            status: "scheduled".to_string(),
            scheduled_date: "2026-06-15".to_string(),
            before_photos: 0,
            after_photos: 0,
            checklist_items: 4,
            completed_checklist_items: 0,
        });

    let yard_service_completed = summary.status != "scheduled";
    let completion_notes_completed = summary.status == "completed";

    JobDetail {
        id: summary.id,
        organization_id: summary.organization_id,
        assigned_crew_id: summary.assigned_crew_id,
        customer_name: summary.customer_name,
        property_address: summary.property_address,
        status: summary.status,
        scheduled_date: summary.scheduled_date,
        before_photos: summary.before_photos,
        after_photos: summary.after_photos,
        checklist_items: summary.checklist_items,
        completed_checklist_items: summary.completed_checklist_items,
        checklist: vec![
            ChecklistItem {
                id: "before-photos".to_string(),
                label: "Capture before photos".to_string(),
                completed: summary.before_photos > 0,
            },
            ChecklistItem {
                id: "yard-service".to_string(),
                label: "Complete yard service".to_string(),
                completed: yard_service_completed,
            },
            ChecklistItem {
                id: "after-photos".to_string(),
                label: "Capture after photos".to_string(),
                completed: summary.after_photos > 0,
            },
            ChecklistItem {
                id: "completion-notes".to_string(),
                label: "Submit completion notes".to_string(),
                completed: completion_notes_completed,
            },
        ],
    }
}
