use crate::completion_reports::{CompletionReportPersistence, CompletionReportResponse};
use sqlx::{PgPool, Row};
use std::time::{SystemTime, UNIX_EPOCH};

pub async fn persist_completion_report(
    pool: &PgPool,
    report: &CompletionReportResponse,
) -> Result<CompletionReportPersistence, sqlx::Error> {
    let proposed_share_token = if completion_report_share_token_should_be_proposed(&report.report_status) {
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
            last_generated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
        ON CONFLICT (job_id) DO UPDATE SET
            id = EXCLUDED.id,
            report_status = EXCLUDED.report_status,
            ready_for_customer = EXCLUDED.ready_for_customer,
            checklist_progress = EXCLUDED.checklist_progress,
            before_photos = EXCLUDED.before_photos,
            after_photos = EXCLUDED.after_photos,
            issue_photos = EXCLUDED.issue_photos,
            share_token = COALESCE(job_completion_reports.share_token, EXCLUDED.share_token),
            last_generated_at = now(),
            updated_at = now()
        RETURNING share_token
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

    Ok(CompletionReportPersistence {
        persisted: true,
        share_token: row.get("share_token"),
    })
}

pub async fn job_id_for_share_token(
    pool: &PgPool,
    share_token: &str,
) -> Result<Option<String>, sqlx::Error> {
    sqlx::query_scalar("SELECT job_id FROM job_completion_reports WHERE share_token = $1")
        .bind(share_token)
        .fetch_optional(pool)
        .await
}

fn completion_report_share_token_should_be_proposed(status: &str) -> bool {
    status == "delivered"
}

fn proposed_share_token(report_id: &str) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);

    format!("share_{report_id}_{nonce}")
}

#[cfg(test)]
mod tests {
    use super::completion_report_share_token_should_be_proposed;

    #[test]
    fn share_token_is_proposed_only_for_delivered_reports() {
        assert!(completion_report_share_token_should_be_proposed("delivered"));
        assert!(!completion_report_share_token_should_be_proposed("submitted"));
        assert!(!completion_report_share_token_should_be_proposed("in_review"));
        assert!(!completion_report_share_token_should_be_proposed("changes_requested"));
        assert!(!completion_report_share_token_should_be_proposed("draft"));
    }
}