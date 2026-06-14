use crate::{ChecklistItem, JobDetail, JobSummary};
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
