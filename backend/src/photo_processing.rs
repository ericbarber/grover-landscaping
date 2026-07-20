use crate::{
    db::{JobRepository, ResourceReadResult},
    photo_storage::PhotoStorageConfig,
};
use std::time::Duration;

const DEFAULT_BATCH_SIZE: i64 = 5;
const DEFAULT_MAX_ATTEMPTS: i32 = 5;
const DEFAULT_POLL_SECONDS: u64 = 10;

#[derive(Clone, Debug)]
pub enum PhotoProcessingWorkerConfig {
    Disabled,
    Enabled(PhotoProcessingWorkerSettings),
}

#[derive(Clone, Debug)]
pub struct PhotoProcessingWorkerSettings {
    poll_interval: Duration,
    batch_size: i64,
    max_attempts: i32,
}

impl PhotoProcessingWorkerConfig {
    pub fn from_env() -> Result<Self, String> {
        let mode = std::env::var("PHOTO_PROCESSING_WORKER_MODE")
            .unwrap_or_else(|_| "disabled".to_string());
        if mode == "disabled" {
            return Ok(Self::Disabled);
        }
        if mode != "enabled" && mode != "thumbnail" {
            return Err(format!("unsupported PHOTO_PROCESSING_WORKER_MODE: {mode}"));
        }

        let poll_seconds =
            parse_positive_env("PHOTO_PROCESSING_POLL_SECONDS", DEFAULT_POLL_SECONDS)?;
        let batch_size =
            parse_positive_env("PHOTO_PROCESSING_BATCH_SIZE", DEFAULT_BATCH_SIZE as u64)? as i64;
        let max_attempts =
            parse_positive_env("PHOTO_PROCESSING_MAX_ATTEMPTS", DEFAULT_MAX_ATTEMPTS as u64)?
                as i32;

        Ok(Self::Enabled(PhotoProcessingWorkerSettings {
            poll_interval: Duration::from_secs(poll_seconds),
            batch_size,
            max_attempts,
        }))
    }
}

pub fn start_photo_processing_worker(
    repository: JobRepository,
    photo_storage: PhotoStorageConfig,
    config: PhotoProcessingWorkerConfig,
) -> Result<(), String> {
    let PhotoProcessingWorkerConfig::Enabled(config) = config else {
        tracing::info!("photo processing worker disabled");
        return Ok(());
    };

    if !repository.is_database_ready() {
        return Err("photo processing worker requires DATABASE_URL".to_string());
    }
    if matches!(photo_storage, PhotoStorageConfig::Local) {
        return Err("photo processing worker requires PHOTO_STORAGE_MODE=s3".to_string());
    }

    tokio::spawn(async move {
        loop {
            let processed = process_photo_processing_once(
                &repository,
                &photo_storage,
                config.batch_size,
                config.max_attempts,
            )
            .await;
            match processed {
                ResourceReadResult::Loaded(processed) if processed > 0 => {
                    tracing::info!(processed, "photo processing worker cycle completed");
                }
                ResourceReadResult::Unavailable => {
                    tracing::error!("photo processing worker cycle could not claim persisted work");
                }
                _ => {}
            }
            tokio::time::sleep(config.poll_interval).await;
        }
    });

    Ok(())
}

pub async fn process_photo_processing_once(
    repository: &JobRepository,
    photo_storage: &PhotoStorageConfig,
    batch_size: i64,
    max_attempts: i32,
) -> ResourceReadResult<usize> {
    let ResourceReadResult::Loaded(claims) = repository
        .claim_photo_processing_batch(batch_size, max_attempts)
        .await
    else {
        return ResourceReadResult::Unavailable;
    };
    let ResourceReadResult::Loaded(deletion_claims) = repository
        .claim_photo_erasure_deletion_batch(batch_size, max_attempts)
        .await
    else {
        return ResourceReadResult::Unavailable;
    };
    let processed = claims.len() + deletion_claims.len();

    for claim in claims {
        if claim.task_type != "thumbnail_generation" {
            let _ = repository
                .mark_photo_processing_failed(
                    &claim.id,
                    claim.attempt_count,
                    max_attempts,
                    "unsupported_photo_processing_task",
                )
                .await;
            continue;
        }

        let generated = photo_storage
            .generate_uploaded_thumbnail(
                &claim.upload_mode,
                &claim.object_key,
                &claim.thumbnail_object_key,
            )
            .await;
        if generated {
            let _ = repository.mark_photo_processing_completed(&claim.id).await;
        } else {
            let _ = repository
                .mark_photo_processing_failed(
                    &claim.id,
                    claim.attempt_count,
                    max_attempts,
                    "thumbnail_generation_failed",
                )
                .await;
        }
    }

    for claim in deletion_claims {
        let deletion = photo_storage
            .delete_objects(std::slice::from_ref(&claim.object_key))
            .await;
        if deletion.failed_object_keys.is_empty() {
            let _ = repository
                .mark_photo_erasure_deletion_completed(&claim.id)
                .await;
        } else {
            let _ = repository
                .mark_photo_erasure_deletion_failed(
                    &claim.id,
                    claim.attempt_count,
                    max_attempts,
                    "photo_object_deletion_failed",
                )
                .await;
        }
    }

    ResourceReadResult::Loaded(processed)
}

fn parse_positive_env(name: &str, default: u64) -> Result<u64, String> {
    match std::env::var(name) {
        Ok(value) => {
            let parsed = value
                .parse::<u64>()
                .map_err(|_| format!("{name} must be a positive integer"))?;
            if parsed == 0 {
                return Err(format!("{name} must be greater than zero"));
            }
            Ok(parsed)
        }
        Err(_) => Ok(default),
    }
}
