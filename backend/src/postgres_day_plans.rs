use crate::day_plans::{DayPlanStop, DayPlanSummary};
use sqlx::{PgPool, Row};

pub async fn create_draft_day_plan(
    pool: &PgPool,
    id: &str,
    crew_id: &str,
    service_date: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "INSERT INTO day_plans (id, crew_id, service_date, status, route_status) VALUES ($1, $2, $3::date, 'draft', 'manual') ON CONFLICT (id) DO UPDATE SET crew_id = EXCLUDED.crew_id, service_date = EXCLUDED.service_date, status = EXCLUDED.status, route_status = EXCLUDED.route_status, updated_at = now()",
    )
    .bind(id)
    .bind(crew_id)
    .bind(service_date)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() == 1)
}

pub async fn publish_day_plan(pool: &PgPool, id: &str) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE day_plans SET status = 'published', updated_at = now() WHERE id = $1",
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() == 1)
}

pub async fn today_for_crew(
    pool: &PgPool,
    crew_id: &str,
) -> Result<Option<DayPlanSummary>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT dp.id AS day_plan_id, dp.crew_id, c.name AS crew_name, dp.service_date::text AS service_date, dp.status AS day_plan_status, dp.route_status, dps.id AS stop_id, dps.job_id, sj.customer_name, sj.property_address, dps.stop_order, sj.status AS job_status, dps.stop_status, dps.estimated_drive_minutes, dps.estimated_service_minutes FROM day_plans dp JOIN crews c ON c.id = dp.crew_id JOIN day_plan_stops dps ON dps.day_plan_id = dp.id JOIN service_jobs sj ON sj.id = dps.job_id WHERE dp.crew_id = $1 AND dp.service_date = CURRENT_DATE ORDER BY dps.stop_order ASC",
    )
    .bind(crew_id)
    .fetch_all(pool)
    .await?;

    let Some(first_row) = rows.first() else {
        return Ok(None);
    };

    let stops = rows
        .iter()
        .map(|row| DayPlanStop {
            id: row.get("stop_id"),
            job_id: row.get("job_id"),
            customer_name: row.get("customer_name"),
            property_address: row.get("property_address"),
            stop_order: row.get::<i32, _>("stop_order") as u32,
            job_status: row.get("job_status"),
            stop_status: row.get("stop_status"),
            estimated_drive_minutes: row.get::<i32, _>("estimated_drive_minutes") as u32,
            estimated_service_minutes: row.get::<i32, _>("estimated_service_minutes") as u32,
        })
        .collect();

    Ok(Some(DayPlanSummary {
        id: first_row.get("day_plan_id"),
        crew_id: first_row.get("crew_id"),
        crew_name: first_row.get("crew_name"),
        service_date: first_row.get("service_date"),
        status: first_row.get("day_plan_status"),
        route_status: first_row.get("route_status"),
        stops,
    }))
}
