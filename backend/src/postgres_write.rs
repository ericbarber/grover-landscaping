use crate::{PhotoUploadRequest, PhotoUploadResponse};
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

pub async fn create_photo_upload(
    pool: &PgPool,
    job_id: &str,
    request: &PhotoUploadRequest,
    photo_id: &str,
    object_key: &str,
    safe_file_name: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO job_photos (id, job_id, photo_type, file_name, content_type, object_key, status) VALUES ($1, $2, $3, $4, $5, $6, 'pending') ON CONFLICT (id) DO UPDATE SET file_name = EXCLUDED.file_name, content_type = EXCLUDED.content_type, object_key = EXCLUDED.object_key")
        .bind(photo_id)
        .bind(job_id)
        .bind(&request.photo_type)
        .bind(safe_file_name)
        .bind(&request.content_type)
        .bind(object_key)
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

pub fn local_photo_response(
    job_id: String,
    request: PhotoUploadRequest,
    photo_id: String,
    object_key: String,
) -> PhotoUploadResponse {
    let upload_url = format!("local://{object_key}?content_type={}", request.content_type);

    PhotoUploadResponse {
        status: "created",
        job_id,
        photo_id,
        photo_type: request.photo_type,
        file_name: request.file_name,
        content_type: request.content_type,
        upload_mode: "local-placeholder",
        upload_url,
        object_key,
    }
}
