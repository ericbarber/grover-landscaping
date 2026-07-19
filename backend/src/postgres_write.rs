use super::{
    PhotoProcessingClaim, PhotoProcessingHistoryFilter, PhotoProcessingHistoryItem,
    PhotoProcessingJobRecord, PhotoProcessingResolveResult, PhotoProcessingRetryResult,
};
use crate::{
    photo_storage::PhotoStorageTicket, PhotoUploadMetadata, PhotoUploadRequest, PhotoUploadResponse,
};
use sqlx::{PgConnection, PgPool, Row};
use uuid::Uuid;

const PHOTO_PROCESSING_RETRY_BASE_SECONDS: i32 = 30;
const PHOTO_PROCESSING_RETRY_MAX_SECONDS: i32 = 900;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum JobLifecycleWriteResult {
    Persisted,
    Replayed,
    NotFound,
    IdempotencyConflict,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ChecklistWriteResult {
    Persisted,
    Replayed,
    NotFound,
    IdempotencyConflict,
}

async fn claim_job_lifecycle_mutation(
    connection: &mut PgConnection,
    id: &str,
    action: &str,
    client_mutation_id: Option<&str>,
    actor_id: &str,
) -> Result<JobLifecycleWriteResult, sqlx::Error> {
    let Some(client_mutation_id) = client_mutation_id else {
        return Ok(JobLifecycleWriteResult::Persisted);
    };
    let inserted = sqlx::query_scalar::<_, String>(
        r#"
        INSERT INTO job_lifecycle_mutations (
            client_mutation_id, organization_id, actor_id, job_id, requested_action
        )
        SELECT $1::uuid, organization_id, $4, id, $3
        FROM service_jobs
        WHERE id = $2
        ON CONFLICT (client_mutation_id) DO NOTHING
        RETURNING client_mutation_id::text
        "#,
    )
    .bind(client_mutation_id)
    .bind(id)
    .bind(action)
    .bind(actor_id)
    .fetch_optional(&mut *connection)
    .await?;
    if inserted.is_some() {
        return Ok(JobLifecycleWriteResult::Persisted);
    }
    let existing = sqlx::query_as::<_, (String, String, String)>(
        "SELECT actor_id, job_id, requested_action FROM job_lifecycle_mutations WHERE client_mutation_id = $1::uuid",
    )
    .bind(client_mutation_id)
    .fetch_optional(&mut *connection)
    .await?;
    Ok(match existing {
        Some((existing_actor, existing_job, existing_action))
            if existing_actor == actor_id && existing_job == id && existing_action == action =>
        {
            JobLifecycleWriteResult::Replayed
        }
        Some(_) => JobLifecycleWriteResult::IdempotencyConflict,
        None => JobLifecycleWriteResult::NotFound,
    })
}

pub async fn start_job(
    pool: &PgPool,
    id: &str,
    client_mutation_id: Option<&str>,
    actor_id: &str,
) -> Result<JobLifecycleWriteResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let claim =
        claim_job_lifecycle_mutation(&mut transaction, id, "start", client_mutation_id, actor_id)
            .await?;
    if claim != JobLifecycleWriteResult::Persisted {
        transaction.rollback().await?;
        return Ok(claim);
    }
    let result = sqlx::query(
        "UPDATE service_jobs SET status = 'in_progress', updated_at = now() WHERE id = $1",
    )
    .bind(id)
    .execute(&mut *transaction)
    .await?;
    if result.rows_affected() != 1 {
        transaction.rollback().await?;
        return Ok(JobLifecycleWriteResult::NotFound);
    }

    sqlx::query("UPDATE job_checklist_items SET completed = true WHERE job_id = $1 AND id LIKE '%yard_service'")
        .bind(id)
        .execute(&mut *transaction)
        .await?;

    transaction.commit().await?;
    Ok(JobLifecycleWriteResult::Persisted)
}

pub async fn complete_job(
    pool: &PgPool,
    id: &str,
    client_mutation_id: Option<&str>,
    actor_id: &str,
) -> Result<JobLifecycleWriteResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let claim = claim_job_lifecycle_mutation(
        &mut transaction,
        id,
        "complete",
        client_mutation_id,
        actor_id,
    )
    .await?;
    if claim != JobLifecycleWriteResult::Persisted {
        transaction.rollback().await?;
        return Ok(claim);
    }
    let result = sqlx::query("UPDATE service_jobs SET status = 'completed', completed_checklist_items = checklist_items, updated_at = now() WHERE id = $1")
        .bind(id)
        .execute(&mut *transaction)
        .await?;
    if result.rows_affected() != 1 {
        transaction.rollback().await?;
        return Ok(JobLifecycleWriteResult::NotFound);
    }

    sqlx::query("UPDATE job_checklist_items SET completed = true WHERE job_id = $1")
        .bind(id)
        .execute(&mut *transaction)
        .await?;

    transaction.commit().await?;
    Ok(JobLifecycleWriteResult::Persisted)
}

pub async fn update_checklist_item(
    pool: &PgPool,
    job_id: &str,
    item_id: &str,
    completed: bool,
    client_mutation_id: Option<&str>,
    actor_id: &str,
) -> Result<ChecklistWriteResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    if let Some(client_mutation_id) = client_mutation_id {
        let inserted = sqlx::query_scalar::<_, String>(
            r#"
            INSERT INTO checklist_mutations (
                client_mutation_id,
                organization_id,
                actor_id,
                job_id,
                checklist_item_id,
                requested_completed
            )
            SELECT $1::uuid, sj.organization_id, $5, sj.id, jci.id, $4
            FROM service_jobs sj
            JOIN job_checklist_items jci ON jci.job_id = sj.id
            WHERE sj.id = $2 AND jci.id = $3
            ON CONFLICT (client_mutation_id) DO NOTHING
            RETURNING client_mutation_id::text
            "#,
        )
        .bind(client_mutation_id)
        .bind(job_id)
        .bind(item_id)
        .bind(completed)
        .bind(actor_id)
        .fetch_optional(&mut *transaction)
        .await?;
        if inserted.is_none() {
            let existing = sqlx::query_as::<_, (String, String, String, bool)>(
                r#"
                SELECT actor_id, job_id, checklist_item_id, requested_completed
                FROM checklist_mutations
                WHERE client_mutation_id = $1::uuid
                "#,
            )
            .bind(client_mutation_id)
            .fetch_optional(&mut *transaction)
            .await?;
            transaction.rollback().await?;
            return Ok(match existing {
                Some((existing_actor, existing_job, existing_item, existing_completed))
                    if existing_actor == actor_id
                        && existing_job == job_id
                        && existing_item == item_id
                        && existing_completed == completed =>
                {
                    ChecklistWriteResult::Replayed
                }
                Some(_) => ChecklistWriteResult::IdempotencyConflict,
                None => ChecklistWriteResult::NotFound,
            });
        }
    }
    let result =
        sqlx::query("UPDATE job_checklist_items SET completed = $3 WHERE job_id = $1 AND id = $2")
            .bind(job_id)
            .bind(item_id)
            .bind(completed)
            .execute(&mut *transaction)
            .await?;
    if result.rows_affected() != 1 {
        transaction.rollback().await?;
        return Ok(ChecklistWriteResult::NotFound);
    }
    sqlx::query(
        r#"
        UPDATE service_jobs
        SET completed_checklist_items = (
            SELECT COUNT(*)::INTEGER
            FROM job_checklist_items
            WHERE job_id = $1 AND completed
        ),
        updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(job_id)
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(ChecklistWriteResult::Persisted)
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

pub async fn list_photo_processing_history(
    pool: &PgPool,
    filter: PhotoProcessingHistoryFilter,
) -> Result<Vec<PhotoProcessingHistoryItem>, sqlx::Error> {
    if filter.organization_ids.is_empty() {
        return Ok(Vec::new());
    }
    let limit = filter.limit.clamp(1, 100);
    let rows = sqlx::query(
        r#"
        SELECT
            processing.id,
            processing.photo_id,
            processing.job_id,
            processing.organization_id,
            photo.photo_type,
            photo.file_name,
            processing.task_type,
            processing.status,
            processing.attempt_count,
            processing.available_at::text AS available_at,
            processing.last_attempt_at::text AS last_attempt_at,
            processing.completed_at::text AS completed_at,
            processing.resolved_at::text AS resolved_at,
            processing.last_error,
            processing.failure_reason,
            processing.resolution_note,
            processing.created_at::text AS created_at,
            processing.updated_at::text AS updated_at
        FROM photo_processing_jobs processing
        JOIN job_photos photo ON photo.id = processing.photo_id
        WHERE processing.organization_id = ANY($1)
          AND ($2::text IS NULL OR processing.task_type = $2)
          AND ($3::text IS NULL OR processing.status = $3)
        ORDER BY processing.created_at DESC, processing.id DESC
        LIMIT $4
        "#,
    )
    .bind(filter.organization_ids)
    .bind(filter.task_type)
    .bind(filter.status)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(photo_processing_history_item)
        .collect())
}

pub async fn retry_photo_processing_job(
    pool: &PgPool,
    processing_job_id: &str,
    organization_ids: &[String],
    actor_user_id: &str,
) -> Result<PhotoProcessingRetryResult, sqlx::Error> {
    if organization_ids.is_empty() {
        return Ok(PhotoProcessingRetryResult::NotFound);
    }

    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        "SELECT status, organization_id FROM photo_processing_jobs WHERE id = $1 AND organization_id = ANY($2) FOR UPDATE",
    )
    .bind(processing_job_id)
    .bind(organization_ids)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PhotoProcessingRetryResult::NotFound);
    };

    let status: String = current.get("status");
    if !matches!(status.as_str(), "failed" | "dead_letter") {
        transaction.rollback().await?;
        return Ok(PhotoProcessingRetryResult::InvalidStatus);
    }

    sqlx::query(
        r#"
        UPDATE photo_processing_jobs
        SET
            status = 'queued',
            attempt_count = 0,
            available_at = now(),
            last_attempt_at = NULL,
            completed_at = NULL,
            resolved_at = NULL,
            last_error = NULL,
            resolution_note = NULL,
            updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(processing_job_id)
    .execute(&mut *transaction)
    .await?;

    insert_photo_processing_audit_event(
        &mut transaction,
        actor_user_id,
        current.get("organization_id"),
        "photo_processing_retried",
        processing_job_id,
    )
    .await?;

    transaction.commit().await?;

    let item = photo_processing_history_by_id(pool, processing_job_id, organization_ids).await?;
    Ok(item
        .map(|item| PhotoProcessingRetryResult::Retried(Box::new(item)))
        .unwrap_or(PhotoProcessingRetryResult::NotFound))
}

pub async fn resolve_photo_processing_job(
    pool: &PgPool,
    processing_job_id: &str,
    organization_ids: &[String],
    actor_user_id: &str,
    reason: Option<&str>,
) -> Result<PhotoProcessingResolveResult, sqlx::Error> {
    if organization_ids.is_empty() {
        return Ok(PhotoProcessingResolveResult::NotFound);
    }

    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        "SELECT status, organization_id FROM photo_processing_jobs WHERE id = $1 AND organization_id = ANY($2) FOR UPDATE",
    )
    .bind(processing_job_id)
    .bind(organization_ids)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PhotoProcessingResolveResult::NotFound);
    };

    let status: String = current.get("status");
    if !matches!(status.as_str(), "failed" | "dead_letter") {
        transaction.rollback().await?;
        return Ok(PhotoProcessingResolveResult::InvalidStatus);
    }

    let resolution_note = reason
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("Manually resolved by manager");
    sqlx::query(
        r#"
        UPDATE photo_processing_jobs
        SET
            status = 'resolved',
            resolved_at = now(),
            resolution_note = $2,
            updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(processing_job_id)
    .bind(truncate_photo_processing_error(resolution_note))
    .execute(&mut *transaction)
    .await?;

    insert_photo_processing_audit_event(
        &mut transaction,
        actor_user_id,
        current.get("organization_id"),
        "photo_processing_resolved",
        processing_job_id,
    )
    .await?;

    transaction.commit().await?;

    let item = photo_processing_history_by_id(pool, processing_job_id, organization_ids).await?;
    Ok(item
        .map(|item| PhotoProcessingResolveResult::Resolved(Box::new(item)))
        .unwrap_or(PhotoProcessingResolveResult::NotFound))
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

fn photo_processing_history_item(row: sqlx::postgres::PgRow) -> PhotoProcessingHistoryItem {
    PhotoProcessingHistoryItem {
        id: row.get("id"),
        photo_id: row.get("photo_id"),
        job_id: row.get("job_id"),
        organization_id: row.get("organization_id"),
        photo_type: row.get("photo_type"),
        file_name: row.get("file_name"),
        task_type: row.get("task_type"),
        status: row.get("status"),
        attempt_count: row.get("attempt_count"),
        available_at: row.get("available_at"),
        last_attempt_at: row.get("last_attempt_at"),
        completed_at: row.get("completed_at"),
        resolved_at: row.get("resolved_at"),
        last_error: row.get("last_error"),
        failure_reason: row.get("failure_reason"),
        resolution_note: row.get("resolution_note"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

async fn photo_processing_history_by_id(
    pool: &PgPool,
    processing_job_id: &str,
    organization_ids: &[String],
) -> Result<Option<PhotoProcessingHistoryItem>, sqlx::Error> {
    let items = list_photo_processing_history(
        pool,
        PhotoProcessingHistoryFilter {
            organization_ids: organization_ids.to_vec(),
            task_type: None,
            status: None,
            limit: 100,
        },
    )
    .await?;
    Ok(items.into_iter().find(|item| item.id == processing_job_id))
}

async fn insert_photo_processing_audit_event(
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

fn photo_processing_retry_delay_seconds(attempt_count: i32) -> i32 {
    let exponent = attempt_count.saturating_sub(1).min(5);
    let delay = PHOTO_PROCESSING_RETRY_BASE_SECONDS.saturating_mul(2_i32.pow(exponent as u32));
    delay.min(PHOTO_PROCESSING_RETRY_MAX_SECONDS)
}

fn truncate_photo_processing_error(error: &str) -> String {
    error.chars().take(500).collect()
}
