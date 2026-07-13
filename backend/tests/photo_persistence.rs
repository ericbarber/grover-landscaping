use grover_landscaping_api::{db::JobRepository, PhotoUploadMetadata, PhotoUploadRequest};
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
