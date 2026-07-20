use sqlx::PgPool;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum StopProgressWriteResult {
    Persisted,
    Replayed,
    NotFound,
    IdempotencyConflict,
    LocalFallback,
    Unavailable,
}

pub async fn update_stop_progress(
    pool: &PgPool,
    day_plan_id: &str,
    stop_id: &str,
    status: &str,
    client_mutation_id: Option<&str>,
    actor_id: &str,
) -> Result<StopProgressWriteResult, sqlx::Error> {
    if let Some(client_mutation_id) = client_mutation_id {
        let mut transaction = pool.begin().await?;
        let inserted = sqlx::query_scalar::<_, String>(
            r#"
            INSERT INTO stop_progress_mutations (
                client_mutation_id,
                organization_id,
                actor_id,
                day_plan_id,
                stop_id,
                requested_status
            )
            SELECT $1::uuid, c.organization_id, $5, dp.id, dps.id, $4
            FROM day_plans dp
            JOIN crews c ON c.id = dp.crew_id
            JOIN day_plan_stops dps ON dps.day_plan_id = dp.id
            WHERE dp.id = $2 AND dps.id = $3
            ON CONFLICT (client_mutation_id) DO NOTHING
            RETURNING client_mutation_id::text
            "#,
        )
        .bind(client_mutation_id)
        .bind(day_plan_id)
        .bind(stop_id)
        .bind(status)
        .bind(actor_id)
        .fetch_optional(&mut *transaction)
        .await?;

        if inserted.is_none() {
            let existing = sqlx::query_as::<_, (String, String, String, String)>(
                r#"
                SELECT actor_id, day_plan_id, stop_id, requested_status
                FROM stop_progress_mutations
                WHERE client_mutation_id = $1::uuid
                "#,
            )
            .bind(client_mutation_id)
            .fetch_optional(&mut *transaction)
            .await?;
            transaction.rollback().await?;
            return Ok(match existing {
                Some((existing_actor, existing_plan, existing_stop, existing_status))
                    if existing_actor == actor_id
                        && existing_plan == day_plan_id
                        && existing_stop == stop_id
                        && existing_status == status =>
                {
                    StopProgressWriteResult::Replayed
                }
                Some(_) => StopProgressWriteResult::IdempotencyConflict,
                None => StopProgressWriteResult::NotFound,
            });
        }

        let result = sqlx::query(
            "UPDATE day_plan_stops SET stop_status = $3, updated_at = now() WHERE day_plan_id = $1 AND id = $2",
        )
        .bind(day_plan_id)
        .bind(stop_id)
        .bind(status)
        .execute(&mut *transaction)
        .await?;
        if result.rows_affected() != 1 {
            transaction.rollback().await?;
            return Ok(StopProgressWriteResult::NotFound);
        }
        transaction.commit().await?;
        return Ok(StopProgressWriteResult::Persisted);
    }

    let result = sqlx::query(
        "UPDATE day_plan_stops SET stop_status = $3, updated_at = now() WHERE day_plan_id = $1 AND id = $2",
    )
    .bind(day_plan_id)
    .bind(stop_id)
    .bind(status)
    .execute(pool)
    .await?;

    Ok(if result.rows_affected() == 1 {
        StopProgressWriteResult::Persisted
    } else {
        StopProgressWriteResult::NotFound
    })
}
