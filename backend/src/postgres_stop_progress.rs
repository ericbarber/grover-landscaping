use sqlx::PgPool;

pub async fn update_stop_progress(
    pool: &PgPool,
    day_plan_id: &str,
    stop_id: &str,
    status: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE day_plan_stops SET stop_status = $3, updated_at = now() WHERE day_plan_id = $1 AND id = $2",
    )
    .bind(day_plan_id)
    .bind(stop_id)
    .bind(status)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() == 1)
}
