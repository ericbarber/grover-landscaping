use crate::{postgres_read, postgres_write, ChecklistItem, JobDetail, JobSummary, PhotoUploadRequest, PhotoUploadResponse};
use sqlx::{postgres::PgPoolOptions, PgPool};

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

impl JobRepository {
    pub fn new_seeded() -> Self {
        Self { pool: None }
    }

    pub async fn connect(config: &DatabaseConfig) -> Result<Self, sqlx::Error> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&config.database_url)
            .await?;

        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool: Some(pool) })
    }

    pub async fn list_jobs(&self) -> Result<Vec<JobSummary>, sqlx::Error> {
        match &self.pool {
            Some(pool) => postgres_read::list_jobs(pool).await,
            None => Ok(seed_job_summaries()),
        }
    }

    pub async fn get_job(&self, id: String) -> Result<Option<JobDetail>, sqlx::Error> {
        match &self.pool {
            Some(pool) => postgres_read::get_job(pool, &id).await,
            None => Ok(Some(seed_job_detail(id))),
        }
    }

    pub async fn start_job(&self, id: &str) -> Result<String, sqlx::Error> {
        if let Some(pool) = &self.pool {
            postgres_write::start_job(pool, id).await?;
        }

        Ok(format!("Job {id} has been marked as started."))
    }

    pub async fn complete_job(&self, id: &str) -> Result<String, sqlx::Error> {
        if let Some(pool) = &self.pool {
            postgres_write::complete_job(pool, id).await?;
        }

        Ok(format!("Job {id} has been marked as complete."))
    }

    pub async fn create_photo_upload(
        &self,
        job_id: String,
        request: PhotoUploadRequest,
    ) -> Result<PhotoUploadResponse, sqlx::Error> {
        let safe_file_name = request.file_name.replace('/', "-");
        let photo_id = format!("photo_{}_{}", job_id, request.photo_type);
        let object_key = format!(
            "local/jobs/{job_id}/{photo_type}/{safe_file_name}",
            photo_type = request.photo_type
        );

        if let Some(pool) = &self.pool {
            postgres_write::create_photo_upload(
                pool,
                &job_id,
                &request,
                &photo_id,
                &object_key,
                &safe_file_name,
            )
            .await?;
        }

        Ok(postgres_write::local_photo_response(
            job_id,
            request,
            photo_id,
            object_key,
        ))
    }

    pub async fn complete_photo_upload(
        &self,
        job_id: &str,
        photo_id: &str,
    ) -> Result<String, sqlx::Error> {
        if let Some(pool) = &self.pool {
            postgres_write::complete_photo_upload(pool, job_id, photo_id).await?;
        }

        Ok(format!("Photo {photo_id} for job {job_id} has been marked uploaded."))
    }
}

fn seed_job_summaries() -> Vec<JobSummary> {
    vec![
        JobSummary {
            id: "job_1001".to_string(),
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

fn seed_job_detail(id: String) -> JobDetail {
    let summary = seed_job_summaries()
        .into_iter()
        .find(|job| job.id == id)
        .unwrap_or(JobSummary {
            id,
            customer_name: "Sample Customer".to_string(),
            property_address: "123 Oak Street".to_string(),
            status: "scheduled".to_string(),
            scheduled_date: "2026-06-15".to_string(),
            before_photos: 0,
            after_photos: 0,
            checklist_items: 4,
            completed_checklist_items: 0,
        });

    JobDetail {
        id: summary.id,
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
                completed: summary.status != "scheduled",
            },
            ChecklistItem {
                id: "after-photos".to_string(),
                label: "Capture after photos".to_string(),
                completed: summary.after_photos > 0,
            },
            ChecklistItem {
                id: "completion-notes".to_string(),
                label: "Submit completion notes".to_string(),
                completed: summary.status == "completed",
            },
        ],
    }
}
