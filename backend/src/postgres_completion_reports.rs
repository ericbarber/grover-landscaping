use crate::completion_reports::{
    shared_report_url, CompletionReportActionResponse, CompletionReportActionResult,
    CompletionReportDeliveryNotificationResponse, CompletionReportDeliveryNotificationResult,
    CompletionReportPersistence, CompletionReportResponse,
};
use sqlx::{PgPool, Row};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

pub async fn persist_completion_report(
    pool: &PgPool,
    report: &CompletionReportResponse,
) -> Result<CompletionReportPersistence, sqlx::Error> {
    let proposed_share_token =
        if completion_report_share_token_should_be_proposed(&report.report_status) {
            Some(proposed_share_token(&report.report_id))
        } else {
            None
        };

    let row = sqlx::query(
        r#"
        INSERT INTO job_completion_reports (
            id,
            job_id,
            report_status,
            ready_for_customer,
            checklist_progress,
            before_photos,
            after_photos,
            issue_photos,
            share_token,
            submitted_at,
            last_generated_at
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            CASE WHEN $3 = 'submitted' THEN now() END,
            now()
        )
        ON CONFLICT (job_id) DO UPDATE SET
            report_status = CASE
                WHEN job_completion_reports.report_status IN (
                    'submitted',
                    'in_review',
                    'changes_requested',
                    'delivered'
                ) THEN job_completion_reports.report_status
                ELSE EXCLUDED.report_status
            END,
            ready_for_customer = CASE
                WHEN job_completion_reports.report_status IN (
                    'submitted',
                    'in_review',
                    'changes_requested',
                    'delivered'
                ) THEN job_completion_reports.ready_for_customer
                ELSE EXCLUDED.ready_for_customer
            END,
            checklist_progress = CASE
                WHEN job_completion_reports.report_status IN (
                    'submitted',
                    'in_review',
                    'changes_requested',
                    'delivered'
                ) THEN job_completion_reports.checklist_progress
                ELSE EXCLUDED.checklist_progress
            END,
            before_photos = CASE
                WHEN job_completion_reports.report_status IN (
                    'submitted',
                    'in_review',
                    'changes_requested',
                    'delivered'
                ) THEN job_completion_reports.before_photos
                ELSE EXCLUDED.before_photos
            END,
            after_photos = CASE
                WHEN job_completion_reports.report_status IN (
                    'submitted',
                    'in_review',
                    'changes_requested',
                    'delivered'
                ) THEN job_completion_reports.after_photos
                ELSE EXCLUDED.after_photos
            END,
            issue_photos = CASE
                WHEN job_completion_reports.report_status IN (
                    'submitted',
                    'in_review',
                    'changes_requested',
                    'delivered'
                ) THEN job_completion_reports.issue_photos
                ELSE EXCLUDED.issue_photos
            END,
            share_token = COALESCE(job_completion_reports.share_token, EXCLUDED.share_token),
            submitted_at = COALESCE(job_completion_reports.submitted_at, EXCLUDED.submitted_at),
            last_generated_at = now(),
            updated_at = now()
        RETURNING
            report_status,
            ready_for_customer,
            checklist_progress,
            before_photos,
            after_photos,
            issue_photos,
            share_token,
            delivered_at IS NOT NULL AS delivered_at_present
        "#,
    )
    .bind(&report.report_id)
    .bind(&report.job_id)
    .bind(&report.report_status)
    .bind(report.ready_for_customer)
    .bind(report.checklist_progress as i32)
    .bind(report.before_photos as i32)
    .bind(report.after_photos as i32)
    .bind(report.issue_photos as i32)
    .bind(proposed_share_token)
    .fetch_one(pool)
    .await?;

    let persisted_report_status: String = row.get("report_status");
    let delivered_at_present: bool = row.get("delivered_at_present");
    let share_token = if completion_report_share_token_should_be_returned(
        &persisted_report_status,
        delivered_at_present,
    ) {
        row.get("share_token")
    } else {
        None
    };

    Ok(CompletionReportPersistence {
        persisted: true,
        report_status: Some(persisted_report_status),
        ready_for_customer: Some(row.get("ready_for_customer")),
        checklist_progress: Some(row.get::<i32, _>("checklist_progress").max(0) as u32),
        before_photos: Some(row.get::<i32, _>("before_photos").max(0) as u32),
        after_photos: Some(row.get::<i32, _>("after_photos").max(0) as u32),
        issue_photos: Some(row.get::<i32, _>("issue_photos").max(0) as u32),
        share_token,
    })
}

pub async fn start_completion_report_review(
    pool: &PgPool,
    report_id: &str,
    reviewer_user_id: &str,
) -> Result<CompletionReportActionResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        "SELECT job_id, report_status FROM job_completion_reports WHERE id = $1 FOR UPDATE",
    )
    .bind(report_id)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(current) = current else {
        return Ok(CompletionReportActionResult::NotFound);
    };
    let job_id: String = current.get("job_id");
    let current_status: String = current.get("report_status");

    if current_status != "submitted" {
        return Ok(CompletionReportActionResult::InvalidTransition);
    }

    sqlx::query(
        r#"
        UPDATE job_completion_reports
        SET report_status = 'in_review',
            reviewed_by_user_id = $2,
            reviewed_at = now(),
            updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(report_id)
    .bind(reviewer_user_id)
    .execute(&mut *transaction)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO job_completion_report_status_history (
            id,
            completion_report_id,
            from_status,
            to_status,
            changed_by_user_id
        )
        VALUES ($1, $2, 'submitted', 'in_review', $3)
        "#,
    )
    .bind(status_history_id(report_id))
    .bind(report_id)
    .bind(reviewer_user_id)
    .execute(&mut *transaction)
    .await?;

    transaction.commit().await?;

    Ok(CompletionReportActionResult::Updated(
        CompletionReportActionResponse {
            report_id: report_id.to_string(),
            job_id,
            report_status: "in_review".to_string(),
            persisted: true,
            share_url: None,
        },
    ))
}

pub async fn request_completion_report_changes(
    pool: &PgPool,
    report_id: &str,
    reviewer_user_id: &str,
    reason: Option<&str>,
) -> Result<CompletionReportActionResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        "SELECT job_id, report_status FROM job_completion_reports WHERE id = $1 FOR UPDATE",
    )
    .bind(report_id)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(current) = current else {
        return Ok(CompletionReportActionResult::NotFound);
    };
    let job_id: String = current.get("job_id");
    let current_status: String = current.get("report_status");

    if current_status != "in_review" {
        return Ok(CompletionReportActionResult::InvalidTransition);
    }

    sqlx::query(
        r#"
        UPDATE job_completion_reports
        SET report_status = 'changes_requested',
            updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(report_id)
    .execute(&mut *transaction)
    .await?;

    insert_status_history(
        &mut transaction,
        report_id,
        "in_review",
        "changes_requested",
        reviewer_user_id,
        reason,
    )
    .await?;

    transaction.commit().await?;

    Ok(CompletionReportActionResult::Updated(
        CompletionReportActionResponse {
            report_id: report_id.to_string(),
            job_id,
            report_status: "changes_requested".to_string(),
            persisted: true,
            share_url: None,
        },
    ))
}

pub async fn resubmit_completion_report(
    pool: &PgPool,
    report_id: &str,
    submitter_user_id: &str,
) -> Result<CompletionReportActionResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        r#"
        SELECT
            job_id,
            report_status,
            ready_for_customer,
            checklist_progress,
            before_photos,
            after_photos
        FROM job_completion_reports
        WHERE id = $1
        FOR UPDATE
        "#,
    )
    .bind(report_id)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(current) = current else {
        return Ok(CompletionReportActionResult::NotFound);
    };
    let job_id: String = current.get("job_id");
    let current_status: String = current.get("report_status");
    let ready_for_customer: bool = current.get("ready_for_customer");
    let checklist_progress: i32 = current.get("checklist_progress");
    let before_photos: i32 = current.get("before_photos");
    let after_photos: i32 = current.get("after_photos");

    if current_status != "changes_requested"
        || !ready_for_customer
        || checklist_progress != 100
        || before_photos <= 0
        || after_photos <= 0
    {
        return Ok(CompletionReportActionResult::InvalidTransition);
    }

    sqlx::query(
        r#"
        UPDATE job_completion_reports
        SET report_status = 'submitted',
            submitted_at = now(),
            reviewed_by_user_id = NULL,
            reviewed_at = NULL,
            updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(report_id)
    .execute(&mut *transaction)
    .await?;

    insert_status_history(
        &mut transaction,
        report_id,
        "changes_requested",
        "submitted",
        submitter_user_id,
        None,
    )
    .await?;

    transaction.commit().await?;

    Ok(CompletionReportActionResult::Updated(
        CompletionReportActionResponse {
            report_id: report_id.to_string(),
            job_id,
            report_status: "submitted".to_string(),
            persisted: true,
            share_url: None,
        },
    ))
}

pub async fn deliver_completion_report(
    pool: &PgPool,
    report_id: &str,
    delivery_user_id: &str,
) -> Result<CompletionReportActionResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        r#"
        SELECT
            job_id,
            report_status,
            ready_for_customer,
            checklist_progress,
            before_photos,
            after_photos,
            reviewed_at IS NOT NULL AS reviewed_at_present,
            share_token
        FROM job_completion_reports
        WHERE id = $1
        FOR UPDATE
        "#,
    )
    .bind(report_id)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(current) = current else {
        return Ok(CompletionReportActionResult::NotFound);
    };
    let job_id: String = current.get("job_id");
    let current_status: String = current.get("report_status");
    let reviewed_at_present: bool = current.get("reviewed_at_present");
    let ready_for_customer: bool = current.get("ready_for_customer");
    let checklist_progress: i32 = current.get("checklist_progress");
    let before_photos: i32 = current.get("before_photos");
    let after_photos: i32 = current.get("after_photos");

    if current_status != "in_review"
        || !reviewed_at_present
        || !ready_for_customer
        || checklist_progress != 100
        || before_photos <= 0
        || after_photos <= 0
    {
        return Ok(CompletionReportActionResult::InvalidTransition);
    }

    let share_token = current
        .try_get::<Option<String>, _>("share_token")
        .ok()
        .flatten()
        .unwrap_or_else(|| proposed_share_token(report_id));

    sqlx::query(
        r#"
        UPDATE job_completion_reports
        SET report_status = 'delivered',
            share_token = $2,
            delivered_by_user_id = $3,
            delivered_at = now(),
            sent_at = COALESCE(sent_at, now()),
            updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(report_id)
    .bind(&share_token)
    .bind(delivery_user_id)
    .execute(&mut *transaction)
    .await?;

    insert_status_history(
        &mut transaction,
        report_id,
        "in_review",
        "delivered",
        delivery_user_id,
        None,
    )
    .await?;

    transaction.commit().await?;

    Ok(CompletionReportActionResult::Updated(
        CompletionReportActionResponse {
            report_id: report_id.to_string(),
            job_id,
            report_status: "delivered".to_string(),
            persisted: true,
            share_url: Some(shared_report_url(&share_token)),
        },
    ))
}

pub async fn job_id_for_share_token(
    pool: &PgPool,
    share_token: &str,
) -> Result<Option<String>, sqlx::Error> {
    sqlx::query_scalar(
        r#"
        SELECT job_id
        FROM job_completion_reports
        WHERE share_token = $1
          AND report_status = 'delivered'
          AND delivered_at IS NOT NULL
        "#,
    )
    .bind(share_token)
    .fetch_optional(pool)
    .await
}

pub async fn store_delivered_snapshot(
    pool: &PgPool,
    report_id: &str,
    report: &CompletionReportResponse,
) -> Result<(), sqlx::Error> {
    let snapshot =
        serde_json::to_string(report).map_err(|error| sqlx::Error::Encode(Box::new(error)))?;

    sqlx::query(
        r#"
        UPDATE job_completion_reports
        SET delivered_snapshot = $2::jsonb,
            delivered_snapshot_at = now(),
            updated_at = now()
        WHERE id = $1
          AND report_status = 'delivered'
          AND delivered_at IS NOT NULL
        "#,
    )
    .bind(report_id)
    .bind(snapshot)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn delivered_snapshot_for_share_token(
    pool: &PgPool,
    share_token: &str,
) -> Result<Option<serde_json::Value>, sqlx::Error> {
    let snapshot: Option<String> = sqlx::query_scalar(
        r#"
        SELECT delivered_snapshot::text
        FROM job_completion_reports
        WHERE share_token = $1
          AND report_status = 'delivered'
          AND delivered_at IS NOT NULL
          AND delivered_snapshot IS NOT NULL
        "#,
    )
    .bind(share_token)
    .fetch_optional(pool)
    .await?;

    Ok(snapshot.and_then(|value| serde_json::from_str(&value).ok()))
}

pub async fn queue_delivery_notification(
    pool: &PgPool,
    report_id: &str,
    channel: &str,
    recipient: &str,
) -> Result<CompletionReportDeliveryNotificationResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        r#"
        SELECT report_status, delivered_at IS NOT NULL AS delivered_at_present, share_token
        FROM job_completion_reports
        WHERE id = $1
        FOR UPDATE
        "#,
    )
    .bind(report_id)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(CompletionReportDeliveryNotificationResult::NotFound);
    };

    let report_status: String = current.get("report_status");
    let delivered_at_present: bool = current.get("delivered_at_present");
    let share_token: Option<String> = current.get("share_token");
    let Some(share_token) = share_token else {
        transaction.rollback().await?;
        return Ok(CompletionReportDeliveryNotificationResult::NotDelivered);
    };

    if report_status != "delivered" || !delivered_at_present {
        transaction.rollback().await?;
        return Ok(CompletionReportDeliveryNotificationResult::NotDelivered);
    }

    let notification_id = format!("notification_{}", Uuid::new_v4().simple());
    let share_url = shared_report_url(&share_token);
    sqlx::query(
        r#"
        INSERT INTO notification_outbox (
            id, entity_type, entity_id, channel, recipient, template_key, payload
        )
        VALUES (
            $1, 'completion_report', $2, $3, $4, 'completion_report_delivery',
            jsonb_build_object('report_id', $2::text, 'share_url', $5::text)
        )
        "#,
    )
    .bind(&notification_id)
    .bind(report_id)
    .bind(channel)
    .bind(recipient.trim())
    .bind(&share_url)
    .execute(&mut *transaction)
    .await?;

    transaction.commit().await?;

    Ok(CompletionReportDeliveryNotificationResult::Queued(
        CompletionReportDeliveryNotificationResponse {
            report_id: report_id.to_string(),
            notification_id,
            channel: channel.to_string(),
            recipient: recipient.trim().to_string(),
            delivery_status: "queued".to_string(),
            share_url,
        },
    ))
}

fn completion_report_share_token_should_be_proposed(status: &str) -> bool {
    status == "delivered"
}

fn completion_report_share_token_should_be_returned(
    status: &str,
    delivered_at_present: bool,
) -> bool {
    status == "delivered" && delivered_at_present
}

fn proposed_share_token(report_id: &str) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);

    format!("share_{report_id}_{nonce}")
}

fn status_history_id(report_id: &str) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);

    format!("report_status_{report_id}_{nonce}")
}

async fn insert_status_history(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    report_id: &str,
    from_status: &str,
    to_status: &str,
    changed_by_user_id: &str,
    change_reason: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO job_completion_report_status_history (
            id,
            completion_report_id,
            from_status,
            to_status,
            changed_by_user_id,
            change_reason
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        "#,
    )
    .bind(status_history_id(report_id))
    .bind(report_id)
    .bind(from_status)
    .bind(to_status)
    .bind(changed_by_user_id)
    .bind(change_reason)
    .execute(&mut **transaction)
    .await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        completion_report_share_token_should_be_proposed,
        completion_report_share_token_should_be_returned,
    };

    #[test]
    fn share_token_is_proposed_only_for_delivered_reports() {
        assert!(completion_report_share_token_should_be_proposed(
            "delivered"
        ));
        assert!(!completion_report_share_token_should_be_proposed(
            "submitted"
        ));
        assert!(!completion_report_share_token_should_be_proposed(
            "in_review"
        ));
        assert!(!completion_report_share_token_should_be_proposed(
            "changes_requested"
        ));
        assert!(!completion_report_share_token_should_be_proposed("draft"));
    }

    #[test]
    fn share_token_is_returned_only_after_delivery_timestamp_exists() {
        assert!(completion_report_share_token_should_be_returned(
            "delivered",
            true,
        ));
        assert!(!completion_report_share_token_should_be_returned(
            "delivered",
            false,
        ));
        assert!(!completion_report_share_token_should_be_returned(
            "submitted",
            true,
        ));
        assert!(!completion_report_share_token_should_be_returned(
            "in_review",
            true,
        ));
    }
}
