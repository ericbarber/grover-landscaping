use crate::day_plans::{
    AmendmentService, AssignDayPlanStopRequest, DayPlanAmendmentResponse,
    DayPlanAmendmentReviewResponse, DayPlanMutationResponse, DayPlanStop,
    DayPlanStopMutationResponse, DayPlanSummary,
};
use std::collections::HashSet;

use sqlx::{PgPool, Row};
use uuid::Uuid;

pub async fn create_crew(
    pool: &PgPool,
    id: &str,
    organization_id: &str,
    name: &str,
) -> Result<Option<crate::day_plans::CrewSummary>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        INSERT INTO crews (id, name, organization_id)
        SELECT $1, $3, organization.id
        FROM organizations organization
        WHERE organization.id = $2
          AND organization.status = 'active'
        ON CONFLICT DO NOTHING
        RETURNING id, name, organization_id, status
        "#,
    )
    .bind(id)
    .bind(organization_id)
    .bind(name)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| crate::day_plans::CrewSummary {
        id: row.get("id"),
        name: row.get("name"),
        organization_id: row.get("organization_id"),
        status: row.get("status"),
        persisted: true,
    }))
}

pub async fn list_organization_crews(
    pool: &PgPool,
    organization_id: &str,
) -> Result<Vec<crate::day_plans::CrewSummary>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, name, organization_id, status
        FROM crews
        WHERE organization_id = $1
        ORDER BY status, name, id
        "#,
    )
    .bind(organization_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|row| crate::day_plans::CrewSummary {
            id: row.get("id"),
            name: row.get("name"),
            organization_id: row.get("organization_id"),
            status: row.get("status"),
            persisted: true,
        })
        .collect())
}

pub async fn update_crew(
    pool: &PgPool,
    organization_id: &str,
    crew_id: &str,
    actor_user_id: &str,
    name: &str,
    status: &str,
) -> Result<crate::day_plans::UpdateCrewResult, sqlx::Error> {
    use crate::day_plans::UpdateCrewResult;

    let mut tx = pool.begin().await?;
    let current_status: Option<String> = sqlx::query_scalar(
        r#"
        SELECT status
        FROM crews
        WHERE id = $1
          AND organization_id = $2
        FOR UPDATE
        "#,
    )
    .bind(crew_id)
    .bind(organization_id)
    .fetch_optional(&mut *tx)
    .await?;
    let Some(current_status) = current_status else {
        tx.rollback().await?;
        return Ok(UpdateCrewResult::NotFound);
    };

    if current_status == "active" && status == "inactive" {
        let has_operational_work: bool = sqlx::query_scalar(
            r#"
            SELECT
                EXISTS (
                    SELECT 1
                    FROM property_crew_assignments assignment
                    WHERE assignment.crew_id = $1
                      AND assignment.organization_id = $2
                      AND assignment.active = TRUE
                )
                OR EXISTS (
                    SELECT 1
                    FROM day_plans plan
                    WHERE plan.crew_id = $1
                      AND plan.status IN ('draft', 'published')
                      AND plan.service_date >= CURRENT_DATE
                )
            "#,
        )
        .bind(crew_id)
        .bind(organization_id)
        .fetch_one(&mut *tx)
        .await?;
        if has_operational_work {
            tx.rollback().await?;
            return Ok(UpdateCrewResult::OperationalConflict);
        }
    }

    let row = sqlx::query(
        r#"
        UPDATE crews
        SET name = $3,
            status = $4,
            updated_at = NOW()
        WHERE id = $1
          AND organization_id = $2
        RETURNING id, name, organization_id, status
        "#,
    )
    .bind(crew_id)
    .bind(organization_id)
    .bind(name)
    .bind(status)
    .fetch_one(&mut *tx)
    .await?;

    let event_kind = if current_status != status {
        if status == "active" {
            "crew_reactivated"
        } else {
            "crew_deactivated"
        }
    } else {
        "crew_profile_updated"
    };
    sqlx::query(
        r#"
        INSERT INTO access_audit_events (
            id, actor_user_id, organization_id, event_kind, target_id, occurred_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        "#,
    )
    .bind(format!("audit_{}_{}", event_kind, Uuid::new_v4().simple()))
    .bind(actor_user_id)
    .bind(organization_id)
    .bind(event_kind)
    .bind(crew_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(UpdateCrewResult::Updated(crate::day_plans::CrewSummary {
        id: row.get("id"),
        name: row.get("name"),
        organization_id: row.get("organization_id"),
        status: row.get("status"),
        persisted: true,
    }))
}

pub async fn organization_id_for_crew(
    pool: &PgPool,
    crew_id: &str,
) -> Result<Option<String>, sqlx::Error> {
    sqlx::query_scalar(
        r#"
        SELECT organization_id
        FROM crews
        WHERE id = $1
        "#,
    )
    .bind(crew_id)
    .fetch_optional(pool)
    .await
}

pub async fn organization_id_for_day_plan(
    pool: &PgPool,
    day_plan_id: &str,
) -> Result<Option<String>, sqlx::Error> {
    sqlx::query_scalar(
        r#"
        SELECT c.organization_id
        FROM day_plans dp
        JOIN crews c ON c.id = dp.crew_id
        WHERE dp.id = $1
        "#,
    )
    .bind(day_plan_id)
    .fetch_optional(pool)
    .await
}

pub async fn create_draft_day_plan(
    pool: &PgPool,
    id: &str,
    crew_id: &str,
    service_date: &str,
) -> Result<Option<DayPlanMutationResponse>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        INSERT INTO day_plans (
            id, crew_id, service_date, status, route_status,
            time_zone, service_area_label, stop_capacity
        )
        SELECT
            $1, crew.id, $3::date, 'draft', 'manual',
            organization.time_zone,
            organization.service_area_label,
            organization.default_daily_stop_capacity
        FROM crews crew
        JOIN organizations organization ON organization.id = crew.organization_id
        WHERE crew.id = $2
          AND crew.status = 'active'
        ON CONFLICT (id) DO UPDATE SET
            crew_id = EXCLUDED.crew_id,
            service_date = EXCLUDED.service_date,
            status = EXCLUDED.status,
            route_status = EXCLUDED.route_status,
            time_zone = EXCLUDED.time_zone,
            service_area_label = EXCLUDED.service_area_label,
            stop_capacity = EXCLUDED.stop_capacity,
            updated_at = now()
        WHERE day_plans.status = 'draft'
        RETURNING id, crew_id, service_date::text AS service_date, status, route_status,
            time_zone, service_area_label, stop_capacity
        "#,
    )
    .bind(id)
    .bind(crew_id)
    .bind(service_date)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| day_plan_mutation_response(row, true)))
}

pub async fn publish_day_plan(
    pool: &PgPool,
    id: &str,
) -> Result<Option<DayPlanMutationResponse>, sqlx::Error> {
    let Some(row) = sqlx::query(
        r#"
        UPDATE day_plans
        SET status = 'published', updated_at = now()
        WHERE id = $1
          AND status = 'draft'
          AND EXISTS (
              SELECT 1
              FROM day_plan_stops
              WHERE day_plan_stops.day_plan_id = day_plans.id
          )
          AND COALESCE((
              SELECT SUM(estimated_drive_minutes + estimated_service_minutes)
              FROM day_plan_stops
              WHERE day_plan_stops.day_plan_id = day_plans.id
          ), 0) > 0
        RETURNING id, crew_id, service_date::text AS service_date, status, route_status,
            time_zone, service_area_label, stop_capacity
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    else {
        return Ok(None);
    };

    Ok(Some(day_plan_mutation_response(row, true)))
}

fn day_plan_mutation_response(
    row: sqlx::postgres::PgRow,
    persisted: bool,
) -> DayPlanMutationResponse {
    DayPlanMutationResponse {
        id: row.get("id"),
        crew_id: row.get("crew_id"),
        service_date: row.get("service_date"),
        status: row.get("status"),
        route_status: row.get("route_status"),
        time_zone: row.get("time_zone"),
        service_area_label: row.get("service_area_label"),
        stop_capacity: row.get::<i32, _>("stop_capacity") as u32,
        persisted,
    }
}

pub async fn assign_stop(
    pool: &PgPool,
    day_plan_id: &str,
    stop_id: &str,
    request: &AssignDayPlanStopRequest,
) -> Result<Option<DayPlanStopMutationResponse>, sqlx::Error> {
    let estimated_drive_minutes = request.estimated_drive_minutes.unwrap_or(0) as i32;
    let estimated_service_minutes = request.estimated_service_minutes.unwrap_or(0) as i32;

    let Some(row) = sqlx::query(
        r#"
        WITH candidate_plan AS (
            SELECT plan.id, plan.stop_capacity
            FROM day_plans plan
            WHERE plan.id = $1
              AND plan.status = 'draft'
            FOR UPDATE
        ),
        draft_plan AS (
            SELECT plan.id
            FROM candidate_plan plan
            WHERE (
                  EXISTS (
                      SELECT 1
                      FROM day_plan_stops existing
                      WHERE existing.day_plan_id = plan.id
                        AND existing.job_id = $3
                  )
                  OR (
                      SELECT COUNT(*)
                      FROM day_plan_stops existing
                      WHERE existing.day_plan_id = plan.id
                  ) < plan.stop_capacity
              )
        ),
        next_order AS (
            SELECT COALESCE(MAX(stop_order), 0) + 1 AS stop_order
            FROM day_plan_stops
            WHERE day_plan_id = $1
        )
        INSERT INTO day_plan_stops (
            id,
            day_plan_id,
            job_id,
            stop_order,
            stop_status,
            estimated_drive_minutes,
            estimated_service_minutes
        )
        SELECT
            $2,
            draft_plan.id,
            $3,
            (SELECT stop_order FROM next_order),
            'pending',
            $4,
            $5
        FROM draft_plan
        ON CONFLICT (day_plan_id, job_id) DO UPDATE SET
            estimated_drive_minutes = EXCLUDED.estimated_drive_minutes,
            estimated_service_minutes = EXCLUDED.estimated_service_minutes,
            updated_at = now()
        RETURNING day_plan_id, id AS stop_id, job_id, stop_order
        "#,
    )
    .bind(day_plan_id)
    .bind(stop_id)
    .bind(&request.job_id)
    .bind(estimated_drive_minutes)
    .bind(estimated_service_minutes)
    .fetch_optional(pool)
    .await?
    else {
        return Ok(None);
    };

    Ok(Some(DayPlanStopMutationResponse {
        day_plan_id: row.get("day_plan_id"),
        stop_id: row.get("stop_id"),
        job_id: row.get("job_id"),
        stop_order: row.get::<i32, _>("stop_order") as u32,
        persisted: true,
    }))
}

pub async fn remove_stop(
    pool: &PgPool,
    day_plan_id: &str,
    stop_id: &str,
) -> Result<bool, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let delete_result = sqlx::query(
        r#"
        DELETE FROM day_plan_stops dps
        USING day_plans dp
        WHERE dps.day_plan_id = $1
          AND dps.id = $2
          AND dp.id = dps.day_plan_id
          AND dp.status = 'draft'
        "#,
    )
    .bind(day_plan_id)
    .bind(stop_id)
    .execute(&mut *tx)
    .await?;

    if delete_result.rows_affected() != 1 {
        tx.commit().await?;
        return Ok(false);
    }

    sqlx::query(
        r#"
        WITH ordered AS (
            SELECT id, row_number() OVER (ORDER BY stop_order ASC, id ASC)::int AS next_order
            FROM day_plan_stops
            WHERE day_plan_id = $1
        )
        UPDATE day_plan_stops dps
        SET stop_order = ordered.next_order, updated_at = now()
        FROM ordered
        WHERE dps.id = ordered.id
        "#,
    )
    .bind(day_plan_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(true)
}

pub async fn reorder_stops(
    pool: &PgPool,
    day_plan_id: &str,
    stop_ids: &[String],
) -> Result<bool, sqlx::Error> {
    if stop_ids.is_empty() {
        return Ok(false);
    }

    let unique_stop_ids: HashSet<&str> = stop_ids.iter().map(String::as_str).collect();
    if unique_stop_ids.len() != stop_ids.len() {
        return Ok(false);
    }

    let mut tx = pool.begin().await?;

    let existing_stop_count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM day_plan_stops dps
        JOIN day_plans dp ON dp.id = dps.day_plan_id
        WHERE dps.day_plan_id = $1
          AND dp.status = 'draft'
        "#,
    )
    .bind(day_plan_id)
    .fetch_one(&mut *tx)
    .await?;

    if existing_stop_count != stop_ids.len() as i64 {
        tx.commit().await?;
        return Ok(false);
    }

    sqlx::query("UPDATE day_plan_stops SET stop_order = stop_order + 10000 WHERE day_plan_id = $1")
        .bind(day_plan_id)
        .execute(&mut *tx)
        .await?;

    let result = sqlx::query(
        r#"
        WITH requested(stop_id, next_order) AS (
            SELECT * FROM unnest($2::text[]) WITH ORDINALITY
        )
        UPDATE day_plan_stops dps
        SET stop_order = requested.next_order::int, updated_at = now()
        FROM requested, day_plans dp
        WHERE dps.day_plan_id = $1
          AND dp.id = dps.day_plan_id
          AND dp.status = 'draft'
          AND dps.id = requested.stop_id
        "#,
    )
    .bind(day_plan_id)
    .bind(stop_ids)
    .execute(&mut *tx)
    .await?;

    let persisted = result.rows_affected() == stop_ids.len() as u64;
    tx.commit().await?;

    Ok(persisted)
}

pub async fn create_amendment(
    pool: &PgPool,
    amendment: &DayPlanAmendmentResponse,
) -> Result<Option<DayPlanAmendmentResponse>, sqlx::Error> {
    let service = amendment.service.as_ref();
    let result = sqlx::query(
        r#"
        INSERT INTO day_plan_amendment_requests (
            id,
            day_plan_id,
            requested_by_crew_id,
            amendment_type,
            status,
            stop_id,
            service_id,
            service_name,
            service_description,
            default_duration_minutes,
            default_price_cents,
            requires_manager_approval,
            requires_bid,
            note,
            manager_note
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
        "#,
    )
    .bind(&amendment.id)
    .bind(&amendment.day_plan_id)
    .bind(&amendment.requested_by_crew_id)
    .bind(&amendment.amendment_type)
    .bind(&amendment.status)
    .bind(&amendment.stop_id)
    .bind(service.map(|item| item.id.as_str()))
    .bind(service.map(|item| item.name.as_str()))
    .bind(service.and_then(|item| item.description.as_deref()))
    .bind(service.and_then(|item| item.default_duration_minutes.map(|value| value as i32)))
    .bind(service.and_then(|item| item.default_price_cents.map(|value| value as i32)))
    .bind(
        service
            .map(|item| item.requires_manager_approval)
            .unwrap_or(false),
    )
    .bind(amendment.requires_bid)
    .bind(&amendment.note)
    .bind(&amendment.manager_note)
    .execute(pool)
    .await?;

    if result.rows_affected() != 1 {
        return Ok(None);
    }

    let mut persisted = amendment.clone();
    persisted.persisted = true;
    Ok(Some(persisted))
}

pub async fn list_amendments(
    pool: &PgPool,
    day_plan_id: &str,
) -> Result<Vec<DayPlanAmendmentResponse>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            id,
            day_plan_id,
            amendment_type,
            status,
            requested_by_crew_id,
            stop_id,
            service_id,
            service_name,
            service_description,
            default_duration_minutes,
            default_price_cents,
            requires_manager_approval,
            requires_bid,
            note,
            manager_note
        FROM day_plan_amendment_requests
        WHERE day_plan_id = $1
        ORDER BY created_at DESC, id DESC
        "#,
    )
    .bind(day_plan_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| {
            let service_id: Option<String> = row.get("service_id");
            let service = service_id.map(|id| AmendmentService {
                id,
                name: row
                    .get::<Option<String>, _>("service_name")
                    .unwrap_or_default(),
                description: row.get("service_description"),
                default_duration_minutes: row
                    .get::<Option<i32>, _>("default_duration_minutes")
                    .map(|value| value as u32),
                default_price_cents: row
                    .get::<Option<i32>, _>("default_price_cents")
                    .map(|value| value as u32),
                requires_manager_approval: row.get("requires_manager_approval"),
            });

            DayPlanAmendmentResponse {
                id: row.get("id"),
                day_plan_id: row.get("day_plan_id"),
                amendment_type: row.get("amendment_type"),
                status: row.get("status"),
                requested_by_crew_id: row.get("requested_by_crew_id"),
                stop_id: row.get("stop_id"),
                service,
                note: row.get("note"),
                requires_bid: row.get("requires_bid"),
                manager_note: row.get("manager_note"),
                persisted: true,
            }
        })
        .collect())
}

pub async fn review_amendment(
    pool: &PgPool,
    day_plan_id: &str,
    amendment_id: &str,
    status: &str,
    manager_note: Option<&str>,
) -> Result<Option<DayPlanAmendmentReviewResponse>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        UPDATE day_plan_amendment_requests
        SET status = $3, manager_note = $4, reviewed_at = now(), updated_at = now()
        WHERE id = $1
          AND day_plan_id = $2
          AND status IN ('submitted', 'bid_review')
          AND ($3 <> 'bid_review' OR requires_bid)
        RETURNING id, day_plan_id, status, manager_note
        "#,
    )
    .bind(amendment_id)
    .bind(day_plan_id)
    .bind(status)
    .bind(manager_note)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| DayPlanAmendmentReviewResponse {
        id: row.get("id"),
        day_plan_id: row.get("day_plan_id"),
        status: row.get("status"),
        manager_note: row.get("manager_note"),
        persisted: true,
    }))
}

pub async fn today_for_crew(
    pool: &PgPool,
    crew_id: &str,
) -> Result<Option<DayPlanSummary>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        WITH selected_plan AS (
            SELECT dp.id
            FROM day_plans dp
            WHERE dp.crew_id = $1
              AND dp.status = 'published'
              AND EXISTS (
                  SELECT 1
                  FROM day_plan_stops dps
                  WHERE dps.day_plan_id = dp.id
              )
            ORDER BY
                CASE
                    WHEN dp.service_date = CURRENT_DATE THEN 0
                    WHEN dp.service_date < CURRENT_DATE THEN 1
                    ELSE 2
                END,
                CASE WHEN dp.service_date < CURRENT_DATE THEN dp.service_date END DESC,
                CASE WHEN dp.service_date > CURRENT_DATE THEN dp.service_date END ASC,
                dp.updated_at DESC
            LIMIT 1
        )
        SELECT
            dp.id AS day_plan_id,
            dp.crew_id,
            c.name AS crew_name,
            dp.service_date::text AS service_date,
            dp.status AS day_plan_status,
            dp.route_status,
            dps.id AS stop_id,
            dps.job_id,
            sj.customer_name,
            sj.property_address,
            dps.stop_order,
            sj.status AS job_status,
            dps.stop_status,
            dps.estimated_drive_minutes,
            dps.estimated_service_minutes + COALESCE((
                SELECT SUM(amendment.default_duration_minutes)
                FROM day_plan_amendment_requests amendment
                JOIN project_bids bid ON bid.source_amendment_id = amendment.id
                JOIN project_bid_conversions conversion ON conversion.project_bid_id = bid.id
                WHERE amendment.day_plan_id = dp.id
                  AND amendment.stop_id = dps.id
                  AND conversion.job_id = dps.job_id
                  AND bid.status = 'converted'
            ), 0)::INTEGER AS estimated_service_minutes
        FROM selected_plan sp
        JOIN day_plans dp ON dp.id = sp.id
        JOIN crews c ON c.id = dp.crew_id
        JOIN day_plan_stops dps ON dps.day_plan_id = dp.id
        JOIN service_jobs sj ON sj.id = dps.job_id
        ORDER BY dps.stop_order ASC
        "#,
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
