#[path = "postgres_completion_reports.rs"]
mod postgres_completion_reports;
#[path = "postgres_read.rs"]
mod postgres_read;
#[path = "postgres_stop_progress.rs"]
mod postgres_stop_progress;
#[path = "postgres_write.rs"]
mod postgres_write;

use crate::{
    completion_reports::{
        CompletionReportActionResult, CompletionReportDeliveryNotificationResult,
        CompletionReportPersistence, CompletionReportResponse,
    },
    photo_storage::PhotoStorageConfig,
    ChecklistItem, JobAddOn, JobDetail, JobSummary, PhotoEvidence, PhotoUploadRequest,
    PhotoUploadResponse,
};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::{SystemTime, UNIX_EPOCH};

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
pub enum JobAddOnStatusUpdate {
    Updated(JobAddOn),
    InvalidStatus,
    InvalidTransition,
    NotFound,
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

    pub async fn list_jobs(&self) -> Vec<JobSummary> {
        if let Some(pool) = &self.pool {
            if let Ok(jobs) = postgres_read::list_jobs(pool).await {
                return jobs;
            }
        }

        seed_job_summaries()
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

    pub async fn start_job(&self, id: &str) -> String {
        if let Some(pool) = &self.pool {
            let _ = postgres_write::start_job(pool, id).await;
        }

        format!("Job {id} has been marked as started.")
    }

    pub async fn complete_job(&self, id: &str) -> String {
        if let Some(pool) = &self.pool {
            let _ = postgres_write::complete_job(pool, id).await;
        }

        format!("Job {id} has been marked as complete.")
    }

    pub async fn update_stop_progress(
        &self,
        day_plan_id: &str,
        stop_id: &str,
        status: &str,
    ) -> bool {
        if let Some(pool) = &self.pool {
            if let Ok(persisted) =
                postgres_stop_progress::update_stop_progress(pool, day_plan_id, stop_id, status)
                    .await
            {
                return persisted;
            }
        }

        false
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
        let upload_nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0);
        let photo_id = format!("photo_{}_{}_{}", job_id, request.photo_type, upload_nonce);
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

    pub async fn complete_photo_upload(&self, job_id: &str, photo_id: &str) -> String {
        if let Some(pool) = &self.pool {
            let _ = postgres_write::complete_photo_upload(pool, job_id, photo_id).await;
        }

        format!("Photo {photo_id} for job {job_id} has been marked uploaded.")
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
