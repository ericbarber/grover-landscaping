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

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct PhotoProcessingCycleResult {
    pub claimed: usize,
    pub finalized: usize,
    pub stale: usize,
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
                ResourceReadResult::Loaded(result) if result.claimed > 0 => {
                    tracing::info!(
                        claimed = result.claimed,
                        finalized = result.finalized,
                        stale = result.stale,
                        "photo processing worker cycle completed"
                    );
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
) -> ResourceReadResult<PhotoProcessingCycleResult> {
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
    let mut result = PhotoProcessingCycleResult {
        claimed: claims.len() + deletion_claims.len(),
        ..PhotoProcessingCycleResult::default()
    };
    let mut mutation_unavailable = false;

    for claim in claims {
        if claim.task_type != "thumbnail_generation" {
            mutation_unavailable |= record_finalization(
                repository
                    .mark_photo_processing_failed(
                        &claim.id,
                        claim.attempt_count,
                        max_attempts,
                        "unsupported_photo_processing_task",
                    )
                    .await,
                &claim.id,
                "photo_processing",
                &mut result,
            );
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
            mutation_unavailable |= record_finalization(
                repository.mark_photo_processing_completed(&claim.id).await,
                &claim.id,
                "photo_processing",
                &mut result,
            );
        } else {
            mutation_unavailable |= record_finalization(
                repository
                    .mark_photo_processing_failed(
                        &claim.id,
                        claim.attempt_count,
                        max_attempts,
                        "thumbnail_generation_failed",
                    )
                    .await,
                &claim.id,
                "photo_processing",
                &mut result,
            );
        }
    }

    for claim in deletion_claims {
        let deletion = photo_storage
            .delete_objects(std::slice::from_ref(&claim.object_key))
            .await;
        if deletion.failed_object_keys.is_empty() {
            mutation_unavailable |= record_finalization(
                repository
                    .mark_photo_erasure_deletion_completed(&claim.id)
                    .await,
                &claim.id,
                "photo_erasure_deletion",
                &mut result,
            );
        } else {
            mutation_unavailable |= record_finalization(
                repository
                    .mark_photo_erasure_deletion_failed(
                        &claim.id,
                        claim.attempt_count,
                        max_attempts,
                        "photo_object_deletion_failed",
                    )
                    .await,
                &claim.id,
                "photo_erasure_deletion",
                &mut result,
            );
        }
    }

    if mutation_unavailable {
        ResourceReadResult::Unavailable
    } else {
        ResourceReadResult::Loaded(result)
    }
}

fn record_finalization(
    outcome: ResourceReadResult<bool>,
    claim_id: &str,
    queue: &'static str,
    result: &mut PhotoProcessingCycleResult,
) -> bool {
    match outcome {
        ResourceReadResult::Loaded(true) => {
            result.finalized += 1;
            false
        }
        ResourceReadResult::Loaded(false) | ResourceReadResult::NotFound => {
            result.stale += 1;
            tracing::warn!(
                claim_id,
                queue,
                "photo worker finalization found no current claim"
            );
            false
        }
        ResourceReadResult::Unavailable => true,
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finalization_counts_applied_and_stale_claims_separately() {
        let mut result = PhotoProcessingCycleResult {
            claimed: 2,
            ..PhotoProcessingCycleResult::default()
        };

        assert!(!record_finalization(
            ResourceReadResult::Loaded(true),
            "claim_applied",
            "photo_processing",
            &mut result,
        ));
        assert!(!record_finalization(
            ResourceReadResult::Loaded(false),
            "claim_stale",
            "photo_erasure_deletion",
            &mut result,
        ));

        assert_eq!(
            result,
            PhotoProcessingCycleResult {
                claimed: 2,
                finalized: 1,
                stale: 1,
            }
        );
    }

    #[test]
    fn unavailable_finalization_stops_a_successful_cycle_result() {
        let mut result = PhotoProcessingCycleResult {
            claimed: 1,
            ..PhotoProcessingCycleResult::default()
        };

        assert!(record_finalization(
            ResourceReadResult::Unavailable,
            "claim_unavailable",
            "photo_processing",
            &mut result,
        ));
        assert_eq!(result.finalized, 0);
        assert_eq!(result.stale, 0);
    }
}
