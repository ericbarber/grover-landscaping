use grover_landscaping_api::{db::JobRepository, PhotoUploadMetadata, PhotoUploadRequest};
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
}
