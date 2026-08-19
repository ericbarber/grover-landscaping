use crate::{photo_storage::PhotoStorageConfig, PhotoUploadMetadata};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{PgPool, Row};
use std::{
    collections::{HashMap, HashSet},
    fmt,
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct SaveOwnerWorkspaceRequest {
    pub display_name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerWorkspaceRecord {
    pub owner_user_id: String,
    pub verified_email: String,
    pub display_name: String,
    pub status: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateOwnerPropertyRequest {
    pub display_name: String,
    pub address_line_1: String,
    pub address_line_2: Option<String>,
    pub city: String,
    pub region: String,
    pub postal_code: String,
    pub country_code: Option<String>,
    pub coarse_area: Option<String>,
    pub address_status: String,
    pub authority_attested: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerPropertyRecord {
    pub property_id: String,
    pub owner_user_id: String,
    pub display_name: String,
    pub address_line_1: String,
    pub address_line_2: String,
    pub city: String,
    pub region: String,
    pub postal_code: String,
    pub country_code: String,
    pub coarse_area: String,
    pub address_status: String,
    pub authority_attested: bool,
    pub status: String,
    pub version: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct SaveOwnerYardBriefRequest {
    pub status: String,
    pub yard_areas: Vec<String>,
    pub care_goals: Vec<String>,
    pub cadence_preference: String,
    pub considerations: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerYardBriefRecord {
    pub brief_id: String,
    pub owner_user_id: String,
    pub property_id: String,
    pub version: i64,
    pub status: String,
    pub yard_areas: Vec<String>,
    pub care_goals: Vec<String>,
    pub cadence_preference: String,
    pub considerations: String,
    pub author_source: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateOwnerIntakeMediaRequest {
    pub file_name: String,
    pub content_type: String,
    pub shot_type: String,
    pub replaces_media_id: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerIntakeMediaRecord {
    pub media_id: String,
    pub owner_user_id: String,
    pub property_id: String,
    pub brief_id: String,
    pub shot_type: String,
    pub file_name: String,
    pub content_type: String,
    pub upload_mode: String,
    pub object_key: String,
    pub thumbnail_object_key: Option<String>,
    pub status: String,
    pub file_size_bytes: Option<i64>,
    pub image_width_px: Option<i32>,
    pub image_height_px: Option<i32>,
    pub metadata_source: Option<String>,
    pub rejection_reason: Option<String>,
    pub replaces_media_id: Option<String>,
    pub replaced_by_media_id: Option<String>,
    pub display_url: Option<String>,
    pub thumbnail_url: Option<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct OwnerIntakeMediaUploadRecord {
    pub media: OwnerIntakeMediaRecord,
    pub upload_url: String,
    pub thumbnail_upload_url: Option<String>,
    pub thumbnail_content_type: Option<String>,
    pub thumbnail_max_dimension_px: Option<u32>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateOwnerProviderInvitationRequest {
    pub provider_name: String,
    pub recipient_business_email: String,
    pub expires_in_days: i32,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct RetryOwnerProviderInvitationRequest {
    pub expires_in_days: i32,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct RecordOwnerProviderInvitationDeliveryRequest {
    pub outcome: String,
    pub provider_message_id: Option<String>,
    pub failure_code: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OptOutOwnerProviderInvitationRequest {
    pub token: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct ReportOwnerProviderInvitationAbuseRequest {
    pub token: String,
    pub category: String,
    pub customer_safe_description: Option<String>,
    pub block_future_invitations: bool,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderInvitationAbuseReportRecord {
    pub report_id: String,
    pub invitation_id: String,
    pub category: String,
    pub severity: String,
    pub assigned_function: String,
    pub status: String,
    pub block_future_invitations: bool,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PreviewOwnerProviderInvitationRequest {
    pub token: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct VerifyOwnerProviderInvitationRecipientRequest {
    pub token: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderOrganizationOption {
    pub organization_id: String,
    pub display_name: String,
    pub membership_role: String,
    pub relationship_checked: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct ListOwnerProviderOrganizationOptionsRequest {
    pub token: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateOwnerProviderOrganizationClaimRequest {
    pub token: String,
    pub claim_kind: String,
    pub organization_id: Option<String>,
    pub provider_display_name: Option<String>,
    pub authority_attested: bool,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct BootstrapOwnerProviderOrganizationClaimRequest {
    pub token: String,
    pub expected_version: i64,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderClaimReviewFilter {
    pub status: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct DecideOwnerProviderClaimReviewRequest {
    pub action: String,
    pub expected_version: i64,
    pub reason_code: Option<String>,
    pub evidence_reference: Option<String>,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct AppealOwnerProviderOrganizationClaimRequest {
    pub token: String,
    pub expected_version: i64,
    pub category: String,
    pub evidence_reference: String,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct IssueOwnerProviderResponseCapabilityRequest {
    pub token: String,
    pub withheld_categories_acknowledged: bool,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderResponseCapabilityRecord {
    pub capability_id: String,
    pub invitation_id: String,
    pub claim_id: String,
    pub organization_id: String,
    pub brief_version: i64,
    pub purpose: String,
    pub allowed_actions: Vec<String>,
    pub withheld_categories: Vec<String>,
    pub status: String,
    pub expires_at_epoch_seconds: i64,
    pub version: i64,
    pub opportunity_response_capability: bool,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderClaimReviewRecord {
    pub claim_id: String,
    pub claim_kind: String,
    pub proposed_display_name: String,
    pub status: String,
    pub reason_code: Option<String>,
    pub assigned_function: Option<String>,
    pub version: i64,
    pub age_band: String,
    pub updated_at_epoch_seconds: i64,
    pub opportunity_response_capability: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderClaimReviewMetrics {
    pub generated_at_epoch_seconds: i64,
    pub duplicate_review_count: i64,
    pub under_review_count: i64,
    pub disputed_count: i64,
    pub due_count: i64,
    pub overdue_count: i64,
    pub priority_count: i64,
    pub oldest_age_seconds: Option<i64>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderOrganizationClaimRecord {
    pub claim_id: String,
    pub invitation_id: String,
    pub claim_kind: String,
    pub proposed_display_name: String,
    pub organization_id: Option<String>,
    pub status: String,
    pub assigned_function: Option<String>,
    pub version: i64,
    pub organization_relationship_checked: bool,
    pub opportunity_response_capability: bool,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderInvitationRecipientEntry {
    pub invitation_id: String,
    pub status: String,
    pub can_review_limited_request: bool,
    pub provider_name: Option<String>,
    pub owner_name: Option<String>,
    pub coarse_area: Option<String>,
    pub care_goals: Vec<String>,
    pub cadence: Option<String>,
    pub recipient_email_hint: Option<String>,
    pub still_private_categories: Vec<String>,
    pub recipient_email_checked: bool,
    pub organization_relationship_checked: bool,
    pub opportunity_response_capability: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderInvitationRecord {
    pub invitation_id: String,
    pub owner_user_id: String,
    pub property_id: String,
    pub brief_id: String,
    pub brief_version: i64,
    pub provider_name: String,
    pub recipient_business_email: String,
    pub purpose: String,
    pub owner_name_snapshot: String,
    pub coarse_area_snapshot: String,
    pub care_goals_snapshot: Vec<String>,
    pub cadence_snapshot: String,
    pub status: String,
    pub expires_at_epoch_seconds: i64,
    pub delivery_status: String,
    pub delivery_attempt_count: i32,
    pub persisted: bool,
}

pub struct OwnerProviderInvitationCreation {
    pub invitation: OwnerProviderInvitationRecord,
    delivery_token: String,
}

impl OwnerProviderInvitationCreation {
    pub fn delivery_token(&self) -> &str {
        &self.delivery_token
    }
}

impl fmt::Debug for OwnerProviderInvitationCreation {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("OwnerProviderInvitationCreation")
            .field("invitation", &self.invitation)
            .field("delivery_token", &"[REDACTED]")
            .finish()
    }
}

#[derive(Debug)]
pub enum OwnerProviderInvitationCreateResult {
    Created(OwnerProviderInvitationCreation),
    Replayed(OwnerProviderInvitationRecord),
    NotFound,
    Conflict,
    Suppressed,
    Unavailable,
}

#[derive(Debug)]
pub enum OwnerProviderInvitationRetryResult {
    Created(OwnerProviderInvitationCreation),
    Replayed(OwnerProviderInvitationRecord),
    NotFound,
    InvalidState(OwnerProviderInvitationRecord),
    Suppressed,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderInvitationMutationResult {
    Saved(OwnerProviderInvitationRecord),
    NotFound,
    InvalidState(OwnerProviderInvitationRecord),
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderInvitationExpiryResult {
    Completed(usize),
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderInvitationDeliveryResult {
    Saved(OwnerProviderInvitationRecord),
    NotFound,
    Invalid,
    InvalidState(OwnerProviderInvitationRecord),
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderInvitationAbuseReportResult {
    Created(OwnerProviderInvitationAbuseReportRecord),
    Replayed(OwnerProviderInvitationAbuseReportRecord),
    NotFound,
    Invalid,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderInvitationPreviewResult {
    Opened(OwnerProviderInvitationRecipientEntry),
    Closed(OwnerProviderInvitationRecipientEntry),
    NotReady,
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderInvitationRecipientCheckResult {
    Checked(OwnerProviderInvitationRecipientEntry),
    Replayed(OwnerProviderInvitationRecipientEntry),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderOrganizationOptionsResult {
    Loaded(Vec<OwnerProviderOrganizationOption>),
    NotFound,
    InvalidState,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderOrganizationClaimResult {
    Created(OwnerProviderOrganizationClaimRecord),
    Replayed(OwnerProviderOrganizationClaimRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderOrganizationBootstrapResult {
    Bootstrapped(OwnerProviderOrganizationClaimRecord),
    Replayed(OwnerProviderOrganizationClaimRecord),
    DuplicateReview(OwnerProviderOrganizationClaimRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderClaimReviewListResult {
    Loaded(Vec<OwnerProviderClaimReviewRecord>),
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderClaimReviewMetricsResult {
    Loaded(OwnerProviderClaimReviewMetrics),
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderClaimReviewDecisionResult {
    Updated(OwnerProviderClaimReviewRecord),
    Replayed(OwnerProviderClaimReviewRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderClaimAppealResult {
    Submitted(OwnerProviderClaimReviewRecord),
    Replayed(OwnerProviderClaimReviewRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderResponseCapabilityResult {
    Issued(OwnerProviderResponseCapabilityRecord),
    Replayed(OwnerProviderResponseCapabilityRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerReadResult<T> {
    Loaded(T),
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerMutationResult<T> {
    Saved(T),
    NotFound,
    Duplicate,
    Unavailable,
}

#[derive(Default)]
struct LocalOwnerState {
    workspaces: HashMap<String, OwnerWorkspaceRecord>,
    properties: HashMap<String, OwnerPropertyRecord>,
    yard_briefs: HashMap<String, Vec<OwnerYardBriefRecord>>,
    intake_media: HashMap<String, OwnerIntakeMediaRecord>,
    provider_invitations: HashMap<String, LocalOwnerProviderInvitation>,
    provider_recipient_suppressions: HashSet<String>,
    provider_abuse_reports: HashMap<String, LocalOwnerProviderAbuseReport>,
    provider_recipient_checks: HashMap<String, LocalOwnerProviderRecipientCheck>,
    provider_organization_claims: HashMap<String, LocalOwnerProviderOrganizationClaim>,
}

struct LocalOwnerProviderInvitation {
    record: OwnerProviderInvitationRecord,
    _token_hash: String,
    idempotency_key: String,
    delivery_idempotency_keys: HashSet<String>,
}

struct LocalOwnerProviderAbuseReport {
    record: OwnerProviderInvitationAbuseReportRecord,
    reporter_user_id: String,
    idempotency_key: String,
}

struct LocalOwnerProviderRecipientCheck {
    recipient_user_id: String,
    verified_email_fingerprint: String,
}

struct LocalOwnerProviderOrganizationClaim {
    record: OwnerProviderOrganizationClaimRecord,
    actor_user_id: String,
    idempotency_key: String,
    bootstrap_idempotency_key: Option<String>,
}

#[derive(Clone, Default)]
pub struct OwnerAcquisitionRepository {
    pool: Option<PgPool>,
    local: Arc<RwLock<LocalOwnerState>>,
}

impl OwnerAcquisitionRepository {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn from_pool(pool: PgPool) -> Self {
        Self {
            pool: Some(pool),
            local: Arc::default(),
        }
    }

    pub async fn get_workspace(
        &self,
        owner_user_id: &str,
    ) -> OwnerReadResult<OwnerWorkspaceRecord> {
        let Some(pool) = &self.pool else {
            return self
                .local
                .read()
                .await
                .workspaces
                .get(owner_user_id)
                .cloned()
                .map(OwnerReadResult::Loaded)
                .unwrap_or(OwnerReadResult::NotFound);
        };

        match sqlx::query(
            "SELECT owner_user_id, verified_email, display_name, status
             FROM owner_workspaces
             WHERE owner_user_id = $1",
        )
        .bind(owner_user_id)
        .fetch_optional(pool)
        .await
        {
            Ok(Some(row)) => OwnerReadResult::Loaded(workspace_from_row(&row, true)),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, "owner workspace read failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn save_workspace(
        &self,
        owner_user_id: &str,
        verified_email: &str,
        request: SaveOwnerWorkspaceRequest,
    ) -> OwnerMutationResult<OwnerWorkspaceRecord> {
        let record = OwnerWorkspaceRecord {
            owner_user_id: owner_user_id.to_string(),
            verified_email: normalize_email(verified_email),
            display_name: request.display_name.trim().to_string(),
            status: "active".to_string(),
            persisted: self.pool.is_some(),
        };
        let Some(pool) = &self.pool else {
            self.local
                .write()
                .await
                .workspaces
                .insert(owner_user_id.to_string(), record.clone());
            return OwnerMutationResult::Saved(record);
        };

        match save_workspace(pool, &record).await {
            Ok(saved) => OwnerMutationResult::Saved(saved),
            Err(error) => {
                tracing::error!(%error, owner_user_id, "owner workspace save failed");
                OwnerMutationResult::Unavailable
            }
        }
    }

    pub async fn list_properties(
        &self,
        owner_user_id: &str,
    ) -> OwnerReadResult<Vec<OwnerPropertyRecord>> {
        let Some(pool) = &self.pool else {
            let mut properties: Vec<_> = self
                .local
                .read()
                .await
                .properties
                .values()
                .filter(|property| property.owner_user_id == owner_user_id)
                .cloned()
                .collect();
            properties.sort_by(|left, right| left.display_name.cmp(&right.display_name));
            return OwnerReadResult::Loaded(properties);
        };

        match sqlx::query(
            "SELECT id, owner_user_id, display_name, address_line_1, address_line_2,
                    city, region, postal_code, country_code, coarse_area,
                    address_status, authority_attested_at IS NOT NULL AS authority_attested,
                    status, version
             FROM owner_properties
             WHERE owner_user_id = $1
             ORDER BY updated_at DESC, id",
        )
        .bind(owner_user_id)
        .fetch_all(pool)
        .await
        {
            Ok(rows) => OwnerReadResult::Loaded(
                rows.iter()
                    .map(|row| property_from_row(row, true))
                    .collect(),
            ),
            Err(error) => {
                tracing::error!(%error, owner_user_id, "owner property list failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn get_property(
        &self,
        owner_user_id: &str,
        property_id: &str,
    ) -> OwnerReadResult<OwnerPropertyRecord> {
        let Some(pool) = &self.pool else {
            return self
                .local
                .read()
                .await
                .properties
                .get(property_id)
                .filter(|property| property.owner_user_id == owner_user_id)
                .cloned()
                .map(OwnerReadResult::Loaded)
                .unwrap_or(OwnerReadResult::NotFound);
        };

        match sqlx::query(
            "SELECT id, owner_user_id, display_name, address_line_1, address_line_2,
                    city, region, postal_code, country_code, coarse_area,
                    address_status, authority_attested_at IS NOT NULL AS authority_attested,
                    status, version
             FROM owner_properties
             WHERE owner_user_id = $1 AND id = $2",
        )
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(pool)
        .await
        {
            Ok(Some(row)) => OwnerReadResult::Loaded(property_from_row(&row, true)),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner property read failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn create_property(
        &self,
        owner_user_id: &str,
        request: CreateOwnerPropertyRequest,
    ) -> OwnerMutationResult<OwnerPropertyRecord> {
        let property = normalized_property(owner_user_id, request, self.pool.is_some());
        let fingerprint = address_fingerprint(&property);
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            if !local.workspaces.contains_key(owner_user_id) {
                return OwnerMutationResult::NotFound;
            }
            if local.properties.values().any(|existing| {
                existing.owner_user_id == owner_user_id
                    && existing.status != "archived"
                    && address_fingerprint(existing) == fingerprint
            }) {
                return OwnerMutationResult::Duplicate;
            }
            local
                .properties
                .insert(property.property_id.clone(), property.clone());
            return OwnerMutationResult::Saved(property);
        };

        match create_property(pool, &property, &fingerprint).await {
            Ok(saved) => OwnerMutationResult::Saved(saved),
            Err(error) if is_unique_violation(&error) => OwnerMutationResult::Duplicate,
            Err(error) if is_foreign_key_violation(&error) => OwnerMutationResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, "owner property creation failed");
                OwnerMutationResult::Unavailable
            }
        }
    }

    pub async fn get_latest_yard_brief(
        &self,
        owner_user_id: &str,
        property_id: &str,
    ) -> OwnerReadResult<OwnerYardBriefRecord> {
        let Some(pool) = &self.pool else {
            let local = self.local.read().await;
            if !local
                .properties
                .get(property_id)
                .is_some_and(|property| property.owner_user_id == owner_user_id)
            {
                return OwnerReadResult::NotFound;
            }
            return local
                .yard_briefs
                .get(property_id)
                .and_then(|versions| versions.last())
                .cloned()
                .map(OwnerReadResult::Loaded)
                .unwrap_or(OwnerReadResult::NotFound);
        };

        match sqlx::query(
            "SELECT id, owner_user_id, property_id, version, status, yard_areas,
                    care_goals, cadence_preference, considerations, author_source
             FROM owner_yard_briefs
             WHERE owner_user_id = $1 AND property_id = $2
             ORDER BY version DESC
             LIMIT 1",
        )
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(pool)
        .await
        {
            Ok(Some(row)) => OwnerReadResult::Loaded(yard_brief_from_row(&row, true)),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner yard brief read failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn save_yard_brief(
        &self,
        owner_user_id: &str,
        property_id: &str,
        request: SaveOwnerYardBriefRequest,
    ) -> OwnerMutationResult<OwnerYardBriefRecord> {
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            if !local
                .properties
                .get(property_id)
                .is_some_and(|property| property.owner_user_id == owner_user_id)
            {
                return OwnerMutationResult::NotFound;
            }
            let versions = local
                .yard_briefs
                .entry(property_id.to_string())
                .or_default();
            let record = normalized_yard_brief(
                owner_user_id,
                property_id,
                versions.len() as i64 + 1,
                request,
                false,
            );
            versions.push(record.clone());
            return OwnerMutationResult::Saved(record);
        };

        match save_yard_brief(pool, owner_user_id, property_id, request).await {
            Ok(Some(saved)) => OwnerMutationResult::Saved(saved),
            Ok(None) => OwnerMutationResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner yard brief save failed");
                OwnerMutationResult::Unavailable
            }
        }
    }

    pub async fn list_intake_media(
        &self,
        owner_user_id: &str,
        property_id: &str,
    ) -> OwnerReadResult<Vec<OwnerIntakeMediaRecord>> {
        let Some(pool) = &self.pool else {
            let local = self.local.read().await;
            if !local
                .properties
                .get(property_id)
                .is_some_and(|property| property.owner_user_id == owner_user_id)
            {
                return OwnerReadResult::NotFound;
            }
            let mut media: Vec<_> = local
                .intake_media
                .values()
                .filter(|media| {
                    media.owner_user_id == owner_user_id
                        && media.property_id == property_id
                        && media.status != "deleted"
                })
                .cloned()
                .collect();
            media.sort_by(|left, right| left.media_id.cmp(&right.media_id));
            return OwnerReadResult::Loaded(media);
        };

        match list_intake_media(pool, owner_user_id, property_id).await {
            Ok(Some(media)) => OwnerReadResult::Loaded(media),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner intake media list failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn create_intake_media_upload(
        &self,
        owner_user_id: &str,
        property_id: &str,
        request: CreateOwnerIntakeMediaRequest,
    ) -> OwnerMutationResult<OwnerIntakeMediaUploadRecord> {
        let upload_nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0);
        let safe_file_name = safe_media_file_name(&request.file_name);
        let storage_ticket = PhotoStorageConfig::from_env().owner_intake_upload_ticket(
            owner_user_id,
            property_id,
            &request.shot_type,
            upload_nonce,
            &safe_file_name,
            &request.content_type,
        );

        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            if !local
                .properties
                .get(property_id)
                .is_some_and(|property| property.owner_user_id == owner_user_id)
            {
                return OwnerMutationResult::NotFound;
            }
            let Some(brief_id) = local
                .yard_briefs
                .get(property_id)
                .and_then(|versions| versions.last())
                .filter(|brief| brief.status == "ready")
                .map(|brief| brief.brief_id.clone())
            else {
                return OwnerMutationResult::NotFound;
            };
            if request.replaces_media_id.as_ref().is_some_and(|media_id| {
                !local.intake_media.get(media_id).is_some_and(|media| {
                    media.owner_user_id == owner_user_id
                        && media.property_id == property_id
                        && media.status == "ready"
                })
            }) {
                return OwnerMutationResult::NotFound;
            }
            let media = new_owner_intake_media_record(
                owner_user_id,
                property_id,
                &brief_id,
                request,
                &safe_file_name,
                &storage_ticket,
                false,
            );
            local
                .intake_media
                .insert(media.media_id.clone(), media.clone());
            return OwnerMutationResult::Saved(owner_media_upload_record(media, storage_ticket));
        };

        match create_intake_media_upload(
            pool,
            owner_user_id,
            property_id,
            request,
            &safe_file_name,
            storage_ticket,
        )
        .await
        {
            Ok(Some(saved)) => OwnerMutationResult::Saved(saved),
            Ok(None) => OwnerMutationResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner intake media create failed");
                OwnerMutationResult::Unavailable
            }
        }
    }

    pub async fn complete_intake_media_upload(
        &self,
        owner_user_id: &str,
        property_id: &str,
        media_id: &str,
        metadata: PhotoUploadMetadata,
    ) -> OwnerMutationResult<OwnerIntakeMediaRecord> {
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            let Some(existing) = local.intake_media.get(media_id).cloned().filter(|media| {
                media.owner_user_id == owner_user_id && media.property_id == property_id
            }) else {
                return OwnerMutationResult::NotFound;
            };
            if existing.status == "ready" {
                return OwnerMutationResult::Saved(existing);
            }
            if !matches!(existing.status.as_str(), "pending_upload" | "processing") {
                return OwnerMutationResult::NotFound;
            }
            let updated = completed_local_media(existing, metadata);
            if let Some(replaced_id) = updated.replaces_media_id.as_deref() {
                if let Some(replaced) = local.intake_media.get_mut(replaced_id) {
                    replaced.status = "replaced".to_string();
                    replaced.replaced_by_media_id = Some(updated.media_id.clone());
                }
            }
            local
                .intake_media
                .insert(updated.media_id.clone(), updated.clone());
            return OwnerMutationResult::Saved(updated);
        };

        match complete_intake_media_upload(pool, owner_user_id, property_id, media_id, metadata)
            .await
        {
            Ok(Some(saved)) => OwnerMutationResult::Saved(saved),
            Ok(None) => OwnerMutationResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, media_id, "owner intake media completion failed");
                OwnerMutationResult::Unavailable
            }
        }
    }

    pub async fn delete_intake_media(
        &self,
        owner_user_id: &str,
        property_id: &str,
        media_id: &str,
    ) -> OwnerMutationResult<OwnerIntakeMediaRecord> {
        let existing = match self.pool.as_ref() {
            Some(pool) => {
                match get_intake_media(pool, owner_user_id, property_id, media_id).await {
                    Ok(Some(media)) => media,
                    Ok(None) => return OwnerMutationResult::NotFound,
                    Err(error) => {
                        tracing::error!(%error, owner_user_id, property_id, media_id, "owner intake media delete lookup failed");
                        return OwnerMutationResult::Unavailable;
                    }
                }
            }
            None => {
                let local = self.local.read().await;
                let Some(media) = local.intake_media.get(media_id).cloned().filter(|media| {
                    media.owner_user_id == owner_user_id && media.property_id == property_id
                }) else {
                    return OwnerMutationResult::NotFound;
                };
                media
            }
        };
        if existing.status == "deleted" {
            return OwnerMutationResult::Saved(existing);
        }
        let mut object_keys = vec![existing.object_key.clone()];
        if let Some(thumbnail) = existing.thumbnail_object_key.clone() {
            object_keys.push(thumbnail);
        }
        let deletion = PhotoStorageConfig::from_env()
            .delete_objects(&object_keys)
            .await;
        if !deletion.failed_object_keys.is_empty() {
            return OwnerMutationResult::Unavailable;
        }

        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            let media = local
                .intake_media
                .get_mut(media_id)
                .expect("scoped local media was checked before deletion");
            media.status = "deleted".to_string();
            media.display_url = None;
            media.thumbnail_url = None;
            return OwnerMutationResult::Saved(media.clone());
        };
        match mark_intake_media_deleted(pool, owner_user_id, property_id, media_id).await {
            Ok(Some(saved)) => OwnerMutationResult::Saved(saved),
            Ok(None) => OwnerMutationResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, media_id, "owner intake media delete save failed");
                OwnerMutationResult::Unavailable
            }
        }
    }

    pub async fn list_provider_invitations(
        &self,
        owner_user_id: &str,
        property_id: &str,
    ) -> OwnerReadResult<Vec<OwnerProviderInvitationRecord>> {
        let Some(pool) = &self.pool else {
            let local = self.local.read().await;
            if !local
                .properties
                .get(property_id)
                .is_some_and(|property| property.owner_user_id == owner_user_id)
            {
                return OwnerReadResult::NotFound;
            }
            let mut invitations: Vec<_> = local
                .provider_invitations
                .values()
                .filter(|invitation| {
                    invitation.record.owner_user_id == owner_user_id
                        && invitation.record.property_id == property_id
                })
                .map(|invitation| invitation.record.clone())
                .collect();
            invitations.sort_by(|left, right| right.invitation_id.cmp(&left.invitation_id));
            return OwnerReadResult::Loaded(invitations);
        };

        match list_owner_provider_invitations(pool, owner_user_id, property_id).await {
            Ok(Some(invitations)) => OwnerReadResult::Loaded(invitations),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner provider invitation list failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn get_provider_invitation(
        &self,
        owner_user_id: &str,
        property_id: &str,
        invitation_id: &str,
    ) -> OwnerReadResult<OwnerProviderInvitationRecord> {
        let Some(pool) = &self.pool else {
            return self
                .local
                .read()
                .await
                .provider_invitations
                .get(invitation_id)
                .filter(|invitation| {
                    invitation.record.owner_user_id == owner_user_id
                        && invitation.record.property_id == property_id
                })
                .map(|invitation| OwnerReadResult::Loaded(invitation.record.clone()))
                .unwrap_or(OwnerReadResult::NotFound);
        };
        match get_owner_provider_invitation(pool, owner_user_id, property_id, invitation_id).await {
            Ok(Some(invitation)) => OwnerReadResult::Loaded(invitation),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, invitation_id, "owner provider invitation read failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn create_provider_invitation(
        &self,
        owner_user_id: &str,
        property_id: &str,
        request: CreateOwnerProviderInvitationRequest,
    ) -> OwnerProviderInvitationCreateResult {
        let recipient_email = normalize_email(&request.recipient_business_email);
        let recipient_fingerprint = email_fingerprint(&recipient_email);
        let delivery_token = new_owner_provider_invitation_token();
        let token_hash = invitation_token_hash(&delivery_token);

        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            if let Some(existing) = local.provider_invitations.values().find(|invitation| {
                invitation.record.owner_user_id == owner_user_id
                    && invitation.idempotency_key == request.idempotency_key.trim()
            }) {
                return OwnerProviderInvitationCreateResult::Replayed(existing.record.clone());
            }
            let Some(property) = local.properties.get(property_id).filter(|property| {
                property.owner_user_id == owner_user_id && property.status != "archived"
            }) else {
                return OwnerProviderInvitationCreateResult::NotFound;
            };
            let Some(workspace) = local.workspaces.get(owner_user_id) else {
                return OwnerProviderInvitationCreateResult::NotFound;
            };
            let Some(brief) = local
                .yard_briefs
                .get(property_id)
                .and_then(|versions| versions.last())
                .filter(|brief| brief.status == "ready")
            else {
                return OwnerProviderInvitationCreateResult::NotFound;
            };
            if local
                .provider_recipient_suppressions
                .contains(&recipient_fingerprint)
            {
                return OwnerProviderInvitationCreateResult::Suppressed;
            }
            if local.provider_invitations.values().any(|invitation| {
                invitation.record.property_id == property_id
                    && email_fingerprint(&invitation.record.recipient_business_email)
                        == recipient_fingerprint
                    && matches!(
                        invitation.record.status.as_str(),
                        "pending_delivery" | "delivered" | "opened"
                    )
            }) {
                return OwnerProviderInvitationCreateResult::Conflict;
            }
            let expires_at_epoch_seconds =
                current_epoch_seconds().saturating_add(i64::from(request.expires_in_days) * 86_400);
            let record = OwnerProviderInvitationRecord {
                invitation_id: format!("owner_provider_invitation_{}", Uuid::new_v4().simple()),
                owner_user_id: owner_user_id.to_string(),
                property_id: property_id.to_string(),
                brief_id: brief.brief_id.clone(),
                brief_version: brief.version,
                provider_name: request.provider_name.trim().to_string(),
                recipient_business_email: recipient_email,
                purpose: "yard_assessment".to_string(),
                owner_name_snapshot: workspace.display_name.clone(),
                coarse_area_snapshot: property.coarse_area.clone(),
                care_goals_snapshot: brief.care_goals.clone(),
                cadence_snapshot: brief.cadence_preference.clone(),
                status: "pending_delivery".to_string(),
                expires_at_epoch_seconds,
                delivery_status: "pending".to_string(),
                delivery_attempt_count: 1,
                persisted: false,
            };
            local.provider_invitations.insert(
                record.invitation_id.clone(),
                LocalOwnerProviderInvitation {
                    record: record.clone(),
                    _token_hash: token_hash,
                    idempotency_key: request.idempotency_key.trim().to_string(),
                    delivery_idempotency_keys: HashSet::from([format!(
                        "initial:{}",
                        request.idempotency_key.trim()
                    )]),
                },
            );
            return OwnerProviderInvitationCreateResult::Created(OwnerProviderInvitationCreation {
                invitation: record,
                delivery_token,
            });
        };

        match create_owner_provider_invitation(
            pool,
            owner_user_id,
            property_id,
            request,
            &recipient_email,
            &recipient_fingerprint,
            &token_hash,
        )
        .await
        {
            Ok(PersistedInvitationCreateOutcome::Created(invitation)) => {
                OwnerProviderInvitationCreateResult::Created(OwnerProviderInvitationCreation {
                    invitation,
                    delivery_token,
                })
            }
            Ok(PersistedInvitationCreateOutcome::Replayed(invitation)) => {
                OwnerProviderInvitationCreateResult::Replayed(invitation)
            }
            Ok(PersistedInvitationCreateOutcome::NotFound) => {
                OwnerProviderInvitationCreateResult::NotFound
            }
            Ok(PersistedInvitationCreateOutcome::Conflict) => {
                OwnerProviderInvitationCreateResult::Conflict
            }
            Ok(PersistedInvitationCreateOutcome::Suppressed) => {
                OwnerProviderInvitationCreateResult::Suppressed
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderInvitationCreateResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner provider invitation create failed");
                OwnerProviderInvitationCreateResult::Unavailable
            }
        }
    }

    pub async fn revoke_provider_invitation(
        &self,
        owner_user_id: &str,
        property_id: &str,
        invitation_id: &str,
    ) -> OwnerProviderInvitationMutationResult {
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            let Some(invitation) =
                local
                    .provider_invitations
                    .get_mut(invitation_id)
                    .filter(|invitation| {
                        invitation.record.owner_user_id == owner_user_id
                            && invitation.record.property_id == property_id
                    })
            else {
                return OwnerProviderInvitationMutationResult::NotFound;
            };
            if invitation.record.status == "revoked" {
                return OwnerProviderInvitationMutationResult::Saved(invitation.record.clone());
            }
            if invitation.record.expires_at_epoch_seconds <= current_epoch_seconds() {
                invitation.record.status = "expired".to_string();
                return OwnerProviderInvitationMutationResult::InvalidState(
                    invitation.record.clone(),
                );
            }
            if !matches!(
                invitation.record.status.as_str(),
                "pending_delivery" | "delivered" | "opened"
            ) {
                return OwnerProviderInvitationMutationResult::InvalidState(
                    invitation.record.clone(),
                );
            }
            invitation.record.status = "revoked".to_string();
            return OwnerProviderInvitationMutationResult::Saved(invitation.record.clone());
        };

        match revoke_owner_provider_invitation(pool, owner_user_id, property_id, invitation_id)
            .await
        {
            Ok(PersistedInvitationMutationOutcome::Saved(invitation)) => {
                OwnerProviderInvitationMutationResult::Saved(invitation)
            }
            Ok(PersistedInvitationMutationOutcome::NotFound) => {
                OwnerProviderInvitationMutationResult::NotFound
            }
            Ok(PersistedInvitationMutationOutcome::InvalidState(invitation)) => {
                OwnerProviderInvitationMutationResult::InvalidState(invitation)
            }
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, invitation_id, "owner provider invitation revoke failed");
                OwnerProviderInvitationMutationResult::Unavailable
            }
        }
    }

    pub async fn retry_provider_invitation(
        &self,
        owner_user_id: &str,
        property_id: &str,
        invitation_id: &str,
        request: RetryOwnerProviderInvitationRequest,
    ) -> OwnerProviderInvitationRetryResult {
        let delivery_token = new_owner_provider_invitation_token();
        let token_hash = invitation_token_hash(&delivery_token);
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            let Some(existing) =
                local
                    .provider_invitations
                    .get(invitation_id)
                    .filter(|invitation| {
                        invitation.record.owner_user_id == owner_user_id
                            && invitation.record.property_id == property_id
                    })
            else {
                return OwnerProviderInvitationRetryResult::NotFound;
            };
            if existing
                .delivery_idempotency_keys
                .contains(request.idempotency_key.trim())
            {
                return OwnerProviderInvitationRetryResult::Replayed(existing.record.clone());
            }
            if existing.record.status != "failed" {
                return OwnerProviderInvitationRetryResult::InvalidState(existing.record.clone());
            }
            let recipient_fingerprint =
                email_fingerprint(&existing.record.recipient_business_email);
            if local
                .provider_recipient_suppressions
                .contains(&recipient_fingerprint)
            {
                return OwnerProviderInvitationRetryResult::Suppressed;
            }
            let Some(invitation) = local.provider_invitations.get_mut(invitation_id) else {
                return OwnerProviderInvitationRetryResult::NotFound;
            };
            invitation.record.status = "pending_delivery".to_string();
            invitation.record.delivery_status = "pending".to_string();
            invitation.record.delivery_attempt_count += 1;
            invitation.record.expires_at_epoch_seconds =
                current_epoch_seconds().saturating_add(i64::from(request.expires_in_days) * 86_400);
            invitation._token_hash = token_hash;
            invitation
                .delivery_idempotency_keys
                .insert(request.idempotency_key.trim().to_string());
            return OwnerProviderInvitationRetryResult::Created(OwnerProviderInvitationCreation {
                invitation: invitation.record.clone(),
                delivery_token,
            });
        };

        match retry_owner_provider_invitation(
            pool,
            owner_user_id,
            property_id,
            invitation_id,
            request,
            &token_hash,
        )
        .await
        {
            Ok(PersistedInvitationRetryOutcome::Created(invitation)) => {
                OwnerProviderInvitationRetryResult::Created(OwnerProviderInvitationCreation {
                    invitation,
                    delivery_token,
                })
            }
            Ok(PersistedInvitationRetryOutcome::Replayed(invitation)) => {
                OwnerProviderInvitationRetryResult::Replayed(invitation)
            }
            Ok(PersistedInvitationRetryOutcome::NotFound) => {
                OwnerProviderInvitationRetryResult::NotFound
            }
            Ok(PersistedInvitationRetryOutcome::InvalidState(invitation)) => {
                OwnerProviderInvitationRetryResult::InvalidState(invitation)
            }
            Ok(PersistedInvitationRetryOutcome::Suppressed) => {
                OwnerProviderInvitationRetryResult::Suppressed
            }
            Err(error) if is_unique_violation(&error) => {
                tracing::error!(%error, owner_user_id, property_id, invitation_id, "owner provider invitation retry idempotency race");
                OwnerProviderInvitationRetryResult::Unavailable
            }
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, invitation_id, "owner provider invitation retry failed");
                OwnerProviderInvitationRetryResult::Unavailable
            }
        }
    }

    pub async fn record_provider_invitation_delivery(
        &self,
        invitation_id: &str,
        attempt_number: i32,
        request: RecordOwnerProviderInvitationDeliveryRequest,
    ) -> OwnerProviderInvitationDeliveryResult {
        if !validate_provider_invitation_delivery_request(&request) || attempt_number <= 0 {
            return OwnerProviderInvitationDeliveryResult::Invalid;
        }
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            let Some(invitation) = local.provider_invitations.get_mut(invitation_id) else {
                return OwnerProviderInvitationDeliveryResult::NotFound;
            };
            if invitation.record.delivery_attempt_count != attempt_number
                || invitation.record.delivery_status != "pending"
                || invitation.record.status != "pending_delivery"
            {
                return OwnerProviderInvitationDeliveryResult::InvalidState(
                    invitation.record.clone(),
                );
            }
            invitation.record.delivery_status = request.outcome.clone();
            invitation.record.status = request.outcome;
            return OwnerProviderInvitationDeliveryResult::Saved(invitation.record.clone());
        };
        match record_owner_provider_invitation_delivery(
            pool,
            invitation_id,
            attempt_number,
            request,
        )
        .await
        {
            Ok(PersistedInvitationMutationOutcome::Saved(invitation)) => {
                OwnerProviderInvitationDeliveryResult::Saved(invitation)
            }
            Ok(PersistedInvitationMutationOutcome::NotFound) => {
                OwnerProviderInvitationDeliveryResult::NotFound
            }
            Ok(PersistedInvitationMutationOutcome::InvalidState(invitation)) => {
                OwnerProviderInvitationDeliveryResult::InvalidState(invitation)
            }
            Err(error) => {
                tracing::error!(%error, invitation_id, attempt_number, "owner provider invitation delivery outcome failed");
                OwnerProviderInvitationDeliveryResult::Unavailable
            }
        }
    }

    pub async fn expire_provider_invitations(
        &self,
        limit: i64,
    ) -> OwnerProviderInvitationExpiryResult {
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            let now = current_epoch_seconds();
            let mut expired = 0usize;
            for invitation in local.provider_invitations.values_mut() {
                if expired >= limit.max(1) as usize {
                    break;
                }
                if invitation.record.expires_at_epoch_seconds <= now
                    && matches!(
                        invitation.record.status.as_str(),
                        "pending_delivery" | "delivered" | "opened"
                    )
                {
                    invitation.record.status = "expired".to_string();
                    if invitation.record.delivery_status == "pending" {
                        invitation.record.delivery_status = "suppressed".to_string();
                    }
                    expired += 1;
                }
            }
            return OwnerProviderInvitationExpiryResult::Completed(expired);
        };
        match expire_owner_provider_invitations(pool, limit.clamp(1, 500)).await {
            Ok(expired) => OwnerProviderInvitationExpiryResult::Completed(expired),
            Err(error) => {
                tracing::error!(%error, "owner provider invitation expiry sweep failed");
                OwnerProviderInvitationExpiryResult::Unavailable
            }
        }
    }

    pub async fn opt_out_provider_invitation(
        &self,
        verified_email: &str,
        token: &str,
    ) -> OwnerProviderInvitationMutationResult {
        let normalized_email = normalize_email(verified_email);
        let token_hash = invitation_token_hash(token);
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            let invitation_id = local
                .provider_invitations
                .iter()
                .find(|(_, invitation)| {
                    invitation._token_hash == token_hash
                        && invitation.record.recipient_business_email == normalized_email
                })
                .map(|(id, _)| id.clone());
            let Some(invitation_id) = invitation_id else {
                return OwnerProviderInvitationMutationResult::NotFound;
            };
            let recipient_fingerprint;
            {
                let invitation = local
                    .provider_invitations
                    .get_mut(&invitation_id)
                    .expect("matched local invitation should remain available");
                if invitation.record.status == "opted_out" {
                    return OwnerProviderInvitationMutationResult::Saved(invitation.record.clone());
                }
                if invitation.record.expires_at_epoch_seconds <= current_epoch_seconds() {
                    invitation.record.status = "expired".to_string();
                    return OwnerProviderInvitationMutationResult::InvalidState(
                        invitation.record.clone(),
                    );
                }
                if !matches!(
                    invitation.record.status.as_str(),
                    "pending_delivery" | "delivered" | "opened"
                ) {
                    return OwnerProviderInvitationMutationResult::InvalidState(
                        invitation.record.clone(),
                    );
                }
                invitation.record.status = "opted_out".to_string();
                if invitation.record.delivery_status == "pending" {
                    invitation.record.delivery_status = "suppressed".to_string();
                }
                recipient_fingerprint =
                    email_fingerprint(&invitation.record.recipient_business_email);
            }
            local
                .provider_recipient_suppressions
                .insert(recipient_fingerprint);
            let record = local
                .provider_invitations
                .get(&invitation_id)
                .map(|invitation| invitation.record.clone())
                .expect("opted-out local invitation should remain available");
            return OwnerProviderInvitationMutationResult::Saved(record);
        };
        match opt_out_owner_provider_invitation(pool, &normalized_email, &token_hash).await {
            Ok(PersistedInvitationMutationOutcome::Saved(invitation)) => {
                OwnerProviderInvitationMutationResult::Saved(invitation)
            }
            Ok(PersistedInvitationMutationOutcome::NotFound) => {
                OwnerProviderInvitationMutationResult::NotFound
            }
            Ok(PersistedInvitationMutationOutcome::InvalidState(invitation)) => {
                OwnerProviderInvitationMutationResult::InvalidState(invitation)
            }
            Err(error) => {
                tracing::error!(%error, "owner provider invitation opt-out failed");
                OwnerProviderInvitationMutationResult::Unavailable
            }
        }
    }

    pub async fn report_provider_invitation_abuse(
        &self,
        reporter_user_id: &str,
        verified_email: &str,
        request: ReportOwnerProviderInvitationAbuseRequest,
    ) -> OwnerProviderInvitationAbuseReportResult {
        if !validate_provider_invitation_abuse_report_request(&request) {
            return OwnerProviderInvitationAbuseReportResult::Invalid;
        }
        let normalized_email = normalize_email(verified_email);
        let token_hash = invitation_token_hash(request.token.trim());
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            if let Some(existing) = local.provider_abuse_reports.values().find(|report| {
                report.reporter_user_id == reporter_user_id
                    && report.idempotency_key == request.idempotency_key.trim()
            }) {
                return OwnerProviderInvitationAbuseReportResult::Replayed(existing.record.clone());
            }
            let invitation_id = local
                .provider_invitations
                .iter()
                .find(|(_, invitation)| {
                    invitation._token_hash == token_hash
                        && invitation.record.recipient_business_email == normalized_email
                })
                .map(|(id, _)| id.clone());
            let Some(invitation_id) = invitation_id else {
                return OwnerProviderInvitationAbuseReportResult::NotFound;
            };
            if local.provider_abuse_reports.values().any(|report| {
                report.reporter_user_id == reporter_user_id
                    && report.record.invitation_id == invitation_id
            }) {
                return OwnerProviderInvitationAbuseReportResult::Conflict;
            }
            let recipient_fingerprint;
            {
                let Some(invitation) = local.provider_invitations.get_mut(&invitation_id) else {
                    return OwnerProviderInvitationAbuseReportResult::NotFound;
                };
                recipient_fingerprint =
                    email_fingerprint(&invitation.record.recipient_business_email);
                if matches!(
                    invitation.record.status.as_str(),
                    "pending_delivery" | "delivered" | "opened"
                ) {
                    invitation.record.status = "opted_out".to_string();
                }
                if invitation.record.delivery_status == "pending" {
                    invitation.record.delivery_status = "suppressed".to_string();
                }
            }
            local
                .provider_recipient_suppressions
                .insert(recipient_fingerprint);
            let record = OwnerProviderInvitationAbuseReportRecord {
                report_id: format!("owner_provider_abuse_{}", Uuid::new_v4().simple()),
                invitation_id,
                category: request.category.clone(),
                severity: abuse_report_severity(&request.category).to_string(),
                assigned_function: "trust_and_safety".to_string(),
                status: "submitted".to_string(),
                block_future_invitations: true,
                persisted: false,
            };
            local.provider_abuse_reports.insert(
                record.report_id.clone(),
                LocalOwnerProviderAbuseReport {
                    record: record.clone(),
                    reporter_user_id: reporter_user_id.to_string(),
                    idempotency_key: request.idempotency_key.trim().to_string(),
                },
            );
            return OwnerProviderInvitationAbuseReportResult::Created(record);
        };
        match report_owner_provider_invitation_abuse(
            pool,
            reporter_user_id,
            &normalized_email,
            request,
            &token_hash,
        )
        .await
        {
            Ok(PersistedAbuseReportOutcome::Created(report)) => {
                OwnerProviderInvitationAbuseReportResult::Created(report)
            }
            Ok(PersistedAbuseReportOutcome::Replayed(report)) => {
                OwnerProviderInvitationAbuseReportResult::Replayed(report)
            }
            Ok(PersistedAbuseReportOutcome::NotFound) => {
                OwnerProviderInvitationAbuseReportResult::NotFound
            }
            Ok(PersistedAbuseReportOutcome::Conflict) => {
                OwnerProviderInvitationAbuseReportResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderInvitationAbuseReportResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, reporter_user_id, "owner provider invitation abuse report failed");
                OwnerProviderInvitationAbuseReportResult::Unavailable
            }
        }
    }

    pub async fn preview_provider_invitation(
        &self,
        token: &str,
    ) -> OwnerProviderInvitationPreviewResult {
        let token_hash = invitation_token_hash(token);
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            let invitation = local
                .provider_invitations
                .values_mut()
                .find(|invitation| invitation._token_hash == token_hash);
            let Some(invitation) = invitation else {
                return OwnerProviderInvitationPreviewResult::NotFound;
            };
            if invitation.record.expires_at_epoch_seconds <= current_epoch_seconds()
                && matches!(
                    invitation.record.status.as_str(),
                    "pending_delivery" | "delivered" | "opened"
                )
            {
                invitation.record.status = "expired".to_string();
                invitation.record.delivery_status =
                    if invitation.record.delivery_status == "pending" {
                        "suppressed".to_string()
                    } else {
                        invitation.record.delivery_status.clone()
                    };
            }
            if invitation.record.status == "pending_delivery" {
                return OwnerProviderInvitationPreviewResult::NotReady;
            }
            if invitation.record.status == "delivered" {
                invitation.record.status = "opened".to_string();
            }
            if invitation.record.status == "opened" {
                return OwnerProviderInvitationPreviewResult::Opened(
                    recipient_entry_from_invitation(&invitation.record, true),
                );
            }
            return OwnerProviderInvitationPreviewResult::Closed(recipient_entry_from_invitation(
                &invitation.record,
                false,
            ));
        };
        match preview_owner_provider_invitation(pool, &token_hash).await {
            Ok(PersistedInvitationPreviewOutcome::Opened(invitation)) => {
                OwnerProviderInvitationPreviewResult::Opened(invitation)
            }
            Ok(PersistedInvitationPreviewOutcome::Closed(invitation)) => {
                OwnerProviderInvitationPreviewResult::Closed(invitation)
            }
            Ok(PersistedInvitationPreviewOutcome::NotReady) => {
                OwnerProviderInvitationPreviewResult::NotReady
            }
            Ok(PersistedInvitationPreviewOutcome::NotFound) => {
                OwnerProviderInvitationPreviewResult::NotFound
            }
            Err(error) => {
                tracing::error!(%error, "owner provider invitation preview failed");
                OwnerProviderInvitationPreviewResult::Unavailable
            }
        }
    }

    pub async fn verify_provider_invitation_recipient(
        &self,
        recipient_user_id: &str,
        verified_email: &str,
        token: &str,
    ) -> OwnerProviderInvitationRecipientCheckResult {
        let normalized_email = normalize_email(verified_email);
        let email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(token);
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            let invitation_id = local
                .provider_invitations
                .iter()
                .find(|(_, invitation)| {
                    invitation._token_hash == token_hash
                        && invitation.record.recipient_business_email == normalized_email
                })
                .map(|(id, _)| id.clone());
            let Some(invitation_id) = invitation_id else {
                return OwnerProviderInvitationRecipientCheckResult::NotFound;
            };
            let Some(invitation) = local.provider_invitations.get(&invitation_id) else {
                return OwnerProviderInvitationRecipientCheckResult::NotFound;
            };
            if invitation.record.status != "opened" {
                return OwnerProviderInvitationRecipientCheckResult::InvalidState;
            }
            if let Some(existing) = local.provider_recipient_checks.get(&invitation_id) {
                if existing.recipient_user_id != recipient_user_id
                    || existing.verified_email_fingerprint != email_fingerprint
                {
                    return OwnerProviderInvitationRecipientCheckResult::Conflict;
                }
                let mut entry = recipient_entry_from_invitation(&invitation.record, true);
                entry.recipient_email_checked = true;
                return OwnerProviderInvitationRecipientCheckResult::Replayed(entry);
            }
            let mut entry = recipient_entry_from_invitation(&invitation.record, true);
            entry.recipient_email_checked = true;
            local.provider_recipient_checks.insert(
                invitation_id,
                LocalOwnerProviderRecipientCheck {
                    recipient_user_id: recipient_user_id.to_string(),
                    verified_email_fingerprint: email_fingerprint,
                },
            );
            return OwnerProviderInvitationRecipientCheckResult::Checked(entry);
        };
        match verify_owner_provider_invitation_recipient(
            pool,
            recipient_user_id,
            &normalized_email,
            &email_fingerprint,
            &token_hash,
        )
        .await
        {
            Ok(PersistedRecipientCheckOutcome::Checked(entry)) => {
                OwnerProviderInvitationRecipientCheckResult::Checked(entry)
            }
            Ok(PersistedRecipientCheckOutcome::Replayed(entry)) => {
                OwnerProviderInvitationRecipientCheckResult::Replayed(entry)
            }
            Ok(PersistedRecipientCheckOutcome::NotFound) => {
                OwnerProviderInvitationRecipientCheckResult::NotFound
            }
            Ok(PersistedRecipientCheckOutcome::InvalidState) => {
                OwnerProviderInvitationRecipientCheckResult::InvalidState
            }
            Ok(PersistedRecipientCheckOutcome::Conflict) => {
                OwnerProviderInvitationRecipientCheckResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderInvitationRecipientCheckResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, recipient_user_id, "owner provider invitation recipient check failed");
                OwnerProviderInvitationRecipientCheckResult::Unavailable
            }
        }
    }

    pub async fn list_provider_organization_options(
        &self,
        recipient_user_id: &str,
        verified_email: &str,
        token: &str,
    ) -> OwnerProviderOrganizationOptionsResult {
        let normalized_email = normalize_email(verified_email);
        let email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(token);
        let Some(pool) = &self.pool else {
            let local = self.local.read().await;
            let invitation = local.provider_invitations.iter().find(|(_, invitation)| {
                invitation._token_hash == token_hash
                    && invitation.record.recipient_business_email == normalized_email
            });
            let Some((invitation_id, invitation)) = invitation else {
                return OwnerProviderOrganizationOptionsResult::NotFound;
            };
            let checked = local
                .provider_recipient_checks
                .get(invitation_id)
                .is_some_and(|check| {
                    check.recipient_user_id == recipient_user_id
                        && check.verified_email_fingerprint == email_fingerprint
                });
            if invitation.record.status != "opened" || !checked {
                return OwnerProviderOrganizationOptionsResult::InvalidState;
            }
            return OwnerProviderOrganizationOptionsResult::Loaded(Vec::new());
        };
        match list_owner_provider_organization_options(
            pool,
            recipient_user_id,
            &normalized_email,
            &email_fingerprint,
            &token_hash,
        )
        .await
        {
            Ok(PersistedOrganizationOptionsOutcome::Loaded(options)) => {
                OwnerProviderOrganizationOptionsResult::Loaded(options)
            }
            Ok(PersistedOrganizationOptionsOutcome::NotFound) => {
                OwnerProviderOrganizationOptionsResult::NotFound
            }
            Ok(PersistedOrganizationOptionsOutcome::InvalidState) => {
                OwnerProviderOrganizationOptionsResult::InvalidState
            }
            Err(error) => {
                tracing::error!(%error, recipient_user_id, "provider organization options failed");
                OwnerProviderOrganizationOptionsResult::Unavailable
            }
        }
    }

    pub async fn create_provider_organization_claim(
        &self,
        recipient_user_id: &str,
        verified_email: &str,
        request: CreateOwnerProviderOrganizationClaimRequest,
    ) -> OwnerProviderOrganizationClaimResult {
        if !validate_provider_organization_claim_request(&request) {
            return OwnerProviderOrganizationClaimResult::InvalidState;
        }
        let normalized_email = normalize_email(verified_email);
        let email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            let invitation_id = local
                .provider_invitations
                .iter()
                .find(|(_, invitation)| {
                    invitation._token_hash == token_hash
                        && invitation.record.recipient_business_email == normalized_email
                })
                .map(|(id, _)| id.clone());
            let Some(invitation_id) = invitation_id else {
                return OwnerProviderOrganizationClaimResult::NotFound;
            };
            if let Some(existing) = local.provider_organization_claims.values().find(|claim| {
                claim.actor_user_id == recipient_user_id
                    && claim.idempotency_key == request.idempotency_key.trim()
                    && claim.record.invitation_id == invitation_id
            }) {
                return OwnerProviderOrganizationClaimResult::Replayed(existing.record.clone());
            }
            let checked = local
                .provider_recipient_checks
                .get(&invitation_id)
                .is_some_and(|check| {
                    check.recipient_user_id == recipient_user_id
                        && check.verified_email_fingerprint == email_fingerprint
                });
            let active_invitation = local
                .provider_invitations
                .get(&invitation_id)
                .is_some_and(|invitation| invitation.record.status == "opened");
            if !checked || !active_invitation {
                return OwnerProviderOrganizationClaimResult::InvalidState;
            }
            if local.provider_organization_claims.values().any(|claim| {
                claim.record.invitation_id == invitation_id
                    && !matches!(claim.record.status.as_str(), "rejected" | "withdrawn")
            }) {
                return OwnerProviderOrganizationClaimResult::Conflict;
            }
            if request.claim_kind == "existing_relationship" {
                return OwnerProviderOrganizationClaimResult::NotFound;
            }
            let record = OwnerProviderOrganizationClaimRecord {
                claim_id: format!("owner_provider_claim_{}", Uuid::new_v4().simple()),
                invitation_id,
                claim_kind: request.claim_kind,
                proposed_display_name: request
                    .provider_display_name
                    .unwrap_or_default()
                    .trim()
                    .to_string(),
                organization_id: None,
                status: "bootstrap_ready".to_string(),
                assigned_function: None,
                version: 1,
                organization_relationship_checked: false,
                opportunity_response_capability: false,
                persisted: false,
            };
            local.provider_organization_claims.insert(
                record.claim_id.clone(),
                LocalOwnerProviderOrganizationClaim {
                    record: record.clone(),
                    actor_user_id: recipient_user_id.to_string(),
                    idempotency_key: request.idempotency_key.trim().to_string(),
                    bootstrap_idempotency_key: None,
                },
            );
            return OwnerProviderOrganizationClaimResult::Created(record);
        };
        match create_owner_provider_organization_claim(
            pool,
            recipient_user_id,
            &normalized_email,
            &email_fingerprint,
            request,
            &token_hash,
        )
        .await
        {
            Ok(PersistedOrganizationClaimOutcome::Created(claim)) => {
                OwnerProviderOrganizationClaimResult::Created(claim)
            }
            Ok(PersistedOrganizationClaimOutcome::Replayed(claim)) => {
                OwnerProviderOrganizationClaimResult::Replayed(claim)
            }
            Ok(PersistedOrganizationClaimOutcome::NotFound) => {
                OwnerProviderOrganizationClaimResult::NotFound
            }
            Ok(PersistedOrganizationClaimOutcome::InvalidState) => {
                OwnerProviderOrganizationClaimResult::InvalidState
            }
            Ok(PersistedOrganizationClaimOutcome::Conflict) => {
                OwnerProviderOrganizationClaimResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderOrganizationClaimResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, recipient_user_id, "provider organization claim failed");
                OwnerProviderOrganizationClaimResult::Unavailable
            }
        }
    }

    pub async fn bootstrap_provider_organization_claim(
        &self,
        recipient_user_id: &str,
        verified_email: &str,
        claim_id: &str,
        request: BootstrapOwnerProviderOrganizationClaimRequest,
    ) -> OwnerProviderOrganizationBootstrapResult {
        if !validate_provider_organization_bootstrap_request(&request) {
            return OwnerProviderOrganizationBootstrapResult::InvalidState;
        }
        let normalized_email = normalize_email(verified_email);
        let email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        let Some(pool) = &self.pool else {
            let mut local = self.local.write().await;
            let Some(claim) = local.provider_organization_claims.get(claim_id) else {
                return OwnerProviderOrganizationBootstrapResult::NotFound;
            };
            if claim.actor_user_id != recipient_user_id {
                return OwnerProviderOrganizationBootstrapResult::NotFound;
            }
            let replay = claim
                .bootstrap_idempotency_key
                .as_deref()
                .is_some_and(|key| key == request.idempotency_key.trim())
                && claim.record.status == "claimed";
            if replay {
                return OwnerProviderOrganizationBootstrapResult::Replayed(claim.record.clone());
            }
            let invitation_id = claim.record.invitation_id.clone();
            let invitation_valid =
                local
                    .provider_invitations
                    .get(&invitation_id)
                    .is_some_and(|invitation| {
                        invitation._token_hash == token_hash
                            && invitation.record.recipient_business_email == normalized_email
                            && invitation.record.status == "opened"
                    });
            let recipient_valid = local
                .provider_recipient_checks
                .get(&invitation_id)
                .is_some_and(|check| {
                    check.recipient_user_id == recipient_user_id
                        && check.verified_email_fingerprint == email_fingerprint
                });
            if !invitation_valid || !recipient_valid {
                return OwnerProviderOrganizationBootstrapResult::InvalidState;
            }
            if claim.record.claim_kind != "new_organization"
                || claim.record.status != "bootstrap_ready"
            {
                return OwnerProviderOrganizationBootstrapResult::InvalidState;
            }
            if claim.record.version != request.expected_version {
                return OwnerProviderOrganizationBootstrapResult::Conflict;
            }
            let claim = local
                .provider_organization_claims
                .get_mut(claim_id)
                .expect("checked local claim should remain present while locked");
            claim.record.organization_id =
                Some(format!("org_provider_{}", Uuid::new_v4().simple()));
            claim.record.status = "claimed".to_string();
            claim.record.version += 1;
            claim.bootstrap_idempotency_key = Some(request.idempotency_key.trim().to_string());
            return OwnerProviderOrganizationBootstrapResult::Bootstrapped(claim.record.clone());
        };
        match bootstrap_owner_provider_organization_claim(
            pool,
            recipient_user_id,
            &normalized_email,
            &email_fingerprint,
            claim_id,
            request,
            &token_hash,
        )
        .await
        {
            Ok(PersistedOrganizationBootstrapOutcome::Bootstrapped(claim)) => {
                OwnerProviderOrganizationBootstrapResult::Bootstrapped(claim)
            }
            Ok(PersistedOrganizationBootstrapOutcome::Replayed(claim)) => {
                OwnerProviderOrganizationBootstrapResult::Replayed(claim)
            }
            Ok(PersistedOrganizationBootstrapOutcome::DuplicateReview(claim)) => {
                OwnerProviderOrganizationBootstrapResult::DuplicateReview(claim)
            }
            Ok(PersistedOrganizationBootstrapOutcome::NotFound) => {
                OwnerProviderOrganizationBootstrapResult::NotFound
            }
            Ok(PersistedOrganizationBootstrapOutcome::InvalidState) => {
                OwnerProviderOrganizationBootstrapResult::InvalidState
            }
            Ok(PersistedOrganizationBootstrapOutcome::Conflict) => {
                OwnerProviderOrganizationBootstrapResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderOrganizationBootstrapResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, recipient_user_id, claim_id, "provider organization bootstrap failed");
                OwnerProviderOrganizationBootstrapResult::Unavailable
            }
        }
    }

    pub async fn list_provider_organization_claim_reviews(
        &self,
        filter: OwnerProviderClaimReviewFilter,
    ) -> OwnerProviderClaimReviewListResult {
        if !validate_provider_claim_review_filter(&filter) {
            return OwnerProviderClaimReviewListResult::Loaded(Vec::new());
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderClaimReviewListResult::Unavailable;
        };
        match list_owner_provider_organization_claim_reviews(pool, filter.status.as_deref()).await {
            Ok(reviews) => OwnerProviderClaimReviewListResult::Loaded(reviews),
            Err(error) => {
                tracing::error!(%error, "provider organization claim review queue failed");
                OwnerProviderClaimReviewListResult::Unavailable
            }
        }
    }

    pub async fn provider_organization_claim_review_metrics(
        &self,
    ) -> OwnerProviderClaimReviewMetricsResult {
        let Some(pool) = &self.pool else {
            return OwnerProviderClaimReviewMetricsResult::Unavailable;
        };
        match owner_provider_organization_claim_review_metrics(pool).await {
            Ok(metrics) => OwnerProviderClaimReviewMetricsResult::Loaded(metrics),
            Err(error) => {
                tracing::error!(%error, "provider organization claim review metrics failed");
                OwnerProviderClaimReviewMetricsResult::Unavailable
            }
        }
    }

    pub async fn decide_provider_organization_claim_review(
        &self,
        actor_user_id: &str,
        claim_id: &str,
        request: DecideOwnerProviderClaimReviewRequest,
    ) -> OwnerProviderClaimReviewDecisionResult {
        if !validate_provider_claim_review_decision_request(&request) {
            return OwnerProviderClaimReviewDecisionResult::InvalidState;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderClaimReviewDecisionResult::Unavailable;
        };
        match decide_owner_provider_organization_claim_review(
            pool,
            actor_user_id,
            claim_id,
            request,
        )
        .await
        {
            Ok(PersistedClaimReviewDecisionOutcome::Updated(review)) => {
                OwnerProviderClaimReviewDecisionResult::Updated(review)
            }
            Ok(PersistedClaimReviewDecisionOutcome::Replayed(review)) => {
                OwnerProviderClaimReviewDecisionResult::Replayed(review)
            }
            Ok(PersistedClaimReviewDecisionOutcome::NotFound) => {
                OwnerProviderClaimReviewDecisionResult::NotFound
            }
            Ok(PersistedClaimReviewDecisionOutcome::InvalidState) => {
                OwnerProviderClaimReviewDecisionResult::InvalidState
            }
            Ok(PersistedClaimReviewDecisionOutcome::Conflict) => {
                OwnerProviderClaimReviewDecisionResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderClaimReviewDecisionResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, actor_user_id, claim_id, "provider claim review decision failed");
                OwnerProviderClaimReviewDecisionResult::Unavailable
            }
        }
    }

    pub async fn appeal_provider_organization_claim(
        &self,
        recipient_user_id: &str,
        verified_email: &str,
        claim_id: &str,
        request: AppealOwnerProviderOrganizationClaimRequest,
    ) -> OwnerProviderClaimAppealResult {
        if !validate_provider_organization_claim_appeal_request(&request) {
            return OwnerProviderClaimAppealResult::InvalidState;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderClaimAppealResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match appeal_owner_provider_organization_claim(
            pool,
            recipient_user_id,
            &normalized_email,
            &email_fingerprint,
            claim_id,
            request,
            &token_hash,
        )
        .await
        {
            Ok(PersistedClaimAppealOutcome::Submitted(review)) => {
                OwnerProviderClaimAppealResult::Submitted(review)
            }
            Ok(PersistedClaimAppealOutcome::Replayed(review)) => {
                OwnerProviderClaimAppealResult::Replayed(review)
            }
            Ok(PersistedClaimAppealOutcome::NotFound) => OwnerProviderClaimAppealResult::NotFound,
            Ok(PersistedClaimAppealOutcome::InvalidState) => {
                OwnerProviderClaimAppealResult::InvalidState
            }
            Ok(PersistedClaimAppealOutcome::Conflict) => OwnerProviderClaimAppealResult::Conflict,
            Err(error) if is_unique_violation(&error) => OwnerProviderClaimAppealResult::Conflict,
            Err(error) => {
                tracing::error!(%error, recipient_user_id, claim_id, "provider claim appeal failed");
                OwnerProviderClaimAppealResult::Unavailable
            }
        }
    }

    pub async fn issue_provider_response_capability(
        &self,
        recipient_user_id: &str,
        verified_email: &str,
        claim_id: &str,
        request: IssueOwnerProviderResponseCapabilityRequest,
    ) -> OwnerProviderResponseCapabilityResult {
        if !validate_provider_response_capability_request(&request) {
            return OwnerProviderResponseCapabilityResult::InvalidState;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderResponseCapabilityResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match issue_owner_provider_response_capability(
            pool,
            recipient_user_id,
            &normalized_email,
            &email_fingerprint,
            claim_id,
            request,
            &token_hash,
        )
        .await
        {
            Ok(PersistedResponseCapabilityOutcome::Issued(capability)) => {
                OwnerProviderResponseCapabilityResult::Issued(capability)
            }
            Ok(PersistedResponseCapabilityOutcome::Replayed(capability)) => {
                OwnerProviderResponseCapabilityResult::Replayed(capability)
            }
            Ok(PersistedResponseCapabilityOutcome::NotFound) => {
                OwnerProviderResponseCapabilityResult::NotFound
            }
            Ok(PersistedResponseCapabilityOutcome::InvalidState) => {
                OwnerProviderResponseCapabilityResult::InvalidState
            }
            Ok(PersistedResponseCapabilityOutcome::Conflict) => {
                OwnerProviderResponseCapabilityResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderResponseCapabilityResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, recipient_user_id, claim_id, "provider response capability issuance failed");
                OwnerProviderResponseCapabilityResult::Unavailable
            }
        }
    }
}

pub fn validate_workspace_request(request: &SaveOwnerWorkspaceRequest) -> bool {
    let length = request.display_name.trim().chars().count();
    (2..=100).contains(&length)
}

pub fn validate_property_request(request: &CreateOwnerPropertyRequest) -> bool {
    let country = request.country_code.as_deref().unwrap_or("US").trim();
    (2..=100).contains(&request.display_name.trim().chars().count())
        && (5..=200).contains(&request.address_line_1.trim().chars().count())
        && request
            .address_line_2
            .as_deref()
            .is_none_or(|value| value.trim().chars().count() <= 200)
        && (2..=100).contains(&request.city.trim().chars().count())
        && (2..=100).contains(&request.region.trim().chars().count())
        && (3..=20).contains(&request.postal_code.trim().chars().count())
        && country.chars().count() == 2
        && request
            .coarse_area
            .as_deref()
            .is_none_or(|value| value.trim().chars().count() <= 120)
        && matches!(
            request.address_status.as_str(),
            "unconfirmed" | "owner_confirmed"
        )
        && request.authority_attested
}

pub fn validate_yard_brief_request(request: &SaveOwnerYardBriefRequest) -> bool {
    let valid_status = matches!(request.status.as_str(), "draft" | "ready");
    let valid_cadence = matches!(
        request.cadence_preference.as_str(),
        "provider_recommendation" | "one_time" | "weekly" | "every_two_weeks" | "monthly"
    );
    let valid_values = |values: &[String]| {
        values.len() <= 12
            && values.iter().all(|value| {
                let length = value.trim().chars().count();
                (2..=80).contains(&length)
            })
    };
    valid_status
        && valid_cadence
        && valid_values(&request.yard_areas)
        && valid_values(&request.care_goals)
        && request.considerations.trim().chars().count() <= 1_500
        && (request.status == "draft"
            || (!request.yard_areas.is_empty() && !request.care_goals.is_empty()))
}

pub fn validate_intake_media_request(request: &CreateOwnerIntakeMediaRequest) -> bool {
    let content_type = request
        .content_type
        .split(';')
        .next()
        .unwrap_or_default()
        .trim()
        .to_ascii_lowercase();
    (1..=180).contains(&request.file_name.trim().chars().count())
        && matches!(
            content_type.as_str(),
            "image/jpeg" | "image/png" | "image/gif" | "image/webp"
        )
        && matches!(
            request.shot_type.as_str(),
            "front_yard" | "back_yard" | "side_access" | "irrigation_or_concern" | "other"
        )
        && request
            .replaces_media_id
            .as_deref()
            .is_none_or(|value| (3..=180).contains(&value.trim().chars().count()))
}

pub fn validate_provider_invitation_request(
    request: &CreateOwnerProviderInvitationRequest,
) -> bool {
    let provider_name_length = request.provider_name.trim().chars().count();
    let email = request.recipient_business_email.trim();
    let idempotency_key_length = request.idempotency_key.trim().chars().count();
    (2..=160).contains(&provider_name_length)
        && (3..=254).contains(&email.chars().count())
        && !email.chars().any(char::is_whitespace)
        && email
            .split_once('@')
            .is_some_and(|(local, domain)| !local.is_empty() && domain.contains('.'))
        && matches!(request.expires_in_days, 7 | 14 | 30)
        && (8..=128).contains(&idempotency_key_length)
        && request
            .idempotency_key
            .trim()
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_provider_invitation_retry_request(
    request: &RetryOwnerProviderInvitationRequest,
) -> bool {
    let key = request.idempotency_key.trim();
    matches!(request.expires_in_days, 7 | 14 | 30)
        && (8..=128).contains(&key.chars().count())
        && key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_provider_invitation_delivery_request(
    request: &RecordOwnerProviderInvitationDeliveryRequest,
) -> bool {
    matches!(request.outcome.as_str(), "delivered" | "failed")
        && request
            .provider_message_id
            .as_deref()
            .is_none_or(|value| (1..=200).contains(&value.trim().chars().count()))
        && request.failure_code.as_deref().is_none_or(|value| {
            (1..=80).contains(&value.trim().chars().count())
                && value.trim().chars().all(|character| {
                    character.is_ascii_alphanumeric() || matches!(character, '-' | '_')
                })
        })
        && (request.outcome == "delivered" || request.failure_code.is_some())
}

pub fn validate_provider_invitation_opt_out_request(
    request: &OptOutOwnerProviderInvitationRequest,
) -> bool {
    let token = request.token.trim();
    token.starts_with("owner_provider_")
        && (64..=160).contains(&token.chars().count())
        && token
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_provider_invitation_abuse_report_request(
    request: &ReportOwnerProviderInvitationAbuseRequest,
) -> bool {
    let idempotency_key = request.idempotency_key.trim();
    validate_provider_invitation_opt_out_request(&OptOutOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && matches!(
        request.category.as_str(),
        "spam"
            | "harassment"
            | "impersonation"
            | "suspicious_contact"
            | "unsafe_contact"
            | "wrong_recipient"
    ) && request
        .customer_safe_description
        .as_deref()
        .is_none_or(|value| value.trim().chars().count() <= 500)
        && request.block_future_invitations
        && (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_provider_invitation_preview_request(
    request: &PreviewOwnerProviderInvitationRequest,
) -> bool {
    validate_provider_invitation_opt_out_request(&OptOutOwnerProviderInvitationRequest {
        token: request.token.clone(),
    })
}

pub fn validate_provider_invitation_recipient_check_request(
    request: &VerifyOwnerProviderInvitationRecipientRequest,
) -> bool {
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    })
}

pub fn validate_provider_organization_options_request(
    request: &ListOwnerProviderOrganizationOptionsRequest,
) -> bool {
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    })
}

pub fn validate_provider_organization_claim_request(
    request: &CreateOwnerProviderOrganizationClaimRequest,
) -> bool {
    let token_valid =
        validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
            token: request.token.clone(),
        });
    let idempotency_key = request.idempotency_key.trim();
    let idempotency_valid = (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'));
    let claim_valid = match request.claim_kind.as_str() {
        "existing_relationship" => {
            request
                .organization_id
                .as_deref()
                .is_some_and(|value| (3..=180).contains(&value.trim().chars().count()))
                && request.provider_display_name.is_none()
        }
        "new_organization" => {
            request.organization_id.is_none()
                && request
                    .provider_display_name
                    .as_deref()
                    .is_some_and(|value| (2..=160).contains(&value.trim().chars().count()))
                && request.authority_attested
        }
        _ => false,
    };
    token_valid && idempotency_valid && claim_valid
}

pub fn validate_provider_organization_bootstrap_request(
    request: &BootstrapOwnerProviderOrganizationClaimRequest,
) -> bool {
    let idempotency_key = request.idempotency_key.trim();
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && request.expected_version > 0
        && (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_provider_claim_review_filter(filter: &OwnerProviderClaimReviewFilter) -> bool {
    filter
        .status
        .as_deref()
        .is_none_or(|status| matches!(status, "duplicate_review" | "under_review" | "disputed"))
}

pub fn validate_provider_claim_review_decision_request(
    request: &DecideOwnerProviderClaimReviewRequest,
) -> bool {
    let idempotency_key = request.idempotency_key.trim();
    let replay_key_valid = (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'));
    let evidence_valid = request.evidence_reference.as_deref().is_some_and(|value| {
        (8..=240).contains(&value.trim().chars().count())
            && value.chars().all(|character| {
                character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | ':' | '/')
            })
    });
    let action_valid = match request.action.as_str() {
        "review_started" => request.reason_code.is_none() && request.evidence_reference.is_none(),
        "cleared_for_bootstrap" | "appeal_approved" => {
            request.reason_code.as_deref() == Some("distinct_organization") && evidence_valid
        }
        "rejected" | "appeal_rejected" => {
            request.reason_code.as_deref().is_some_and(|reason| {
                matches!(
                    reason,
                    "existing_organization_relationship_required"
                        | "authority_not_supported"
                        | "identity_evidence_incomplete"
                        | "policy_ineligible"
                )
            }) && evidence_valid
        }
        "dispute_paused" => {
            request.reason_code.as_deref().is_some_and(|reason| {
                matches!(
                    reason,
                    "identity_dispute" | "unsafe_contact" | "suspected_impersonation"
                )
            }) && evidence_valid
        }
        _ => false,
    };
    request.expected_version > 0 && replay_key_valid && action_valid
}

pub fn validate_provider_organization_claim_appeal_request(
    request: &AppealOwnerProviderOrganizationClaimRequest,
) -> bool {
    let idempotency_key = request.idempotency_key.trim();
    let evidence_reference = request.evidence_reference.trim();
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && request.expected_version > 0
        && matches!(
            request.category.as_str(),
            "new_identity_evidence" | "relationship_correction" | "decision_correction"
        )
        && (8..=240).contains(&evidence_reference.chars().count())
        && evidence_reference.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | ':' | '/')
        })
        && (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_provider_response_capability_request(
    request: &IssueOwnerProviderResponseCapabilityRequest,
) -> bool {
    let idempotency_key = request.idempotency_key.trim();
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && request.withheld_categories_acknowledged
        && (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

fn abuse_report_severity(category: &str) -> &'static str {
    if matches!(category, "harassment" | "impersonation" | "unsafe_contact") {
        "S1"
    } else {
        "S2"
    }
}

fn recipient_email_hint(email: &str) -> String {
    let Some((local, domain)) = email.split_once('@') else {
        return "•••".to_string();
    };
    let first = local.chars().next().unwrap_or('•');
    format!("{first}•••@{domain}")
}

fn provider_name_fingerprint(value: &str) -> String {
    let normalized = value
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_ascii_lowercase();
    format!("{:x}", Sha256::digest(normalized.as_bytes()))
}

fn recipient_entry_from_invitation(
    invitation: &OwnerProviderInvitationRecord,
    include_limited_request: bool,
) -> OwnerProviderInvitationRecipientEntry {
    OwnerProviderInvitationRecipientEntry {
        invitation_id: invitation.invitation_id.clone(),
        status: invitation.status.clone(),
        can_review_limited_request: include_limited_request,
        provider_name: include_limited_request.then(|| invitation.provider_name.clone()),
        owner_name: include_limited_request.then(|| invitation.owner_name_snapshot.clone()),
        coarse_area: include_limited_request.then(|| invitation.coarse_area_snapshot.clone()),
        care_goals: include_limited_request
            .then(|| invitation.care_goals_snapshot.clone())
            .unwrap_or_default(),
        cadence: include_limited_request.then(|| invitation.cadence_snapshot.clone()),
        recipient_email_hint: include_limited_request
            .then(|| recipient_email_hint(&invitation.recipient_business_email)),
        still_private_categories: vec![
            "exact_address".to_string(),
            "yard_photos".to_string(),
            "owner_contact".to_string(),
            "access_considerations".to_string(),
        ],
        recipient_email_checked: false,
        organization_relationship_checked: false,
        opportunity_response_capability: false,
    }
}

fn safe_media_file_name(value: &str) -> String {
    value.trim().replace(['/', '\\'], "-")
}

fn new_owner_intake_media_record(
    owner_user_id: &str,
    property_id: &str,
    brief_id: &str,
    request: CreateOwnerIntakeMediaRequest,
    safe_file_name: &str,
    ticket: &crate::photo_storage::PhotoStorageTicket,
    persisted: bool,
) -> OwnerIntakeMediaRecord {
    OwnerIntakeMediaRecord {
        media_id: format!("owner_media_{}", Uuid::new_v4()),
        owner_user_id: owner_user_id.to_string(),
        property_id: property_id.to_string(),
        brief_id: brief_id.to_string(),
        shot_type: request.shot_type,
        file_name: safe_file_name.to_string(),
        content_type: request.content_type,
        upload_mode: ticket.upload_mode.to_string(),
        object_key: ticket.object_key.clone(),
        thumbnail_object_key: ticket.thumbnail_object_key.clone(),
        status: "pending_upload".to_string(),
        file_size_bytes: None,
        image_width_px: None,
        image_height_px: None,
        metadata_source: None,
        rejection_reason: None,
        replaces_media_id: request.replaces_media_id,
        replaced_by_media_id: None,
        display_url: None,
        thumbnail_url: None,
        persisted,
    }
}

fn owner_media_upload_record(
    media: OwnerIntakeMediaRecord,
    ticket: crate::photo_storage::PhotoStorageTicket,
) -> OwnerIntakeMediaUploadRecord {
    OwnerIntakeMediaUploadRecord {
        media,
        upload_url: ticket.upload_url,
        thumbnail_upload_url: ticket.thumbnail_upload_url,
        thumbnail_content_type: ticket.thumbnail_content_type.map(str::to_string),
        thumbnail_max_dimension_px: ticket.thumbnail_max_dimension_px,
    }
}

fn completed_local_media(
    mut media: OwnerIntakeMediaRecord,
    metadata: PhotoUploadMetadata,
) -> OwnerIntakeMediaRecord {
    media.status = "ready".to_string();
    media.file_size_bytes = metadata.file_size_bytes;
    media.image_width_px = metadata.image_width_px;
    media.image_height_px = metadata.image_height_px;
    media.metadata_source = Some(
        metadata
            .metadata_source
            .unwrap_or_else(|| "client_reported".to_string()),
    );
    let storage = PhotoStorageConfig::from_env();
    media.display_url = Some(storage.display_url(&media.upload_mode, &media.object_key));
    media.thumbnail_url =
        storage.thumbnail_url(&media.upload_mode, media.thumbnail_object_key.as_deref());
    media
}

fn normalized_property(
    owner_user_id: &str,
    request: CreateOwnerPropertyRequest,
    persisted: bool,
) -> OwnerPropertyRecord {
    OwnerPropertyRecord {
        property_id: format!("owner_property_{}", Uuid::new_v4()),
        owner_user_id: owner_user_id.to_string(),
        display_name: request.display_name.trim().to_string(),
        address_line_1: request.address_line_1.trim().to_string(),
        address_line_2: request
            .address_line_2
            .unwrap_or_default()
            .trim()
            .to_string(),
        city: request.city.trim().to_string(),
        region: request.region.trim().to_string(),
        postal_code: request.postal_code.trim().to_string(),
        country_code: request
            .country_code
            .unwrap_or_else(|| "US".to_string())
            .trim()
            .to_ascii_uppercase(),
        coarse_area: request.coarse_area.unwrap_or_default().trim().to_string(),
        address_status: request.address_status,
        authority_attested: request.authority_attested,
        status: "draft".to_string(),
        version: 1,
        persisted,
    }
}

fn normalized_yard_brief(
    owner_user_id: &str,
    property_id: &str,
    version: i64,
    request: SaveOwnerYardBriefRequest,
    persisted: bool,
) -> OwnerYardBriefRecord {
    let normalize_values = |values: Vec<String>| {
        values
            .into_iter()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
            .collect()
    };
    OwnerYardBriefRecord {
        brief_id: format!("owner_brief_{}", Uuid::new_v4()),
        owner_user_id: owner_user_id.to_string(),
        property_id: property_id.to_string(),
        version,
        status: request.status,
        yard_areas: normalize_values(request.yard_areas),
        care_goals: normalize_values(request.care_goals),
        cadence_preference: request.cadence_preference,
        considerations: request.considerations.trim().to_string(),
        author_source: "yard_owner".to_string(),
        persisted,
    }
}

fn normalize_email(value: &str) -> String {
    value.trim().to_ascii_lowercase()
}

fn email_fingerprint(value: &str) -> String {
    format!("{:x}", Sha256::digest(normalize_email(value).as_bytes()))
}

fn new_owner_provider_invitation_token() -> String {
    format!(
        "owner_provider_{}{}",
        Uuid::new_v4().simple(),
        Uuid::new_v4().simple()
    )
}

fn invitation_token_hash(value: &str) -> String {
    format!("{:x}", Sha256::digest(value.as_bytes()))
}

fn current_epoch_seconds() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| i64::try_from(duration.as_secs()).unwrap_or(i64::MAX))
        .unwrap_or(0)
}

fn address_fingerprint(property: &OwnerPropertyRecord) -> String {
    let normalized = [
        property.address_line_1.as_str(),
        property.address_line_2.as_str(),
        property.city.as_str(),
        property.region.as_str(),
        property.postal_code.as_str(),
        property.country_code.as_str(),
    ]
    .map(|value| {
        value
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
            .to_ascii_lowercase()
    })
    .join("|");
    format!("{:x}", Sha256::digest(normalized.as_bytes()))
}

async fn save_workspace(
    pool: &PgPool,
    record: &OwnerWorkspaceRecord,
) -> Result<OwnerWorkspaceRecord, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        "INSERT INTO owner_workspaces (
             owner_user_id, verified_email, display_name, status, email_verified_at
         ) VALUES ($1, $2, $3, 'active', NOW())
         ON CONFLICT (owner_user_id) DO UPDATE SET
             verified_email = EXCLUDED.verified_email,
             display_name = EXCLUDED.display_name,
             status = 'active',
             email_verified_at = NOW(),
             updated_at = NOW()
         RETURNING owner_user_id, verified_email, display_name, status",
    )
    .bind(&record.owner_user_id)
    .bind(&record.verified_email)
    .bind(&record.display_name)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, NULL, 'workspace_saved', $3)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(&record.owner_user_id)
    .bind(serde_json::json!({ "status": "active" }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(workspace_from_row(&row, true))
}

async fn create_property(
    pool: &PgPool,
    property: &OwnerPropertyRecord,
    fingerprint: &str,
) -> Result<OwnerPropertyRecord, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        "INSERT INTO owner_properties (
             id, owner_user_id, display_name, address_line_1, address_line_2,
             city, region, postal_code, country_code, coarse_area,
             address_status, address_fingerprint, authority_attested_at, status, version
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), 'draft', 1
         )
         RETURNING id, owner_user_id, display_name, address_line_1, address_line_2,
                   city, region, postal_code, country_code, coarse_area,
                   address_status, authority_attested_at IS NOT NULL AS authority_attested,
                   status, version",
    )
    .bind(&property.property_id)
    .bind(&property.owner_user_id)
    .bind(&property.display_name)
    .bind(&property.address_line_1)
    .bind(&property.address_line_2)
    .bind(&property.city)
    .bind(&property.region)
    .bind(&property.postal_code)
    .bind(&property.country_code)
    .bind(&property.coarse_area)
    .bind(&property.address_status)
    .bind(fingerprint)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'property_created', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(&property.owner_user_id)
    .bind(&property.property_id)
    .bind(serde_json::json!({
        "address_status": property.address_status,
        "coarse_area": property.coarse_area,
        "authority_attested": property.authority_attested,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(property_from_row(&row, true))
}

async fn save_yard_brief(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    request: SaveOwnerYardBriefRequest,
) -> Result<Option<OwnerYardBriefRecord>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let owned_property = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_properties
             WHERE id = $1 AND owner_user_id = $2 AND status <> 'archived'
         )",
    )
    .bind(property_id)
    .bind(owner_user_id)
    .fetch_one(&mut *transaction)
    .await?;
    if !owned_property {
        transaction.rollback().await?;
        return Ok(None);
    }

    sqlx::query("SELECT pg_advisory_xact_lock(hashtext($1))")
        .bind(format!("owner-yard-brief:{property_id}"))
        .execute(&mut *transaction)
        .await?;
    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) + 1
         FROM owner_yard_briefs
         WHERE property_id = $1",
    )
    .bind(property_id)
    .fetch_one(&mut *transaction)
    .await?;
    let record = normalized_yard_brief(owner_user_id, property_id, version, request, true);
    let row = sqlx::query(
        "INSERT INTO owner_yard_briefs (
             id, owner_user_id, property_id, version, status, yard_areas,
             care_goals, cadence_preference, considerations, author_source
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'yard_owner')
         RETURNING id, owner_user_id, property_id, version, status, yard_areas,
                   care_goals, cadence_preference, considerations, author_source",
    )
    .bind(&record.brief_id)
    .bind(owner_user_id)
    .bind(property_id)
    .bind(version)
    .bind(&record.status)
    .bind(&record.yard_areas)
    .bind(&record.care_goals)
    .bind(&record.cadence_preference)
    .bind(&record.considerations)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'yard_brief_saved', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(owner_user_id)
    .bind(property_id)
    .bind(serde_json::json!({
        "version": version,
        "status": record.status,
        "yard_area_count": record.yard_areas.len(),
        "care_goal_count": record.care_goals.len(),
    }))
    .execute(&mut *transaction)
    .await?;
    if record.status == "ready" {
        sqlx::query(
            "UPDATE owner_properties
             SET status = CASE WHEN status = 'draft' THEN 'profile_ready' ELSE status END,
                 version = version + 1,
                 updated_at = NOW()
             WHERE id = $1 AND owner_user_id = $2",
        )
        .bind(property_id)
        .bind(owner_user_id)
        .execute(&mut *transaction)
        .await?;
    }
    transaction.commit().await?;
    Ok(Some(yard_brief_from_row(&row, true)))
}

async fn create_intake_media_upload(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    request: CreateOwnerIntakeMediaRequest,
    safe_file_name: &str,
    storage_ticket: crate::photo_storage::PhotoStorageTicket,
) -> Result<Option<OwnerIntakeMediaUploadRecord>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let brief_id = sqlx::query_scalar::<_, String>(
        "SELECT b.id
         FROM owner_yard_briefs b
         JOIN owner_properties p ON p.id = b.property_id
         WHERE b.owner_user_id = $1 AND b.property_id = $2
           AND b.status = 'ready' AND p.status <> 'archived'
         ORDER BY b.version DESC
         LIMIT 1",
    )
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(brief_id) = brief_id else {
        transaction.rollback().await?;
        return Ok(None);
    };
    if let Some(replaces_media_id) = request.replaces_media_id.as_deref() {
        let replacement_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(
                 SELECT 1 FROM owner_intake_media
                 WHERE id = $1 AND owner_user_id = $2 AND property_id = $3 AND status = 'ready'
             )",
        )
        .bind(replaces_media_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_one(&mut *transaction)
        .await?;
        if !replacement_exists {
            transaction.rollback().await?;
            return Ok(None);
        }
    }

    let media = new_owner_intake_media_record(
        owner_user_id,
        property_id,
        &brief_id,
        request,
        safe_file_name,
        &storage_ticket,
        true,
    );
    let row = sqlx::query(
        "INSERT INTO owner_intake_media (
             id, owner_user_id, property_id, brief_id, shot_type, file_name,
             content_type, upload_mode, object_key, thumbnail_object_key, status,
             replaces_media_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending_upload', $11)
         RETURNING id, owner_user_id, property_id, brief_id, shot_type, file_name,
                   content_type, upload_mode, object_key, thumbnail_object_key, status,
                   file_size_bytes, image_width_px, image_height_px, metadata_source,
                   rejection_reason, replaces_media_id, replaced_by_media_id",
    )
    .bind(&media.media_id)
    .bind(owner_user_id)
    .bind(property_id)
    .bind(&brief_id)
    .bind(&media.shot_type)
    .bind(safe_file_name)
    .bind(&media.content_type)
    .bind(&media.upload_mode)
    .bind(&media.object_key)
    .bind(&media.thumbnail_object_key)
    .bind(&media.replaces_media_id)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'intake_media_created', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(owner_user_id)
    .bind(property_id)
    .bind(serde_json::json!({
        "media_id": media.media_id,
        "brief_id": brief_id,
        "shot_type": media.shot_type,
        "status": "pending_upload",
        "replaces_media_id": media.replaces_media_id,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(Some(owner_media_upload_record(
        owner_media_from_row(&row, true),
        storage_ticket,
    )))
}

async fn list_intake_media(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
) -> Result<Option<Vec<OwnerIntakeMediaRecord>>, sqlx::Error> {
    let property_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_properties
             WHERE id = $1 AND owner_user_id = $2 AND status <> 'archived'
         )",
    )
    .bind(property_id)
    .bind(owner_user_id)
    .fetch_one(pool)
    .await?;
    if !property_exists {
        return Ok(None);
    }
    let rows = sqlx::query(
        "SELECT id, owner_user_id, property_id, brief_id, shot_type, file_name,
                content_type, upload_mode, object_key, thumbnail_object_key, status,
                file_size_bytes, image_width_px, image_height_px, metadata_source,
                rejection_reason, replaces_media_id, replaced_by_media_id
         FROM owner_intake_media
         WHERE owner_user_id = $1 AND property_id = $2
           AND status <> 'deleted'
         ORDER BY created_at DESC, id",
    )
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_all(pool)
    .await?;
    Ok(Some(
        rows.iter()
            .map(|row| owner_media_from_row(row, true))
            .collect(),
    ))
}

async fn get_intake_media(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    media_id: &str,
) -> Result<Option<OwnerIntakeMediaRecord>, sqlx::Error> {
    sqlx::query(
        "SELECT id, owner_user_id, property_id, brief_id, shot_type, file_name,
                content_type, upload_mode, object_key, thumbnail_object_key, status,
                file_size_bytes, image_width_px, image_height_px, metadata_source,
                rejection_reason, replaces_media_id, replaced_by_media_id
         FROM owner_intake_media
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3",
    )
    .bind(media_id)
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_optional(pool)
    .await
    .map(|row| row.as_ref().map(|row| owner_media_from_row(row, true)))
}

async fn complete_intake_media_upload(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    media_id: &str,
    client_metadata: PhotoUploadMetadata,
) -> Result<Option<OwnerIntakeMediaRecord>, sqlx::Error> {
    let Some(existing) = get_intake_media(pool, owner_user_id, property_id, media_id).await? else {
        return Ok(None);
    };
    if existing.status == "ready" {
        return Ok(Some(existing));
    }
    if !matches!(existing.status.as_str(), "pending_upload" | "processing") {
        return Ok(None);
    }

    let storage = PhotoStorageConfig::from_env();
    let (status, metadata, rejection_reason) = match storage
        .uploaded_photo_inspection(&existing.upload_mode, &existing.object_key)
        .await
    {
        crate::photo_storage::UploadedPhotoInspection::Extracted(metadata) => {
            if let Some(thumbnail_object_key) = existing.thumbnail_object_key.as_deref() {
                let _ = storage
                    .generate_uploaded_thumbnail(
                        &existing.upload_mode,
                        &existing.object_key,
                        thumbnail_object_key,
                    )
                    .await;
            }
            ("ready", metadata, None)
        }
        crate::photo_storage::UploadedPhotoInspection::Rejected(reason) => {
            ("rejected", PhotoUploadMetadata::default(), Some(reason))
        }
        crate::photo_storage::UploadedPhotoInspection::Unavailable
            if existing.upload_mode == "s3-presigned" =>
        {
            ("processing", client_metadata, None)
        }
        crate::photo_storage::UploadedPhotoInspection::Unavailable => {
            ("ready", client_metadata, None)
        }
    };

    let mut transaction = pool.begin().await?;
    let metadata_source = if status == "rejected" {
        None
    } else {
        metadata
            .metadata_source
            .as_deref()
            .or(Some("client_reported"))
    };
    let row = sqlx::query(
        "UPDATE owner_intake_media
         SET status = $4,
             file_size_bytes = $5,
             image_width_px = $6,
             image_height_px = $7,
             metadata_source = $8,
             rejection_reason = $9,
             uploaded_at = CASE WHEN $4 IN ('ready', 'processing') THEN NOW() ELSE uploaded_at END,
             updated_at = NOW()
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3
         RETURNING id, owner_user_id, property_id, brief_id, shot_type, file_name,
                   content_type, upload_mode, object_key, thumbnail_object_key, status,
                   file_size_bytes, image_width_px, image_height_px, metadata_source,
                   rejection_reason, replaces_media_id, replaced_by_media_id",
    )
    .bind(media_id)
    .bind(owner_user_id)
    .bind(property_id)
    .bind(status)
    .bind(metadata.file_size_bytes)
    .bind(metadata.image_width_px)
    .bind(metadata.image_height_px)
    .bind(metadata_source)
    .bind(rejection_reason)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(row) = row else {
        transaction.rollback().await?;
        return Ok(None);
    };
    let updated = owner_media_from_row(&row, true);
    if status == "ready" {
        if let Some(replaces_media_id) = updated.replaces_media_id.as_deref() {
            sqlx::query(
                "UPDATE owner_intake_media
                 SET status = 'replaced', replaced_by_media_id = $1, updated_at = NOW()
                 WHERE id = $2 AND owner_user_id = $3 AND property_id = $4 AND status = 'ready'",
            )
            .bind(media_id)
            .bind(replaces_media_id)
            .bind(owner_user_id)
            .bind(property_id)
            .execute(&mut *transaction)
            .await?;
        }
    }
    let event_kind = if status == "rejected" {
        "intake_media_rejected"
    } else {
        "intake_media_completed"
    };
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(owner_user_id)
    .bind(property_id)
    .bind(event_kind)
    .bind(serde_json::json!({
        "media_id": media_id,
        "shot_type": updated.shot_type,
        "status": status,
        "metadata_source": updated.metadata_source,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(Some(updated))
}

async fn mark_intake_media_deleted(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    media_id: &str,
) -> Result<Option<OwnerIntakeMediaRecord>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        "UPDATE owner_intake_media
         SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3
         RETURNING id, owner_user_id, property_id, brief_id, shot_type, file_name,
                   content_type, upload_mode, object_key, thumbnail_object_key, status,
                   file_size_bytes, image_width_px, image_height_px, metadata_source,
                   rejection_reason, replaces_media_id, replaced_by_media_id",
    )
    .bind(media_id)
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(row) = row else {
        transaction.rollback().await?;
        return Ok(None);
    };
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'intake_media_deleted', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(owner_user_id)
    .bind(property_id)
    .bind(serde_json::json!({ "media_id": media_id, "status": "deleted" }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(Some(owner_media_from_row(&row, true)))
}

enum PersistedInvitationCreateOutcome {
    Created(OwnerProviderInvitationRecord),
    Replayed(OwnerProviderInvitationRecord),
    NotFound,
    Conflict,
    Suppressed,
}

async fn list_owner_provider_invitations(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
) -> Result<Option<Vec<OwnerProviderInvitationRecord>>, sqlx::Error> {
    let property_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_properties
             WHERE id = $1 AND owner_user_id = $2 AND status <> 'archived'
         )",
    )
    .bind(property_id)
    .bind(owner_user_id)
    .fetch_one(pool)
    .await?;
    if !property_exists {
        return Ok(None);
    }
    let rows = sqlx::query(
        "SELECT invitation.id, invitation.owner_user_id, invitation.property_id,
                invitation.brief_id, invitation.brief_version, invitation.provider_name,
                invitation.recipient_email, invitation.purpose,
                invitation.owner_name_snapshot, invitation.coarse_area_snapshot,
                invitation.care_goals_snapshot, invitation.cadence_snapshot,
                CASE
                    WHEN invitation.status IN ('pending_delivery', 'delivered', 'opened')
                         AND invitation.expires_at <= NOW()
                    THEN 'expired'
                    ELSE invitation.status
                END AS status,
                EXTRACT(EPOCH FROM invitation.expires_at)::BIGINT AS expires_at_epoch_seconds,
                COALESCE(delivery.status, 'pending') AS delivery_status,
                COALESCE(delivery.attempt_count, 0)::INTEGER AS delivery_attempt_count
         FROM owner_provider_invitations invitation
         LEFT JOIN LATERAL (
             SELECT attempt.status, COUNT(*) OVER () AS attempt_count
             FROM owner_provider_invitation_delivery_attempts attempt
             WHERE attempt.invitation_id = invitation.id
             ORDER BY attempt.attempt_number DESC
             LIMIT 1
         ) delivery ON TRUE
         WHERE invitation.owner_user_id = $1 AND invitation.property_id = $2
         ORDER BY invitation.created_at DESC, invitation.id",
    )
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_all(pool)
    .await?;
    Ok(Some(
        rows.iter()
            .map(|row| owner_provider_invitation_from_row(row, true))
            .collect(),
    ))
}

async fn get_owner_provider_invitation(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    invitation_id: &str,
) -> Result<Option<OwnerProviderInvitationRecord>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT invitation.id, invitation.owner_user_id, invitation.property_id,
                invitation.brief_id, invitation.brief_version, invitation.provider_name,
                invitation.recipient_email, invitation.purpose,
                invitation.owner_name_snapshot, invitation.coarse_area_snapshot,
                invitation.care_goals_snapshot, invitation.cadence_snapshot,
                CASE
                    WHEN invitation.status IN ('pending_delivery', 'delivered', 'opened')
                         AND invitation.expires_at <= NOW()
                    THEN 'expired'
                    ELSE invitation.status
                END AS status,
                EXTRACT(EPOCH FROM invitation.expires_at)::BIGINT AS expires_at_epoch_seconds,
                COALESCE(delivery.status, 'pending') AS delivery_status,
                COALESCE(delivery.attempt_count, 0)::INTEGER AS delivery_attempt_count
         FROM owner_provider_invitations invitation
         LEFT JOIN LATERAL (
             SELECT attempt.status, COUNT(*) OVER () AS attempt_count
             FROM owner_provider_invitation_delivery_attempts attempt
             WHERE attempt.invitation_id = invitation.id
             ORDER BY attempt.attempt_number DESC
             LIMIT 1
         ) delivery ON TRUE
         WHERE invitation.id = $1
           AND invitation.owner_user_id = $2
           AND invitation.property_id = $3",
    )
    .bind(invitation_id)
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|row| owner_provider_invitation_from_row(&row, true)))
}

#[allow(clippy::too_many_arguments)]
async fn create_owner_provider_invitation(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    request: CreateOwnerProviderInvitationRequest,
    recipient_email: &str,
    recipient_fingerprint: &str,
    token_hash: &str,
) -> Result<PersistedInvitationCreateOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    sqlx::query("SELECT pg_advisory_xact_lock(hashtext($1))")
        .bind(format!(
            "owner-provider-invitation:{owner_user_id}:{property_id}:{recipient_fingerprint}"
        ))
        .execute(&mut *transaction)
        .await?;

    let replay = sqlx::query(
        "SELECT invitation.id, invitation.owner_user_id, invitation.property_id,
                invitation.brief_id, invitation.brief_version, invitation.provider_name,
                invitation.recipient_email, invitation.purpose,
                invitation.owner_name_snapshot, invitation.coarse_area_snapshot,
                invitation.care_goals_snapshot, invitation.cadence_snapshot,
                CASE
                    WHEN invitation.status IN ('pending_delivery', 'delivered', 'opened')
                         AND invitation.expires_at <= NOW()
                    THEN 'expired'
                    ELSE invitation.status
                END AS status,
                EXTRACT(EPOCH FROM invitation.expires_at)::BIGINT AS expires_at_epoch_seconds,
                COALESCE(delivery.status, 'pending') AS delivery_status,
                COALESCE(delivery.attempt_count, 0)::INTEGER AS delivery_attempt_count
         FROM owner_provider_invitations invitation
         LEFT JOIN LATERAL (
             SELECT attempt.status, COUNT(*) OVER () AS attempt_count
             FROM owner_provider_invitation_delivery_attempts attempt
             WHERE attempt.invitation_id = invitation.id
             ORDER BY attempt.attempt_number DESC
             LIMIT 1
         ) delivery ON TRUE
         WHERE invitation.owner_user_id = $1 AND invitation.idempotency_key = $2",
    )
    .bind(owner_user_id)
    .bind(request.idempotency_key.trim())
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(row) = replay {
        transaction.commit().await?;
        return Ok(PersistedInvitationCreateOutcome::Replayed(
            owner_provider_invitation_from_row(&row, true),
        ));
    }

    let snapshot = sqlx::query(
        "SELECT workspace.display_name AS owner_name_snapshot,
                property.coarse_area AS coarse_area_snapshot,
                brief.id AS brief_id, brief.version AS brief_version,
                brief.care_goals AS care_goals_snapshot,
                brief.cadence_preference AS cadence_snapshot
         FROM owner_workspaces workspace
         JOIN owner_properties property
           ON property.owner_user_id = workspace.owner_user_id
          AND property.id = $2
          AND property.status <> 'archived'
         JOIN LATERAL (
             SELECT id, version, status, care_goals, cadence_preference
             FROM owner_yard_briefs
             WHERE owner_user_id = workspace.owner_user_id AND property_id = property.id
             ORDER BY version DESC
             LIMIT 1
         ) brief ON brief.status = 'ready'
         WHERE workspace.owner_user_id = $1 AND workspace.status = 'active'",
    )
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(snapshot) = snapshot else {
        transaction.rollback().await?;
        return Ok(PersistedInvitationCreateOutcome::NotFound);
    };

    let suppressed = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_provider_recipient_suppressions
             WHERE recipient_email_fingerprint = $1
         )",
    )
    .bind(recipient_fingerprint)
    .fetch_one(&mut *transaction)
    .await?;
    if suppressed {
        transaction.rollback().await?;
        return Ok(PersistedInvitationCreateOutcome::Suppressed);
    }

    let expired_ids = sqlx::query_scalar::<_, String>(
        "UPDATE owner_provider_invitations
         SET status = 'expired', terminal_at = NOW(), updated_at = NOW()
         WHERE property_id = $1
           AND recipient_email_fingerprint = $2
           AND status IN ('pending_delivery', 'delivered', 'opened')
           AND expires_at <= NOW()
         RETURNING id",
    )
    .bind(property_id)
    .bind(recipient_fingerprint)
    .fetch_all(&mut *transaction)
    .await?;
    for invitation_id in expired_ids {
        sqlx::query(
            "INSERT INTO owner_acquisition_events (
                 id, owner_user_id, property_id, event_kind, event_data
             ) VALUES ($1, $2, $3, 'provider_invitation_expired', $4)",
        )
        .bind(format!("owner_event_{}", Uuid::new_v4()))
        .bind(owner_user_id)
        .bind(property_id)
        .bind(serde_json::json!({ "invitation_id": invitation_id }))
        .execute(&mut *transaction)
        .await?;
    }

    let live_invitation_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_provider_invitations
             WHERE property_id = $1
               AND recipient_email_fingerprint = $2
               AND status IN ('pending_delivery', 'delivered', 'opened')
         )",
    )
    .bind(property_id)
    .bind(recipient_fingerprint)
    .fetch_one(&mut *transaction)
    .await?;
    if live_invitation_exists {
        transaction.rollback().await?;
        return Ok(PersistedInvitationCreateOutcome::Conflict);
    }

    let invitation_id = format!("owner_provider_invitation_{}", Uuid::new_v4().simple());
    let row = sqlx::query(
        "INSERT INTO owner_provider_invitations (
             id, owner_user_id, property_id, brief_id, brief_version,
             provider_name, recipient_email, recipient_email_fingerprint,
             token_hash, idempotency_key, purpose, owner_name_snapshot,
             coarse_area_snapshot, care_goals_snapshot, cadence_snapshot,
             status, expires_at
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
             'yard_assessment', $11, $12, $13, $14, 'pending_delivery',
             NOW() + ($15::INTEGER * INTERVAL '1 day')
         )
         RETURNING id, owner_user_id, property_id, brief_id, brief_version,
                   provider_name, recipient_email, purpose, owner_name_snapshot,
                   coarse_area_snapshot, care_goals_snapshot, cadence_snapshot,
                   status, EXTRACT(EPOCH FROM expires_at)::BIGINT AS expires_at_epoch_seconds",
    )
    .bind(&invitation_id)
    .bind(owner_user_id)
    .bind(property_id)
    .bind(snapshot.get::<String, _>("brief_id"))
    .bind(snapshot.get::<i64, _>("brief_version"))
    .bind(request.provider_name.trim())
    .bind(recipient_email)
    .bind(recipient_fingerprint)
    .bind(token_hash)
    .bind(request.idempotency_key.trim())
    .bind(snapshot.get::<String, _>("owner_name_snapshot"))
    .bind(snapshot.get::<String, _>("coarse_area_snapshot"))
    .bind(snapshot.get::<Vec<String>, _>("care_goals_snapshot"))
    .bind(snapshot.get::<String, _>("cadence_snapshot"))
    .bind(request.expires_in_days)
    .fetch_one(&mut *transaction)
    .await?;

    sqlx::query(
        "INSERT INTO owner_provider_invitation_delivery_attempts (
             id, invitation_id, attempt_number, status, idempotency_key
         ) VALUES ($1, $2, 1, 'pending', $3)",
    )
    .bind(format!(
        "owner_provider_delivery_{}",
        Uuid::new_v4().simple()
    ))
    .bind(&invitation_id)
    .bind(format!("initial:{}", request.idempotency_key.trim()))
    .execute(&mut *transaction)
    .await?;

    for (event_kind, event_data) in [
        (
            "provider_invitation_created",
            serde_json::json!({
                "invitation_id": invitation_id,
                "brief_version": snapshot.get::<i64, _>("brief_version"),
                "purpose": "yard_assessment",
                "limited_categories": ["owner_name", "coarse_area", "care_goals", "cadence"]
            }),
        ),
        (
            "provider_invitation_delivery_requested",
            serde_json::json!({ "invitation_id": invitation_id, "attempt_number": 1 }),
        ),
    ] {
        sqlx::query(
            "INSERT INTO owner_acquisition_events (
                 id, owner_user_id, property_id, event_kind, event_data
             ) VALUES ($1, $2, $3, $4, $5)",
        )
        .bind(format!("owner_event_{}", Uuid::new_v4()))
        .bind(owner_user_id)
        .bind(property_id)
        .bind(event_kind)
        .bind(event_data)
        .execute(&mut *transaction)
        .await?;
    }
    sqlx::query(
        "UPDATE owner_properties
         SET status = CASE WHEN status = 'profile_ready' THEN 'connection_in_progress' ELSE status END,
             version = version + 1,
             updated_at = NOW()
         WHERE id = $1 AND owner_user_id = $2",
    )
    .bind(property_id)
    .bind(owner_user_id)
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;

    let mut invitation = owner_provider_invitation_from_row(&row, true);
    invitation.delivery_status = "pending".to_string();
    invitation.delivery_attempt_count = 1;
    Ok(PersistedInvitationCreateOutcome::Created(invitation))
}

enum PersistedInvitationMutationOutcome {
    Saved(OwnerProviderInvitationRecord),
    NotFound,
    InvalidState(OwnerProviderInvitationRecord),
}

async fn reconcile_owner_provider_response_capability(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    invitation_id: &str,
    owner_user_id: &str,
    property_id: &str,
    next_status: &str,
    reason: &str,
) -> Result<(), sqlx::Error> {
    let updated = sqlx::query(
        "UPDATE owner_provider_invitation_response_capabilities
         SET status = $2, version = version + 1, updated_at = NOW()
         WHERE invitation_id = $1 AND status = 'active'",
    )
    .bind(invitation_id)
    .bind(next_status)
    .execute(&mut **transaction)
    .await?;
    if updated.rows_affected() > 0 {
        sqlx::query(
            "INSERT INTO owner_acquisition_events (
                 id, owner_user_id, property_id, event_kind, event_data
             ) VALUES ($1, $2, $3, 'provider_invitation_response_capability_reconciled', $4)",
        )
        .bind(format!("owner_event_{}", Uuid::new_v4()))
        .bind(owner_user_id)
        .bind(property_id)
        .bind(serde_json::json!({
            "invitation_id": invitation_id,
            "status": next_status,
            "reason": reason,
        }))
        .execute(&mut **transaction)
        .await?;
    }
    Ok(())
}

async fn revoke_owner_provider_invitation(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    invitation_id: &str,
) -> Result<PersistedInvitationMutationOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        "SELECT status, expires_at <= NOW() AS expired
         FROM owner_provider_invitations
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3
         FOR UPDATE",
    )
    .bind(invitation_id)
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PersistedInvitationMutationOutcome::NotFound);
    };
    let status: String = current.get("status");
    let expired: bool = current.get("expired");
    if status == "revoked" {
        transaction.commit().await?;
        let invitation =
            get_owner_provider_invitation(pool, owner_user_id, property_id, invitation_id)
                .await?
                .ok_or(sqlx::Error::RowNotFound)?;
        return Ok(PersistedInvitationMutationOutcome::Saved(invitation));
    }
    let (next_status, event_kind, valid_revoke) =
        if expired && matches!(status.as_str(), "pending_delivery" | "delivered" | "opened") {
            ("expired", "provider_invitation_expired", false)
        } else if matches!(status.as_str(), "pending_delivery" | "delivered" | "opened") {
            ("revoked", "provider_invitation_revoked", true)
        } else {
            transaction.commit().await?;
            let invitation =
                get_owner_provider_invitation(pool, owner_user_id, property_id, invitation_id)
                    .await?
                    .ok_or(sqlx::Error::RowNotFound)?;
            return Ok(PersistedInvitationMutationOutcome::InvalidState(invitation));
        };

    sqlx::query(
        "UPDATE owner_provider_invitations
         SET status = $4, terminal_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3",
    )
    .bind(invitation_id)
    .bind(owner_user_id)
    .bind(property_id)
    .bind(next_status)
    .execute(&mut *transaction)
    .await?;
    if next_status == "revoked" {
        sqlx::query(
            "UPDATE owner_provider_invitation_delivery_attempts
             SET status = 'suppressed', failure_code = 'owner_revoked', completed_at = NOW()
             WHERE invitation_id = $1 AND status = 'pending'",
        )
        .bind(invitation_id)
        .execute(&mut *transaction)
        .await?;
    }
    reconcile_owner_provider_response_capability(
        &mut transaction,
        invitation_id,
        owner_user_id,
        property_id,
        if next_status == "expired" {
            "expired"
        } else {
            "revoked"
        },
        if next_status == "expired" {
            "invitation_expired"
        } else {
            "owner_revoked"
        },
    )
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(owner_user_id)
    .bind(property_id)
    .bind(event_kind)
    .bind(serde_json::json!({ "invitation_id": invitation_id }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    let invitation = get_owner_provider_invitation(pool, owner_user_id, property_id, invitation_id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)?;
    if valid_revoke {
        Ok(PersistedInvitationMutationOutcome::Saved(invitation))
    } else {
        Ok(PersistedInvitationMutationOutcome::InvalidState(invitation))
    }
}

enum PersistedInvitationRetryOutcome {
    Created(OwnerProviderInvitationRecord),
    Replayed(OwnerProviderInvitationRecord),
    NotFound,
    InvalidState(OwnerProviderInvitationRecord),
    Suppressed,
}

#[allow(clippy::too_many_arguments)]
async fn retry_owner_provider_invitation(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    invitation_id: &str,
    request: RetryOwnerProviderInvitationRequest,
    token_hash: &str,
) -> Result<PersistedInvitationRetryOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        "SELECT status, recipient_email_fingerprint
         FROM owner_provider_invitations
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3
         FOR UPDATE",
    )
    .bind(invitation_id)
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PersistedInvitationRetryOutcome::NotFound);
    };
    let replayed = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_provider_invitation_delivery_attempts
             WHERE invitation_id = $1 AND idempotency_key = $2
         )",
    )
    .bind(invitation_id)
    .bind(request.idempotency_key.trim())
    .fetch_one(&mut *transaction)
    .await?;
    if replayed {
        transaction.commit().await?;
        let invitation =
            get_owner_provider_invitation(pool, owner_user_id, property_id, invitation_id)
                .await?
                .ok_or(sqlx::Error::RowNotFound)?;
        return Ok(PersistedInvitationRetryOutcome::Replayed(invitation));
    }
    let status: String = current.get("status");
    if status != "failed" {
        transaction.commit().await?;
        let invitation =
            get_owner_provider_invitation(pool, owner_user_id, property_id, invitation_id)
                .await?
                .ok_or(sqlx::Error::RowNotFound)?;
        return Ok(PersistedInvitationRetryOutcome::InvalidState(invitation));
    }
    let recipient_fingerprint: String = current.get("recipient_email_fingerprint");
    let suppressed = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_provider_recipient_suppressions
             WHERE recipient_email_fingerprint = $1
         )",
    )
    .bind(&recipient_fingerprint)
    .fetch_one(&mut *transaction)
    .await?;
    if suppressed {
        transaction.rollback().await?;
        return Ok(PersistedInvitationRetryOutcome::Suppressed);
    }
    let next_attempt = sqlx::query_scalar::<_, i32>(
        "SELECT COALESCE(MAX(attempt_number), 0)::INTEGER + 1
         FROM owner_provider_invitation_delivery_attempts
         WHERE invitation_id = $1",
    )
    .bind(invitation_id)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "UPDATE owner_provider_invitations
         SET token_hash = $4,
             status = 'pending_delivery',
             expires_at = NOW() + ($5::INTEGER * INTERVAL '1 day'),
             terminal_at = NULL,
             delivered_at = NULL,
             opened_at = NULL,
             updated_at = NOW()
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3",
    )
    .bind(invitation_id)
    .bind(owner_user_id)
    .bind(property_id)
    .bind(token_hash)
    .bind(request.expires_in_days)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_invitation_delivery_attempts (
             id, invitation_id, attempt_number, status, idempotency_key
         ) VALUES ($1, $2, $3, 'pending', $4)",
    )
    .bind(format!(
        "owner_provider_delivery_{}",
        Uuid::new_v4().simple()
    ))
    .bind(invitation_id)
    .bind(next_attempt)
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_invitation_delivery_retried', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(owner_user_id)
    .bind(property_id)
    .bind(serde_json::json!({
        "invitation_id": invitation_id,
        "attempt_number": next_attempt,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    let invitation = get_owner_provider_invitation(pool, owner_user_id, property_id, invitation_id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)?;
    Ok(PersistedInvitationRetryOutcome::Created(invitation))
}

async fn record_owner_provider_invitation_delivery(
    pool: &PgPool,
    invitation_id: &str,
    attempt_number: i32,
    request: RecordOwnerProviderInvitationDeliveryRequest,
) -> Result<PersistedInvitationMutationOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        "SELECT invitation.owner_user_id, invitation.property_id,
                invitation.status AS invitation_status,
                attempt.status AS attempt_status,
                attempt.attempt_number = (
                    SELECT MAX(latest.attempt_number)
                    FROM owner_provider_invitation_delivery_attempts latest
                    WHERE latest.invitation_id = invitation.id
                ) AS latest_attempt
         FROM owner_provider_invitations invitation
         JOIN owner_provider_invitation_delivery_attempts attempt
           ON attempt.invitation_id = invitation.id AND attempt.attempt_number = $2
         WHERE invitation.id = $1
         FOR UPDATE OF invitation, attempt",
    )
    .bind(invitation_id)
    .bind(attempt_number)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PersistedInvitationMutationOutcome::NotFound);
    };
    let owner_user_id: String = current.get("owner_user_id");
    let property_id: String = current.get("property_id");
    let invitation_status: String = current.get("invitation_status");
    let attempt_status: String = current.get("attempt_status");
    let latest_attempt: bool = current.get("latest_attempt");
    if attempt_status == request.outcome && invitation_status == request.outcome {
        transaction.commit().await?;
        let invitation =
            get_owner_provider_invitation(pool, &owner_user_id, &property_id, invitation_id)
                .await?
                .ok_or(sqlx::Error::RowNotFound)?;
        return Ok(PersistedInvitationMutationOutcome::Saved(invitation));
    }
    if attempt_status != "pending" || invitation_status != "pending_delivery" || !latest_attempt {
        transaction.commit().await?;
        let invitation =
            get_owner_provider_invitation(pool, &owner_user_id, &property_id, invitation_id)
                .await?
                .ok_or(sqlx::Error::RowNotFound)?;
        return Ok(PersistedInvitationMutationOutcome::InvalidState(invitation));
    }
    sqlx::query(
        "UPDATE owner_provider_invitation_delivery_attempts
         SET status = $3,
             provider_message_id = $4,
             failure_code = $5,
             attempted_at = COALESCE(attempted_at, NOW()),
             completed_at = NOW()
         WHERE invitation_id = $1 AND attempt_number = $2",
    )
    .bind(invitation_id)
    .bind(attempt_number)
    .bind(&request.outcome)
    .bind(request.provider_message_id.as_deref().map(str::trim))
    .bind(request.failure_code.as_deref().map(str::trim))
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "UPDATE owner_provider_invitations
         SET status = $2,
             delivered_at = CASE WHEN $2 = 'delivered' THEN NOW() ELSE delivered_at END,
             terminal_at = CASE WHEN $2 = 'failed' THEN NOW() ELSE NULL END,
             updated_at = NOW()
         WHERE id = $1",
    )
    .bind(invitation_id)
    .bind(&request.outcome)
    .execute(&mut *transaction)
    .await?;
    let event_kind = if request.outcome == "delivered" {
        "provider_invitation_delivered"
    } else {
        "provider_invitation_failed"
    };
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(&owner_user_id)
    .bind(&property_id)
    .bind(event_kind)
    .bind(serde_json::json!({
        "invitation_id": invitation_id,
        "attempt_number": attempt_number,
        "failure_code": request.failure_code,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    let invitation =
        get_owner_provider_invitation(pool, &owner_user_id, &property_id, invitation_id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;
    Ok(PersistedInvitationMutationOutcome::Saved(invitation))
}

async fn expire_owner_provider_invitations(
    pool: &PgPool,
    limit: i64,
) -> Result<usize, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let expired = sqlx::query(
        "SELECT id, owner_user_id, property_id
         FROM owner_provider_invitations
         WHERE status IN ('pending_delivery', 'delivered', 'opened')
           AND expires_at <= NOW()
         ORDER BY expires_at, id
         FOR UPDATE SKIP LOCKED
         LIMIT $1",
    )
    .bind(limit)
    .fetch_all(&mut *transaction)
    .await?;
    for row in &expired {
        let invitation_id: String = row.get("id");
        let owner_user_id: String = row.get("owner_user_id");
        let property_id: String = row.get("property_id");
        sqlx::query(
            "UPDATE owner_provider_invitations
             SET status = 'expired', terminal_at = NOW(), updated_at = NOW()
             WHERE id = $1",
        )
        .bind(&invitation_id)
        .execute(&mut *transaction)
        .await?;
        reconcile_owner_provider_response_capability(
            &mut transaction,
            &invitation_id,
            &owner_user_id,
            &property_id,
            "expired",
            "invitation_expired",
        )
        .await?;
        sqlx::query(
            "UPDATE owner_provider_invitation_delivery_attempts
             SET status = 'suppressed', failure_code = 'invitation_expired', completed_at = NOW()
             WHERE invitation_id = $1 AND status = 'pending'",
        )
        .bind(&invitation_id)
        .execute(&mut *transaction)
        .await?;
        sqlx::query(
            "INSERT INTO owner_acquisition_events (
                 id, owner_user_id, property_id, event_kind, event_data
             ) VALUES ($1, $2, $3, 'provider_invitation_expired', $4)",
        )
        .bind(format!("owner_event_{}", Uuid::new_v4()))
        .bind(&owner_user_id)
        .bind(&property_id)
        .bind(serde_json::json!({ "invitation_id": invitation_id }))
        .execute(&mut *transaction)
        .await?;
    }
    transaction.commit().await?;
    Ok(expired.len())
}

async fn opt_out_owner_provider_invitation(
    pool: &PgPool,
    verified_email: &str,
    token_hash: &str,
) -> Result<PersistedInvitationMutationOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        "SELECT id, owner_user_id, property_id, recipient_email, status,
                expires_at <= NOW() AS expired
         FROM owner_provider_invitations
         WHERE token_hash = $1 AND LOWER(recipient_email) = LOWER($2)
         FOR UPDATE",
    )
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PersistedInvitationMutationOutcome::NotFound);
    };
    let invitation_id: String = current.get("id");
    let owner_user_id: String = current.get("owner_user_id");
    let property_id: String = current.get("property_id");
    let recipient_email: String = current.get("recipient_email");
    let status: String = current.get("status");
    let expired: bool = current.get("expired");
    if status == "opted_out" {
        transaction.commit().await?;
        let invitation =
            get_owner_provider_invitation(pool, &owner_user_id, &property_id, &invitation_id)
                .await?
                .ok_or(sqlx::Error::RowNotFound)?;
        return Ok(PersistedInvitationMutationOutcome::Saved(invitation));
    }
    if expired && matches!(status.as_str(), "pending_delivery" | "delivered" | "opened") {
        sqlx::query(
            "UPDATE owner_provider_invitations
             SET status = 'expired', terminal_at = NOW(), updated_at = NOW()
             WHERE id = $1",
        )
        .bind(&invitation_id)
        .execute(&mut *transaction)
        .await?;
        sqlx::query(
            "INSERT INTO owner_acquisition_events (
                 id, owner_user_id, property_id, event_kind, event_data
             ) VALUES ($1, $2, $3, 'provider_invitation_expired', $4)",
        )
        .bind(format!("owner_event_{}", Uuid::new_v4()))
        .bind(&owner_user_id)
        .bind(&property_id)
        .bind(serde_json::json!({ "invitation_id": invitation_id }))
        .execute(&mut *transaction)
        .await?;
        transaction.commit().await?;
        let invitation =
            get_owner_provider_invitation(pool, &owner_user_id, &property_id, &invitation_id)
                .await?
                .ok_or(sqlx::Error::RowNotFound)?;
        return Ok(PersistedInvitationMutationOutcome::InvalidState(invitation));
    }
    if !matches!(status.as_str(), "pending_delivery" | "delivered" | "opened") {
        transaction.commit().await?;
        let invitation =
            get_owner_provider_invitation(pool, &owner_user_id, &property_id, &invitation_id)
                .await?
                .ok_or(sqlx::Error::RowNotFound)?;
        return Ok(PersistedInvitationMutationOutcome::InvalidState(invitation));
    }
    sqlx::query(
        "UPDATE owner_provider_invitations
         SET status = 'opted_out', terminal_at = NOW(), updated_at = NOW()
         WHERE id = $1",
    )
    .bind(&invitation_id)
    .execute(&mut *transaction)
    .await?;
    reconcile_owner_provider_response_capability(
        &mut transaction,
        &invitation_id,
        &owner_user_id,
        &property_id,
        "revoked",
        "recipient_opt_out",
    )
    .await?;
    sqlx::query(
        "UPDATE owner_provider_invitation_delivery_attempts
         SET status = 'suppressed', failure_code = 'recipient_opt_out', completed_at = NOW()
         WHERE invitation_id = $1 AND status = 'pending'",
    )
    .bind(&invitation_id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_recipient_suppressions (
             recipient_email_fingerprint, recipient_email, reason, source_invitation_id
         ) VALUES ($1, $2, 'recipient_opt_out', $3)
         ON CONFLICT (recipient_email_fingerprint) DO NOTHING",
    )
    .bind(email_fingerprint(&recipient_email))
    .bind(&recipient_email)
    .bind(&invitation_id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_invitation_opted_out', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(&owner_user_id)
    .bind(&property_id)
    .bind(serde_json::json!({ "invitation_id": invitation_id }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    let invitation =
        get_owner_provider_invitation(pool, &owner_user_id, &property_id, &invitation_id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;
    Ok(PersistedInvitationMutationOutcome::Saved(invitation))
}

enum PersistedAbuseReportOutcome {
    Created(OwnerProviderInvitationAbuseReportRecord),
    Replayed(OwnerProviderInvitationAbuseReportRecord),
    NotFound,
    Conflict,
}

enum PersistedInvitationPreviewOutcome {
    Opened(OwnerProviderInvitationRecipientEntry),
    Closed(OwnerProviderInvitationRecipientEntry),
    NotReady,
    NotFound,
}

async fn preview_owner_provider_invitation(
    pool: &PgPool,
    token_hash: &str,
) -> Result<PersistedInvitationPreviewOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        "SELECT id, owner_user_id, property_id, provider_name, recipient_email,
                owner_name_snapshot, coarse_area_snapshot, care_goals_snapshot,
                cadence_snapshot, status, expires_at <= NOW() AS expired
         FROM owner_provider_invitations
         WHERE token_hash = $1
         FOR UPDATE",
    )
    .bind(token_hash)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(row) = row else {
        transaction.rollback().await?;
        return Ok(PersistedInvitationPreviewOutcome::NotFound);
    };
    let invitation_id: String = row.get("id");
    let owner_user_id: String = row.get("owner_user_id");
    let property_id: String = row.get("property_id");
    let current_status: String = row.get("status");
    let expired: bool = row.get("expired");
    let status = if expired
        && matches!(
            current_status.as_str(),
            "pending_delivery" | "delivered" | "opened"
        ) {
        sqlx::query(
            "UPDATE owner_provider_invitations
             SET status = 'expired', terminal_at = NOW(), updated_at = NOW()
             WHERE id = $1",
        )
        .bind(&invitation_id)
        .execute(&mut *transaction)
        .await?;
        sqlx::query(
            "UPDATE owner_provider_invitation_delivery_attempts
             SET status = 'suppressed', failure_code = 'invitation_expired', completed_at = NOW()
             WHERE invitation_id = $1 AND status = 'pending'",
        )
        .bind(&invitation_id)
        .execute(&mut *transaction)
        .await?;
        sqlx::query(
            "INSERT INTO owner_acquisition_events (
                 id, owner_user_id, property_id, event_kind, event_data
             ) VALUES ($1, $2, $3, 'provider_invitation_expired', $4)",
        )
        .bind(format!("owner_event_{}", Uuid::new_v4()))
        .bind(&owner_user_id)
        .bind(&property_id)
        .bind(serde_json::json!({ "invitation_id": invitation_id }))
        .execute(&mut *transaction)
        .await?;
        "expired".to_string()
    } else {
        current_status
    };
    if status == "pending_delivery" {
        transaction.commit().await?;
        return Ok(PersistedInvitationPreviewOutcome::NotReady);
    }
    if status == "delivered" {
        sqlx::query(
            "UPDATE owner_provider_invitations
             SET status = 'opened', opened_at = COALESCE(opened_at, NOW()), updated_at = NOW()
             WHERE id = $1",
        )
        .bind(&invitation_id)
        .execute(&mut *transaction)
        .await?;
        sqlx::query(
            "INSERT INTO owner_acquisition_events (
                 id, owner_user_id, property_id, event_kind, event_data
             ) VALUES ($1, $2, $3, 'provider_invitation_opened', $4)",
        )
        .bind(format!("owner_event_{}", Uuid::new_v4()))
        .bind(&owner_user_id)
        .bind(&property_id)
        .bind(serde_json::json!({ "invitation_id": invitation_id }))
        .execute(&mut *transaction)
        .await?;
        let entry = recipient_entry_from_preview_row(&row, "opened", true);
        transaction.commit().await?;
        return Ok(PersistedInvitationPreviewOutcome::Opened(entry));
    }
    let include_limited_request = status == "opened";
    let entry = recipient_entry_from_preview_row(&row, &status, include_limited_request);
    transaction.commit().await?;
    if include_limited_request {
        Ok(PersistedInvitationPreviewOutcome::Opened(entry))
    } else {
        Ok(PersistedInvitationPreviewOutcome::Closed(entry))
    }
}

fn recipient_entry_from_preview_row(
    row: &sqlx::postgres::PgRow,
    status: &str,
    include_limited_request: bool,
) -> OwnerProviderInvitationRecipientEntry {
    OwnerProviderInvitationRecipientEntry {
        invitation_id: row.get("id"),
        status: status.to_string(),
        can_review_limited_request: include_limited_request,
        provider_name: include_limited_request.then(|| row.get("provider_name")),
        owner_name: include_limited_request.then(|| row.get("owner_name_snapshot")),
        coarse_area: include_limited_request.then(|| row.get("coarse_area_snapshot")),
        care_goals: include_limited_request
            .then(|| row.get("care_goals_snapshot"))
            .unwrap_or_default(),
        cadence: include_limited_request.then(|| row.get("cadence_snapshot")),
        recipient_email_hint: include_limited_request
            .then(|| recipient_email_hint(&row.get::<String, _>("recipient_email"))),
        still_private_categories: vec![
            "exact_address".to_string(),
            "yard_photos".to_string(),
            "owner_contact".to_string(),
            "access_considerations".to_string(),
        ],
        recipient_email_checked: false,
        organization_relationship_checked: false,
        opportunity_response_capability: false,
    }
}

enum PersistedRecipientCheckOutcome {
    Checked(OwnerProviderInvitationRecipientEntry),
    Replayed(OwnerProviderInvitationRecipientEntry),
    NotFound,
    InvalidState,
    Conflict,
}

async fn verify_owner_provider_invitation_recipient(
    pool: &PgPool,
    recipient_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
) -> Result<PersistedRecipientCheckOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let invitation = sqlx::query(
        "SELECT id, owner_user_id, property_id, provider_name, recipient_email,
                owner_name_snapshot, coarse_area_snapshot, care_goals_snapshot,
                cadence_snapshot, status, expires_at <= NOW() AS expired
         FROM owner_provider_invitations
         WHERE token_hash = $1 AND LOWER(recipient_email) = LOWER($2)
         FOR UPDATE",
    )
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(invitation) = invitation else {
        transaction.rollback().await?;
        return Ok(PersistedRecipientCheckOutcome::NotFound);
    };
    let invitation_id: String = invitation.get("id");
    let owner_user_id: String = invitation.get("owner_user_id");
    let property_id: String = invitation.get("property_id");
    let status: String = invitation.get("status");
    let expired: bool = invitation.get("expired");
    if expired && status == "opened" {
        sqlx::query(
            "UPDATE owner_provider_invitations
             SET status = 'expired', terminal_at = NOW(), updated_at = NOW()
             WHERE id = $1",
        )
        .bind(&invitation_id)
        .execute(&mut *transaction)
        .await?;
        sqlx::query(
            "INSERT INTO owner_acquisition_events (
                 id, owner_user_id, property_id, event_kind, event_data
             ) VALUES ($1, $2, $3, 'provider_invitation_expired', $4)",
        )
        .bind(format!("owner_event_{}", Uuid::new_v4()))
        .bind(&owner_user_id)
        .bind(&property_id)
        .bind(serde_json::json!({ "invitation_id": invitation_id }))
        .execute(&mut *transaction)
        .await?;
        transaction.commit().await?;
        return Ok(PersistedRecipientCheckOutcome::InvalidState);
    }
    if status != "opened" {
        transaction.commit().await?;
        return Ok(PersistedRecipientCheckOutcome::InvalidState);
    }
    let existing = sqlx::query(
        "SELECT recipient_user_id, verified_email_fingerprint, status
         FROM owner_provider_invitation_recipient_checks
         WHERE invitation_id = $1",
    )
    .bind(&invitation_id)
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(existing) = existing {
        let same_binding = existing.get::<String, _>("recipient_user_id") == recipient_user_id
            && existing.get::<String, _>("verified_email_fingerprint")
                == verified_email_fingerprint
            && existing.get::<String, _>("status") == "checked";
        transaction.commit().await?;
        if !same_binding {
            return Ok(PersistedRecipientCheckOutcome::Conflict);
        }
        let mut entry = recipient_entry_from_preview_row(&invitation, "opened", true);
        entry.recipient_email_checked = true;
        return Ok(PersistedRecipientCheckOutcome::Replayed(entry));
    }
    let check_id = format!("owner_provider_recipient_check_{}", Uuid::new_v4().simple());
    sqlx::query(
        "INSERT INTO owner_provider_invitation_recipient_checks (
             id, invitation_id, recipient_user_id, verified_email_fingerprint, status
         ) VALUES ($1, $2, $3, $4, 'checked')",
    )
    .bind(&check_id)
    .bind(&invitation_id)
    .bind(recipient_user_id)
    .bind(verified_email_fingerprint)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_invitation_recipient_checked', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(&owner_user_id)
    .bind(&property_id)
    .bind(serde_json::json!({
        "invitation_id": invitation_id,
        "recipient_check_id": check_id,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    let mut entry = recipient_entry_from_preview_row(&invitation, "opened", true);
    entry.recipient_email_checked = true;
    Ok(PersistedRecipientCheckOutcome::Checked(entry))
}

enum PersistedOrganizationOptionsOutcome {
    Loaded(Vec<OwnerProviderOrganizationOption>),
    NotFound,
    InvalidState,
}

async fn list_owner_provider_organization_options(
    pool: &PgPool,
    recipient_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
) -> Result<PersistedOrganizationOptionsOutcome, sqlx::Error> {
    let invitation = sqlx::query(
        "SELECT invitation.id, invitation.status,
                invitation.expires_at <= NOW() AS expired,
                recipient_check.recipient_user_id,
                recipient_check.verified_email_fingerprint,
                recipient_check.status AS recipient_check_status
         FROM owner_provider_invitations invitation
         LEFT JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.invitation_id = invitation.id
         WHERE invitation.token_hash = $1
           AND LOWER(invitation.recipient_email) = LOWER($2)",
    )
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(pool)
    .await?;
    let Some(invitation) = invitation else {
        return Ok(PersistedOrganizationOptionsOutcome::NotFound);
    };
    let recipient_checked = invitation
        .try_get::<String, _>("recipient_user_id")
        .is_ok_and(|value| value == recipient_user_id)
        && invitation
            .try_get::<String, _>("verified_email_fingerprint")
            .is_ok_and(|value| value == verified_email_fingerprint)
        && invitation
            .try_get::<String, _>("recipient_check_status")
            .is_ok_and(|value| value == "checked");
    if invitation.get::<String, _>("status") != "opened"
        || invitation.get::<bool, _>("expired")
        || !recipient_checked
    {
        return Ok(PersistedOrganizationOptionsOutcome::InvalidState);
    }
    let rows = sqlx::query(
        "SELECT organization.id, organization.display_name, membership.role
         FROM organization_memberships membership
         JOIN organizations organization ON organization.id = membership.organization_id
         WHERE membership.user_id = $1
           AND membership.status = 'active'
           AND organization.status = 'active'
           AND organization.organization_type = 'yard_care_company'
         ORDER BY organization.display_name, organization.id, membership.role",
    )
    .bind(recipient_user_id)
    .fetch_all(pool)
    .await?;
    let mut options = Vec::new();
    let mut seen_organizations = HashSet::new();
    for row in rows {
        let organization_id: String = row.get("id");
        if seen_organizations.insert(organization_id.clone()) {
            options.push(OwnerProviderOrganizationOption {
                organization_id,
                display_name: row.get("display_name"),
                membership_role: row.get("role"),
                relationship_checked: true,
            });
        }
    }
    Ok(PersistedOrganizationOptionsOutcome::Loaded(options))
}

enum PersistedOrganizationClaimOutcome {
    Created(OwnerProviderOrganizationClaimRecord),
    Replayed(OwnerProviderOrganizationClaimRecord),
    NotFound,
    InvalidState,
    Conflict,
}

async fn create_owner_provider_organization_claim(
    pool: &PgPool,
    recipient_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    request: CreateOwnerProviderOrganizationClaimRequest,
    token_hash: &str,
) -> Result<PersistedOrganizationClaimOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let replay = sqlx::query(
        "SELECT claim.id, claim.invitation_id, claim.claim_kind,
                claim.proposed_display_name, claim.organization_id, claim.status,
                claim.assigned_function, claim.version
         FROM owner_provider_invitation_organization_claims claim
         JOIN owner_provider_invitations invitation ON invitation.id = claim.invitation_id
         WHERE claim.actor_user_id = $1
           AND claim.idempotency_key = $2
           AND invitation.token_hash = $3
           AND LOWER(invitation.recipient_email) = LOWER($4)",
    )
    .bind(recipient_user_id)
    .bind(request.idempotency_key.trim())
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(row) = replay {
        transaction.commit().await?;
        return Ok(PersistedOrganizationClaimOutcome::Replayed(
            owner_provider_organization_claim_from_row(&row, true),
        ));
    }
    let invitation = sqlx::query(
        "SELECT invitation.id, invitation.owner_user_id, invitation.property_id,
                invitation.status, invitation.expires_at <= NOW() AS expired,
                recipient_check.id AS recipient_check_id,
                recipient_check.recipient_user_id,
                recipient_check.verified_email_fingerprint,
                recipient_check.status AS recipient_check_status
         FROM owner_provider_invitations invitation
         LEFT JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.invitation_id = invitation.id
         WHERE invitation.token_hash = $1
           AND LOWER(invitation.recipient_email) = LOWER($2)
         FOR UPDATE OF invitation",
    )
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(invitation) = invitation else {
        transaction.rollback().await?;
        return Ok(PersistedOrganizationClaimOutcome::NotFound);
    };
    let invitation_id: String = invitation.get("id");
    let recipient_checked = invitation
        .try_get::<String, _>("recipient_user_id")
        .is_ok_and(|value| value == recipient_user_id)
        && invitation
            .try_get::<String, _>("verified_email_fingerprint")
            .is_ok_and(|value| value == verified_email_fingerprint)
        && invitation
            .try_get::<String, _>("recipient_check_status")
            .is_ok_and(|value| value == "checked");
    if invitation.get::<String, _>("status") != "opened"
        || invitation.get::<bool, _>("expired")
        || !recipient_checked
    {
        transaction.rollback().await?;
        return Ok(PersistedOrganizationClaimOutcome::InvalidState);
    }
    let active_claim_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_provider_invitation_organization_claims
             WHERE invitation_id = $1
               AND status IN (
                   'relationship_checked', 'bootstrap_ready', 'duplicate_review',
                   'under_review', 'claimed', 'disputed'
               )
         )",
    )
    .bind(&invitation_id)
    .fetch_one(&mut *transaction)
    .await?;
    if active_claim_exists {
        transaction.rollback().await?;
        return Ok(PersistedOrganizationClaimOutcome::Conflict);
    }

    let (display_name, name_fingerprint, organization_id, status, assigned_function, reason_code) =
        if request.claim_kind == "existing_relationship" {
            let requested_organization_id = request.organization_id.as_deref().unwrap_or_default();
            let relationship = sqlx::query(
                "SELECT organization.id, organization.display_name
                 FROM organization_memberships membership
                 JOIN organizations organization ON organization.id = membership.organization_id
                 WHERE membership.user_id = $1
                   AND membership.organization_id = $2
                   AND membership.status = 'active'
                   AND organization.status = 'active'
                   AND organization.organization_type = 'yard_care_company'
                 ORDER BY membership.role
                 LIMIT 1",
            )
            .bind(recipient_user_id)
            .bind(requested_organization_id.trim())
            .fetch_optional(&mut *transaction)
            .await?;
            let Some(relationship) = relationship else {
                transaction.rollback().await?;
                return Ok(PersistedOrganizationClaimOutcome::NotFound);
            };
            let display_name: String = relationship.get("display_name");
            (
                display_name.clone(),
                provider_name_fingerprint(&display_name),
                Some(relationship.get::<String, _>("id")),
                "relationship_checked",
                None,
                None,
            )
        } else {
            let display_name = request
                .provider_display_name
                .as_deref()
                .unwrap_or_default()
                .trim()
                .split_whitespace()
                .collect::<Vec<_>>()
                .join(" ");
            let name_fingerprint = provider_name_fingerprint(&display_name);
            let existing_names = sqlx::query_scalar::<_, String>(
                "SELECT display_name FROM organizations
                 WHERE status = 'active' AND organization_type = 'yard_care_company'",
            )
            .fetch_all(&mut *transaction)
            .await?;
            let possible_duplicate = existing_names
                .iter()
                .any(|name| provider_name_fingerprint(name) == name_fingerprint);
            if possible_duplicate {
                (
                    display_name,
                    name_fingerprint,
                    None,
                    "duplicate_review",
                    Some("provider_operations"),
                    Some("possible_duplicate"),
                )
            } else {
                (
                    display_name,
                    name_fingerprint,
                    None,
                    "bootstrap_ready",
                    None,
                    None,
                )
            }
        };
    let claim_id = format!("owner_provider_claim_{}", Uuid::new_v4().simple());
    let row = sqlx::query(
        "INSERT INTO owner_provider_invitation_organization_claims (
             id, invitation_id, recipient_check_id, actor_user_id, claim_kind,
             proposed_display_name, normalized_name_fingerprint, organization_id,
             status, authority_attested_at, reason_code, assigned_function,
             idempotency_key
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9,
             CASE WHEN $10 THEN NOW() ELSE NULL END, $11, $12, $13
         )
         RETURNING id, invitation_id, claim_kind, proposed_display_name,
                   organization_id, status, assigned_function, version",
    )
    .bind(&claim_id)
    .bind(&invitation_id)
    .bind(invitation.get::<String, _>("recipient_check_id"))
    .bind(recipient_user_id)
    .bind(&request.claim_kind)
    .bind(&display_name)
    .bind(&name_fingerprint)
    .bind(organization_id.as_deref())
    .bind(status)
    .bind(request.authority_attested)
    .bind(reason_code)
    .bind(assigned_function)
    .bind(request.idempotency_key.trim())
    .fetch_one(&mut *transaction)
    .await?;
    let owner_user_id: String = invitation.get("owner_user_id");
    let property_id: String = invitation.get("property_id");
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_invitation_organization_claim_created', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(&owner_user_id)
    .bind(&property_id)
    .bind(serde_json::json!({
        "invitation_id": invitation_id,
        "claim_id": claim_id,
        "claim_kind": request.claim_kind,
        "status": status,
    }))
    .execute(&mut *transaction)
    .await?;
    if status == "duplicate_review" {
        sqlx::query(
            "INSERT INTO owner_acquisition_events (
                 id, owner_user_id, property_id, event_kind, event_data
             ) VALUES ($1, $2, $3, 'provider_invitation_organization_duplicate_review', $4)",
        )
        .bind(format!("owner_event_{}", Uuid::new_v4()))
        .bind(&owner_user_id)
        .bind(&property_id)
        .bind(serde_json::json!({
            "invitation_id": invitation_id,
            "claim_id": claim_id,
            "status": status,
            "assigned_function": "provider_operations",
        }))
        .execute(&mut *transaction)
        .await?;
    }
    transaction.commit().await?;
    Ok(PersistedOrganizationClaimOutcome::Created(
        owner_provider_organization_claim_from_row(&row, true),
    ))
}

fn owner_provider_organization_claim_from_row(
    row: &sqlx::postgres::PgRow,
    persisted: bool,
) -> OwnerProviderOrganizationClaimRecord {
    let claim_kind: String = row.get("claim_kind");
    OwnerProviderOrganizationClaimRecord {
        claim_id: row.get("id"),
        invitation_id: row.get("invitation_id"),
        claim_kind: claim_kind.clone(),
        proposed_display_name: row.get("proposed_display_name"),
        organization_id: row.get("organization_id"),
        status: row.get("status"),
        assigned_function: row.get("assigned_function"),
        version: row.get("version"),
        organization_relationship_checked: claim_kind == "existing_relationship",
        opportunity_response_capability: false,
        persisted,
    }
}

enum PersistedOrganizationBootstrapOutcome {
    Bootstrapped(OwnerProviderOrganizationClaimRecord),
    Replayed(OwnerProviderOrganizationClaimRecord),
    DuplicateReview(OwnerProviderOrganizationClaimRecord),
    NotFound,
    InvalidState,
    Conflict,
}

#[allow(clippy::too_many_arguments)]
async fn bootstrap_owner_provider_organization_claim(
    pool: &PgPool,
    recipient_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    claim_id: &str,
    request: BootstrapOwnerProviderOrganizationClaimRequest,
    token_hash: &str,
) -> Result<PersistedOrganizationBootstrapOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let claim = sqlx::query(
        "SELECT claim.id, claim.invitation_id, claim.claim_kind,
                claim.proposed_display_name, claim.normalized_name_fingerprint,
                claim.organization_id, claim.status, claim.assigned_function,
                claim.version, claim.actor_user_id, claim.bootstrap_idempotency_key,
                invitation.owner_user_id, invitation.property_id,
                invitation.status AS invitation_status,
                invitation.expires_at <= NOW() AS expired,
                recipient_check.recipient_user_id,
                recipient_check.verified_email_fingerprint,
                recipient_check.status AS recipient_check_status
         FROM owner_provider_invitation_organization_claims claim
         JOIN owner_provider_invitations invitation ON invitation.id = claim.invitation_id
         JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.id = claim.recipient_check_id
         WHERE claim.id = $1
           AND invitation.token_hash = $2
           AND LOWER(invitation.recipient_email) = LOWER($3)
         FOR UPDATE OF claim, invitation",
    )
    .bind(claim_id)
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(claim) = claim else {
        transaction.rollback().await?;
        return Ok(PersistedOrganizationBootstrapOutcome::NotFound);
    };
    let recipient_checked = claim.get::<String, _>("actor_user_id") == recipient_user_id
        && claim.get::<String, _>("recipient_user_id") == recipient_user_id
        && claim.get::<String, _>("verified_email_fingerprint") == verified_email_fingerprint
        && claim.get::<String, _>("recipient_check_status") == "checked";
    if claim.get::<String, _>("invitation_status") != "opened"
        || claim.get::<bool, _>("expired")
        || !recipient_checked
    {
        transaction.rollback().await?;
        return Ok(PersistedOrganizationBootstrapOutcome::InvalidState);
    }
    let status: String = claim.get("status");
    let existing_bootstrap_key: Option<String> = claim.get("bootstrap_idempotency_key");
    if status == "claimed"
        && existing_bootstrap_key.as_deref() == Some(request.idempotency_key.trim())
    {
        transaction.commit().await?;
        return Ok(PersistedOrganizationBootstrapOutcome::Replayed(
            owner_provider_organization_claim_from_row(&claim, true),
        ));
    }
    if claim.get::<String, _>("claim_kind") != "new_organization" || status != "bootstrap_ready" {
        transaction.rollback().await?;
        return Ok(PersistedOrganizationBootstrapOutcome::InvalidState);
    }
    if claim.get::<i64, _>("version") != request.expected_version {
        transaction.rollback().await?;
        return Ok(PersistedOrganizationBootstrapOutcome::Conflict);
    }
    let name_fingerprint: String = claim.get("normalized_name_fingerprint");
    sqlx::query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))")
        .bind(&name_fingerprint)
        .execute(&mut *transaction)
        .await?;
    let existing_names = sqlx::query_scalar::<_, String>(
        "SELECT display_name FROM organizations
         WHERE status = 'active' AND organization_type = 'yard_care_company'",
    )
    .fetch_all(&mut *transaction)
    .await?;
    let possible_duplicate = existing_names
        .iter()
        .any(|name| provider_name_fingerprint(name) == name_fingerprint);
    let owner_user_id: String = claim.get("owner_user_id");
    let property_id: String = claim.get("property_id");
    let invitation_id: String = claim.get("invitation_id");
    if possible_duplicate {
        let row = sqlx::query(
            "UPDATE owner_provider_invitation_organization_claims
             SET status = 'duplicate_review', reason_code = 'possible_duplicate',
                 assigned_function = 'provider_operations', version = version + 1,
                 updated_at = NOW()
             WHERE id = $1
             RETURNING id, invitation_id, claim_kind, proposed_display_name,
                       organization_id, status, assigned_function, version",
        )
        .bind(claim_id)
        .fetch_one(&mut *transaction)
        .await?;
        sqlx::query(
            "INSERT INTO owner_acquisition_events (
                 id, owner_user_id, property_id, event_kind, event_data
             ) VALUES ($1, $2, $3, 'provider_invitation_organization_duplicate_review', $4)",
        )
        .bind(format!("owner_event_{}", Uuid::new_v4()))
        .bind(&owner_user_id)
        .bind(&property_id)
        .bind(serde_json::json!({
            "invitation_id": invitation_id,
            "claim_id": claim_id,
            "status": "duplicate_review",
            "assigned_function": "provider_operations",
            "source": "final_bootstrap_rescan",
        }))
        .execute(&mut *transaction)
        .await?;
        transaction.commit().await?;
        return Ok(PersistedOrganizationBootstrapOutcome::DuplicateReview(
            owner_provider_organization_claim_from_row(&row, true),
        ));
    }

    let organization_id = format!("org_provider_{}", Uuid::new_v4().simple());
    let membership_id = format!("membership_provider_{}", Uuid::new_v4().simple());
    let display_name: String = claim.get("proposed_display_name");
    sqlx::query(
        "INSERT INTO organizations (id, display_name, organization_type, status)
         VALUES ($1, $2, 'yard_care_company', 'active')",
    )
    .bind(&organization_id)
    .bind(&display_name)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO organization_memberships (
             id, organization_id, user_id, display_name, role, status,
             scope_type, scope_id
         ) VALUES (
             $1, $2, $3, $3, 'organization_owner', 'active',
             'organization', $2
         )",
    )
    .bind(&membership_id)
    .bind(&organization_id)
    .bind(recipient_user_id)
    .execute(&mut *transaction)
    .await?;
    let row = sqlx::query(
        "UPDATE owner_provider_invitation_organization_claims
         SET organization_id = $2, status = 'claimed', reason_code = NULL,
             assigned_function = NULL, bootstrap_membership_id = $3,
             bootstrap_idempotency_key = $4, bootstrapped_at = NOW(),
             version = version + 1, updated_at = NOW()
         WHERE id = $1
         RETURNING id, invitation_id, claim_kind, proposed_display_name,
                   organization_id, status, assigned_function, version",
    )
    .bind(claim_id)
    .bind(&organization_id)
    .bind(&membership_id)
    .bind(request.idempotency_key.trim())
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO access_audit_events (
             id, actor_user_id, organization_id, event_kind, target_id, occurred_at
         ) VALUES ($1, $2, $3, 'organization_bootstrapped', $3, NOW())",
    )
    .bind(format!(
        "audit_organization_bootstrapped_{}",
        Uuid::new_v4().simple()
    ))
    .bind(recipient_user_id)
    .bind(&organization_id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_invitation_organization_bootstrapped', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(&owner_user_id)
    .bind(&property_id)
    .bind(serde_json::json!({
        "invitation_id": invitation_id,
        "claim_id": claim_id,
        "organization_id": organization_id,
        "status": "claimed",
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(PersistedOrganizationBootstrapOutcome::Bootstrapped(
        owner_provider_organization_claim_from_row(&row, true),
    ))
}

async fn list_owner_provider_organization_claim_reviews(
    pool: &PgPool,
    status: Option<&str>,
) -> Result<Vec<OwnerProviderClaimReviewRecord>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, claim_kind, proposed_display_name, status, reason_code,
                assigned_function, version,
                EXTRACT(EPOCH FROM updated_at)::BIGINT AS updated_at_epoch_seconds,
                CASE
                  WHEN status = 'disputed' THEN 'priority'
                  WHEN status = 'duplicate_review' AND updated_at <= NOW() - INTERVAL '2 days' THEN 'overdue'
                  WHEN status = 'duplicate_review' AND updated_at <= NOW() - INTERVAL '1 day' THEN 'due'
                  WHEN status = 'under_review' AND updated_at <= NOW() - INTERVAL '3 days' THEN 'overdue'
                  WHEN status = 'under_review' AND updated_at <= NOW() - INTERVAL '2 days' THEN 'due'
                  ELSE 'fresh'
                END AS age_band
         FROM owner_provider_invitation_organization_claims
         WHERE status IN ('duplicate_review', 'under_review', 'disputed')
           AND ($1::TEXT IS NULL OR status = $1)
         ORDER BY
           CASE status WHEN 'disputed' THEN 0 WHEN 'duplicate_review' THEN 1 ELSE 2 END,
           updated_at, id",
    )
    .bind(status)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .iter()
        .map(owner_provider_claim_review_from_row)
        .collect())
}

async fn owner_provider_organization_claim_review_metrics(
    pool: &PgPool,
) -> Result<OwnerProviderClaimReviewMetrics, sqlx::Error> {
    let row = sqlx::query(
        "SELECT
           EXTRACT(EPOCH FROM NOW())::BIGINT AS generated_at_epoch_seconds,
           COUNT(*) FILTER (WHERE status = 'duplicate_review')::BIGINT AS duplicate_review_count,
           COUNT(*) FILTER (WHERE status = 'under_review')::BIGINT AS under_review_count,
           COUNT(*) FILTER (WHERE status = 'disputed')::BIGINT AS disputed_count,
           COUNT(*) FILTER (
             WHERE (status = 'duplicate_review'
                       AND updated_at <= NOW() - INTERVAL '1 day'
                       AND updated_at > NOW() - INTERVAL '2 days')
                OR (status = 'under_review'
                       AND updated_at <= NOW() - INTERVAL '2 days'
                       AND updated_at > NOW() - INTERVAL '3 days')
           )::BIGINT AS due_count,
           COUNT(*) FILTER (
             WHERE (status = 'duplicate_review' AND updated_at <= NOW() - INTERVAL '2 days')
                OR (status = 'under_review' AND updated_at <= NOW() - INTERVAL '3 days')
           )::BIGINT AS overdue_count,
           COUNT(*) FILTER (WHERE status = 'disputed')::BIGINT AS priority_count,
           EXTRACT(EPOCH FROM (NOW() - MIN(updated_at)))::BIGINT AS oldest_age_seconds
         FROM owner_provider_invitation_organization_claims
         WHERE status IN ('duplicate_review', 'under_review', 'disputed')",
    )
    .fetch_one(pool)
    .await?;
    Ok(OwnerProviderClaimReviewMetrics {
        generated_at_epoch_seconds: row.get("generated_at_epoch_seconds"),
        duplicate_review_count: row.get("duplicate_review_count"),
        under_review_count: row.get("under_review_count"),
        disputed_count: row.get("disputed_count"),
        due_count: row.get("due_count"),
        overdue_count: row.get("overdue_count"),
        priority_count: row.get("priority_count"),
        oldest_age_seconds: row.get("oldest_age_seconds"),
    })
}

async fn get_owner_provider_organization_claim_review(
    pool: &PgPool,
    claim_id: &str,
) -> Result<Option<OwnerProviderClaimReviewRecord>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, claim_kind, proposed_display_name, status, reason_code,
                assigned_function, version,
                EXTRACT(EPOCH FROM updated_at)::BIGINT AS updated_at_epoch_seconds,
                CASE WHEN status = 'disputed' THEN 'priority' ELSE 'fresh' END AS age_band
         FROM owner_provider_invitation_organization_claims WHERE id = $1",
    )
    .bind(claim_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.as_ref().map(owner_provider_claim_review_from_row))
}

fn owner_provider_claim_review_from_row(
    row: &sqlx::postgres::PgRow,
) -> OwnerProviderClaimReviewRecord {
    OwnerProviderClaimReviewRecord {
        claim_id: row.get("id"),
        claim_kind: row.get("claim_kind"),
        proposed_display_name: row.get("proposed_display_name"),
        status: row.get("status"),
        reason_code: row.get("reason_code"),
        assigned_function: row.get("assigned_function"),
        version: row.get("version"),
        age_band: row.get("age_band"),
        updated_at_epoch_seconds: row.get("updated_at_epoch_seconds"),
        opportunity_response_capability: false,
    }
}

enum PersistedClaimReviewDecisionOutcome {
    Updated(OwnerProviderClaimReviewRecord),
    Replayed(OwnerProviderClaimReviewRecord),
    NotFound,
    InvalidState,
    Conflict,
}

async fn decide_owner_provider_organization_claim_review(
    pool: &PgPool,
    actor_user_id: &str,
    claim_id: &str,
    request: DecideOwnerProviderClaimReviewRequest,
) -> Result<PersistedClaimReviewDecisionOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let replay_claim_id = sqlx::query_scalar::<_, String>(
        "SELECT claim_id FROM owner_provider_organization_claim_review_events
         WHERE actor_user_id = $1 AND idempotency_key = $2",
    )
    .bind(actor_user_id)
    .bind(request.idempotency_key.trim())
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(replay_claim_id) = replay_claim_id {
        transaction.commit().await?;
        if replay_claim_id != claim_id {
            return Ok(PersistedClaimReviewDecisionOutcome::Conflict);
        }
        return Ok(
            match get_owner_provider_organization_claim_review(pool, claim_id).await? {
                Some(review) => PersistedClaimReviewDecisionOutcome::Replayed(review),
                None => PersistedClaimReviewDecisionOutcome::NotFound,
            },
        );
    }
    let claim = sqlx::query(
        "SELECT claim.status, claim.version, invitation.owner_user_id,
                invitation.property_id, claim.invitation_id,
                active_appeal.id AS active_appeal_id,
                active_appeal.rejecting_actor_user_id
         FROM owner_provider_invitation_organization_claims claim
         JOIN owner_provider_invitations invitation ON invitation.id = claim.invitation_id
         LEFT JOIN LATERAL (
             SELECT appeal.id, rejection.actor_user_id AS rejecting_actor_user_id
             FROM owner_provider_organization_claim_review_events appeal
             JOIN owner_provider_organization_claim_review_events rejection
               ON rejection.id = appeal.appeal_of_review_event_id
             WHERE appeal.claim_id = claim.id AND appeal.action = 'appeal_submitted'
               AND NOT EXISTS (
                   SELECT 1 FROM owner_provider_organization_claim_review_events decision
                   WHERE decision.action = 'appeal_decided'
                     AND decision.appeal_of_review_event_id = appeal.id
               )
             ORDER BY appeal.occurred_at DESC, appeal.id DESC LIMIT 1
         ) active_appeal ON TRUE
         WHERE claim.id = $1 FOR UPDATE OF claim",
    )
    .bind(claim_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(claim) = claim else {
        transaction.rollback().await?;
        return Ok(PersistedClaimReviewDecisionOutcome::NotFound);
    };
    if claim.get::<i64, _>("version") != request.expected_version {
        transaction.rollback().await?;
        return Ok(PersistedClaimReviewDecisionOutcome::Conflict);
    }
    let prior_status: String = claim.get("status");
    let active_appeal_id: Option<String> = claim.get("active_appeal_id");
    let rejecting_actor_user_id: Option<String> = claim.get("rejecting_actor_user_id");
    let appeal_action = matches!(
        request.action.as_str(),
        "appeal_approved" | "appeal_rejected"
    );
    if appeal_action && rejecting_actor_user_id.as_deref() == Some(actor_user_id) {
        transaction.rollback().await?;
        return Ok(PersistedClaimReviewDecisionOutcome::Conflict);
    }
    if (appeal_action && active_appeal_id.is_none())
        || (!appeal_action && active_appeal_id.is_some())
    {
        transaction.rollback().await?;
        return Ok(PersistedClaimReviewDecisionOutcome::InvalidState);
    }
    let resulting_status = match (request.action.as_str(), prior_status.as_str()) {
        ("review_started", "duplicate_review") => "under_review",
        ("cleared_for_bootstrap", "duplicate_review" | "under_review") => "bootstrap_ready",
        ("rejected", "duplicate_review" | "under_review") => "rejected",
        ("dispute_paused", "relationship_checked" | "claimed") => "disputed",
        ("appeal_approved", "under_review") => "bootstrap_ready",
        ("appeal_rejected", "under_review") => "rejected",
        _ => {
            transaction.rollback().await?;
            return Ok(PersistedClaimReviewDecisionOutcome::InvalidState);
        }
    };
    let assigned_function = match resulting_status {
        "bootstrap_ready" | "rejected" => None,
        _ => Some("provider_operations"),
    };
    let resulting_reason_code = if request.action == "review_started" {
        Some("possible_duplicate")
    } else {
        request.reason_code.as_deref()
    };
    sqlx::query(
        "UPDATE owner_provider_invitation_organization_claims
         SET status = $2, reason_code = $3, assigned_function = $4,
             version = version + 1, updated_at = NOW()
         WHERE id = $1",
    )
    .bind(claim_id)
    .bind(resulting_status)
    .bind(resulting_reason_code)
    .bind(assigned_function)
    .execute(&mut *transaction)
    .await?;
    if resulting_status == "disputed" {
        reconcile_owner_provider_response_capability(
            &mut transaction,
            &claim.get::<String, _>("invitation_id"),
            &claim.get::<String, _>("owner_user_id"),
            &claim.get::<String, _>("property_id"),
            "suspended",
            "claim_disputed",
        )
        .await?;
    }
    let stored_action = if appeal_action {
        "appeal_decided"
    } else {
        request.action.as_str()
    };
    sqlx::query(
        "INSERT INTO owner_provider_organization_claim_review_events (
             id, claim_id, actor_user_id, actor_function, action, prior_status,
             resulting_status, reason_code, evidence_reference,
             expected_claim_version, idempotency_key, appeal_of_review_event_id
         ) VALUES ($1, $2, $3, 'provider_operations', $4, $5, $6, $7, $8, $9, $10, $11)",
    )
    .bind(format!("provider_claim_review_{}", Uuid::new_v4().simple()))
    .bind(claim_id)
    .bind(actor_user_id)
    .bind(stored_action)
    .bind(&prior_status)
    .bind(resulting_status)
    .bind(request.reason_code.as_deref())
    .bind(request.evidence_reference.as_deref())
    .bind(request.expected_version)
    .bind(request.idempotency_key.trim())
    .bind(active_appeal_id.as_deref())
    .execute(&mut *transaction)
    .await?;
    let event_kind = if appeal_action {
        "provider_invitation_organization_appeal_decided"
    } else if request.action == "review_started" {
        "provider_invitation_organization_review_started"
    } else {
        "provider_invitation_organization_review_dispositioned"
    };
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(claim.get::<String, _>("owner_user_id"))
    .bind(claim.get::<String, _>("property_id"))
    .bind(event_kind)
    .bind(serde_json::json!({
        "invitation_id": claim.get::<String, _>("invitation_id"),
        "claim_id": claim_id,
        "action": request.action,
        "status": resulting_status,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(
        match get_owner_provider_organization_claim_review(pool, claim_id).await? {
            Some(review) => PersistedClaimReviewDecisionOutcome::Updated(review),
            None => PersistedClaimReviewDecisionOutcome::NotFound,
        },
    )
}

enum PersistedClaimAppealOutcome {
    Submitted(OwnerProviderClaimReviewRecord),
    Replayed(OwnerProviderClaimReviewRecord),
    NotFound,
    InvalidState,
    Conflict,
}

#[allow(clippy::too_many_arguments)]
async fn appeal_owner_provider_organization_claim(
    pool: &PgPool,
    recipient_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    claim_id: &str,
    request: AppealOwnerProviderOrganizationClaimRequest,
    token_hash: &str,
) -> Result<PersistedClaimAppealOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let replay_claim_id = sqlx::query_scalar::<_, String>(
        "SELECT event.claim_id
         FROM owner_provider_organization_claim_review_events event
         JOIN owner_provider_invitation_organization_claims claim ON claim.id = event.claim_id
         JOIN owner_provider_invitations invitation ON invitation.id = claim.invitation_id
         WHERE event.actor_user_id = $1 AND event.idempotency_key = $2
           AND event.action = 'appeal_submitted'
           AND invitation.token_hash = $3
           AND LOWER(invitation.recipient_email) = LOWER($4)",
    )
    .bind(recipient_user_id)
    .bind(request.idempotency_key.trim())
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(replay_claim_id) = replay_claim_id {
        transaction.commit().await?;
        if replay_claim_id != claim_id {
            return Ok(PersistedClaimAppealOutcome::Conflict);
        }
        return Ok(
            match get_owner_provider_organization_claim_review(pool, claim_id).await? {
                Some(review) => PersistedClaimAppealOutcome::Replayed(review),
                None => PersistedClaimAppealOutcome::NotFound,
            },
        );
    }
    let claim = sqlx::query(
        "SELECT claim.status, claim.version, claim.invitation_id,
                invitation.owner_user_id, invitation.property_id,
                invitation.status AS invitation_status,
                invitation.expires_at <= NOW() AS expired,
                recipient_check.recipient_user_id,
                recipient_check.verified_email_fingerprint,
                recipient_check.status AS recipient_check_status,
                rejection.id AS rejection_event_id
         FROM owner_provider_invitation_organization_claims claim
         JOIN owner_provider_invitations invitation ON invitation.id = claim.invitation_id
         JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.id = claim.recipient_check_id
         LEFT JOIN LATERAL (
             SELECT event.id
             FROM owner_provider_organization_claim_review_events event
             WHERE event.claim_id = claim.id
               AND event.resulting_status = 'rejected'
             ORDER BY event.occurred_at DESC, event.id DESC LIMIT 1
         ) rejection ON TRUE
         WHERE claim.id = $1 AND invitation.token_hash = $2
           AND LOWER(invitation.recipient_email) = LOWER($3)
         FOR UPDATE OF claim, invitation",
    )
    .bind(claim_id)
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(claim) = claim else {
        transaction.rollback().await?;
        return Ok(PersistedClaimAppealOutcome::NotFound);
    };
    let recipient_checked = claim.get::<String, _>("recipient_user_id") == recipient_user_id
        && claim.get::<String, _>("verified_email_fingerprint") == verified_email_fingerprint
        && claim.get::<String, _>("recipient_check_status") == "checked";
    if !recipient_checked
        || claim.get::<String, _>("invitation_status") != "opened"
        || claim.get::<bool, _>("expired")
    {
        transaction.rollback().await?;
        return Ok(PersistedClaimAppealOutcome::InvalidState);
    }
    if claim.get::<String, _>("status") != "rejected" {
        transaction.rollback().await?;
        return Ok(PersistedClaimAppealOutcome::InvalidState);
    }
    if claim.get::<i64, _>("version") != request.expected_version {
        transaction.rollback().await?;
        return Ok(PersistedClaimAppealOutcome::Conflict);
    }
    let rejection_event_id: Option<String> = claim.get("rejection_event_id");
    let Some(rejection_event_id) = rejection_event_id else {
        transaction.rollback().await?;
        return Ok(PersistedClaimAppealOutcome::InvalidState);
    };
    sqlx::query(
        "UPDATE owner_provider_invitation_organization_claims
         SET status = 'under_review', reason_code = $2,
             assigned_function = 'provider_operations', version = version + 1,
             updated_at = NOW() WHERE id = $1",
    )
    .bind(claim_id)
    .bind(&request.category)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_organization_claim_review_events (
             id, claim_id, actor_user_id, actor_function, action, prior_status,
             resulting_status, reason_code, evidence_reference,
             expected_claim_version, idempotency_key, appeal_of_review_event_id
         ) VALUES (
             $1, $2, $3, 'checked_recipient', 'appeal_submitted', 'rejected',
             'under_review', $4, $5, $6, $7, $8
         )",
    )
    .bind(format!("provider_claim_appeal_{}", Uuid::new_v4().simple()))
    .bind(claim_id)
    .bind(recipient_user_id)
    .bind(&request.category)
    .bind(request.evidence_reference.trim())
    .bind(request.expected_version)
    .bind(request.idempotency_key.trim())
    .bind(&rejection_event_id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_invitation_organization_appealed', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(claim.get::<String, _>("owner_user_id"))
    .bind(claim.get::<String, _>("property_id"))
    .bind(serde_json::json!({
        "invitation_id": claim.get::<String, _>("invitation_id"),
        "claim_id": claim_id,
        "status": "under_review",
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(
        match get_owner_provider_organization_claim_review(pool, claim_id).await? {
            Some(review) => PersistedClaimAppealOutcome::Submitted(review),
            None => PersistedClaimAppealOutcome::NotFound,
        },
    )
}

enum PersistedResponseCapabilityOutcome {
    Issued(OwnerProviderResponseCapabilityRecord),
    Replayed(OwnerProviderResponseCapabilityRecord),
    NotFound,
    InvalidState,
    Conflict,
}

#[allow(clippy::too_many_arguments)]
async fn issue_owner_provider_response_capability(
    pool: &PgPool,
    recipient_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    claim_id: &str,
    request: IssueOwnerProviderResponseCapabilityRequest,
    token_hash: &str,
) -> Result<PersistedResponseCapabilityOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let replay = sqlx::query(
        "SELECT capability.id, capability.invitation_id, capability.claim_id,
                capability.organization_id, capability.brief_version,
                capability.purpose, capability.allowed_actions,
                capability.withheld_categories, capability.status,
                EXTRACT(EPOCH FROM capability.expires_at)::BIGINT AS expires_at_epoch_seconds,
                capability.version
         FROM owner_provider_invitation_response_capabilities capability
         JOIN owner_provider_invitation_organization_claims claim ON claim.id = capability.claim_id
         JOIN owner_provider_invitations invitation ON invitation.id = capability.invitation_id
         WHERE capability.actor_user_id = $1 AND capability.idempotency_key = $2
           AND claim.id = $3 AND invitation.token_hash = $4
           AND LOWER(invitation.recipient_email) = LOWER($5)",
    )
    .bind(recipient_user_id)
    .bind(request.idempotency_key.trim())
    .bind(claim_id)
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(replay) = replay {
        transaction.commit().await?;
        return Ok(PersistedResponseCapabilityOutcome::Replayed(
            owner_provider_response_capability_from_row(&replay, true),
        ));
    }
    let eligibility = sqlx::query(
        "SELECT claim.invitation_id, claim.organization_id, claim.status AS claim_status,
                claim.actor_user_id, invitation.owner_user_id, invitation.property_id,
                invitation.brief_id, invitation.brief_version,
                invitation.status AS invitation_status,
                invitation.expires_at <= NOW() AS expired,
                recipient_check.id AS recipient_check_id,
                recipient_check.recipient_user_id,
                recipient_check.verified_email_fingerprint,
                recipient_check.status AS recipient_check_status,
                organization.status AS organization_status,
                organization.organization_type,
                EXISTS (
                    SELECT 1 FROM organization_memberships membership
                    WHERE membership.organization_id = claim.organization_id
                      AND membership.user_id = $4 AND membership.status = 'active'
                ) AS active_membership,
                EXISTS (
                    SELECT 1 FROM owner_provider_invitation_response_capabilities capability
                    WHERE capability.invitation_id = invitation.id AND capability.status = 'active'
                ) AS active_capability
         FROM owner_provider_invitation_organization_claims claim
         JOIN owner_provider_invitations invitation ON invitation.id = claim.invitation_id
         JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.id = claim.recipient_check_id
         LEFT JOIN organizations organization ON organization.id = claim.organization_id
         WHERE claim.id = $1 AND invitation.token_hash = $2
           AND LOWER(invitation.recipient_email) = LOWER($3)
         FOR UPDATE OF claim, invitation",
    )
    .bind(claim_id)
    .bind(token_hash)
    .bind(verified_email)
    .bind(recipient_user_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(eligibility) = eligibility else {
        transaction.rollback().await?;
        return Ok(PersistedResponseCapabilityOutcome::NotFound);
    };
    let actor_checked = eligibility.get::<String, _>("actor_user_id") == recipient_user_id
        && eligibility.get::<String, _>("recipient_user_id") == recipient_user_id
        && eligibility.get::<String, _>("verified_email_fingerprint") == verified_email_fingerprint
        && eligibility.get::<String, _>("recipient_check_status") == "checked";
    let relationship_checked = matches!(
        eligibility.get::<String, _>("claim_status").as_str(),
        "relationship_checked" | "claimed"
    );
    let organization_active = eligibility
        .try_get::<String, _>("organization_status")
        .is_ok_and(|status| status == "active")
        && eligibility
            .try_get::<String, _>("organization_type")
            .is_ok_and(|kind| kind == "yard_care_company");
    if !actor_checked
        || !relationship_checked
        || !organization_active
        || !eligibility.get::<bool, _>("active_membership")
        || eligibility.get::<String, _>("invitation_status") != "opened"
        || eligibility.get::<bool, _>("expired")
    {
        transaction.rollback().await?;
        return Ok(PersistedResponseCapabilityOutcome::InvalidState);
    }
    if eligibility.get::<bool, _>("active_capability") {
        transaction.rollback().await?;
        return Ok(PersistedResponseCapabilityOutcome::Conflict);
    }
    let organization_id: Option<String> = eligibility.get("organization_id");
    let Some(organization_id) = organization_id else {
        transaction.rollback().await?;
        return Ok(PersistedResponseCapabilityOutcome::InvalidState);
    };
    let invitation_id: String = eligibility.get("invitation_id");
    let capability_id = format!("owner_provider_capability_{}", Uuid::new_v4().simple());
    let row = sqlx::query(
        "INSERT INTO owner_provider_invitation_response_capabilities (
             id, invitation_id, recipient_check_id, claim_id, organization_id,
             actor_user_id, owner_user_id, property_id, brief_id, brief_version,
             purpose, allowed_actions, withheld_categories, status,
             withheld_acknowledged_at, expires_at, idempotency_key
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
             'known_provider_yard_assessment_response',
             ARRAY['preliminary_question', 'express_interest', 'decline', 'report']::TEXT[],
             ARRAY['exact_address', 'yard_photos', 'owner_contact',
                   'access_considerations', 'pricing_and_work_authority']::TEXT[],
             'active', NOW(),
             (SELECT expires_at FROM owner_provider_invitations WHERE id = $2), $11
         )
         RETURNING id, invitation_id, claim_id, organization_id, brief_version,
                   purpose, allowed_actions, withheld_categories, status,
                   EXTRACT(EPOCH FROM expires_at)::BIGINT AS expires_at_epoch_seconds,
                   version",
    )
    .bind(&capability_id)
    .bind(&invitation_id)
    .bind(eligibility.get::<String, _>("recipient_check_id"))
    .bind(claim_id)
    .bind(&organization_id)
    .bind(recipient_user_id)
    .bind(eligibility.get::<String, _>("owner_user_id"))
    .bind(eligibility.get::<String, _>("property_id"))
    .bind(eligibility.get::<String, _>("brief_id"))
    .bind(eligibility.get::<i64, _>("brief_version"))
    .bind(request.idempotency_key.trim())
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_invitation_response_capability_issued', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(eligibility.get::<String, _>("owner_user_id"))
    .bind(eligibility.get::<String, _>("property_id"))
    .bind(serde_json::json!({
        "invitation_id": invitation_id,
        "claim_id": claim_id,
        "capability_id": capability_id,
        "organization_id": organization_id,
        "purpose": "known_provider_yard_assessment_response",
        "allowed_actions": ["preliminary_question", "express_interest", "decline", "report"],
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(PersistedResponseCapabilityOutcome::Issued(
        owner_provider_response_capability_from_row(&row, true),
    ))
}

fn owner_provider_response_capability_from_row(
    row: &sqlx::postgres::PgRow,
    persisted: bool,
) -> OwnerProviderResponseCapabilityRecord {
    let status: String = row.get("status");
    OwnerProviderResponseCapabilityRecord {
        capability_id: row.get("id"),
        invitation_id: row.get("invitation_id"),
        claim_id: row.get("claim_id"),
        organization_id: row.get("organization_id"),
        brief_version: row.get("brief_version"),
        purpose: row.get("purpose"),
        allowed_actions: row.get("allowed_actions"),
        withheld_categories: row.get("withheld_categories"),
        status: status.clone(),
        expires_at_epoch_seconds: row.get("expires_at_epoch_seconds"),
        version: row.get("version"),
        opportunity_response_capability: status == "active",
        persisted,
    }
}

async fn report_owner_provider_invitation_abuse(
    pool: &PgPool,
    reporter_user_id: &str,
    verified_email: &str,
    request: ReportOwnerProviderInvitationAbuseRequest,
    token_hash: &str,
) -> Result<PersistedAbuseReportOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let replay = sqlx::query(
        "SELECT report.id, report.invitation_id, report.category, report.severity,
                report.assigned_function, report.status, report.block_future_invitations
         FROM owner_provider_invitation_abuse_reports report
         JOIN owner_provider_invitations invitation ON invitation.id = report.invitation_id
         WHERE report.reporter_user_id = $1
           AND report.idempotency_key = $2
           AND invitation.token_hash = $3
           AND LOWER(invitation.recipient_email) = LOWER($4)",
    )
    .bind(reporter_user_id)
    .bind(request.idempotency_key.trim())
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(row) = replay {
        transaction.commit().await?;
        return Ok(PersistedAbuseReportOutcome::Replayed(
            owner_provider_abuse_report_from_row(&row, true),
        ));
    }
    let invitation = sqlx::query(
        "SELECT id, owner_user_id, property_id, recipient_email, status
         FROM owner_provider_invitations
         WHERE token_hash = $1 AND LOWER(recipient_email) = LOWER($2)
         FOR UPDATE",
    )
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(invitation) = invitation else {
        transaction.rollback().await?;
        return Ok(PersistedAbuseReportOutcome::NotFound);
    };
    let invitation_id: String = invitation.get("id");
    let owner_user_id: String = invitation.get("owner_user_id");
    let property_id: String = invitation.get("property_id");
    let recipient_email: String = invitation.get("recipient_email");
    let invitation_status: String = invitation.get("status");
    let existing_report = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_provider_invitation_abuse_reports
             WHERE invitation_id = $1 AND reporter_user_id = $2
         )",
    )
    .bind(&invitation_id)
    .bind(reporter_user_id)
    .fetch_one(&mut *transaction)
    .await?;
    if existing_report {
        transaction.rollback().await?;
        return Ok(PersistedAbuseReportOutcome::Conflict);
    }
    let report_id = format!("owner_provider_abuse_{}", Uuid::new_v4().simple());
    let severity = abuse_report_severity(&request.category);
    let row = sqlx::query(
        "INSERT INTO owner_provider_invitation_abuse_reports (
             id, invitation_id, invitation_reference_hash, reporter_user_id,
             reporter_email_fingerprint, category, customer_safe_description,
             block_future_invitations, severity, assigned_function, status,
             idempotency_key
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, TRUE, $8,
             'trust_and_safety', 'submitted', $9
         )
         RETURNING id, invitation_id, category, severity, assigned_function,
                   status, block_future_invitations",
    )
    .bind(&report_id)
    .bind(&invitation_id)
    .bind(format!("{:x}", Sha256::digest(invitation_id.as_bytes())))
    .bind(reporter_user_id)
    .bind(email_fingerprint(&recipient_email))
    .bind(&request.category)
    .bind(
        request
            .customer_safe_description
            .as_deref()
            .map(str::trim)
            .unwrap_or_default(),
    )
    .bind(severity)
    .bind(request.idempotency_key.trim())
    .fetch_one(&mut *transaction)
    .await?;
    if matches!(
        invitation_status.as_str(),
        "pending_delivery" | "delivered" | "opened"
    ) {
        sqlx::query(
            "UPDATE owner_provider_invitations
             SET status = 'opted_out', terminal_at = NOW(), updated_at = NOW()
             WHERE id = $1",
        )
        .bind(&invitation_id)
        .execute(&mut *transaction)
        .await?;
    }
    sqlx::query(
        "UPDATE owner_provider_invitation_delivery_attempts
         SET status = 'suppressed', failure_code = 'abuse_block', completed_at = NOW()
         WHERE invitation_id = $1 AND status = 'pending'",
    )
    .bind(&invitation_id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_recipient_suppressions (
             recipient_email_fingerprint, recipient_email, reason, source_invitation_id
         ) VALUES ($1, $2, 'abuse_block', $3)
         ON CONFLICT (recipient_email_fingerprint) DO NOTHING",
    )
    .bind(email_fingerprint(&recipient_email))
    .bind(&recipient_email)
    .bind(&invitation_id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_invitation_abuse_reported', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(&owner_user_id)
    .bind(&property_id)
    .bind(serde_json::json!({
        "invitation_id": invitation_id,
        "report_id": report_id,
        "category": request.category,
        "severity": severity,
        "blocked": true,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(PersistedAbuseReportOutcome::Created(
        owner_provider_abuse_report_from_row(&row, true),
    ))
}

fn workspace_from_row(row: &sqlx::postgres::PgRow, persisted: bool) -> OwnerWorkspaceRecord {
    OwnerWorkspaceRecord {
        owner_user_id: row.get("owner_user_id"),
        verified_email: row.get("verified_email"),
        display_name: row.get("display_name"),
        status: row.get("status"),
        persisted,
    }
}

fn property_from_row(row: &sqlx::postgres::PgRow, persisted: bool) -> OwnerPropertyRecord {
    OwnerPropertyRecord {
        property_id: row.get("id"),
        owner_user_id: row.get("owner_user_id"),
        display_name: row.get("display_name"),
        address_line_1: row.get("address_line_1"),
        address_line_2: row.get("address_line_2"),
        city: row.get("city"),
        region: row.get("region"),
        postal_code: row.get("postal_code"),
        country_code: row.get("country_code"),
        coarse_area: row.get("coarse_area"),
        address_status: row.get("address_status"),
        authority_attested: row.get("authority_attested"),
        status: row.get("status"),
        version: row.get("version"),
        persisted,
    }
}

fn yard_brief_from_row(row: &sqlx::postgres::PgRow, persisted: bool) -> OwnerYardBriefRecord {
    OwnerYardBriefRecord {
        brief_id: row.get("id"),
        owner_user_id: row.get("owner_user_id"),
        property_id: row.get("property_id"),
        version: row.get("version"),
        status: row.get("status"),
        yard_areas: row.get("yard_areas"),
        care_goals: row.get("care_goals"),
        cadence_preference: row.get("cadence_preference"),
        considerations: row.get("considerations"),
        author_source: row.get("author_source"),
        persisted,
    }
}

fn owner_media_from_row(row: &sqlx::postgres::PgRow, persisted: bool) -> OwnerIntakeMediaRecord {
    let upload_mode: String = row.get("upload_mode");
    let object_key: String = row.get("object_key");
    let thumbnail_object_key: Option<String> = row.get("thumbnail_object_key");
    let status: String = row.get("status");
    let storage = PhotoStorageConfig::from_env();
    let visible = matches!(status.as_str(), "ready" | "replaced");
    OwnerIntakeMediaRecord {
        media_id: row.get("id"),
        owner_user_id: row.get("owner_user_id"),
        property_id: row.get("property_id"),
        brief_id: row.get("brief_id"),
        shot_type: row.get("shot_type"),
        file_name: row.get("file_name"),
        content_type: row.get("content_type"),
        upload_mode: upload_mode.clone(),
        object_key: object_key.clone(),
        thumbnail_object_key: thumbnail_object_key.clone(),
        status,
        file_size_bytes: row.get("file_size_bytes"),
        image_width_px: row.get("image_width_px"),
        image_height_px: row.get("image_height_px"),
        metadata_source: row.get("metadata_source"),
        rejection_reason: row.get("rejection_reason"),
        replaces_media_id: row.get("replaces_media_id"),
        replaced_by_media_id: row.get("replaced_by_media_id"),
        display_url: visible.then(|| storage.display_url(&upload_mode, &object_key)),
        thumbnail_url: visible
            .then(|| storage.thumbnail_url(&upload_mode, thumbnail_object_key.as_deref()))
            .flatten(),
        persisted,
    }
}

fn owner_provider_invitation_from_row(
    row: &sqlx::postgres::PgRow,
    persisted: bool,
) -> OwnerProviderInvitationRecord {
    OwnerProviderInvitationRecord {
        invitation_id: row.get("id"),
        owner_user_id: row.get("owner_user_id"),
        property_id: row.get("property_id"),
        brief_id: row.get("brief_id"),
        brief_version: row.get("brief_version"),
        provider_name: row.get("provider_name"),
        recipient_business_email: row.get("recipient_email"),
        purpose: row.get("purpose"),
        owner_name_snapshot: row.get("owner_name_snapshot"),
        coarse_area_snapshot: row.get("coarse_area_snapshot"),
        care_goals_snapshot: row.get("care_goals_snapshot"),
        cadence_snapshot: row.get("cadence_snapshot"),
        status: row.get("status"),
        expires_at_epoch_seconds: row.get("expires_at_epoch_seconds"),
        delivery_status: row
            .try_get("delivery_status")
            .unwrap_or_else(|_| "pending".to_string()),
        delivery_attempt_count: row.try_get("delivery_attempt_count").unwrap_or(1),
        persisted,
    }
}

fn owner_provider_abuse_report_from_row(
    row: &sqlx::postgres::PgRow,
    persisted: bool,
) -> OwnerProviderInvitationAbuseReportRecord {
    OwnerProviderInvitationAbuseReportRecord {
        report_id: row.get("id"),
        invitation_id: row
            .get::<Option<String>, _>("invitation_id")
            .unwrap_or_default(),
        category: row.get("category"),
        severity: row.get("severity"),
        assigned_function: row.get("assigned_function"),
        status: row.get("status"),
        block_future_invitations: row.get("block_future_invitations"),
        persisted,
    }
}

fn is_unique_violation(error: &sqlx::Error) -> bool {
    error
        .as_database_error()
        .and_then(|database_error| database_error.code())
        .is_some_and(|code| code == "23505")
}

fn is_foreign_key_violation(error: &sqlx::Error) -> bool {
    error
        .as_database_error()
        .and_then(|database_error| database_error.code())
        .is_some_and(|code| code == "23503")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn property_request(address: &str) -> CreateOwnerPropertyRequest {
        CreateOwnerPropertyRequest {
            display_name: "Home".to_string(),
            address_line_1: address.to_string(),
            address_line_2: None,
            city: "Phoenix".to_string(),
            region: "AZ".to_string(),
            postal_code: "85004".to_string(),
            country_code: Some("us".to_string()),
            coarse_area: Some("Central Phoenix".to_string()),
            address_status: "owner_confirmed".to_string(),
            authority_attested: true,
        }
    }

    fn yard_brief_request(status: &str) -> SaveOwnerYardBriefRequest {
        SaveOwnerYardBriefRequest {
            status: status.to_string(),
            yard_areas: vec!["Front yard".to_string(), "Back yard".to_string()],
            care_goals: vec!["Routine upkeep".to_string()],
            cadence_preference: "every_two_weeks".to_string(),
            considerations: "Keep the side gate closed for the dog.".to_string(),
        }
    }

    fn intake_media_request(
        shot_type: &str,
        replaces_media_id: Option<String>,
    ) -> CreateOwnerIntakeMediaRequest {
        CreateOwnerIntakeMediaRequest {
            file_name: "front-yard.jpg".to_string(),
            content_type: "image/jpeg".to_string(),
            shot_type: shot_type.to_string(),
            replaces_media_id,
        }
    }

    #[test]
    fn validates_workspace_and_property_boundaries() {
        assert!(validate_workspace_request(&SaveOwnerWorkspaceRequest {
            display_name: "Morgan Reyes".to_string(),
        }));
        assert!(validate_property_request(&property_request(
            "123 Oak Street"
        )));
        let mut invalid = property_request("123 Oak Street");
        invalid.authority_attested = false;
        assert!(!validate_property_request(&invalid));
        assert!(validate_yard_brief_request(&yard_brief_request("ready")));
        let mut invalid_brief = yard_brief_request("ready");
        invalid_brief.care_goals.clear();
        assert!(!validate_yard_brief_request(&invalid_brief));
        invalid_brief.status = "draft".to_string();
        assert!(validate_yard_brief_request(&invalid_brief));
        assert!(validate_intake_media_request(&intake_media_request(
            "front_yard",
            None
        )));
        let mut invalid_media = intake_media_request("street_view", None);
        assert!(!validate_intake_media_request(&invalid_media));
        invalid_media.shot_type = "front_yard".to_string();
        invalid_media.content_type = "application/pdf".to_string();
        assert!(!validate_intake_media_request(&invalid_media));
        invalid.authority_attested = true;
        invalid.address_status = "verified".to_string();
        assert!(!validate_property_request(&invalid));
        let invitation = CreateOwnerProviderInvitationRequest {
            provider_name: "Sonoran Yard Care".to_string(),
            recipient_business_email: "dispatch@sonoranyard.example".to_string(),
            expires_in_days: 7,
            idempotency_key: "provider-invite-001".to_string(),
        };
        assert!(validate_provider_invitation_request(&invitation));
        let mut invalid_invitation = invitation.clone();
        invalid_invitation.recipient_business_email = "not-an-email".to_string();
        assert!(!validate_provider_invitation_request(&invalid_invitation));
        invalid_invitation = invitation;
        invalid_invitation.expires_in_days = 365;
        assert!(!validate_provider_invitation_request(&invalid_invitation));
        assert!(validate_provider_invitation_retry_request(
            &RetryOwnerProviderInvitationRequest {
                expires_in_days: 14,
                idempotency_key: "retry-request-001".to_string(),
            }
        ));
        assert!(validate_provider_invitation_delivery_request(
            &RecordOwnerProviderInvitationDeliveryRequest {
                outcome: "delivered".to_string(),
                provider_message_id: Some("provider-message-1".to_string()),
                failure_code: None,
            }
        ));
        assert!(!validate_provider_invitation_delivery_request(
            &RecordOwnerProviderInvitationDeliveryRequest {
                outcome: "failed".to_string(),
                provider_message_id: None,
                failure_code: None,
            }
        ));
        assert!(validate_provider_invitation_opt_out_request(
            &OptOutOwnerProviderInvitationRequest {
                token: new_owner_provider_invitation_token(),
            }
        ));
        assert!(validate_provider_invitation_preview_request(
            &PreviewOwnerProviderInvitationRequest {
                token: new_owner_provider_invitation_token(),
            }
        ));
        assert!(validate_provider_invitation_recipient_check_request(
            &VerifyOwnerProviderInvitationRecipientRequest {
                token: new_owner_provider_invitation_token(),
            }
        ));
        let existing_relationship_claim = CreateOwnerProviderOrganizationClaimRequest {
            token: new_owner_provider_invitation_token(),
            claim_kind: "existing_relationship".to_string(),
            organization_id: Some("org_existing_provider".to_string()),
            provider_display_name: None,
            authority_attested: false,
            idempotency_key: "provider-org-claim-001".to_string(),
        };
        assert!(validate_provider_organization_claim_request(
            &existing_relationship_claim
        ));
        let mut invalid_claim = existing_relationship_claim;
        invalid_claim.provider_display_name = Some("Untrusted name override".to_string());
        assert!(!validate_provider_organization_claim_request(
            &invalid_claim
        ));
        let new_organization_claim = CreateOwnerProviderOrganizationClaimRequest {
            token: new_owner_provider_invitation_token(),
            claim_kind: "new_organization".to_string(),
            organization_id: None,
            provider_display_name: Some("Sonoran Yard Care".to_string()),
            authority_attested: true,
            idempotency_key: "provider-org-claim-002".to_string(),
        };
        assert!(validate_provider_organization_claim_request(
            &new_organization_claim
        ));
        let mut invalid_new_claim = new_organization_claim;
        invalid_new_claim.authority_attested = false;
        assert!(!validate_provider_organization_claim_request(
            &invalid_new_claim
        ));
        let bootstrap_request = BootstrapOwnerProviderOrganizationClaimRequest {
            token: new_owner_provider_invitation_token(),
            expected_version: 1,
            idempotency_key: "provider-org-bootstrap-001".to_string(),
        };
        assert!(validate_provider_organization_bootstrap_request(
            &bootstrap_request
        ));
        let mut invalid_bootstrap = bootstrap_request;
        invalid_bootstrap.expected_version = 0;
        assert!(!validate_provider_organization_bootstrap_request(
            &invalid_bootstrap
        ));
        assert!(validate_provider_claim_review_filter(
            &OwnerProviderClaimReviewFilter {
                status: Some("duplicate_review".to_string()),
            }
        ));
        assert!(!validate_provider_claim_review_filter(
            &OwnerProviderClaimReviewFilter {
                status: Some("claimed".to_string()),
            }
        ));
        let review_decision = DecideOwnerProviderClaimReviewRequest {
            action: "cleared_for_bootstrap".to_string(),
            expected_version: 2,
            reason_code: Some("distinct_organization".to_string()),
            evidence_reference: Some("restricted://provider-claims/evidence-1".to_string()),
            idempotency_key: "provider-review-decision-001".to_string(),
        };
        assert!(validate_provider_claim_review_decision_request(
            &review_decision
        ));
        let mut invalid_review_decision = review_decision;
        invalid_review_decision.evidence_reference = None;
        assert!(!validate_provider_claim_review_decision_request(
            &invalid_review_decision
        ));
        assert!(validate_provider_claim_review_decision_request(
            &DecideOwnerProviderClaimReviewRequest {
                action: "appeal_approved".to_string(),
                expected_version: 3,
                reason_code: Some("distinct_organization".to_string()),
                evidence_reference: Some(
                    "restricted://provider-claims/appeal-decision-1".to_string(),
                ),
                idempotency_key: "provider-appeal-decision-001".to_string(),
            }
        ));
        let appeal_request = AppealOwnerProviderOrganizationClaimRequest {
            token: new_owner_provider_invitation_token(),
            expected_version: 3,
            category: "new_identity_evidence".to_string(),
            evidence_reference: "restricted://provider-claims/appeal-1".to_string(),
            idempotency_key: "provider-claim-appeal-001".to_string(),
        };
        assert!(validate_provider_organization_claim_appeal_request(
            &appeal_request
        ));
        let mut invalid_appeal = appeal_request;
        invalid_appeal.category = "please_reconsider".to_string();
        assert!(!validate_provider_organization_claim_appeal_request(
            &invalid_appeal
        ));
        let capability_request = IssueOwnerProviderResponseCapabilityRequest {
            token: new_owner_provider_invitation_token(),
            withheld_categories_acknowledged: true,
            idempotency_key: "provider-response-capability-001".to_string(),
        };
        assert!(validate_provider_response_capability_request(
            &capability_request
        ));
        let mut invalid_capability = capability_request;
        invalid_capability.withheld_categories_acknowledged = false;
        assert!(!validate_provider_response_capability_request(
            &invalid_capability
        ));
        let abuse_report = ReportOwnerProviderInvitationAbuseRequest {
            token: new_owner_provider_invitation_token(),
            category: "impersonation".to_string(),
            customer_safe_description: Some("The sender's identity looks wrong.".to_string()),
            block_future_invitations: true,
            idempotency_key: "abuse-report-001".to_string(),
        };
        assert!(validate_provider_invitation_abuse_report_request(
            &abuse_report
        ));
        let mut invalid_abuse_report = abuse_report;
        invalid_abuse_report.block_future_invitations = false;
        assert!(!validate_provider_invitation_abuse_report_request(
            &invalid_abuse_report
        ));
    }

    #[tokio::test]
    async fn local_repository_is_self_scoped_and_rejects_owner_duplicates() {
        let repository = OwnerAcquisitionRepository::new();
        assert_eq!(
            repository
                .create_property("missing-owner", property_request("1 Missing Street"))
                .await,
            OwnerMutationResult::NotFound
        );
        let saved = repository
            .save_workspace(
                "owner-a",
                " MORGAN@EXAMPLE.COM ",
                SaveOwnerWorkspaceRequest {
                    display_name: "Morgan Reyes".to_string(),
                },
            )
            .await;
        assert!(matches!(
            saved,
            OwnerMutationResult::Saved(OwnerWorkspaceRecord {
                verified_email,
                persisted: false,
                ..
            }) if verified_email == "morgan@example.com"
        ));

        let OwnerMutationResult::Saved(property) = repository
            .create_property("owner-a", property_request("123 Oak Street"))
            .await
        else {
            panic!("first private property should be saved");
        };
        assert_eq!(
            repository
                .get_property("owner-b", &property.property_id)
                .await,
            OwnerReadResult::NotFound
        );
        assert_eq!(
            repository
                .create_property("owner-a", property_request("  123   OAK street "))
                .await,
            OwnerMutationResult::Duplicate
        );
        assert!(matches!(
            repository.list_properties("owner-a").await,
            OwnerReadResult::Loaded(properties) if properties.len() == 1
        ));
        assert!(matches!(
            repository.list_properties("owner-b").await,
            OwnerReadResult::Loaded(properties) if properties.is_empty()
        ));

        let OwnerMutationResult::Saved(first_brief) = repository
            .save_yard_brief(
                "owner-a",
                &property.property_id,
                yard_brief_request("draft"),
            )
            .await
        else {
            panic!("private yard brief should be saved");
        };
        assert_eq!(first_brief.version, 1);
        let OwnerMutationResult::Saved(second_brief) = repository
            .save_yard_brief(
                "owner-a",
                &property.property_id,
                yard_brief_request("ready"),
            )
            .await
        else {
            panic!("revised yard brief should be saved");
        };
        assert_eq!(second_brief.version, 2);
        assert_eq!(
            repository
                .get_latest_yard_brief("owner-b", &property.property_id)
                .await,
            OwnerReadResult::NotFound
        );
        assert!(matches!(
            repository
                .get_latest_yard_brief("owner-a", &property.property_id)
                .await,
            OwnerReadResult::Loaded(brief) if brief.version == 2 && brief.status == "ready"
        ));

        let OwnerMutationResult::Saved(upload) = repository
            .create_intake_media_upload(
                "owner-a",
                &property.property_id,
                intake_media_request("front_yard", None),
            )
            .await
        else {
            panic!("owner intake media upload should be created");
        };
        assert_eq!(upload.media.status, "pending_upload");
        assert!(upload.media.object_key.contains("owner-intake"));
        let first_media_id = upload.media.media_id;
        let OwnerMutationResult::Saved(ready) = repository
            .complete_intake_media_upload(
                "owner-a",
                &property.property_id,
                &first_media_id,
                PhotoUploadMetadata {
                    file_size_bytes: Some(1024),
                    image_width_px: Some(1200),
                    image_height_px: Some(800),
                    metadata_source: Some("client_reported".to_string()),
                },
            )
            .await
        else {
            panic!("owner intake media upload should complete");
        };
        assert_eq!(ready.status, "ready");
        assert_eq!(
            repository
                .list_intake_media("owner-b", &property.property_id)
                .await,
            OwnerReadResult::NotFound
        );

        let OwnerMutationResult::Saved(replacement_upload) = repository
            .create_intake_media_upload(
                "owner-a",
                &property.property_id,
                intake_media_request("front_yard", Some(first_media_id.clone())),
            )
            .await
        else {
            panic!("replacement upload should be created");
        };
        let replacement_id = replacement_upload.media.media_id;
        assert!(matches!(
            repository
                .complete_intake_media_upload(
                    "owner-a",
                    &property.property_id,
                    &replacement_id,
                    PhotoUploadMetadata::default(),
                )
                .await,
            OwnerMutationResult::Saved(media) if media.status == "ready"
        ));
        assert!(matches!(
            repository
                .list_intake_media("owner-a", &property.property_id)
                .await,
            OwnerReadResult::Loaded(media) if media.len() == 2
                && media.iter().any(|item| item.media_id == replacement_id && item.status == "ready")
                && media.iter().any(|item| item.media_id == first_media_id && item.status == "replaced")
        ));
        assert!(matches!(
            repository
                .delete_intake_media("owner-a", &property.property_id, &replacement_id)
                .await,
            OwnerMutationResult::Saved(media) if media.status == "deleted"
        ));
        assert!(matches!(
            repository
                .list_intake_media("owner-a", &property.property_id)
                .await,
            OwnerReadResult::Loaded(media) if media.len() == 1
                && media[0].media_id == first_media_id
                && media[0].status == "replaced"
        ));
        assert!(matches!(
            repository
                .delete_intake_media("owner-a", &property.property_id, &first_media_id)
                .await,
            OwnerMutationResult::Saved(media) if media.status == "deleted"
        ));

        let invitation_request = CreateOwnerProviderInvitationRequest {
            provider_name: "Sonoran Yard Care".to_string(),
            recipient_business_email: " Dispatch@SonoranYard.Example ".to_string(),
            expires_in_days: 7,
            idempotency_key: "provider-invite-local-001".to_string(),
        };
        let OwnerProviderInvitationCreateResult::Created(created) = repository
            .create_provider_invitation(
                "owner-a",
                &property.property_id,
                invitation_request.clone(),
            )
            .await
        else {
            panic!("provider invitation should be created");
        };
        assert_eq!(
            created.invitation.recipient_business_email,
            "dispatch@sonoranyard.example"
        );
        assert!(!format!("{created:?}").contains(created.delivery_token()));
        assert!(matches!(
            repository
                .create_provider_invitation(
                    "owner-a",
                    &property.property_id,
                    invitation_request,
                )
                .await,
            OwnerProviderInvitationCreateResult::Replayed(invitation)
                if invitation.invitation_id == created.invitation.invitation_id
        ));
        assert_eq!(
            repository
                .list_provider_invitations("owner-b", &property.property_id)
                .await,
            OwnerReadResult::NotFound
        );
        assert!(matches!(
            repository
                .list_provider_invitations("owner-a", &property.property_id)
                .await,
            OwnerReadResult::Loaded(invitations) if invitations.len() == 1
        ));
    }
}
