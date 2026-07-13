use super::{
    CustomerPhotoErasureResult, CustomerPhotoErasureSummary, CustomerPrivacyAccount,
    CustomerPrivacyCompletionReport, CustomerPrivacyExport, CustomerPrivacyExportResult,
    CustomerPrivacyJob, CustomerPrivacyPhotoEvidence,
};
use sqlx::{PgPool, Row};
use std::collections::HashSet;
use uuid::Uuid;

pub async fn export_customer_privacy_data(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
    actor_user_id: &str,
) -> Result<CustomerPrivacyExportResult, sqlx::Error> {
    if organization_ids.is_empty() {
        return Ok(CustomerPrivacyExportResult::NotFound);
    }

    let Some(account) = customer_privacy_account(pool, account_id, organization_ids).await? else {
        return Ok(CustomerPrivacyExportResult::NotFound);
    };

    insert_account_privacy_audit_events(
        pool,
        actor_user_id,
        &account.organization_ids,
        "customer_privacy_exported",
        account_id,
    )
    .await?;

    let jobs = customer_privacy_jobs(pool, account_id, organization_ids).await?;
    let photo_evidence =
        customer_privacy_photo_evidence(pool, account_id, organization_ids).await?;
    let completion_reports =
        customer_privacy_completion_reports(pool, account_id, organization_ids).await?;
    let generated_at = sqlx::query_scalar::<_, String>("SELECT NOW()::text")
        .fetch_one(pool)
        .await?;

    Ok(CustomerPrivacyExportResult::Exported(Box::new(
        CustomerPrivacyExport {
            account,
            jobs,
            photo_evidence,
            completion_reports,
            generated_at,
        },
    )))
}

pub async fn erase_customer_photo_evidence(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
    actor_user_id: &str,
    reason: &str,
) -> Result<CustomerPhotoErasureResult, sqlx::Error> {
    if organization_ids.is_empty() {
        return Ok(CustomerPhotoErasureResult::NotFound);
    }

    let Some(account) = customer_privacy_account(pool, account_id, organization_ids).await? else {
        return Ok(CustomerPhotoErasureResult::NotFound);
    };

    let mut transaction = pool.begin().await?;
    let erased_rows = sqlx::query(
        r#"
        WITH target_photos AS (
            SELECT
                photo.id,
                photo.job_id,
                photo.object_key,
                photo.thumbnail_object_key
            FROM job_photos photo
            JOIN service_jobs job ON job.id = photo.job_id
            WHERE job.customer_account_id = $1
              AND job.organization_id = ANY($2)
              AND photo.erased_at IS NULL
              AND photo.status <> 'erased'
        ),
        erased AS (
            UPDATE job_photos photo
            SET
                status = 'erased',
                file_name = 'erased-photo-evidence',
                content_type = 'application/octet-stream',
                object_key = 'erased/' || photo.id,
                thumbnail_object_key = NULL,
                file_size_bytes = NULL,
                image_width_px = NULL,
                image_height_px = NULL,
                metadata_source = 'erased',
                metadata_captured_at = NOW(),
                rejected_reason = NULL,
                rejected_at = NULL,
                erased_at = NOW(),
                erased_by_user_id = $3,
                erasure_reason = $4,
                erasure_original_object_key = target_photos.object_key,
                erasure_original_thumbnail_object_key = target_photos.thumbnail_object_key
            FROM target_photos
            WHERE photo.id = target_photos.id
            RETURNING
                photo.id,
                photo.job_id,
                target_photos.object_key AS original_object_key,
                target_photos.thumbnail_object_key AS original_thumbnail_object_key
        )
        SELECT id, job_id, original_object_key, original_thumbnail_object_key
        FROM erased
        "#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .bind(actor_user_id)
    .bind(reason)
    .fetch_all(&mut *transaction)
    .await?;

    let report_rows = sqlx::query(
        r#"
        WITH target_reports AS (
            SELECT report.id
            FROM job_completion_reports report
            JOIN service_jobs job ON job.id = report.job_id
            WHERE job.customer_account_id = $1
              AND job.organization_id = ANY($2)
              AND report.delivered_snapshot IS NOT NULL
        )
        UPDATE job_completion_reports report
        SET
            delivered_snapshot = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        jsonb_set(
                                            delivered_snapshot,
                                            '{photo_evidence}',
                                            '[]'::jsonb,
                                            true
                                        ),
                                        '{before_photos}',
                                        '0'::jsonb,
                                        true
                                    ),
                                    '{after_photos}',
                                    '0'::jsonb,
                                    true
                                ),
                                '{issue_photos}',
                                '0'::jsonb,
                                true
                            ),
                            '{snapshot_metadata,evidence,total_photo_evidence}',
                            '0'::jsonb,
                            true
                        ),
                        '{snapshot_metadata,evidence,before_photos}',
                        '0'::jsonb,
                        true
                    ),
                    '{snapshot_metadata,evidence,after_photos}',
                    '0'::jsonb,
                    true
                ),
                '{snapshot_metadata,evidence,issue_photos}',
                '0'::jsonb,
                true
            ),
            updated_at = NOW()
        FROM target_reports
        WHERE report.id = target_reports.id
        RETURNING report.id
        "#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_all(&mut *transaction)
    .await?;

    for organization_id in &account.organization_ids {
        insert_account_privacy_audit_event_in_transaction(
            &mut transaction,
            actor_user_id,
            organization_id,
            "customer_photo_evidence_erased",
            account_id,
        )
        .await?;
    }

    transaction.commit().await?;

    let mut affected_jobs = HashSet::new();
    let mut object_keys = Vec::new();
    for row in &erased_rows {
        affected_jobs.insert(row.get::<String, _>("job_id"));
        if let Some(object_key) = row.get::<Option<String>, _>("original_object_key") {
            object_keys.push(object_key);
        }
        if let Some(thumbnail_object_key) =
            row.get::<Option<String>, _>("original_thumbnail_object_key")
        {
            object_keys.push(thumbnail_object_key);
        }
    }
    object_keys.sort();
    object_keys.dedup();

    Ok(CustomerPhotoErasureResult::Erased(
        CustomerPhotoErasureSummary {
            account_id: account_id.to_string(),
            status: "erased",
            erased_photo_count: erased_rows.len() as i64,
            affected_job_count: affected_jobs.len() as i64,
            redacted_completion_report_count: report_rows.len() as i64,
            object_keys_pending_deletion: object_keys,
        },
    ))
}

async fn customer_privacy_account(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
) -> Result<Option<CustomerPrivacyAccount>, sqlx::Error> {
    let Some(row) = sqlx::query(
        r#"
        SELECT
            account.id AS account_id,
            account.customer_name,
            account.billing_model,
            account.payment_status,
            account.service_approval_status,
            account.contracted_services_per_period,
            account.completed_services_this_period,
            account.period_start,
            account.period_end,
            account.billing_notes,
            ARRAY_AGG(DISTINCT job.organization_id ORDER BY job.organization_id) AS organization_ids,
            account.created_at::text AS created_at,
            account.updated_at::text AS updated_at
        FROM customer_accounts account
        JOIN service_jobs job ON job.customer_account_id = account.id
        WHERE account.id = $1
          AND job.organization_id = ANY($2)
        GROUP BY account.id
        "#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_optional(pool)
    .await?
    else {
        return Ok(None);
    };

    Ok(Some(CustomerPrivacyAccount {
        account_id: row.get("account_id"),
        customer_name: row.get("customer_name"),
        billing_model: row.get("billing_model"),
        payment_status: row.get("payment_status"),
        service_approval_status: row.get("service_approval_status"),
        contracted_services_per_period: row.get("contracted_services_per_period"),
        completed_services_this_period: row.get("completed_services_this_period"),
        period_start: row.get("period_start"),
        period_end: row.get("period_end"),
        billing_notes: row.get("billing_notes"),
        organization_ids: row.get("organization_ids"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }))
}

async fn customer_privacy_jobs(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
) -> Result<Vec<CustomerPrivacyJob>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            id AS job_id,
            organization_id,
            customer_name,
            property_address,
            status,
            scheduled_date,
            before_photos,
            after_photos,
            created_at::text AS created_at,
            updated_at::text AS updated_at
        FROM service_jobs
        WHERE customer_account_id = $1
          AND organization_id = ANY($2)
        ORDER BY scheduled_date, id
        "#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| CustomerPrivacyJob {
            job_id: row.get("job_id"),
            organization_id: row.get("organization_id"),
            customer_name: row.get("customer_name"),
            property_address: row.get("property_address"),
            status: row.get("status"),
            scheduled_date: row.get("scheduled_date"),
            before_photos: row.get("before_photos"),
            after_photos: row.get("after_photos"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect())
}

async fn customer_privacy_photo_evidence(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
) -> Result<Vec<CustomerPrivacyPhotoEvidence>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            photo.id AS photo_id,
            photo.job_id,
            job.organization_id,
            photo.photo_type,
            CASE WHEN photo.erased_at IS NULL THEN photo.file_name ELSE NULL END AS file_name,
            CASE WHEN photo.erased_at IS NULL THEN photo.content_type ELSE NULL END AS content_type,
            CASE WHEN photo.erased_at IS NULL THEN photo.object_key ELSE NULL END AS object_key,
            CASE
                WHEN photo.erased_at IS NULL THEN photo.thumbnail_object_key
                ELSE NULL
            END AS thumbnail_object_key,
            photo.status,
            COALESCE(photo.upload_mode, 'local-placeholder') AS upload_mode,
            CASE WHEN photo.erased_at IS NULL THEN photo.file_size_bytes ELSE NULL END AS file_size_bytes,
            CASE WHEN photo.erased_at IS NULL THEN photo.image_width_px ELSE NULL END AS image_width_px,
            CASE WHEN photo.erased_at IS NULL THEN photo.image_height_px ELSE NULL END AS image_height_px,
            photo.metadata_source,
            photo.uploaded_at::text AS uploaded_at,
            photo.erased_at::text AS erased_at,
            photo.erasure_reason
        FROM job_photos photo
        JOIN service_jobs job ON job.id = photo.job_id
        WHERE job.customer_account_id = $1
          AND job.organization_id = ANY($2)
        ORDER BY photo.created_at DESC, photo.id DESC
        "#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| CustomerPrivacyPhotoEvidence {
            photo_id: row.get("photo_id"),
            job_id: row.get("job_id"),
            organization_id: row.get("organization_id"),
            photo_type: row.get("photo_type"),
            file_name: row.get("file_name"),
            content_type: row.get("content_type"),
            object_key: row.get("object_key"),
            thumbnail_object_key: row.get("thumbnail_object_key"),
            status: row.get("status"),
            upload_mode: row.get("upload_mode"),
            file_size_bytes: row.get("file_size_bytes"),
            image_width_px: row.get("image_width_px"),
            image_height_px: row.get("image_height_px"),
            metadata_source: row.get("metadata_source"),
            uploaded_at: row.get("uploaded_at"),
            erased_at: row.get("erased_at"),
            erasure_reason: row.get("erasure_reason"),
        })
        .collect())
}

async fn customer_privacy_completion_reports(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
) -> Result<Vec<CustomerPrivacyCompletionReport>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            report.id AS report_id,
            report.job_id,
            report.report_status,
            report.ready_for_customer,
            report.sent_at::text AS sent_at,
            report.delivered_at::text AS delivered_at,
            report.delivered_snapshot_at::text AS delivered_snapshot_at,
            CASE
                WHEN jsonb_typeof(report.delivered_snapshot -> 'photo_evidence') = 'array'
                    THEN jsonb_array_length(report.delivered_snapshot -> 'photo_evidence')
                ELSE 0
            END AS delivered_snapshot_photo_count,
            report.created_at::text AS created_at,
            report.updated_at::text AS updated_at
        FROM job_completion_reports report
        JOIN service_jobs job ON job.id = report.job_id
        WHERE job.customer_account_id = $1
          AND job.organization_id = ANY($2)
        ORDER BY report.updated_at DESC, report.id DESC
        "#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| CustomerPrivacyCompletionReport {
            report_id: row.get("report_id"),
            job_id: row.get("job_id"),
            report_status: row.get("report_status"),
            ready_for_customer: row.get("ready_for_customer"),
            sent_at: row.get("sent_at"),
            delivered_at: row.get("delivered_at"),
            delivered_snapshot_at: row.get("delivered_snapshot_at"),
            delivered_snapshot_photo_count: row.get("delivered_snapshot_photo_count"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect())
}

async fn insert_account_privacy_audit_events(
    pool: &PgPool,
    actor_user_id: &str,
    organization_ids: &[String],
    event_kind: &str,
    target_id: &str,
) -> Result<(), sqlx::Error> {
    for organization_id in organization_ids {
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
        .execute(pool)
        .await?;
    }

    Ok(())
}

async fn insert_account_privacy_audit_event_in_transaction(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    actor_user_id: &str,
    organization_id: &str,
    event_kind: &str,
    target_id: &str,
) -> Result<(), sqlx::Error> {
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
