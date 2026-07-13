use grover_landscaping_api::{
    db::{
        CustomerPhotoErasureResult, CustomerPrivacyExportResult, JobRepository,
        PhotoProcessingHistoryFilter, PhotoProcessingResolveResult, PhotoProcessingRetryResult,
    },
    photo_processing::process_photo_processing_once,
    photo_storage::PhotoStorageConfig,
    PhotoUploadMetadata, PhotoUploadRequest,
};
use sqlx::Row;
mod common;

#[tokio::test]
async fn repository_persists_and_lists_photo_evidence() {
    let Some(config) = common::database_config() else {
        return;
    };

    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let ticket = repository
        .create_photo_upload(
            "job_1001".to_string(),
            PhotoUploadRequest {
                file_name: "issue-test.jpg".to_string(),
                content_type: "image/jpeg".to_string(),
                photo_type: "issue".to_string(),
            },
        )
        .await;

    let pending_photos = repository.list_photo_evidence("job_1001").await;
    assert!(
        pending_photos
            .iter()
            .all(|photo| photo.id != ticket.photo_id),
        "pending upload tickets should not be visible as photo evidence"
    );

    repository
        .complete_photo_upload(
            "job_1001",
            &ticket.photo_id,
            PhotoUploadMetadata {
                file_size_bytes: Some(24_576),
                image_width_px: Some(1600),
                image_height_px: Some(900),
                metadata_source: Some("client_reported".to_string()),
            },
        )
        .await;

    let photos = repository.list_photo_evidence("job_1001").await;
    let photo = photos
        .iter()
        .find(|photo| photo.id == ticket.photo_id)
        .expect("uploaded photo evidence should be listed");

    assert_eq!(photo.job_id, "job_1001");
    assert_eq!(photo.photo_type, "issue");
    assert_eq!(photo.file_name, "issue-test.jpg");
    assert_eq!(photo.content_type, "image/jpeg");
    assert_eq!(photo.status, "uploaded");
    assert_eq!(photo.upload_mode, "local-placeholder");
    assert_eq!(photo.object_key, ticket.object_key);
    assert_eq!(photo.thumbnail_url, None);
    assert_eq!(photo.file_size_bytes, Some(24_576));
    assert_eq!(photo.image_width_px, Some(1600));
    assert_eq!(photo.image_height_px, Some(900));
    assert_eq!(photo.metadata_source.as_deref(), Some("client_reported"));
    assert!(photo.display_url.starts_with("local://"));

    let processed_ticket = repository
        .create_photo_upload(
            "job_1001".to_string(),
            PhotoUploadRequest {
                file_name: "server-processed.jpg".to_string(),
                content_type: "image/jpeg".to_string(),
                photo_type: "after".to_string(),
            },
        )
        .await;

    repository
        .complete_photo_upload(
            "job_1001",
            &processed_ticket.photo_id,
            PhotoUploadMetadata {
                file_size_bytes: Some(49_152),
                image_width_px: Some(2048),
                image_height_px: Some(1536),
                metadata_source: Some("server_extracted".to_string()),
            },
        )
        .await;

    let processed_photos = repository.list_photo_evidence("job_1001").await;
    let processed_photo = processed_photos
        .iter()
        .find(|photo| photo.id == processed_ticket.photo_id)
        .expect("server-extracted photo evidence should be listed");

    assert_eq!(processed_photo.status, "processed");
    assert_eq!(
        processed_photo.metadata_source.as_deref(),
        Some("server_extracted")
    );

    let rejected_ticket = repository
        .create_photo_upload(
            "job_1001".to_string(),
            PhotoUploadRequest {
                file_name: "invalid-image.jpg".to_string(),
                content_type: "image/jpeg".to_string(),
                photo_type: "before".to_string(),
            },
        )
        .await;
    let pool = repository
        .pool()
        .expect("photo persistence test should have a PostgreSQL pool");
    let before_count: i32 =
        sqlx::query_scalar("SELECT before_photos FROM service_jobs WHERE id = 'job_1001'")
            .fetch_one(&pool)
            .await
            .unwrap();

    assert!(
        repository
            .reject_photo_upload(
                "job_1001",
                &rejected_ticket.photo_id,
                "unsupported_or_invalid_image_header",
            )
            .await
    );
    assert!(
        !repository
            .reject_photo_upload(
                "job_1001",
                "photo_missing_for_rejection",
                "unsupported_or_invalid_image_header",
            )
            .await,
        "rejecting an unknown photo id should report that nothing changed"
    );

    let rejected_row = sqlx::query(
        r#"
        SELECT status, metadata_source, rejected_reason, rejected_at IS NOT NULL AS has_rejected_at
        FROM job_photos
        WHERE id = $1
        "#,
    )
    .bind(&rejected_ticket.photo_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    let after_count: i32 =
        sqlx::query_scalar("SELECT before_photos FROM service_jobs WHERE id = 'job_1001'")
            .fetch_one(&pool)
            .await
            .unwrap();
    let visible_photos = repository.list_photo_evidence("job_1001").await;

    assert_eq!(rejected_row.get::<String, _>("status"), "rejected");
    assert_eq!(
        rejected_row.get::<String, _>("metadata_source"),
        "server_rejected"
    );
    assert_eq!(
        rejected_row.get::<String, _>("rejected_reason"),
        "unsupported_or_invalid_image_header"
    );
    assert!(rejected_row.get::<bool, _>("has_rejected_at"));
    assert_eq!(after_count, before_count);
    assert!(
        visible_photos
            .iter()
            .all(|photo| photo.id != rejected_ticket.photo_id),
        "rejected photo evidence should stay quarantined from evidence reads"
    );
}

#[tokio::test]
async fn repository_queues_and_retries_photo_processing_jobs() {
    let Some(config) = common::database_config() else {
        return;
    };

    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let ticket = repository
        .create_photo_upload(
            "job_1001".to_string(),
            PhotoUploadRequest {
                file_name: "needs-thumbnail.jpg".to_string(),
                content_type: "image/jpeg".to_string(),
                photo_type: "after".to_string(),
            },
        )
        .await;

    assert!(
        repository
            .queue_photo_processing_retry(
                "job_1001",
                &ticket.photo_id,
                "thumbnail_generation",
                "thumbnail_generation_unavailable",
            )
            .await
            .is_none(),
        "photos without thumbnail object keys should not enqueue thumbnail work"
    );

    let pool = repository
        .pool()
        .expect("photo processing test should have a PostgreSQL pool");
    sqlx::query(
        r#"
        UPDATE job_photos
        SET upload_mode = 's3-presigned',
            thumbnail_object_key = $2
        WHERE id = $1
        "#,
    )
    .bind(&ticket.photo_id)
    .bind("jobs/job_1001/photos/thumbnails/needs-thumbnail.jpg")
    .execute(&pool)
    .await
    .unwrap();

    let queued = repository
        .queue_photo_processing_retry(
            "job_1001",
            &ticket.photo_id,
            "thumbnail_generation",
            "thumbnail_generation_unavailable",
        )
        .await
        .expect("thumbnail processing job should be queued");
    let duplicate = repository
        .queue_photo_processing_retry(
            "job_1001",
            &ticket.photo_id,
            "thumbnail_generation",
            "storage_inspection_unavailable",
        )
        .await
        .expect("duplicate thumbnail processing queue should return existing row");

    assert_eq!(duplicate.id, queued.id);
    assert_eq!(queued.photo_id, ticket.photo_id);
    assert_eq!(queued.job_id, "job_1001");
    assert_eq!(queued.organization_id, "org_demo_landscaping");
    assert_eq!(queued.task_type, "thumbnail_generation");
    assert_eq!(queued.status, "queued");
    assert_eq!(queued.attempt_count, 0);

    let claimed = repository.claim_photo_processing_batch(10, 3).await;
    assert_eq!(claimed.len(), 1);
    let claim = &claimed[0];
    assert_eq!(claim.id, queued.id);
    assert_eq!(claim.photo_id, ticket.photo_id);
    assert_eq!(claim.upload_mode, "s3-presigned");
    assert_eq!(claim.object_key, ticket.object_key);
    assert_eq!(
        claim.thumbnail_object_key,
        "jobs/job_1001/photos/thumbnails/needs-thumbnail.jpg"
    );
    assert_eq!(claim.attempt_count, 1);

    assert!(
        repository
            .mark_photo_processing_failed(&claim.id, claim.attempt_count, 3, "temporary failure")
            .await
    );
    assert!(
        repository
            .claim_photo_processing_batch(10, 3)
            .await
            .is_empty(),
        "failed jobs should wait for retry availability before being claimed again"
    );

    sqlx::query("UPDATE photo_processing_jobs SET available_at = now() WHERE id = $1")
        .bind(&claim.id)
        .execute(&pool)
        .await
        .unwrap();

    let retry_claimed = repository.claim_photo_processing_batch(10, 3).await;
    assert_eq!(retry_claimed.len(), 1);
    assert_eq!(retry_claimed[0].id, queued.id);
    assert_eq!(retry_claimed[0].attempt_count, 2);

    assert!(
        repository
            .mark_photo_processing_completed(&retry_claimed[0].id)
            .await
    );
    assert!(
        !repository
            .mark_photo_processing_failed(
                &retry_claimed[0].id,
                retry_claimed[0].attempt_count,
                3,
                "late failure"
            )
            .await,
        "completed processing jobs should not be failed afterward"
    );

    let status: String =
        sqlx::query_scalar("SELECT status FROM photo_processing_jobs WHERE id = $1")
            .bind(&queued.id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(status, "completed");
    assert!(repository
        .claim_photo_processing_batch(10, 3)
        .await
        .is_empty());
}

#[tokio::test]
async fn photo_processing_worker_marks_failed_thumbnail_jobs() {
    let Some(config) = common::database_config() else {
        return;
    };

    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let ticket = repository
        .create_photo_upload(
            "job_1001".to_string(),
            PhotoUploadRequest {
                file_name: "worker-thumbnail.jpg".to_string(),
                content_type: "image/jpeg".to_string(),
                photo_type: "after".to_string(),
            },
        )
        .await;
    let pool = repository
        .pool()
        .expect("photo worker test should have a PostgreSQL pool");
    sqlx::query(
        r#"
        UPDATE job_photos
        SET upload_mode = 's3-presigned',
            thumbnail_object_key = $2
        WHERE id = $1
        "#,
    )
    .bind(&ticket.photo_id)
    .bind("jobs/job_1001/photos/thumbnails/worker-thumbnail.jpg")
    .execute(&pool)
    .await
    .unwrap();

    let queued = repository
        .queue_photo_processing_retry(
            "job_1001",
            &ticket.photo_id,
            "thumbnail_generation",
            "thumbnail_generation_unavailable",
        )
        .await
        .expect("thumbnail processing job should be queued");

    let processed =
        process_photo_processing_once(&repository, &PhotoStorageConfig::Local, 10, 1).await;
    assert_eq!(processed, 1);

    let row = sqlx::query(
        r#"
        SELECT status, attempt_count, last_error
        FROM photo_processing_jobs
        WHERE id = $1
        "#,
    )
    .bind(&queued.id)
    .fetch_one(&pool)
    .await
    .unwrap();

    assert_eq!(row.get::<String, _>("status"), "dead_letter");
    assert_eq!(row.get::<i32, _>("attempt_count"), 1);
    assert_eq!(
        row.get::<String, _>("last_error"),
        "thumbnail_generation_failed"
    );
    assert_eq!(
        process_photo_processing_once(&repository, &PhotoStorageConfig::Local, 10, 1).await,
        0
    );
}

#[tokio::test]
async fn repository_recovers_failed_photo_processing_jobs() {
    let Some(config) = common::database_config() else {
        return;
    };

    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let ticket = repository
        .create_photo_upload(
            "job_1001".to_string(),
            PhotoUploadRequest {
                file_name: "recover-thumbnail.jpg".to_string(),
                content_type: "image/jpeg".to_string(),
                photo_type: "after".to_string(),
            },
        )
        .await;
    let pool = repository
        .pool()
        .expect("photo recovery test should have a PostgreSQL pool");
    sqlx::query(
        r#"
        UPDATE job_photos
        SET upload_mode = 's3-presigned',
            thumbnail_object_key = $2
        WHERE id = $1
        "#,
    )
    .bind(&ticket.photo_id)
    .bind("jobs/job_1001/photos/thumbnails/recover-thumbnail.jpg")
    .execute(&pool)
    .await
    .unwrap();

    let queued = repository
        .queue_photo_processing_retry(
            "job_1001",
            &ticket.photo_id,
            "thumbnail_generation",
            "thumbnail_generation_unavailable",
        )
        .await
        .expect("thumbnail processing job should be queued");

    assert_eq!(
        process_photo_processing_once(&repository, &PhotoStorageConfig::Local, 10, 1).await,
        1
    );

    let dead_letters = repository
        .list_photo_processing_history(PhotoProcessingHistoryFilter {
            organization_ids: vec!["org_demo_landscaping".to_string()],
            task_type: Some("thumbnail_generation".to_string()),
            status: Some("dead_letter".to_string()),
            limit: 10,
        })
        .await
        .unwrap();
    assert_eq!(dead_letters.len(), 1);
    assert_eq!(dead_letters[0].id, queued.id);
    assert_eq!(dead_letters[0].file_name, "recover-thumbnail.jpg");
    assert_eq!(
        dead_letters[0].last_error.as_deref(),
        Some("thumbnail_generation_failed")
    );

    let retry = repository
        .retry_photo_processing_job(
            &queued.id,
            &["org_demo_landscaping".to_string()],
            "manager_user_1",
        )
        .await
        .unwrap();
    let PhotoProcessingRetryResult::Retried(retried) = retry else {
        panic!("dead-letter photo processing job should be retryable");
    };
    assert_eq!(retried.status, "queued");
    assert_eq!(retried.attempt_count, 0);
    assert_eq!(retried.last_error, None);

    assert_eq!(
        repository
            .retry_photo_processing_job(
                &queued.id,
                &["org_demo_landscaping".to_string()],
                "manager_user_1",
            )
            .await
            .unwrap(),
        PhotoProcessingRetryResult::InvalidStatus
    );

    assert_eq!(
        process_photo_processing_once(&repository, &PhotoStorageConfig::Local, 10, 1).await,
        1
    );

    let resolved = repository
        .resolve_photo_processing_job(
            &queued.id,
            &["org_demo_landscaping".to_string()],
            "manager_user_1",
            Some("Thumbnail regenerated manually"),
        )
        .await
        .unwrap();
    let PhotoProcessingResolveResult::Resolved(resolved) = resolved else {
        panic!("dead-letter photo processing job should be resolvable");
    };
    assert_eq!(resolved.status, "resolved");
    assert!(resolved.resolved_at.is_some());
    assert_eq!(
        resolved.resolution_note.as_deref(),
        Some("Thumbnail regenerated manually")
    );

    let audit_events: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM access_audit_events
        WHERE target_id = $1
          AND event_kind IN ('photo_processing_retried', 'photo_processing_resolved')
        "#,
    )
    .bind(&queued.id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit_events, 2);
}

#[tokio::test]
async fn repository_exports_and_erases_customer_photo_evidence() {
    let Some(config) = common::database_config() else {
        return;
    };

    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let ticket = repository
        .create_photo_upload(
            "job_1001".to_string(),
            PhotoUploadRequest {
                file_name: "privacy-export.jpg".to_string(),
                content_type: "image/jpeg".to_string(),
                photo_type: "before".to_string(),
            },
        )
        .await;

    repository
        .complete_photo_upload(
            "job_1001",
            &ticket.photo_id,
            PhotoUploadMetadata {
                file_size_bytes: Some(33_333),
                image_width_px: Some(1200),
                image_height_px: Some(800),
                metadata_source: Some("client_reported".to_string()),
            },
        )
        .await;

    let organization_ids = vec!["org_demo_landscaping".to_string()];
    let export = repository
        .export_customer_privacy_data("acct_1001", &organization_ids, "manager_user_1")
        .await;
    let CustomerPrivacyExportResult::Exported(export) = export else {
        panic!("customer privacy data should export for an account in scope");
    };
    assert_eq!(export.account.account_id, "acct_1001");
    assert!(export.jobs.iter().any(|job| job.job_id == "job_1001"));
    let exported_photo = export
        .photo_evidence
        .iter()
        .find(|photo| photo.photo_id == ticket.photo_id)
        .expect("export should include retained photo evidence");
    assert_eq!(
        exported_photo.object_key.as_deref(),
        Some(ticket.object_key.as_str())
    );
    assert_eq!(exported_photo.file_size_bytes, Some(33_333));
    assert_eq!(exported_photo.erased_at, None);

    let erasure = repository
        .erase_customer_photo_evidence(
            "acct_1001",
            &organization_ids,
            "manager_user_1",
            "Customer requested removal of retained photo evidence.",
        )
        .await;
    let CustomerPhotoErasureResult::Erased(erasure) = erasure else {
        panic!("customer photo evidence should be erased for an account in scope");
    };
    assert!(erasure.erased_photo_count >= 1);
    assert!(erasure.affected_job_count >= 1);
    assert!(
        erasure.deleted_object_key_count >= 1,
        "local placeholder object keys should be treated as deleted"
    );
    assert_eq!(erasure.failed_object_key_count, 0);
    assert!(erasure.object_keys_pending_deletion.is_empty());

    let visible_photos = repository.list_photo_evidence("job_1001").await;
    assert!(
        visible_photos
            .iter()
            .all(|photo| photo.id != ticket.photo_id),
        "erased photo evidence should be hidden from standard evidence reads"
    );

    let export_after_erasure = repository
        .export_customer_privacy_data("acct_1001", &organization_ids, "manager_user_1")
        .await;
    let CustomerPrivacyExportResult::Exported(export_after_erasure) = export_after_erasure else {
        panic!("customer privacy data should still export after erasure");
    };
    let erased_photo = export_after_erasure
        .photo_evidence
        .iter()
        .find(|photo| photo.photo_id == ticket.photo_id)
        .expect("export should keep an erasure proof row");
    assert_eq!(erased_photo.status, "erased");
    assert_eq!(erased_photo.object_key, None);
    assert_eq!(erased_photo.file_name, None);
    assert!(erased_photo.erased_at.is_some());
    assert_eq!(
        erased_photo.erasure_reason.as_deref(),
        Some("Customer requested removal of retained photo evidence.")
    );

    let pool = repository
        .pool()
        .expect("photo privacy test should have a PostgreSQL pool");
    let audit_events: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM access_audit_events
        WHERE target_id = 'acct_1001'
          AND event_kind IN ('customer_privacy_exported', 'customer_photo_evidence_erased')
        "#,
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert!(
        audit_events >= 3,
        "initial export, erasure, and post-erasure export should be audited"
    );
}
