use crate::{
    photo_storage::{normalized_upload_mode, PhotoStorageConfig},
    ChecklistItem, JobAddOn, JobDetail, JobSummary, PhotoEvidence,
};
use sqlx::{PgPool, Row};

pub async fn list_jobs(pool: &PgPool) -> Result<Vec<JobSummary>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, customer_name, property_address, status, scheduled_date, before_photos, after_photos, checklist_items, completed_checklist_items FROM service_jobs ORDER BY scheduled_date ASC, id ASC",
    )
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| JobSummary {
            id: row.get("id"),
            customer_name: row.get("customer_name"),
            property_address: row.get("property_address"),
            status: row.get("status"),
            scheduled_date: row.get("scheduled_date"),
            before_photos: row.get::<i32, _>("before_photos") as u32,
            after_photos: row.get::<i32, _>("after_photos") as u32,
            checklist_items: row.get::<i32, _>("checklist_items") as u32,
            completed_checklist_items: row.get::<i32, _>("completed_checklist_items") as u32,
        })
        .collect())
}

pub async fn get_job(pool: &PgPool, id: &str) -> Result<Option<JobDetail>, sqlx::Error> {
    let Some(row) = sqlx::query(
        "SELECT id, customer_name, property_address, status, scheduled_date, before_photos, after_photos, checklist_items, completed_checklist_items FROM service_jobs WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    else {
        return Ok(None);
    };

    let checklist_rows = sqlx::query(
        "SELECT id, label, completed FROM job_checklist_items WHERE job_id = $1 ORDER BY sort_order ASC",
    )
    .bind(id)
    .fetch_all(pool)
    .await?;

    Ok(Some(JobDetail {
        id: row.get("id"),
        customer_name: row.get("customer_name"),
        property_address: row.get("property_address"),
        status: row.get("status"),
        scheduled_date: row.get("scheduled_date"),
        before_photos: row.get::<i32, _>("before_photos") as u32,
        after_photos: row.get::<i32, _>("after_photos") as u32,
        checklist_items: row.get::<i32, _>("checklist_items") as u32,
        completed_checklist_items: row.get::<i32, _>("completed_checklist_items") as u32,
        checklist: checklist_rows
            .into_iter()
            .map(|checklist_row| ChecklistItem {
                id: checklist_row.get("id"),
                label: checklist_row.get("label"),
                completed: checklist_row.get("completed"),
            })
            .collect(),
    }))
}

pub async fn list_job_photos(
    pool: &PgPool,
    job_id: &str,
    photo_storage: &PhotoStorageConfig,
) -> Result<Vec<PhotoEvidence>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            id,
            job_id,
            photo_type,
            file_name,
            content_type,
            object_key,
            COALESCE(upload_mode, 'local-placeholder') AS upload_mode,
            thumbnail_object_key,
            status
        FROM job_photos
        WHERE job_id = $1
        ORDER BY created_at DESC, id DESC
        "#,
    )
    .bind(job_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| {
            let object_key: String = row.get("object_key");
            let upload_mode: String = row.get("upload_mode");
            let normalized_upload_mode = normalized_upload_mode(&upload_mode);
            let thumbnail_object_key: Option<String> = row.get("thumbnail_object_key");

            PhotoEvidence {
                id: row.get("id"),
                job_id: row.get("job_id"),
                photo_type: row.get("photo_type"),
                file_name: row.get("file_name"),
                content_type: row.get("content_type"),
                display_url: photo_storage.display_url(normalized_upload_mode, &object_key),
                object_key,
                status: row.get("status"),
                upload_mode: normalized_upload_mode,
                thumbnail_url: photo_storage
                    .thumbnail_url(normalized_upload_mode, thumbnail_object_key.as_deref()),
            }
        })
        .collect())
}

pub async fn list_job_add_ons(pool: &PgPool, job_id: &str) -> Result<Vec<JobAddOn>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, job_id, service_name, service_description, quantity,
               unit_price_cents, note, status
        FROM service_job_add_ons
        WHERE job_id = $1
        ORDER BY created_at, id
        "#,
    )
    .bind(job_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| JobAddOn {
            id: row.get("id"),
            job_id: row.get("job_id"),
            service_name: row.get("service_name"),
            service_description: row.get("service_description"),
            quantity: row.get::<i32, _>("quantity") as u32,
            unit_price_cents: row.get::<i32, _>("unit_price_cents") as u32,
            note: row.get("note"),
            status: row.get("status"),
        })
        .collect())
}

pub async fn get_job_add_on(
    pool: &PgPool,
    job_id: &str,
    add_on_id: &str,
) -> Result<Option<JobAddOn>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT id, job_id, service_name, service_description, quantity,
               unit_price_cents, note, status
        FROM service_job_add_ons
        WHERE job_id = $1 AND id = $2
        "#,
    )
    .bind(job_id)
    .bind(add_on_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| JobAddOn {
        id: row.get("id"),
        job_id: row.get("job_id"),
        service_name: row.get("service_name"),
        service_description: row.get("service_description"),
        quantity: row.get::<i32, _>("quantity") as u32,
        unit_price_cents: row.get::<i32, _>("unit_price_cents") as u32,
        note: row.get("note"),
        status: row.get("status"),
    }))
}
