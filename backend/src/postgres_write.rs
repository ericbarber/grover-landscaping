use crate::{photo_storage::PhotoStorageTicket, PhotoUploadRequest, PhotoUploadResponse};
use sqlx::{PgPool, Row};

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
) -> Result<(), sqlx::Error> {
    let Some(row) = sqlx::query("UPDATE job_photos SET status = 'uploaded', uploaded_at = now() WHERE id = $1 AND job_id = $2 RETURNING photo_type")
        .bind(photo_id)
        .bind(job_id)
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
    }
}
