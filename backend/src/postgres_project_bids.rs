use crate::project_bids::{ProjectBidLineItemResponse, ProjectBidResponse, SendProjectBidRequest};
use sqlx::{PgPool, Row};
use std::collections::HashMap;
use uuid::Uuid;

pub async fn save_draft(
    pool: &PgPool,
    bid: &ProjectBidResponse,
) -> Result<Option<ProjectBidResponse>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let customer_account_id = sqlx::query_scalar::<_, String>(
        r#"
        SELECT job.customer_account_id
        FROM day_plan_amendment_requests amendment
        JOIN day_plan_stops stop ON stop.id = amendment.stop_id
        JOIN service_jobs job ON job.id = stop.job_id
        WHERE amendment.id = $1
          AND amendment.day_plan_id = $2
          AND amendment.status = 'bid_review'
          AND amendment.requires_bid
          AND job.customer_account_id IS NOT NULL
        "#,
    )
    .bind(&bid.source_amendment_id)
    .bind(&bid.day_plan_id)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(customer_account_id) = customer_account_id else {
        transaction.rollback().await?;
        return Ok(None);
    };

    let saved = sqlx::query(
        r#"
        INSERT INTO project_bids (
            id, day_plan_id, customer_account_id, source_amendment_id, status, customer_message
        )
        VALUES ($1, $2, $3, $4, 'draft', $5)
        ON CONFLICT (source_amendment_id) DO UPDATE
        SET customer_message = EXCLUDED.customer_message, updated_at = now()
        WHERE project_bids.status = 'draft'
        RETURNING id, status
        "#,
    )
    .bind(&bid.id)
    .bind(&bid.day_plan_id)
    .bind(&customer_account_id)
    .bind(&bid.source_amendment_id)
    .bind(&bid.customer_message)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(saved) = saved else {
        transaction.rollback().await?;
        return Ok(None);
    };
    let bid_id: String = saved.get("id");
    let status: String = saved.get("status");

    sqlx::query("DELETE FROM project_bid_line_items WHERE project_bid_id = $1")
        .bind(&bid_id)
        .execute(&mut *transaction)
        .await?;

    let mut line_items = Vec::with_capacity(bid.line_items.len());
    for (index, item) in bid.line_items.iter().enumerate() {
        let item_id = format!("{bid_id}_line_{}", index + 1);
        sqlx::query(
            r#"
            INSERT INTO project_bid_line_items (
                id, project_bid_id, service_id, service_name, service_description,
                quantity, unit_price_cents, note, sort_order
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            "#,
        )
        .bind(&item_id)
        .bind(&bid_id)
        .bind(&item.service_id)
        .bind(&item.service_name)
        .bind(&item.service_description)
        .bind(item.quantity as i32)
        .bind(item.unit_price_cents as i32)
        .bind(&item.note)
        .bind((index + 1) as i32)
        .execute(&mut *transaction)
        .await?;

        let mut saved_item = item.clone();
        saved_item.id = item_id;
        line_items.push(saved_item);
    }

    transaction.commit().await?;
    let total_cents = line_items
        .iter()
        .map(|item| u64::from(item.quantity) * u64::from(item.unit_price_cents))
        .sum();

    Ok(Some(ProjectBidResponse {
        id: bid_id,
        day_plan_id: bid.day_plan_id.clone(),
        customer_account_id,
        source_amendment_id: bid.source_amendment_id.clone(),
        status,
        line_items,
        customer_message: bid.customer_message.clone(),
        total_cents,
        share_url: None,
        sent_at: None,
        responded_at: None,
        share_expires_at: None,
        share_revoked_at: None,
        delivery_status: None,
        delivery_channel: None,
        delivery_recipient: None,
        converted_job_id: None,
        converted_at: None,
        persisted: true,
    }))
}

pub async fn list_for_day_plan(
    pool: &PgPool,
    day_plan_id: &str,
) -> Result<Vec<ProjectBidResponse>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            bid.id AS bid_id,
            bid.day_plan_id,
            bid.customer_account_id,
            bid.source_amendment_id,
            bid.status,
            bid.customer_message,
            bid.share_token,
            bid.sent_at::text AS sent_at,
            bid.responded_at::text AS responded_at,
            bid.share_expires_at::text AS share_expires_at,
            bid.share_revoked_at::text AS share_revoked_at,
            COALESCE((
                bid.share_token IS NOT NULL
                AND bid.share_expires_at > now()
                AND bid.share_revoked_at IS NULL
            ), FALSE) AS share_active,
            delivery.status AS delivery_status,
            delivery.channel AS delivery_channel,
            delivery.recipient AS delivery_recipient,
            conversion.job_id AS converted_job_id,
            conversion.converted_at::text AS converted_at,
            item.id AS item_id,
            item.service_id,
            item.service_name,
            item.service_description,
            item.quantity,
            item.unit_price_cents,
            item.note
        FROM project_bids bid
        JOIN project_bid_line_items item ON item.project_bid_id = bid.id
        LEFT JOIN LATERAL (
            SELECT status, channel, recipient
            FROM notification_outbox
            WHERE entity_type = 'project_bid' AND entity_id = bid.id
            ORDER BY created_at DESC, id DESC
            LIMIT 1
        ) delivery ON true
        LEFT JOIN project_bid_conversions conversion ON conversion.project_bid_id = bid.id
        WHERE bid.day_plan_id = $1
        ORDER BY bid.updated_at DESC, bid.id, item.sort_order
        "#,
    )
    .bind(day_plan_id)
    .fetch_all(pool)
    .await?;

    let mut bids = Vec::<ProjectBidResponse>::new();
    let mut indexes = HashMap::<String, usize>::new();
    for row in rows {
        let bid_id: String = row.get("bid_id");
        let index = if let Some(index) = indexes.get(&bid_id) {
            *index
        } else {
            let index = bids.len();
            indexes.insert(bid_id.clone(), index);
            bids.push(ProjectBidResponse {
                id: bid_id,
                day_plan_id: row.get("day_plan_id"),
                customer_account_id: row.get("customer_account_id"),
                source_amendment_id: row.get("source_amendment_id"),
                status: row.get("status"),
                line_items: Vec::new(),
                customer_message: row.get("customer_message"),
                total_cents: 0,
                share_url: if row.get("share_active") {
                    row.get::<Option<String>, _>("share_token")
                        .as_deref()
                        .map(shared_bid_url)
                } else {
                    None
                },
                sent_at: row.get("sent_at"),
                responded_at: row.get("responded_at"),
                share_expires_at: row.get("share_expires_at"),
                share_revoked_at: row.get("share_revoked_at"),
                delivery_status: row.get("delivery_status"),
                delivery_channel: row.get("delivery_channel"),
                delivery_recipient: row.get("delivery_recipient"),
                converted_job_id: row.get("converted_job_id"),
                converted_at: row.get("converted_at"),
                persisted: true,
            });
            index
        };

        let item = ProjectBidLineItemResponse {
            id: row.get("item_id"),
            service_id: row.get("service_id"),
            service_name: row.get("service_name"),
            service_description: row.get("service_description"),
            quantity: row.get::<i32, _>("quantity") as u32,
            unit_price_cents: row.get::<i32, _>("unit_price_cents") as u32,
            note: row.get("note"),
        };
        bids[index].total_cents += u64::from(item.quantity) * u64::from(item.unit_price_cents);
        bids[index].line_items.push(item);
    }

    Ok(bids)
}

pub async fn list_for_account(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
) -> Result<Vec<ProjectBidResponse>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            bid.id AS bid_id,
            bid.day_plan_id,
            bid.customer_account_id,
            bid.source_amendment_id,
            bid.status,
            bid.customer_message,
            bid.share_token,
            bid.sent_at::text AS sent_at,
            bid.responded_at::text AS responded_at,
            bid.share_expires_at::text AS share_expires_at,
            bid.share_revoked_at::text AS share_revoked_at,
            COALESCE((
                bid.share_token IS NOT NULL
                AND bid.share_expires_at > now()
                AND bid.share_revoked_at IS NULL
            ), FALSE) AS share_active,
            delivery.status AS delivery_status,
            delivery.channel AS delivery_channel,
            delivery.recipient AS delivery_recipient,
            conversion.job_id AS converted_job_id,
            conversion.converted_at::text AS converted_at,
            item.id AS item_id,
            item.service_id,
            item.service_name,
            item.service_description,
            item.quantity,
            item.unit_price_cents,
            item.note
        FROM project_bids bid
        JOIN day_plans plan ON plan.id = bid.day_plan_id
        JOIN crews crew ON crew.id = plan.crew_id
        JOIN project_bid_line_items item ON item.project_bid_id = bid.id
        LEFT JOIN LATERAL (
            SELECT status, channel, recipient
            FROM notification_outbox
            WHERE entity_type = 'project_bid' AND entity_id = bid.id
            ORDER BY created_at DESC, id DESC
            LIMIT 1
        ) delivery ON true
        LEFT JOIN project_bid_conversions conversion ON conversion.project_bid_id = bid.id
        WHERE bid.customer_account_id = $1
          AND crew.organization_id = ANY($2)
          AND bid.status IN ('sent', 'approved', 'rejected', 'converted')
        ORDER BY bid.updated_at DESC, bid.id, item.sort_order
        "#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;

    let mut bids = Vec::<ProjectBidResponse>::new();
    let mut indexes = HashMap::<String, usize>::new();
    for row in rows {
        let bid_id: String = row.get("bid_id");
        let index = if let Some(index) = indexes.get(&bid_id) {
            *index
        } else {
            let index = bids.len();
            indexes.insert(bid_id.clone(), index);
            bids.push(ProjectBidResponse {
                id: bid_id,
                day_plan_id: row.get("day_plan_id"),
                customer_account_id: row.get("customer_account_id"),
                source_amendment_id: row.get("source_amendment_id"),
                status: row.get("status"),
                line_items: Vec::new(),
                customer_message: row.get("customer_message"),
                total_cents: 0,
                share_url: if row.get("share_active") {
                    row.get::<Option<String>, _>("share_token")
                        .as_deref()
                        .map(shared_bid_url)
                } else {
                    None
                },
                sent_at: row.get("sent_at"),
                responded_at: row.get("responded_at"),
                share_expires_at: row.get("share_expires_at"),
                share_revoked_at: row.get("share_revoked_at"),
                delivery_status: row.get("delivery_status"),
                delivery_channel: row.get("delivery_channel"),
                delivery_recipient: row.get("delivery_recipient"),
                converted_job_id: row.get("converted_job_id"),
                converted_at: row.get("converted_at"),
                persisted: true,
            });
            index
        };

        let item = ProjectBidLineItemResponse {
            id: row.get("item_id"),
            service_id: row.get("service_id"),
            service_name: row.get("service_name"),
            service_description: row.get("service_description"),
            quantity: row.get::<i32, _>("quantity") as u32,
            unit_price_cents: row.get::<i32, _>("unit_price_cents") as u32,
            note: row.get("note"),
        };
        bids[index].total_cents += u64::from(item.quantity) * u64::from(item.unit_price_cents);
        bids[index].line_items.push(item);
    }

    Ok(bids)
}

pub async fn convert_to_job_add_ons(
    pool: &PgPool,
    day_plan_id: &str,
    bid_id: &str,
    actor_user_id: &str,
) -> Result<Option<ProjectBidResponse>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let job_id = sqlx::query_scalar::<_, String>(
        r#"
        SELECT stop.job_id
        FROM project_bids bid
        JOIN day_plan_amendment_requests amendment ON amendment.id = bid.source_amendment_id
        JOIN day_plan_stops stop ON stop.id = amendment.stop_id
        WHERE bid.id = $1
          AND bid.day_plan_id = $2
          AND bid.status IN ('approved', 'converted')
        FOR UPDATE OF bid
        "#,
    )
    .bind(bid_id)
    .bind(day_plan_id)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(job_id) = job_id else {
        transaction.rollback().await?;
        return Ok(None);
    };

    sqlx::query(
        r#"
        INSERT INTO service_job_add_ons (
            id,
            job_id,
            project_bid_id,
            project_bid_line_item_id,
            service_id,
            service_name,
            service_description,
            quantity,
            unit_price_cents,
            note
        )
        SELECT
            'add_on_' || item.id,
            $2,
            item.project_bid_id,
            item.id,
            item.service_id,
            item.service_name,
            item.service_description,
            item.quantity,
            item.unit_price_cents,
            item.note
        FROM project_bid_line_items item
        WHERE item.project_bid_id = $1
        ON CONFLICT (project_bid_line_item_id) DO NOTHING
        "#,
    )
    .bind(bid_id)
    .bind(&job_id)
    .execute(&mut *transaction)
    .await?;

    let conversion_result = sqlx::query(
        r#"
        INSERT INTO project_bid_conversions (project_bid_id, job_id)
        VALUES ($1, $2)
        ON CONFLICT (project_bid_id) DO NOTHING
        "#,
    )
    .bind(bid_id)
    .bind(&job_id)
    .execute(&mut *transaction)
    .await?;
    let conversion_created = conversion_result.rows_affected() == 1;

    if conversion_created {
        sqlx::query(
            r#"
            UPDATE day_plan_stops stop
            SET estimated_service_minutes =
                    stop.estimated_service_minutes
                    + COALESCE(amendment.default_duration_minutes, 0),
                updated_at = now()
            FROM project_bids bid
            JOIN day_plan_amendment_requests amendment
                ON amendment.id = bid.source_amendment_id
            WHERE bid.id = $1
              AND stop.day_plan_id = bid.day_plan_id
              AND stop.id = amendment.stop_id
              AND amendment.amendment_type = 'add_service'
            "#,
        )
        .bind(bid_id)
        .execute(&mut *transaction)
        .await?;
    }

    sqlx::query("UPDATE project_bids SET status = 'converted', updated_at = now() WHERE id = $1")
        .bind(bid_id)
        .execute(&mut *transaction)
        .await?;
    sqlx::query(
        r#"
        UPDATE day_plan_amendment_requests amendment
        SET status = 'approved', updated_at = now()
        FROM project_bids bid
        WHERE bid.id = $1 AND amendment.id = bid.source_amendment_id
        "#,
    )
    .bind(bid_id)
    .execute(&mut *transaction)
    .await?;

    if conversion_created {
        insert_project_bid_audit_event(
            &mut transaction,
            actor_user_id,
            day_plan_id,
            "bid_converted",
            bid_id,
        )
        .await?;
    }

    transaction.commit().await?;
    Ok(list_for_day_plan(pool, day_plan_id)
        .await?
        .into_iter()
        .find(|bid| bid.id == bid_id))
}

pub async fn send(
    pool: &PgPool,
    day_plan_id: &str,
    bid_id: &str,
    request: &SendProjectBidRequest,
) -> Result<Option<ProjectBidResponse>, sqlx::Error> {
    let proposed_token = Uuid::new_v4().simple().to_string();
    let notification_id = format!("notification_{}", Uuid::new_v4().simple());
    let mut transaction = pool.begin().await?;
    let share_token = sqlx::query_scalar::<_, String>(
        r#"
        UPDATE project_bids
        SET
            status = 'sent',
            share_token = CASE
                WHEN share_token IS NULL OR share_revoked_at IS NOT NULL OR share_expires_at <= now()
                    THEN $3
                ELSE share_token
            END,
            share_expires_at = now() + interval '7 days',
            share_revoked_at = NULL,
            sent_at = COALESCE(sent_at, now()),
            updated_at = now()
        WHERE id = $1
          AND day_plan_id = $2
          AND status IN ('draft', 'sent')
        RETURNING share_token
        "#,
    )
    .bind(bid_id)
    .bind(day_plan_id)
    .bind(proposed_token)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(share_token) = share_token else {
        transaction.rollback().await?;
        return Ok(None);
    };

    let share_url = shared_bid_url(&share_token);
    sqlx::query(
        r#"
        INSERT INTO notification_outbox (
            id, entity_type, entity_id, channel, recipient, template_key, payload
        )
        VALUES (
            $1, 'project_bid', $2, $3, $4, 'project_bid_review',
            jsonb_build_object('bid_id', $2::text, 'share_url', $5::text)
        )
        "#,
    )
    .bind(notification_id)
    .bind(bid_id)
    .bind(&request.channel)
    .bind(request.recipient.trim())
    .bind(share_url)
    .execute(&mut *transaction)
    .await?;

    transaction.commit().await?;
    Ok(list_for_day_plan(pool, day_plan_id)
        .await?
        .into_iter()
        .find(|bid| bid.id == bid_id))
}

pub async fn revoke(
    pool: &PgPool,
    day_plan_id: &str,
    bid_id: &str,
) -> Result<Option<ProjectBidResponse>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let updated = sqlx::query_scalar::<_, String>(
        r#"
        UPDATE project_bids
        SET share_revoked_at = now(), updated_at = now()
        WHERE id = $1
          AND day_plan_id = $2
          AND status = 'sent'
          AND responded_at IS NULL
          AND share_revoked_at IS NULL
        RETURNING id
        "#,
    )
    .bind(bid_id)
    .bind(day_plan_id)
    .fetch_optional(&mut *transaction)
    .await?;

    if updated.is_none() {
        transaction.rollback().await?;
        return Ok(None);
    }

    sqlx::query(
        r#"
        UPDATE notification_outbox
        SET
            status = 'skipped',
            last_error = 'Customer review link revoked before delivery',
            updated_at = now()
        WHERE entity_type = 'project_bid'
          AND entity_id = $1
          AND status IN ('queued', 'failed', 'sending')
        "#,
    )
    .bind(bid_id)
    .execute(&mut *transaction)
    .await?;

    transaction.commit().await?;

    Ok(list_for_day_plan(pool, day_plan_id)
        .await?
        .into_iter()
        .find(|bid| bid.id == bid_id))
}

pub async fn shared_for_token(
    pool: &PgPool,
    share_token: &str,
) -> Result<Option<ProjectBidResponse>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            bid.id AS bid_id,
            bid.day_plan_id,
            bid.customer_account_id,
            bid.source_amendment_id,
            bid.status,
            bid.customer_message,
            bid.share_token,
            bid.sent_at::text AS sent_at,
            bid.responded_at::text AS responded_at,
            bid.share_expires_at::text AS share_expires_at,
            bid.share_revoked_at::text AS share_revoked_at,
            item.id AS item_id,
            item.service_id,
            item.service_name,
            item.service_description,
            item.quantity,
            item.unit_price_cents,
            item.note
        FROM project_bids bid
        JOIN project_bid_line_items item ON item.project_bid_id = bid.id
        WHERE bid.share_token = $1
          AND bid.status IN ('sent', 'approved', 'rejected', 'converted')
          AND bid.share_expires_at > now()
          AND bid.share_revoked_at IS NULL
        ORDER BY item.sort_order
        "#,
    )
    .bind(share_token)
    .fetch_all(pool)
    .await?;

    let Some(first) = rows.first() else {
        return Ok(None);
    };

    let mut bid = ProjectBidResponse {
        id: first.get("bid_id"),
        day_plan_id: first.get("day_plan_id"),
        customer_account_id: first.get("customer_account_id"),
        source_amendment_id: first.get("source_amendment_id"),
        status: first.get("status"),
        line_items: Vec::with_capacity(rows.len()),
        customer_message: first.get("customer_message"),
        total_cents: 0,
        share_url: Some(shared_bid_url(share_token)),
        sent_at: first.get("sent_at"),
        responded_at: first.get("responded_at"),
        share_expires_at: first.get("share_expires_at"),
        share_revoked_at: first.get("share_revoked_at"),
        delivery_status: None,
        delivery_channel: None,
        delivery_recipient: None,
        converted_job_id: None,
        converted_at: None,
        persisted: true,
    };

    for row in rows {
        let item = ProjectBidLineItemResponse {
            id: row.get("item_id"),
            service_id: row.get("service_id"),
            service_name: row.get("service_name"),
            service_description: row.get("service_description"),
            quantity: row.get::<i32, _>("quantity") as u32,
            unit_price_cents: row.get::<i32, _>("unit_price_cents") as u32,
            note: row.get("note"),
        };
        bid.total_cents += u64::from(item.quantity) * u64::from(item.unit_price_cents);
        bid.line_items.push(item);
    }

    Ok(Some(bid))
}

pub async fn decide_shared(
    pool: &PgPool,
    share_token: &str,
    decision: &str,
) -> Result<Option<ProjectBidResponse>, sqlx::Error> {
    let (status, event_kind) = match decision {
        "approve" => ("approved", "bid_approved"),
        "reject" => ("rejected", "bid_rejected"),
        _ => return Ok(None),
    };

    let mut transaction = pool.begin().await?;
    let updated = sqlx::query_as::<_, (String, String)>(
        r#"
        UPDATE project_bids
        SET status = $2, responded_at = now(), updated_at = now()
        WHERE share_token = $1
          AND status = 'sent'
          AND share_expires_at > now()
          AND share_revoked_at IS NULL
        RETURNING id, day_plan_id
        "#,
    )
    .bind(share_token)
    .bind(status)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some((bid_id, day_plan_id)) = updated else {
        transaction.rollback().await?;
        return Ok(None);
    };

    insert_project_bid_audit_event(
        &mut transaction,
        "customer_shared_bid_link",
        &day_plan_id,
        event_kind,
        &bid_id,
    )
    .await?;

    transaction.commit().await?;

    shared_for_token(pool, share_token).await
}

async fn insert_project_bid_audit_event(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    actor_user_id: &str,
    day_plan_id: &str,
    event_kind: &str,
    target_id: &str,
) -> Result<(), sqlx::Error> {
    let organization_id = sqlx::query_scalar::<_, String>(
        r#"
        SELECT crew.organization_id
        FROM day_plans plan
        JOIN crews crew ON crew.id = plan.crew_id
        WHERE plan.id = $1
        "#,
    )
    .bind(day_plan_id)
    .fetch_one(&mut **transaction)
    .await?;

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

fn shared_bid_url(share_token: &str) -> String {
    format!("/bid-review/{share_token}")
}
