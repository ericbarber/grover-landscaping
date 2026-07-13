use super::{PhotoProcessingClaim, PhotoProcessingJobRecord};
use crate::{
    photo_storage::PhotoStorageTicket, PhotoUploadMetadata, PhotoUploadRequest, PhotoUploadResponse,
};
use sqlx::{PgPool, Row};
use uuid::Uuid;

const PHOTO_PROCESSING_RETRY_BASE_SECONDS: i32 = 30;
const PHOTO_PROCESSING_RETRY_MAX_SECONDS: i32 = 900;

pub async fn start_job(pool: &PgPool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE service_jobs SET status = 'in_progress', updated_at = now() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;

    sqlx::query("UPDATE job_checklist_items SET completed = true WHERE job_id = $1 AND id LIKE '%yard_service'")
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn complete_job(pool: &PgPool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE service_jobs SET status = 'completed', completed_checklist_items = checklist_items, updated_at = now() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;

    sqlx::query("UPDATE job_checklist_items SET completed = true WHERE job_id = $1")
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn update_job_add_on_status(
    pool: &PgPool,
    job_id: &str,
    add_on_id: &str,
    status: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        r#"
        UPDATE service_job_add_ons
        SET status = $3, updated_at = now()
        WHERE job_id = $1
          AND id = $2
          AND (
              status = $3
              OR (status = 'scheduled' AND $3 IN ('in_progress', 'cancelled'))
              OR (status = 'in_progress' AND $3 IN ('completed', 'cancelled'))
          )
        "#,
    )
    .bind(job_id)
    .bind(add_on_id)
    .bind(status)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() == 1)
}

#[allow(clippy::too_many_arguments)]
pub async fn create_photo_upload(
    pool: &PgPool,
    job_id: &str,
    request: &PhotoUploadRequest,
    photo_id: &str,
    object_key: &str,
    safe_file_name: &str,
    upload_mode: &str,
    thumbnail_object_key: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO job_photos (id, job_id, photo_type, file_name, content_type, object_key, upload_mode, thumbnail_object_key, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') ON CONFLICT (id) DO UPDATE SET file_name = EXCLUDED.file_name, content_type = EXCLUDED.content_type, object_key = EXCLUDED.object_key, upload_mode = EXCLUDED.upload_mode, thumbnail_object_key = EXCLUDED.thumbnail_object_key")
        .bind(photo_id)
        .bind(job_id)
        .bind(&request.photo_type)
        .bind(safe_file_name)
        .bind(&request.content_type)
        .bind(object_key)
        .bind(upload_mode)
        .bind(thumbnail_object_key)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn complete_photo_upload(
    pool: &PgPool,
    job_id: &str,
    photo_id: &str,
    metadata: &PhotoUploadMetadata,
) -> Result<(), sqlx::Error> {
    let fallback_metadata_source = if metadata.file_size_bytes.is_some()
        || metadata.image_width_px.is_some()
        || metadata.image_height_px.is_some()
    {
        Some("client_reported")
    } else {
        None
    };
    let metadata_source = metadata
        .metadata_source
        .as_deref()
        .or(fallback_metadata_source);
    let photo_status = if metadata_source == Some("server_extracted") {
        "processed"
    } else {
        "uploaded"
    };
    let Some(row) = sqlx::query(
        r#"
        UPDATE job_photos
        SET
            status = $7,
            uploaded_at = now(),
            file_size_bytes = COALESCE($3, file_size_bytes),
            image_width_px = COALESCE($4, image_width_px),
            image_height_px = COALESCE($5, image_height_px),
            metadata_source = COALESCE($6, metadata_source),
            metadata_captured_at = CASE
                WHEN $6::text IS NULL THEN metadata_captured_at
                ELSE now()
            END
        WHERE id = $1 AND job_id = $2
        RETURNING photo_type
        "#,
    )
    .bind(photo_id)
    .bind(job_id)
    .bind(metadata.file_size_bytes)
    .bind(metadata.image_width_px)
    .bind(metadata.image_height_px)
    .bind(metadata_source)
    .bind(photo_status)
    .fetch_optional(pool)
    .await?
    else {
        return Ok(());
    };

    let photo_type: String = row.get("photo_type");
    if photo_type == "before" {
        sqlx::query("UPDATE service_jobs SET before_photos = before_photos + 1, updated_at = now() WHERE id = $1")
            .bind(job_id)
            .execute(pool)
            .await?;
    } else if photo_type == "after" {
        sqlx::query("UPDATE service_jobs SET after_photos = after_photos + 1, updated_at = now() WHERE id = $1")
            .bind(job_id)
            .execute(pool)
            .await?;
    }

    Ok(())
}

pub async fn reject_photo_upload(
    pool: &PgPool,
    job_id: &str,
    photo_id: &str,
    rejected_reason: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        r#"
        UPDATE job_photos
        SET
            status = 'rejected',
            uploaded_at = now(),
            metadata_source = 'server_rejected',
            metadata_captured_at = now(),
            rejected_reason = $3,
            rejected_at = now()
        WHERE id = $1 AND job_id = $2
        "#,
    )
    .bind(photo_id)
    .bind(job_id)
    .bind(rejected_reason)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn queue_photo_processing_job(
    pool: &PgPool,
    job_id: &str,
    photo_id: &str,
    task_type: &str,
    failure_reason: &str,
) -> Result<Option<PhotoProcessingJobRecord>, sqlx::Error> {
    let processing_job_id = format!("photo_processing_{}", Uuid::new_v4().simple());
    let row = sqlx::query(
        r#"
        INSERT INTO photo_processing_jobs (
            id,
            photo_id,
            job_id,
            organization_id,
            task_type,
            status,
            failure_reason
        )
        SELECT
            $1,
            photo.id,
            photo.job_id,
            job.organization_id,
            $4,
            'queued',
            $5
        FROM job_photos photo
        JOIN service_jobs job ON job.id = photo.job_id
        WHERE photo.job_id = $2
          AND photo.id = $3
          AND photo.thumbnail_object_key IS NOT NULL
          AND $4 = 'thumbnail_generation'
        ON CONFLICT (photo_id, task_type) DO UPDATE
        SET
            status = CASE
                WHEN photo_processing_jobs.status IN ('completed', 'processing') THEN photo_processing_jobs.status
                ELSE 'queued'
            END,
            available_at = CASE
                WHEN photo_processing_jobs.status IN ('completed', 'processing') THEN photo_processing_jobs.available_at
                ELSE now()
            END,
            failure_reason = CASE
                WHEN photo_processing_jobs.status = 'completed' THEN photo_processing_jobs.failure_reason
                ELSE EXCLUDED.failure_reason
            END,
            last_error = CASE
                WHEN photo_processing_jobs.status = 'completed' THEN photo_processing_jobs.last_error
                ELSE NULL
            END,
            updated_at = now()
        RETURNING
            id,
            photo_id,
            job_id,
            organization_id,
            task_type,
            status,
            attempt_count,
            failure_reason
        "#,
    )
    .bind(processing_job_id)
    .bind(job_id)
    .bind(photo_id)
    .bind(task_type)
    .bind(truncate_photo_processing_error(failure_reason))
    .fetch_optional(pool)
    .await?;

    Ok(row.map(photo_processing_job_record))
}

pub async fn claim_photo_processing_jobs(
    pool: &PgPool,
    limit: i64,
    max_attempts: i32,
) -> Result<Vec<PhotoProcessingClaim>, sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE photo_processing_jobs
        SET status = 'dead_letter', updated_at = now()
        WHERE attempt_count >= $1
          AND (
              status = 'failed'
              OR (status = 'processing' AND updated_at < now() - interval '10 minutes')
          )
        "#,
    )
    .bind(max_attempts)
    .execute(pool)
    .await?;

    let rows = sqlx::query(
        r#"
        WITH candidates AS (
            SELECT processing.id
            FROM photo_processing_jobs processing
            JOIN job_photos photo ON photo.id = processing.photo_id
            WHERE photo.thumbnail_object_key IS NOT NULL
              AND (
                  (
                      processing.status IN ('queued', 'failed')
                      AND processing.available_at <= now()
                      AND processing.attempt_count < $2
                  ) OR (
                      processing.status = 'processing'
                      AND processing.updated_at < now() - interval '10 minutes'
                      AND processing.attempt_count < $2
                  )
              )
            ORDER BY processing.available_at, processing.created_at, processing.id
            FOR UPDATE SKIP LOCKED
            LIMIT $1
        )
        UPDATE photo_processing_jobs processing
        SET
            status = 'processing',
            attempt_count = processing.attempt_count + 1,
            last_attempt_at = now(),
            updated_at = now()
        FROM candidates, job_photos photo
        WHERE processing.id = candidates.id
          AND photo.id = processing.photo_id
        RETURNING
            processing.id,
            processing.photo_id,
            processing.job_id,
            processing.organization_id,
            processing.task_type,
            COALESCE(photo.upload_mode, 'local-placeholder') AS upload_mode,
            photo.object_key,
            photo.thumbnail_object_key,
            processing.attempt_count
        "#,
    )
    .bind(limit.clamp(1, 100))
    .bind(max_attempts)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| PhotoProcessingClaim {
            id: row.get("id"),
            photo_id: row.get("photo_id"),
            job_id: row.get("job_id"),
            organization_id: row.get("organization_id"),
            task_type: row.get("task_type"),
            upload_mode: row.get("upload_mode"),
            object_key: row.get("object_key"),
            thumbnail_object_key: row.get("thumbnail_object_key"),
            attempt_count: row.get("attempt_count"),
        })
        .collect())
}

pub async fn mark_photo_processing_completed(
    pool: &PgPool,
    processing_job_id: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        r#"
        UPDATE photo_processing_jobs
        SET
            status = 'completed',
            completed_at = now(),
            last_error = NULL,
            updated_at = now()
        WHERE id = $1 AND status = 'processing'
        "#,
    )
    .bind(processing_job_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() == 1)
}

pub async fn mark_photo_processing_failed(
    pool: &PgPool,
    processing_job_id: &str,
    attempt_count: i32,
    max_attempts: i32,
    error: &str,
) -> Result<bool, sqlx::Error> {
    let retry_seconds = photo_processing_retry_delay_seconds(attempt_count);
    let status = if attempt_count >= max_attempts {
        "dead_letter"
    } else {
        "failed"
    };
    let result = sqlx::query(
        r#"
        UPDATE photo_processing_jobs
        SET
            status = $2,
            last_error = $3,
            available_at = now() + make_interval(secs => $4),
            updated_at = now()
        WHERE id = $1 AND status = 'processing'
        "#,
    )
    .bind(processing_job_id)
    .bind(status)
    .bind(truncate_photo_processing_error(error))
    .bind(retry_seconds)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() == 1)
}

pub fn photo_upload_response(
    job_id: String,
    request: PhotoUploadRequest,
    photo_id: String,
    storage_ticket: PhotoStorageTicket,
) -> PhotoUploadResponse {
    PhotoUploadResponse {
        status: "created",
        job_id,
        photo_id,
        photo_type: request.photo_type,
        file_name: request.file_name,
        content_type: request.content_type,
        upload_mode: storage_ticket.upload_mode,
        upload_url: storage_ticket.upload_url,
        object_key: storage_ticket.object_key,
        thumbnail_upload_url: storage_ticket.thumbnail_upload_url,
        thumbnail_object_key: storage_ticket.thumbnail_object_key,
        thumbnail_content_type: storage_ticket.thumbnail_content_type,
        thumbnail_max_dimension_px: storage_ticket.thumbnail_max_dimension_px,
    }
}

fn photo_processing_job_record(row: sqlx::postgres::PgRow) -> PhotoProcessingJobRecord {
    PhotoProcessingJobRecord {
        id: row.get("id"),
        photo_id: row.get("photo_id"),
        job_id: row.get("job_id"),
        organization_id: row.get("organization_id"),
        task_type: row.get("task_type"),
        status: row.get("status"),
        attempt_count: row.get("attempt_count"),
        failure_reason: row.get("failure_reason"),
    }
}

fn photo_processing_retry_delay_seconds(attempt_count: i32) -> i32 {
    let exponent = attempt_count.saturating_sub(1).min(5);
    let delay = PHOTO_PROCESSING_RETRY_BASE_SECONDS.saturating_mul(2_i32.pow(exponent as u32));
    delay.min(PHOTO_PROCESSING_RETRY_MAX_SECONDS)
}

fn truncate_photo_processing_error(error: &str) -> String {
    error.chars().take(500).collect()
}
