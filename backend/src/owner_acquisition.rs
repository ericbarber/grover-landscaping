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
pub struct OpenOwnerProviderInboxRequest {
    pub token: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateOwnerProviderOpportunityResponseRequest {
    pub token: String,
    pub capability_id: String,
    pub expected_capability_version: i64,
    pub action: String,
    pub response_code: String,
    pub block_future_invitations: bool,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderOpportunityResponseRecord {
    pub response_id: String,
    pub capability_id: String,
    pub invitation_id: String,
    pub organization_id: String,
    pub action: String,
    pub response_code: String,
    pub status: String,
    pub assigned_function: Option<String>,
    pub capability_status: String,
    pub capability_version: i64,
    pub opportunity_response_capability: bool,
    pub persisted: bool,
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
pub struct OwnerProviderInboxEntry {
    pub invitation_id: String,
    pub status: String,
    pub can_review_limited_request: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capability_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capability_version: Option<i64>,
    pub organization_id: Option<String>,
    pub organization_name: Option<String>,
    pub provider_name: Option<String>,
    pub owner_name: Option<String>,
    pub coarse_area: Option<String>,
    pub care_goals: Vec<String>,
    pub cadence: Option<String>,
    pub allowed_actions: Vec<String>,
    pub withheld_categories: Vec<String>,
    pub opportunity_response_capability: bool,
    pub recovery_action: Option<String>,
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

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderConnectionProgressEntry {
    pub invitation_id: String,
    pub provider_name: String,
    pub invitation_status: String,
    pub delivery_status: String,
    pub progress_stage: String,
    pub status_label: String,
    pub owner_action_required: bool,
    pub next_action: String,
    pub latest_response_action: Option<String>,
    pub response_label: Option<String>,
    pub expires_at_epoch_seconds: i64,
    pub responded_at_epoch_seconds: Option<i64>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderProgressEntry {
    pub invitation_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization_claim_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization_claim_status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization_claim_version: Option<i64>,
    pub progress_stage: String,
    pub status_label: String,
    pub next_action: String,
    pub recipient_email_checked: bool,
    pub organization_relationship_checked: bool,
    pub opportunity_response_capability: bool,
    pub response_action: Option<String>,
    pub response_label: Option<String>,
    pub responded_at_epoch_seconds: Option<i64>,
    pub closed: bool,
}

pub const OWNER_PROVIDER_DISCLOSURE_CATEGORIES: [&str; 5] = [
    "exact_address",
    "yard_brief",
    "selected_yard_photos",
    "owner_contact",
    "access_considerations",
];

const OWNER_PROVIDER_CONSENT_TEXT_VERSION: &str = "owner-provider-assessment-consent-v1";
const OWNER_PROVIDER_RETENTION_NOTICE_VERSION: &str = "owner-provider-assessment-retention-v1";

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderDisclosureMediaOption {
    pub media_id: String,
    pub shot_type: String,
    pub file_label: String,
    pub thumbnail_url: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderDisclosureReview {
    pub review_version: String,
    pub invitation_id: String,
    pub property_id: String,
    pub property_name: String,
    pub provider_organization_id: String,
    pub provider_organization_name: String,
    pub purpose: String,
    pub brief_id: String,
    pub brief_version: i64,
    pub exact_address: String,
    pub yard_areas: Vec<String>,
    pub care_goals: Vec<String>,
    pub cadence_preference: String,
    pub access_considerations: String,
    pub owner_contact: String,
    pub available_categories: Vec<String>,
    pub media_options: Vec<OwnerProviderDisclosureMediaOption>,
    pub consent_text_version: String,
    pub retention_notice_version: String,
    pub retention_notice: String,
    pub authority_boundary: String,
    pub expires_at_epoch_seconds: i64,
    pub can_approve: bool,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateOwnerProviderDisclosureGrantRequest {
    pub expected_review_version: String,
    pub purpose: String,
    pub approved_categories: Vec<String>,
    pub selected_media_ids: Vec<String>,
    pub consent_text_version: String,
    pub retention_notice_version: String,
    pub owner_affirmed: bool,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderDisclosureGrantRecord {
    pub receipt_id: String,
    pub grant_id: String,
    pub invitation_id: String,
    pub property_id: String,
    pub organization_id: String,
    pub purpose: String,
    pub approved_categories: Vec<String>,
    pub withheld_categories: Vec<String>,
    pub selected_media_ids: Vec<String>,
    pub brief_id: String,
    pub brief_version: i64,
    pub grant_version: i64,
    pub status: String,
    pub effective_at_epoch_seconds: i64,
    pub expires_at_epoch_seconds: i64,
    pub version: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OpenOwnerProviderDisclosureRequest {
    pub token: String,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct OwnerProviderDisclosureYardBrief {
    pub yard_areas: Vec<String>,
    pub care_goals: Vec<String>,
    pub cadence_preference: String,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct OwnerProviderDisclosurePhoto {
    pub media_id: String,
    pub shot_type: String,
    pub file_label: String,
    pub display_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail_url: Option<String>,
    pub authorization_expires_at_epoch_seconds: i64,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct OwnerProviderDisclosureAccess {
    pub invitation_id: String,
    pub status: String,
    pub can_access: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recovery_action: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub grant_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub receipt_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub property_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub purpose: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub approved_categories: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub withheld_categories: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub brief_version: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at_epoch_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exact_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub yard_brief: Option<OwnerProviderDisclosureYardBrief>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_yard_photos: Option<Vec<OwnerProviderDisclosurePhoto>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owner_contact: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub access_considerations: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub authority_boundary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assessment: Option<OwnerProviderAssessmentRecord>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub customer_safe_messages: Option<Vec<OwnerProviderAssessmentMessageRecord>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub private_notes: Option<Vec<OwnerProviderAssessmentPrivateNoteRecord>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub initial_service_proposal: Option<OwnerProviderInitialServiceProposalRecord>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub initial_service_proposal_messages:
        Option<Vec<OwnerProviderInitialServiceProposalMessageRecord>>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct RevokeOwnerProviderDisclosureGrantRequest {
    pub expected_version: i64,
    pub reason_code: String,
    pub owner_confirmed: bool,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct OwnerProviderDisclosureReceiptPhoto {
    pub media_id: String,
    pub file_label: String,
    pub shot_type: String,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct OwnerProviderDisclosureReceiptView {
    pub receipt_id: String,
    pub grant_id: String,
    pub invitation_id: String,
    pub property_id: String,
    pub property_name: String,
    pub organization_id: String,
    pub organization_name: String,
    pub purpose: String,
    pub approved_categories: Vec<String>,
    pub withheld_categories: Vec<String>,
    pub selected_photos: Vec<OwnerProviderDisclosureReceiptPhoto>,
    pub brief_version: i64,
    pub consent_text_version: String,
    pub retention_notice_version: String,
    pub grant_version: i64,
    pub affirmed_at_epoch_seconds: i64,
    pub status: String,
    pub effective_at_epoch_seconds: i64,
    pub expires_at_epoch_seconds: i64,
    pub version: i64,
    pub latest_event_kind: String,
    pub latest_reason_code: Option<String>,
    pub latest_event_at_epoch_seconds: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateOwnerProviderAssessmentRequest {
    pub token: String,
    pub disclosure_grant_id: String,
    pub assessment_method: String,
    pub proposed_window_start_epoch_seconds: Option<i64>,
    pub proposed_window_end_epoch_seconds: Option<i64>,
    pub time_zone: Option<String>,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderAssessmentRecord {
    pub assessment_id: String,
    pub invitation_id: String,
    pub property_id: String,
    pub organization_id: String,
    pub disclosure_grant_id: String,
    pub assessment_method: String,
    pub status: String,
    pub proposed_window_start_epoch_seconds: Option<i64>,
    pub proposed_window_end_epoch_seconds: Option<i64>,
    pub time_zone: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub outcome_reason_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owner_visible_summary: Option<String>,
    pub version: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderAssessmentStatusRecord {
    pub assessment_id: String,
    pub status: String,
    pub version: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct DecideOwnerProviderAssessmentWindowRequest {
    pub action: String,
    pub expected_version: i64,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct ProposeProviderAssessmentWindowRequest {
    pub token: String,
    pub proposed_window_start_epoch_seconds: i64,
    pub proposed_window_end_epoch_seconds: i64,
    pub time_zone: String,
    pub expected_version: i64,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct TransitionOwnerProviderAssessmentRequest {
    pub token: String,
    pub action: String,
    pub expected_version: i64,
    pub reason_code: Option<String>,
    pub owner_visible_summary: Option<String>,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateOwnerAssessmentMessageRequest {
    pub message_kind: String,
    pub customer_safe_body: String,
    pub expected_assessment_version: i64,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateProviderAssessmentMessageRequest {
    pub token: String,
    pub message_kind: String,
    pub customer_safe_body: String,
    pub expected_assessment_version: i64,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateProviderAssessmentPrivateNoteRequest {
    pub token: String,
    pub note_kind: String,
    pub private_body: String,
    pub expected_assessment_version: i64,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderAssessmentMessageRecord {
    pub message_id: String,
    pub assessment_id: String,
    pub author_role: String,
    pub message_kind: String,
    pub customer_safe_body: String,
    pub assessment_version_snapshot: i64,
    pub created_at_epoch_seconds: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderAssessmentPrivateNoteRecord {
    pub note_id: String,
    pub assessment_id: String,
    pub organization_id: String,
    pub author_user_id: String,
    pub note_kind: String,
    pub private_body: String,
    pub assessment_version_snapshot: i64,
    pub created_at_epoch_seconds: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PublishOwnerProviderInitialServiceProposalRequest {
    pub token: String,
    pub expected_proposal_version: i64,
    pub title: String,
    pub customer_summary: String,
    pub included_scope: Vec<String>,
    pub exclusions: Vec<String>,
    pub cadence_code: String,
    pub cadence_detail: String,
    pub arrival_policy: String,
    pub weather_policy: String,
    pub cancellation_policy: String,
    pub proof_expectation: String,
    pub price_amount_minor: i64,
    pub price_basis: String,
    pub currency_code: String,
    pub revision_note: Option<String>,
    pub expires_at_epoch_seconds: i64,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderInitialServiceProposalRecord {
    pub proposal_id: String,
    pub assessment_id: String,
    pub invitation_id: String,
    pub property_id: String,
    pub organization_id: String,
    pub disclosure_grant_id: String,
    pub proposal_version: i64,
    pub status: String,
    pub title: String,
    pub customer_summary: String,
    pub included_scope: Vec<String>,
    pub exclusions: Vec<String>,
    pub cadence_code: String,
    pub cadence_detail: String,
    pub arrival_policy: String,
    pub weather_policy: String,
    pub cancellation_policy: String,
    pub proof_expectation: String,
    pub price_amount_minor: i64,
    pub price_basis: String,
    pub currency_code: String,
    pub annualized_monthly_minor: Option<i64>,
    pub revision_note: Option<String>,
    pub issued_at_epoch_seconds: i64,
    pub expires_at_epoch_seconds: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct DecideOwnerProviderInitialServiceProposalRequest {
    pub action: String,
    pub expected_proposal_version: i64,
    pub reason_code: Option<String>,
    pub customer_safe_note: Option<String>,
    pub affirmation_text_version: Option<String>,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderInitialServiceProposalDecisionRecord {
    pub decision_id: String,
    pub proposal_id: String,
    pub action: String,
    pub reason_code: Option<String>,
    pub customer_safe_note: Option<String>,
    pub proposal_version: i64,
    pub affirmation_text_version: Option<String>,
    pub decided_at_epoch_seconds: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub acceptance_snapshot_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub acceptance_snapshot_sha256: Option<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateOwnerInitialServiceProposalMessageRequest {
    pub message_kind: String,
    pub customer_safe_body: String,
    pub expected_proposal_version: i64,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateProviderInitialServiceProposalResponseRequest {
    pub token: String,
    pub in_reply_to_message_id: String,
    pub customer_safe_body: String,
    pub expected_proposal_version: i64,
    pub related_proposal_id: Option<String>,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderInitialServiceProposalMessageRecord {
    pub message_id: String,
    pub proposal_id: String,
    pub assessment_id: String,
    pub author_role: String,
    pub message_kind: String,
    pub customer_safe_body: String,
    pub proposal_version_snapshot: i64,
    pub series_version_snapshot: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub in_reply_to_message_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub related_proposal_id: Option<String>,
    pub created_at_epoch_seconds: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct ActivateOwnerProviderRelationshipRequest {
    pub expected_proposal_version: i64,
    pub activation_affirmation_text_version: String,
    pub owner_confirmed: bool,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderRelationshipActivationRecord {
    pub activation_id: String,
    pub owner_property_id: String,
    pub invitation_id: String,
    pub organization_id: String,
    pub proposal_id: String,
    pub proposal_version: i64,
    pub acceptance_snapshot_id: String,
    pub acceptance_snapshot_sha256: String,
    pub customer_account_id: String,
    pub customer_property_id: String,
    pub owner_membership_id: String,
    pub portal_access_id: String,
    pub status: String,
    pub closed_competing_invitation_count: i64,
    pub activated_at_epoch_seconds: i64,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct ProposeProviderFirstVisitRequest {
    pub token: String,
    pub expected_series_version: i64,
    pub window_start_epoch_seconds: i64,
    pub window_end_epoch_seconds: i64,
    pub time_zone: String,
    pub customer_safe_arrival_note: Option<String>,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct DecideOwnerProviderFirstVisitRequest {
    pub expected_window_version: i64,
    pub action: String,
    pub customer_safe_note: Option<String>,
    pub confirmation_affirmation_text_version: Option<String>,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OwnerProviderFirstVisitRecord {
    pub activation_id: String,
    pub owner_property_id: String,
    pub invitation_id: String,
    pub organization_id: String,
    pub organization_name: String,
    pub customer_account_id: String,
    pub customer_property_id: String,
    pub status: String,
    pub current_version: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proposal_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_start_epoch_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_end_epoch_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_zone: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub customer_safe_arrival_note: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owner_decision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owner_customer_safe_note: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proposed_at_epoch_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub decided_at_epoch_seconds: Option<i64>,
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
pub enum OwnerProviderInboxResult {
    Loaded(OwnerProviderInboxEntry),
    Closed(OwnerProviderInboxEntry),
    NotFound,
    InvalidState,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderOpportunityResponseResult {
    Recorded(OwnerProviderOpportunityResponseRecord),
    Replayed(OwnerProviderOpportunityResponseRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderProgressResult {
    Loaded(OwnerProviderProgressEntry),
    NotFound,
    InvalidState,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderDisclosureReviewResult {
    Loaded(OwnerProviderDisclosureReview),
    NotFound,
    InvalidState,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderDisclosureGrantCreateResult {
    Created(OwnerProviderDisclosureGrantRecord),
    Replayed(OwnerProviderDisclosureGrantRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderDisclosureAccessResult {
    Loaded(OwnerProviderDisclosureAccess),
    Closed(OwnerProviderDisclosureAccess),
    NotFound,
    InvalidState,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderDisclosureGrantRevokeResult {
    Revoked(OwnerProviderDisclosureReceiptView),
    Replayed(OwnerProviderDisclosureReceiptView),
    NotFound,
    InvalidState(OwnerProviderDisclosureReceiptView),
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderAssessmentCreateResult {
    Created(OwnerProviderAssessmentRecord),
    Replayed(OwnerProviderAssessmentRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderAssessmentWindowDecisionResult {
    Updated(OwnerProviderAssessmentRecord),
    Replayed(OwnerProviderAssessmentRecord),
    NotFound,
    InvalidState(OwnerProviderAssessmentRecord),
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ProviderAssessmentWindowProposalResult {
    Updated(OwnerProviderAssessmentRecord),
    Replayed(OwnerProviderAssessmentRecord),
    NotFound,
    InvalidState(OwnerProviderAssessmentStatusRecord),
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderAssessmentTransitionResult {
    Updated(OwnerProviderAssessmentRecord),
    Replayed(OwnerProviderAssessmentRecord),
    NotFound,
    InvalidState(OwnerProviderAssessmentStatusRecord),
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderAssessmentCommunicationWriteResult<T> {
    Created(T),
    Replayed(T),
    NotFound,
    InvalidState(OwnerProviderAssessmentStatusRecord),
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderInitialServiceProposalWriteResult {
    Published(OwnerProviderInitialServiceProposalRecord),
    Replayed(OwnerProviderInitialServiceProposalRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderInitialServiceProposalDecisionResult {
    Decided(OwnerProviderInitialServiceProposalDecisionRecord),
    Replayed(OwnerProviderInitialServiceProposalDecisionRecord),
    NotFound,
    InvalidState(OwnerProviderInitialServiceProposalRecord),
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderInitialServiceProposalMessageWriteResult {
    Created(OwnerProviderInitialServiceProposalMessageRecord),
    Replayed(OwnerProviderInitialServiceProposalMessageRecord),
    NotFound,
    InvalidState(OwnerProviderInitialServiceProposalRecord),
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderRelationshipActivationResult {
    Activated(OwnerProviderRelationshipActivationRecord),
    Replayed(OwnerProviderRelationshipActivationRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderFirstVisitWriteResult {
    Saved(OwnerProviderFirstVisitRecord),
    Replayed(OwnerProviderFirstVisitRecord),
    NotFound,
    InvalidState(OwnerProviderFirstVisitRecord),
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OwnerProviderFirstVisitReadResult {
    Loaded(OwnerProviderFirstVisitRecord),
    NotFound,
    InvalidState,
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

    pub async fn list_provider_connection_progress(
        &self,
        owner_user_id: &str,
        property_id: &str,
    ) -> OwnerReadResult<Vec<OwnerProviderConnectionProgressEntry>> {
        let Some(pool) = &self.pool else {
            let local = self.local.read().await;
            if !local
                .properties
                .get(property_id)
                .is_some_and(|property| property.owner_user_id == owner_user_id)
            {
                return OwnerReadResult::NotFound;
            }
            let mut entries: Vec<_> = local
                .provider_invitations
                .values()
                .filter(|invitation| {
                    invitation.record.owner_user_id == owner_user_id
                        && invitation.record.property_id == property_id
                })
                .map(|invitation| {
                    owner_provider_connection_progress_entry(
                        &invitation.record.invitation_id,
                        &invitation.record.provider_name,
                        &invitation.record.status,
                        &invitation.record.delivery_status,
                        invitation.record.expires_at_epoch_seconds,
                        None,
                        None,
                        None,
                        None,
                        false,
                    )
                })
                .collect();
            entries.sort_by(|left, right| right.invitation_id.cmp(&left.invitation_id));
            return OwnerReadResult::Loaded(entries);
        };
        match list_owner_provider_connection_progress(pool, owner_user_id, property_id).await {
            Ok(Some(entries)) => OwnerReadResult::Loaded(entries),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner provider connection progress read failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn provider_invitation_progress(
        &self,
        recipient_user_id: &str,
        verified_email: &str,
        request: OpenOwnerProviderInboxRequest,
    ) -> OwnerProviderProgressResult {
        if !validate_provider_inbox_request(&request) {
            return OwnerProviderProgressResult::NotFound;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderProgressResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match get_owner_provider_progress(
            pool,
            recipient_user_id,
            &normalized_email,
            &email_fingerprint,
            &token_hash,
        )
        .await
        {
            Ok(Some(progress)) => OwnerProviderProgressResult::Loaded(progress),
            Ok(None) => OwnerProviderProgressResult::NotFound,
            Err(sqlx::Error::RowNotFound) => OwnerProviderProgressResult::InvalidState,
            Err(error) => {
                tracing::error!(%error, recipient_user_id, "provider invitation progress read failed");
                OwnerProviderProgressResult::Unavailable
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

    pub async fn open_provider_inbox(
        &self,
        recipient_user_id: &str,
        verified_email: &str,
        request: OpenOwnerProviderInboxRequest,
    ) -> OwnerProviderInboxResult {
        if !validate_provider_inbox_request(&request) {
            return OwnerProviderInboxResult::NotFound;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderInboxResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match open_owner_provider_inbox(
            pool,
            recipient_user_id,
            &normalized_email,
            &email_fingerprint,
            &token_hash,
        )
        .await
        {
            Ok(PersistedProviderInboxOutcome::Loaded(entry)) => {
                OwnerProviderInboxResult::Loaded(entry)
            }
            Ok(PersistedProviderInboxOutcome::Closed(entry)) => {
                OwnerProviderInboxResult::Closed(entry)
            }
            Ok(PersistedProviderInboxOutcome::NotFound) => OwnerProviderInboxResult::NotFound,
            Ok(PersistedProviderInboxOutcome::InvalidState) => {
                OwnerProviderInboxResult::InvalidState
            }
            Err(error) => {
                tracing::error!(%error, recipient_user_id, "provider inbox open failed");
                OwnerProviderInboxResult::Unavailable
            }
        }
    }

    pub async fn create_provider_opportunity_response(
        &self,
        recipient_user_id: &str,
        verified_email: &str,
        request: CreateOwnerProviderOpportunityResponseRequest,
    ) -> OwnerProviderOpportunityResponseResult {
        if !validate_provider_opportunity_response_request(&request) {
            return OwnerProviderOpportunityResponseResult::InvalidState;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderOpportunityResponseResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match create_owner_provider_opportunity_response(
            pool,
            recipient_user_id,
            &normalized_email,
            &email_fingerprint,
            request,
            &token_hash,
        )
        .await
        {
            Ok(PersistedOpportunityResponseOutcome::Recorded(response)) => {
                OwnerProviderOpportunityResponseResult::Recorded(response)
            }
            Ok(PersistedOpportunityResponseOutcome::Replayed(response)) => {
                OwnerProviderOpportunityResponseResult::Replayed(response)
            }
            Ok(PersistedOpportunityResponseOutcome::NotFound) => {
                OwnerProviderOpportunityResponseResult::NotFound
            }
            Ok(PersistedOpportunityResponseOutcome::InvalidState) => {
                OwnerProviderOpportunityResponseResult::InvalidState
            }
            Ok(PersistedOpportunityResponseOutcome::Conflict) => {
                OwnerProviderOpportunityResponseResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderOpportunityResponseResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, recipient_user_id, "provider opportunity response failed");
                OwnerProviderOpportunityResponseResult::Unavailable
            }
        }
    }

    pub async fn get_provider_disclosure_review(
        &self,
        owner_user_id: &str,
        property_id: &str,
        invitation_id: &str,
    ) -> OwnerProviderDisclosureReviewResult {
        let Some(pool) = &self.pool else {
            return OwnerProviderDisclosureReviewResult::Unavailable;
        };
        match get_owner_provider_disclosure_review(pool, owner_user_id, property_id, invitation_id)
            .await
        {
            Ok(PersistedDisclosureReviewOutcome::Loaded(review)) => {
                OwnerProviderDisclosureReviewResult::Loaded(review)
            }
            Ok(PersistedDisclosureReviewOutcome::NotFound) => {
                OwnerProviderDisclosureReviewResult::NotFound
            }
            Ok(PersistedDisclosureReviewOutcome::InvalidState) => {
                OwnerProviderDisclosureReviewResult::InvalidState
            }
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, invitation_id, "owner provider disclosure review failed");
                OwnerProviderDisclosureReviewResult::Unavailable
            }
        }
    }

    pub async fn create_provider_disclosure_grant(
        &self,
        owner_user_id: &str,
        property_id: &str,
        invitation_id: &str,
        request: CreateOwnerProviderDisclosureGrantRequest,
    ) -> OwnerProviderDisclosureGrantCreateResult {
        if !validate_provider_disclosure_grant_request(&request) {
            return OwnerProviderDisclosureGrantCreateResult::InvalidState;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderDisclosureGrantCreateResult::Unavailable;
        };
        let replay_request = request.clone();
        match create_owner_provider_disclosure_grant(
            pool,
            owner_user_id,
            property_id,
            invitation_id,
            request,
        )
        .await
        {
            Ok(PersistedDisclosureGrantOutcome::Created(record)) => {
                OwnerProviderDisclosureGrantCreateResult::Created(record)
            }
            Ok(PersistedDisclosureGrantOutcome::Replayed(record)) => {
                OwnerProviderDisclosureGrantCreateResult::Replayed(record)
            }
            Ok(PersistedDisclosureGrantOutcome::NotFound) => {
                OwnerProviderDisclosureGrantCreateResult::NotFound
            }
            Ok(PersistedDisclosureGrantOutcome::InvalidState) => {
                OwnerProviderDisclosureGrantCreateResult::InvalidState
            }
            Ok(PersistedDisclosureGrantOutcome::Conflict) => {
                OwnerProviderDisclosureGrantCreateResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => match disclosure_grant_replay_from_pool(
                pool,
                owner_user_id,
                property_id,
                invitation_id,
                &replay_request,
            )
            .await
            {
                Ok(Some(PersistedDisclosureGrantOutcome::Replayed(record))) => {
                    OwnerProviderDisclosureGrantCreateResult::Replayed(record)
                }
                Ok(_) => OwnerProviderDisclosureGrantCreateResult::Conflict,
                Err(replay_error) => {
                    tracing::error!(%replay_error, owner_user_id, property_id, invitation_id, "owner provider disclosure grant replay recovery failed");
                    OwnerProviderDisclosureGrantCreateResult::Unavailable
                }
            },
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, invitation_id, "owner provider disclosure grant creation failed");
                OwnerProviderDisclosureGrantCreateResult::Unavailable
            }
        }
    }

    pub async fn open_provider_disclosure(
        &self,
        recipient_user_id: &str,
        verified_email: &str,
        request: OpenOwnerProviderDisclosureRequest,
    ) -> OwnerProviderDisclosureAccessResult {
        if !validate_provider_disclosure_access_request(&request) {
            return OwnerProviderDisclosureAccessResult::NotFound;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderDisclosureAccessResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match open_owner_provider_disclosure(
            pool,
            recipient_user_id,
            &normalized_email,
            &email_fingerprint,
            &token_hash,
        )
        .await
        {
            Ok(PersistedDisclosureAccessOutcome::Loaded(access)) => {
                OwnerProviderDisclosureAccessResult::Loaded(access)
            }
            Ok(PersistedDisclosureAccessOutcome::Closed(access)) => {
                OwnerProviderDisclosureAccessResult::Closed(access)
            }
            Ok(PersistedDisclosureAccessOutcome::NotFound) => {
                OwnerProviderDisclosureAccessResult::NotFound
            }
            Ok(PersistedDisclosureAccessOutcome::InvalidState) => {
                OwnerProviderDisclosureAccessResult::InvalidState
            }
            Err(error) => {
                tracing::error!(%error, recipient_user_id, "provider disclosure access failed");
                OwnerProviderDisclosureAccessResult::Unavailable
            }
        }
    }

    pub async fn list_provider_disclosure_receipts(
        &self,
        owner_user_id: &str,
        property_id: &str,
    ) -> OwnerReadResult<Vec<OwnerProviderDisclosureReceiptView>> {
        let Some(pool) = &self.pool else {
            return OwnerReadResult::Unavailable;
        };
        match list_owner_provider_disclosure_receipts(pool, owner_user_id, property_id).await {
            Ok(Some(receipts)) => OwnerReadResult::Loaded(receipts),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner provider disclosure receipt list failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn revoke_provider_disclosure_grant(
        &self,
        owner_user_id: &str,
        property_id: &str,
        grant_id: &str,
        request: RevokeOwnerProviderDisclosureGrantRequest,
    ) -> OwnerProviderDisclosureGrantRevokeResult {
        if !validate_provider_disclosure_revoke_request(&request) {
            return OwnerProviderDisclosureGrantRevokeResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderDisclosureGrantRevokeResult::Unavailable;
        };
        match revoke_owner_provider_disclosure_grant(
            pool,
            owner_user_id,
            property_id,
            grant_id,
            request,
        )
        .await
        {
            Ok(PersistedDisclosureRevokeOutcome::Revoked(receipt)) => {
                OwnerProviderDisclosureGrantRevokeResult::Revoked(receipt)
            }
            Ok(PersistedDisclosureRevokeOutcome::Replayed(receipt)) => {
                OwnerProviderDisclosureGrantRevokeResult::Replayed(receipt)
            }
            Ok(PersistedDisclosureRevokeOutcome::NotFound) => {
                OwnerProviderDisclosureGrantRevokeResult::NotFound
            }
            Ok(PersistedDisclosureRevokeOutcome::InvalidState(receipt)) => {
                OwnerProviderDisclosureGrantRevokeResult::InvalidState(receipt)
            }
            Ok(PersistedDisclosureRevokeOutcome::Conflict) => {
                OwnerProviderDisclosureGrantRevokeResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderDisclosureGrantRevokeResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, grant_id, "owner provider disclosure revoke failed");
                OwnerProviderDisclosureGrantRevokeResult::Unavailable
            }
        }
    }

    pub async fn create_provider_assessment(
        &self,
        provider_actor_user_id: &str,
        verified_email: &str,
        request: CreateOwnerProviderAssessmentRequest,
    ) -> OwnerProviderAssessmentCreateResult {
        if !validate_provider_assessment_request(&request) {
            return OwnerProviderAssessmentCreateResult::InvalidState;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderAssessmentCreateResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        let recovery_request = request.clone();
        match create_owner_provider_assessment(
            pool,
            provider_actor_user_id,
            &normalized_email,
            &email_fingerprint,
            &token_hash,
            request,
        )
        .await
        {
            Ok(PersistedAssessmentCreateOutcome::Created(assessment)) => {
                OwnerProviderAssessmentCreateResult::Created(assessment)
            }
            Ok(PersistedAssessmentCreateOutcome::Replayed(assessment)) => {
                OwnerProviderAssessmentCreateResult::Replayed(assessment)
            }
            Ok(PersistedAssessmentCreateOutcome::NotFound) => {
                OwnerProviderAssessmentCreateResult::NotFound
            }
            Ok(PersistedAssessmentCreateOutcome::InvalidState) => {
                OwnerProviderAssessmentCreateResult::InvalidState
            }
            Ok(PersistedAssessmentCreateOutcome::Conflict) => {
                OwnerProviderAssessmentCreateResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                match load_owner_provider_assessment_replay(
                    pool,
                    provider_actor_user_id,
                    &normalized_email,
                    &email_fingerprint,
                    &token_hash,
                    &recovery_request,
                )
                .await
                {
                    Ok(Some(PersistedAssessmentCreateOutcome::Replayed(assessment))) => {
                        OwnerProviderAssessmentCreateResult::Replayed(assessment)
                    }
                    Ok(_) => OwnerProviderAssessmentCreateResult::Conflict,
                    Err(recovery_error) => {
                        tracing::error!(%recovery_error, provider_actor_user_id, "provider assessment replay recovery failed");
                        OwnerProviderAssessmentCreateResult::Unavailable
                    }
                }
            }
            Err(error) => {
                tracing::error!(%error, provider_actor_user_id, "provider assessment creation failed");
                OwnerProviderAssessmentCreateResult::Unavailable
            }
        }
    }

    pub async fn list_owner_provider_assessments(
        &self,
        owner_user_id: &str,
        property_id: &str,
    ) -> OwnerReadResult<Vec<OwnerProviderAssessmentRecord>> {
        let Some(pool) = &self.pool else {
            return OwnerReadResult::Unavailable;
        };
        match list_owner_provider_assessments(pool, owner_user_id, property_id).await {
            Ok(Some(assessments)) => OwnerReadResult::Loaded(assessments),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "owner provider assessment list failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn decide_provider_assessment_window(
        &self,
        owner_user_id: &str,
        property_id: &str,
        assessment_id: &str,
        request: DecideOwnerProviderAssessmentWindowRequest,
    ) -> OwnerProviderAssessmentWindowDecisionResult {
        if !validate_provider_assessment_window_decision_request(&request) {
            return OwnerProviderAssessmentWindowDecisionResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderAssessmentWindowDecisionResult::Unavailable;
        };
        match decide_owner_provider_assessment_window(
            pool,
            owner_user_id,
            property_id,
            assessment_id,
            request,
        )
        .await
        {
            Ok(PersistedAssessmentWindowDecisionOutcome::Updated(assessment)) => {
                OwnerProviderAssessmentWindowDecisionResult::Updated(assessment)
            }
            Ok(PersistedAssessmentWindowDecisionOutcome::Replayed(assessment)) => {
                OwnerProviderAssessmentWindowDecisionResult::Replayed(assessment)
            }
            Ok(PersistedAssessmentWindowDecisionOutcome::NotFound) => {
                OwnerProviderAssessmentWindowDecisionResult::NotFound
            }
            Ok(PersistedAssessmentWindowDecisionOutcome::InvalidState(assessment)) => {
                OwnerProviderAssessmentWindowDecisionResult::InvalidState(assessment)
            }
            Ok(PersistedAssessmentWindowDecisionOutcome::Conflict) => {
                OwnerProviderAssessmentWindowDecisionResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderAssessmentWindowDecisionResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, assessment_id, "owner provider assessment window decision failed");
                OwnerProviderAssessmentWindowDecisionResult::Unavailable
            }
        }
    }

    pub async fn transition_provider_assessment(
        &self,
        provider_actor_user_id: &str,
        verified_email: &str,
        assessment_id: &str,
        request: TransitionOwnerProviderAssessmentRequest,
    ) -> OwnerProviderAssessmentTransitionResult {
        if !validate_provider_assessment_transition_request(&request) {
            return OwnerProviderAssessmentTransitionResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderAssessmentTransitionResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let verified_email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match transition_owner_provider_assessment(
            pool,
            provider_actor_user_id,
            &normalized_email,
            &verified_email_fingerprint,
            &token_hash,
            assessment_id,
            request,
        )
        .await
        {
            Ok(PersistedAssessmentTransitionOutcome::Updated(assessment)) => {
                OwnerProviderAssessmentTransitionResult::Updated(assessment)
            }
            Ok(PersistedAssessmentTransitionOutcome::Replayed(assessment)) => {
                OwnerProviderAssessmentTransitionResult::Replayed(assessment)
            }
            Ok(PersistedAssessmentTransitionOutcome::NotFound) => {
                OwnerProviderAssessmentTransitionResult::NotFound
            }
            Ok(PersistedAssessmentTransitionOutcome::InvalidState(assessment)) => {
                OwnerProviderAssessmentTransitionResult::InvalidState(
                    owner_provider_assessment_status(&assessment),
                )
            }
            Ok(PersistedAssessmentTransitionOutcome::Conflict) => {
                OwnerProviderAssessmentTransitionResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderAssessmentTransitionResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, provider_actor_user_id, assessment_id, "provider assessment transition failed");
                OwnerProviderAssessmentTransitionResult::Unavailable
            }
        }
    }

    pub async fn propose_provider_assessment_window(
        &self,
        provider_actor_user_id: &str,
        verified_email: &str,
        assessment_id: &str,
        request: ProposeProviderAssessmentWindowRequest,
    ) -> ProviderAssessmentWindowProposalResult {
        if !validate_provider_assessment_window_proposal_request(&request) {
            return ProviderAssessmentWindowProposalResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return ProviderAssessmentWindowProposalResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let verified_email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match propose_provider_assessment_window(
            pool,
            provider_actor_user_id,
            &normalized_email,
            &verified_email_fingerprint,
            &token_hash,
            assessment_id,
            request,
        )
        .await
        {
            Ok(PersistedAssessmentWindowProposalOutcome::Updated(assessment)) => {
                ProviderAssessmentWindowProposalResult::Updated(assessment)
            }
            Ok(PersistedAssessmentWindowProposalOutcome::Replayed(assessment)) => {
                ProviderAssessmentWindowProposalResult::Replayed(assessment)
            }
            Ok(PersistedAssessmentWindowProposalOutcome::NotFound) => {
                ProviderAssessmentWindowProposalResult::NotFound
            }
            Ok(PersistedAssessmentWindowProposalOutcome::InvalidState(assessment)) => {
                ProviderAssessmentWindowProposalResult::InvalidState(
                    owner_provider_assessment_status(&assessment),
                )
            }
            Ok(PersistedAssessmentWindowProposalOutcome::Conflict) => {
                ProviderAssessmentWindowProposalResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                ProviderAssessmentWindowProposalResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, provider_actor_user_id, assessment_id, "provider assessment window proposal failed");
                ProviderAssessmentWindowProposalResult::Unavailable
            }
        }
    }

    pub async fn create_owner_assessment_message(
        &self,
        owner_user_id: &str,
        property_id: &str,
        assessment_id: &str,
        request: CreateOwnerAssessmentMessageRequest,
    ) -> OwnerProviderAssessmentCommunicationWriteResult<OwnerProviderAssessmentMessageRecord> {
        if !validate_owner_assessment_message_request(&request) {
            return OwnerProviderAssessmentCommunicationWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderAssessmentCommunicationWriteResult::Unavailable;
        };
        match create_owner_provider_assessment_message(
            pool,
            owner_user_id,
            property_id,
            assessment_id,
            request,
        )
        .await
        {
            Ok(outcome) => public_assessment_communication_outcome(outcome),
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderAssessmentCommunicationWriteResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, assessment_id, "owner assessment message creation failed");
                OwnerProviderAssessmentCommunicationWriteResult::Unavailable
            }
        }
    }

    pub async fn create_provider_assessment_message(
        &self,
        provider_actor_user_id: &str,
        verified_email: &str,
        assessment_id: &str,
        request: CreateProviderAssessmentMessageRequest,
    ) -> OwnerProviderAssessmentCommunicationWriteResult<OwnerProviderAssessmentMessageRecord> {
        if !validate_provider_assessment_message_request(&request) {
            return OwnerProviderAssessmentCommunicationWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderAssessmentCommunicationWriteResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let verified_email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match create_provider_assessment_message(
            pool,
            provider_actor_user_id,
            &normalized_email,
            &verified_email_fingerprint,
            &token_hash,
            assessment_id,
            request,
        )
        .await
        {
            Ok(outcome) => public_assessment_communication_outcome(outcome),
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderAssessmentCommunicationWriteResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, provider_actor_user_id, assessment_id, "provider assessment message creation failed");
                OwnerProviderAssessmentCommunicationWriteResult::Unavailable
            }
        }
    }

    pub async fn create_provider_assessment_private_note(
        &self,
        provider_actor_user_id: &str,
        verified_email: &str,
        assessment_id: &str,
        request: CreateProviderAssessmentPrivateNoteRequest,
    ) -> OwnerProviderAssessmentCommunicationWriteResult<OwnerProviderAssessmentPrivateNoteRecord>
    {
        if !validate_provider_assessment_private_note_request(&request) {
            return OwnerProviderAssessmentCommunicationWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderAssessmentCommunicationWriteResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let verified_email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match create_provider_assessment_private_note(
            pool,
            provider_actor_user_id,
            &normalized_email,
            &verified_email_fingerprint,
            &token_hash,
            assessment_id,
            request,
        )
        .await
        {
            Ok(outcome) => public_assessment_communication_outcome(outcome),
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderAssessmentCommunicationWriteResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, provider_actor_user_id, assessment_id, "provider assessment private note creation failed");
                OwnerProviderAssessmentCommunicationWriteResult::Unavailable
            }
        }
    }

    pub async fn list_owner_assessment_messages(
        &self,
        owner_user_id: &str,
        property_id: &str,
        assessment_id: &str,
    ) -> OwnerReadResult<Vec<OwnerProviderAssessmentMessageRecord>> {
        let Some(pool) = &self.pool else {
            return OwnerReadResult::Unavailable;
        };
        match list_owner_provider_assessment_messages(
            pool,
            owner_user_id,
            property_id,
            assessment_id,
        )
        .await
        {
            Ok(Some(messages)) => OwnerReadResult::Loaded(messages),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, assessment_id, "owner assessment messages failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn publish_initial_service_proposal(
        &self,
        provider_actor_user_id: &str,
        verified_email: &str,
        assessment_id: &str,
        request: PublishOwnerProviderInitialServiceProposalRequest,
    ) -> OwnerProviderInitialServiceProposalWriteResult {
        if !validate_initial_service_proposal_request(&request) {
            return OwnerProviderInitialServiceProposalWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderInitialServiceProposalWriteResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let verified_email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match publish_owner_provider_initial_service_proposal(
            pool,
            provider_actor_user_id,
            &normalized_email,
            &verified_email_fingerprint,
            &token_hash,
            assessment_id,
            request,
        )
        .await
        {
            Ok(PersistedInitialServiceProposalWriteOutcome::Published(proposal)) => {
                OwnerProviderInitialServiceProposalWriteResult::Published(proposal)
            }
            Ok(PersistedInitialServiceProposalWriteOutcome::Replayed(proposal)) => {
                OwnerProviderInitialServiceProposalWriteResult::Replayed(proposal)
            }
            Ok(PersistedInitialServiceProposalWriteOutcome::NotFound) => {
                OwnerProviderInitialServiceProposalWriteResult::NotFound
            }
            Ok(PersistedInitialServiceProposalWriteOutcome::InvalidState) => {
                OwnerProviderInitialServiceProposalWriteResult::InvalidState
            }
            Ok(PersistedInitialServiceProposalWriteOutcome::Conflict) => {
                OwnerProviderInitialServiceProposalWriteResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderInitialServiceProposalWriteResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, provider_actor_user_id, assessment_id, "initial service proposal publish failed");
                OwnerProviderInitialServiceProposalWriteResult::Unavailable
            }
        }
    }

    pub async fn list_owner_initial_service_proposals(
        &self,
        owner_user_id: &str,
        property_id: &str,
    ) -> OwnerReadResult<Vec<OwnerProviderInitialServiceProposalRecord>> {
        let Some(pool) = &self.pool else {
            return OwnerReadResult::Unavailable;
        };
        match list_owner_provider_initial_service_proposals(pool, owner_user_id, property_id).await
        {
            Ok(Some(proposals)) => OwnerReadResult::Loaded(proposals),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, "initial service proposal list failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn get_owner_initial_service_proposal(
        &self,
        owner_user_id: &str,
        property_id: &str,
        proposal_id: &str,
    ) -> OwnerReadResult<OwnerProviderInitialServiceProposalRecord> {
        let Some(pool) = &self.pool else {
            return OwnerReadResult::Unavailable;
        };
        match get_owner_provider_initial_service_proposal(
            pool,
            owner_user_id,
            property_id,
            proposal_id,
        )
        .await
        {
            Ok(Some(proposal)) => OwnerReadResult::Loaded(proposal),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, proposal_id, "initial service proposal read failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn decide_initial_service_proposal(
        &self,
        owner_user_id: &str,
        property_id: &str,
        proposal_id: &str,
        request: DecideOwnerProviderInitialServiceProposalRequest,
    ) -> OwnerProviderInitialServiceProposalDecisionResult {
        if !validate_initial_service_proposal_decision_request(&request) {
            return OwnerProviderInitialServiceProposalDecisionResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderInitialServiceProposalDecisionResult::Unavailable;
        };
        match decide_owner_provider_initial_service_proposal(
            pool,
            owner_user_id,
            property_id,
            proposal_id,
            request,
        )
        .await
        {
            Ok(PersistedInitialServiceProposalDecisionOutcome::Decided(decision)) => {
                OwnerProviderInitialServiceProposalDecisionResult::Decided(decision)
            }
            Ok(PersistedInitialServiceProposalDecisionOutcome::Replayed(decision)) => {
                OwnerProviderInitialServiceProposalDecisionResult::Replayed(decision)
            }
            Ok(PersistedInitialServiceProposalDecisionOutcome::NotFound) => {
                OwnerProviderInitialServiceProposalDecisionResult::NotFound
            }
            Ok(PersistedInitialServiceProposalDecisionOutcome::InvalidState(proposal)) => {
                OwnerProviderInitialServiceProposalDecisionResult::InvalidState(proposal)
            }
            Ok(PersistedInitialServiceProposalDecisionOutcome::Conflict) => {
                OwnerProviderInitialServiceProposalDecisionResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderInitialServiceProposalDecisionResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, proposal_id, "initial service proposal decision failed");
                OwnerProviderInitialServiceProposalDecisionResult::Unavailable
            }
        }
    }

    pub async fn get_owner_provider_relationship_activation(
        &self,
        owner_user_id: &str,
        property_id: &str,
        proposal_id: &str,
    ) -> OwnerReadResult<OwnerProviderRelationshipActivationRecord> {
        let Some(pool) = &self.pool else {
            return OwnerReadResult::Unavailable;
        };
        let query = format!(
            "{OWNER_PROVIDER_RELATIONSHIP_ACTIVATION_SELECT}
             WHERE activation.owner_user_id = $1
               AND activation.owner_property_id = $2
               AND activation.proposal_id = $3"
        );
        match sqlx::query(&query)
            .bind(owner_user_id)
            .bind(property_id)
            .bind(proposal_id)
            .fetch_optional(pool)
            .await
        {
            Ok(Some(row)) => {
                OwnerReadResult::Loaded(owner_provider_relationship_activation_from_row(&row))
            }
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, proposal_id, "owner-provider relationship activation read failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn list_owner_initial_service_proposal_messages(
        &self,
        owner_user_id: &str,
        property_id: &str,
        proposal_id: &str,
    ) -> OwnerReadResult<Vec<OwnerProviderInitialServiceProposalMessageRecord>> {
        let Some(pool) = &self.pool else {
            return OwnerReadResult::Unavailable;
        };
        match list_owner_provider_initial_service_proposal_messages(
            pool,
            owner_user_id,
            property_id,
            proposal_id,
        )
        .await
        {
            Ok(Some(messages)) => OwnerReadResult::Loaded(messages),
            Ok(None) => OwnerReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, proposal_id, "initial service proposal messages failed");
                OwnerReadResult::Unavailable
            }
        }
    }

    pub async fn create_owner_initial_service_proposal_message(
        &self,
        owner_user_id: &str,
        property_id: &str,
        proposal_id: &str,
        request: CreateOwnerInitialServiceProposalMessageRequest,
    ) -> OwnerProviderInitialServiceProposalMessageWriteResult {
        if !validate_owner_initial_service_proposal_message_request(&request) {
            return OwnerProviderInitialServiceProposalMessageWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderInitialServiceProposalMessageWriteResult::Unavailable;
        };
        match create_owner_initial_service_proposal_message(
            pool,
            owner_user_id,
            property_id,
            proposal_id,
            request,
        )
        .await
        {
            Ok(outcome) => public_initial_service_proposal_message_outcome(outcome),
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderInitialServiceProposalMessageWriteResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, proposal_id, "owner initial service proposal message failed");
                OwnerProviderInitialServiceProposalMessageWriteResult::Unavailable
            }
        }
    }

    pub async fn create_provider_initial_service_proposal_response(
        &self,
        provider_actor_user_id: &str,
        verified_email: &str,
        assessment_id: &str,
        request: CreateProviderInitialServiceProposalResponseRequest,
    ) -> OwnerProviderInitialServiceProposalMessageWriteResult {
        if !validate_provider_initial_service_proposal_response_request(&request) {
            return OwnerProviderInitialServiceProposalMessageWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderInitialServiceProposalMessageWriteResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        let verified_email_fingerprint = email_fingerprint(&normalized_email);
        let token_hash = invitation_token_hash(request.token.trim());
        match create_provider_initial_service_proposal_response(
            pool,
            provider_actor_user_id,
            &normalized_email,
            &verified_email_fingerprint,
            &token_hash,
            assessment_id,
            request,
        )
        .await
        {
            Ok(outcome) => public_initial_service_proposal_message_outcome(outcome),
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderInitialServiceProposalMessageWriteResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, provider_actor_user_id, assessment_id, "provider initial service proposal response failed");
                OwnerProviderInitialServiceProposalMessageWriteResult::Unavailable
            }
        }
    }

    pub async fn activate_owner_provider_relationship(
        &self,
        owner_user_id: &str,
        property_id: &str,
        proposal_id: &str,
        request: ActivateOwnerProviderRelationshipRequest,
    ) -> OwnerProviderRelationshipActivationResult {
        if !validate_owner_provider_relationship_activation_request(&request) {
            return OwnerProviderRelationshipActivationResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderRelationshipActivationResult::Unavailable;
        };
        match activate_owner_provider_relationship(
            pool,
            owner_user_id,
            property_id,
            proposal_id,
            request,
        )
        .await
        {
            Ok(PersistedRelationshipActivationOutcome::Activated(activation)) => {
                OwnerProviderRelationshipActivationResult::Activated(activation)
            }
            Ok(PersistedRelationshipActivationOutcome::Replayed(activation)) => {
                OwnerProviderRelationshipActivationResult::Replayed(activation)
            }
            Ok(PersistedRelationshipActivationOutcome::NotFound) => {
                OwnerProviderRelationshipActivationResult::NotFound
            }
            Ok(PersistedRelationshipActivationOutcome::InvalidState) => {
                OwnerProviderRelationshipActivationResult::InvalidState
            }
            Ok(PersistedRelationshipActivationOutcome::Conflict) => {
                OwnerProviderRelationshipActivationResult::Conflict
            }
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderRelationshipActivationResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, proposal_id, "owner-provider relationship activation failed");
                OwnerProviderRelationshipActivationResult::Unavailable
            }
        }
    }

    pub async fn get_owner_provider_first_visit(
        &self,
        owner_user_id: &str,
        property_id: &str,
        activation_id: &str,
    ) -> OwnerProviderFirstVisitReadResult {
        let Some(pool) = &self.pool else {
            return OwnerProviderFirstVisitReadResult::Unavailable;
        };
        match get_owner_provider_first_visit(pool, owner_user_id, property_id, activation_id).await
        {
            Ok(Some(record)) => OwnerProviderFirstVisitReadResult::Loaded(record),
            Ok(None) => OwnerProviderFirstVisitReadResult::NotFound,
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, activation_id, "owner first-visit read failed");
                OwnerProviderFirstVisitReadResult::Unavailable
            }
        }
    }

    pub async fn get_provider_first_visit(
        &self,
        provider_actor_user_id: &str,
        verified_email: &str,
        activation_id: &str,
        token: &str,
    ) -> OwnerProviderFirstVisitReadResult {
        if !validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
            token: token.to_string(),
        }) {
            return OwnerProviderFirstVisitReadResult::NotFound;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderFirstVisitReadResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        match get_provider_first_visit(
            pool,
            provider_actor_user_id,
            &email_fingerprint(&normalized_email),
            &invitation_token_hash(token.trim()),
            activation_id,
        )
        .await
        {
            Ok(Some(record)) => OwnerProviderFirstVisitReadResult::Loaded(record),
            Ok(None) => OwnerProviderFirstVisitReadResult::NotFound,
            Err(sqlx::Error::RowNotFound) => OwnerProviderFirstVisitReadResult::InvalidState,
            Err(error) => {
                tracing::error!(%error, provider_actor_user_id, activation_id, "provider first-visit read failed");
                OwnerProviderFirstVisitReadResult::Unavailable
            }
        }
    }

    pub async fn propose_provider_first_visit(
        &self,
        provider_actor_user_id: &str,
        verified_email: &str,
        activation_id: &str,
        request: ProposeProviderFirstVisitRequest,
    ) -> OwnerProviderFirstVisitWriteResult {
        if !validate_provider_first_visit_request(&request) {
            return OwnerProviderFirstVisitWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderFirstVisitWriteResult::Unavailable;
        };
        let normalized_email = normalize_email(verified_email);
        match propose_provider_first_visit(
            pool,
            provider_actor_user_id,
            &email_fingerprint(&normalized_email),
            &invitation_token_hash(request.token.trim()),
            activation_id,
            request,
        )
        .await
        {
            Ok(outcome) => public_first_visit_outcome(outcome),
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderFirstVisitWriteResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, provider_actor_user_id, activation_id, "provider first-visit proposal failed");
                OwnerProviderFirstVisitWriteResult::Unavailable
            }
        }
    }

    pub async fn decide_owner_provider_first_visit(
        &self,
        owner_user_id: &str,
        property_id: &str,
        activation_id: &str,
        request: DecideOwnerProviderFirstVisitRequest,
    ) -> OwnerProviderFirstVisitWriteResult {
        if !validate_owner_first_visit_decision_request(&request) {
            return OwnerProviderFirstVisitWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return OwnerProviderFirstVisitWriteResult::Unavailable;
        };
        match decide_owner_provider_first_visit(
            pool,
            owner_user_id,
            property_id,
            activation_id,
            request,
        )
        .await
        {
            Ok(outcome) => public_first_visit_outcome(outcome),
            Err(error) if is_unique_violation(&error) => {
                OwnerProviderFirstVisitWriteResult::Conflict
            }
            Err(error) => {
                tracing::error!(%error, owner_user_id, property_id, activation_id, "owner first-visit decision failed");
                OwnerProviderFirstVisitWriteResult::Unavailable
            }
        }
    }
}

fn public_first_visit_outcome(
    outcome: PersistedFirstVisitOutcome,
) -> OwnerProviderFirstVisitWriteResult {
    match outcome {
        PersistedFirstVisitOutcome::Saved(record) => {
            OwnerProviderFirstVisitWriteResult::Saved(record)
        }
        PersistedFirstVisitOutcome::Replayed(record) => {
            OwnerProviderFirstVisitWriteResult::Replayed(record)
        }
        PersistedFirstVisitOutcome::NotFound => OwnerProviderFirstVisitWriteResult::NotFound,
        PersistedFirstVisitOutcome::InvalidState(record) => {
            OwnerProviderFirstVisitWriteResult::InvalidState(record)
        }
        PersistedFirstVisitOutcome::Conflict => OwnerProviderFirstVisitWriteResult::Conflict,
    }
}

fn public_initial_service_proposal_message_outcome(
    outcome: PersistedInitialServiceProposalMessageWriteOutcome,
) -> OwnerProviderInitialServiceProposalMessageWriteResult {
    match outcome {
        PersistedInitialServiceProposalMessageWriteOutcome::Created(record) => {
            OwnerProviderInitialServiceProposalMessageWriteResult::Created(record)
        }
        PersistedInitialServiceProposalMessageWriteOutcome::Replayed(record) => {
            OwnerProviderInitialServiceProposalMessageWriteResult::Replayed(record)
        }
        PersistedInitialServiceProposalMessageWriteOutcome::NotFound => {
            OwnerProviderInitialServiceProposalMessageWriteResult::NotFound
        }
        PersistedInitialServiceProposalMessageWriteOutcome::InvalidState(proposal) => {
            OwnerProviderInitialServiceProposalMessageWriteResult::InvalidState(proposal)
        }
        PersistedInitialServiceProposalMessageWriteOutcome::Conflict => {
            OwnerProviderInitialServiceProposalMessageWriteResult::Conflict
        }
    }
}

fn public_assessment_communication_outcome<T>(
    outcome: PersistedAssessmentCommunicationWriteOutcome<T>,
) -> OwnerProviderAssessmentCommunicationWriteResult<T> {
    match outcome {
        PersistedAssessmentCommunicationWriteOutcome::Created(record) => {
            OwnerProviderAssessmentCommunicationWriteResult::Created(record)
        }
        PersistedAssessmentCommunicationWriteOutcome::Replayed(record) => {
            OwnerProviderAssessmentCommunicationWriteResult::Replayed(record)
        }
        PersistedAssessmentCommunicationWriteOutcome::NotFound => {
            OwnerProviderAssessmentCommunicationWriteResult::NotFound
        }
        PersistedAssessmentCommunicationWriteOutcome::InvalidState(status) => {
            OwnerProviderAssessmentCommunicationWriteResult::InvalidState(status)
        }
        PersistedAssessmentCommunicationWriteOutcome::Conflict => {
            OwnerProviderAssessmentCommunicationWriteResult::Conflict
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

pub fn validate_provider_inbox_request(request: &OpenOwnerProviderInboxRequest) -> bool {
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    })
}

pub fn validate_provider_opportunity_response_request(
    request: &CreateOwnerProviderOpportunityResponseRequest,
) -> bool {
    let idempotency_key = request.idempotency_key.trim();
    let response_valid = match request.action.as_str() {
        "preliminary_question" => {
            matches!(
                request.response_code.as_str(),
                "service_fit" | "coarse_area_fit" | "cadence_support" | "assessment_method"
            ) && !request.block_future_invitations
        }
        "express_interest" => {
            request.response_code == "ready_for_owner_disclosure"
                && !request.block_future_invitations
        }
        "decline" => {
            matches!(
                request.response_code.as_str(),
                "service_area_mismatch"
                    | "capacity_unavailable"
                    | "service_fit_mismatch"
                    | "not_accepting_assessments"
            ) && !request.block_future_invitations
        }
        "report" => {
            matches!(
                request.response_code.as_str(),
                "suspicious_contact" | "unsafe_contact" | "wrong_recipient" | "impersonation"
            ) && request.block_future_invitations
        }
        _ => false,
    };
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && (8..=180).contains(&request.capability_id.trim().chars().count())
        && request.expected_capability_version > 0
        && response_valid
        && (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_provider_disclosure_grant_request(
    request: &CreateOwnerProviderDisclosureGrantRequest,
) -> bool {
    let idempotency_key = request.idempotency_key.trim();
    let review_version = request.expected_review_version.trim();
    let approved: HashSet<_> = request
        .approved_categories
        .iter()
        .map(String::as_str)
        .collect();
    let media: HashSet<_> = request
        .selected_media_ids
        .iter()
        .map(String::as_str)
        .collect();
    let categories_are_unique = approved.len() == request.approved_categories.len();
    let media_are_unique = media.len() == request.selected_media_ids.len();
    let categories_are_controlled = request
        .approved_categories
        .iter()
        .all(|category| OWNER_PROVIDER_DISCLOSURE_CATEGORIES.contains(&category.as_str()));
    let photo_selection_consistent =
        approved.contains("selected_yard_photos") == !request.selected_media_ids.is_empty();
    request.owner_affirmed
        && request.purpose == "yard_assessment"
        && request.consent_text_version == OWNER_PROVIDER_CONSENT_TEXT_VERSION
        && request.retention_notice_version == OWNER_PROVIDER_RETENTION_NOTICE_VERSION
        && review_version.starts_with("disclosure_review_v1_")
        && review_version.len() == 85
        && !request.approved_categories.is_empty()
        && categories_are_unique
        && categories_are_controlled
        && media_are_unique
        && photo_selection_consistent
        && (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
        && request.selected_media_ids.iter().all(|media_id| {
            (8..=180).contains(&media_id.trim().chars().count())
                && media_id.chars().all(|character| {
                    character.is_ascii_alphanumeric() || matches!(character, '-' | '_')
                })
        })
}

pub fn validate_provider_disclosure_access_request(
    request: &OpenOwnerProviderDisclosureRequest,
) -> bool {
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    })
}

pub fn validate_provider_disclosure_revoke_request(
    request: &RevokeOwnerProviderDisclosureGrantRequest,
) -> bool {
    let idempotency_key = request.idempotency_key.trim();
    request.owner_confirmed
        && request.expected_version > 0
        && matches!(
            request.reason_code.as_str(),
            "owner_choice"
                | "assessment_complete"
                | "provider_changed"
                | "incorrect_details"
                | "privacy_concern"
        )
        && (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_provider_assessment_request(
    request: &CreateOwnerProviderAssessmentRequest,
) -> bool {
    let idempotency_key = request.idempotency_key.trim();
    let grant_id = request.disclosure_grant_id.trim();
    let schedule_valid = match request.assessment_method.as_str() {
        "remote" => {
            request.proposed_window_start_epoch_seconds.is_none()
                && request.proposed_window_end_epoch_seconds.is_none()
                && request.time_zone.is_none()
        }
        "on_site" => match (
            request.proposed_window_start_epoch_seconds,
            request.proposed_window_end_epoch_seconds,
            request.time_zone.as_deref(),
        ) {
            (Some(start), Some(end), Some(time_zone)) => {
                let time_zone = time_zone.trim();
                start > 0
                    && end > start
                    && end - start <= 8 * 60 * 60
                    && (1..=80).contains(&time_zone.chars().count())
                    && time_zone.chars().all(|character| {
                        character.is_ascii_alphanumeric()
                            || matches!(character, '/' | '_' | '-' | '+')
                    })
            }
            _ => false,
        },
        _ => false,
    };
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && (8..=180).contains(&grant_id.chars().count())
        && grant_id
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
        && schedule_valid
        && (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_provider_assessment_window_decision_request(
    request: &DecideOwnerProviderAssessmentWindowRequest,
) -> bool {
    let idempotency_key = request.idempotency_key.trim();
    matches!(request.action.as_str(), "confirm" | "request_change")
        && request.expected_version > 0
        && (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_provider_assessment_window_proposal_request(
    request: &ProposeProviderAssessmentWindowRequest,
) -> bool {
    let time_zone = request.time_zone.trim();
    let idempotency_key = request.idempotency_key.trim();
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && request.expected_version > 0
        && request.proposed_window_start_epoch_seconds > 0
        && request.proposed_window_end_epoch_seconds > request.proposed_window_start_epoch_seconds
        && request.proposed_window_end_epoch_seconds - request.proposed_window_start_epoch_seconds
            <= 8 * 60 * 60
        && (1..=80).contains(&time_zone.chars().count())
        && time_zone.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '/' | '_' | '-' | '+')
        })
        && (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_provider_assessment_transition_request(
    request: &TransitionOwnerProviderAssessmentRequest,
) -> bool {
    let idempotency_key = request.idempotency_key.trim();
    let summary_valid = request
        .owner_visible_summary
        .as_deref()
        .is_some_and(|summary| (1..=2000).contains(&summary.trim().chars().count()));
    let action_valid = match request.action.as_str() {
        "begin" => request.reason_code.is_none() && request.owner_visible_summary.is_none(),
        "complete" => request.reason_code.is_none() && summary_valid,
        "cannot_assess" => {
            request.reason_code.as_deref().is_some_and(|reason| {
                matches!(
                    reason,
                    "insufficient_information"
                        | "on_site_required"
                        | "safety_concern"
                        | "outside_service_scope"
                        | "qualified_specialist_required"
                )
            }) && summary_valid
        }
        "cancel" => {
            request.reason_code.as_deref().is_some_and(|reason| {
                matches!(
                    reason,
                    "provider_unavailable"
                        | "safety_concern"
                        | "access_unavailable"
                        | "assessment_no_longer_needed"
                )
            }) && summary_valid
        }
        _ => false,
    };
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && request.expected_version > 0
        && action_valid
        && (8..=128).contains(&idempotency_key.chars().count())
        && idempotency_key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

fn valid_assessment_communication_key(key: &str) -> bool {
    let key = key.trim();
    (8..=128).contains(&key.chars().count())
        && key
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub fn validate_owner_assessment_message_request(
    request: &CreateOwnerAssessmentMessageRequest,
) -> bool {
    matches!(
        request.message_kind.as_str(),
        "owner_question" | "window_change_request" | "clarification"
    ) && (1..=2000).contains(&request.customer_safe_body.trim().chars().count())
        && request.expected_assessment_version > 0
        && valid_assessment_communication_key(&request.idempotency_key)
}

pub fn validate_provider_assessment_message_request(
    request: &CreateProviderAssessmentMessageRequest,
) -> bool {
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && matches!(
        request.message_kind.as_str(),
        "provider_answer" | "window_change_request" | "additional_photo_request" | "clarification"
    ) && (1..=2000).contains(&request.customer_safe_body.trim().chars().count())
        && request.expected_assessment_version > 0
        && valid_assessment_communication_key(&request.idempotency_key)
}

pub fn validate_provider_assessment_private_note_request(
    request: &CreateProviderAssessmentPrivateNoteRequest,
) -> bool {
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && matches!(
        request.note_kind.as_str(),
        "scope_basis"
            | "measurement"
            | "access"
            | "safety"
            | "production_assumption"
            | "route_fit"
            | "other"
    ) && (1..=4000).contains(&request.private_body.trim().chars().count())
        && request.expected_assessment_version > 0
        && valid_assessment_communication_key(&request.idempotency_key)
}

const OWNER_PROVIDER_PROPOSAL_ACCEPTANCE_TEXT_VERSION: &str =
    "initial_service_proposal_acceptance_v1";
const OWNER_PROVIDER_PROPOSAL_ACCEPTANCE_TEXT: &str =
    "I accept this exact proposal for provider setup. I understand that acceptance does not schedule service, collect payment, or assign a crew.";
pub const OWNER_PROVIDER_ACTIVATION_AFFIRMATION_TEXT_VERSION: &str =
    "owner_provider_relationship_activation_v1";
pub const OWNER_PROVIDER_FIRST_VISIT_CONFIRMATION_TEXT_VERSION: &str =
    "owner_provider_first_visit_confirmation_v1";

fn valid_proposal_text_items(items: &[String]) -> bool {
    (1..=40).contains(&items.len())
        && items
            .iter()
            .all(|item| (1..=500).contains(&item.trim().chars().count()))
}

pub fn validate_initial_service_proposal_request(
    request: &PublishOwnerProviderInitialServiceProposalRequest,
) -> bool {
    let revision_note_valid = if request.expected_proposal_version == 0 {
        request.revision_note.is_none()
    } else {
        request
            .revision_note
            .as_deref()
            .is_some_and(|note| (1..=1000).contains(&note.trim().chars().count()))
    };
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && request.expected_proposal_version >= 0
        && (1..=160).contains(&request.title.trim().chars().count())
        && (1..=2000).contains(&request.customer_summary.trim().chars().count())
        && valid_proposal_text_items(&request.included_scope)
        && valid_proposal_text_items(&request.exclusions)
        && matches!(
            request.cadence_code.as_str(),
            "weekly" | "every_two_weeks" | "monthly" | "one_time" | "custom"
        )
        && (1..=500).contains(&request.cadence_detail.trim().chars().count())
        && [
            &request.arrival_policy,
            &request.weather_policy,
            &request.cancellation_policy,
            &request.proof_expectation,
        ]
        .iter()
        .all(|value| (1..=1000).contains(&value.trim().chars().count()))
        && (0..=100_000_000_000).contains(&request.price_amount_minor)
        && matches!(
            request.price_basis.as_str(),
            "per_visit" | "monthly" | "fixed"
        )
        && request.currency_code.len() == 3
        && request
            .currency_code
            .chars()
            .all(|character| character.is_ascii_uppercase())
        && revision_note_valid
        && request.expires_at_epoch_seconds > 0
        && valid_assessment_communication_key(&request.idempotency_key)
}

pub fn validate_initial_service_proposal_decision_request(
    request: &DecideOwnerProviderInitialServiceProposalRequest,
) -> bool {
    let note_valid = request
        .customer_safe_note
        .as_deref()
        .is_none_or(|note| (1..=2000).contains(&note.trim().chars().count()));
    let action_valid = match request.action.as_str() {
        "accept" => {
            request.reason_code.is_none()
                && request.affirmation_text_version.as_deref()
                    == Some(OWNER_PROVIDER_PROPOSAL_ACCEPTANCE_TEXT_VERSION)
        }
        "decline" => {
            request.affirmation_text_version.is_none()
                && request.reason_code.as_deref().is_some_and(|reason| {
                    matches!(
                        reason,
                        "price"
                            | "scope"
                            | "timing"
                            | "provider_fit"
                            | "no_longer_needed"
                            | "other"
                    )
                })
        }
        _ => false,
    };
    request.expected_proposal_version > 0
        && action_valid
        && note_valid
        && valid_assessment_communication_key(&request.idempotency_key)
}

pub fn validate_owner_provider_relationship_activation_request(
    request: &ActivateOwnerProviderRelationshipRequest,
) -> bool {
    request.expected_proposal_version > 0
        && request.owner_confirmed
        && request.activation_affirmation_text_version.trim()
            == OWNER_PROVIDER_ACTIVATION_AFFIRMATION_TEXT_VERSION
        && valid_assessment_communication_key(&request.idempotency_key)
}

pub fn validate_provider_first_visit_request(request: &ProposeProviderFirstVisitRequest) -> bool {
    let time_zone = request.time_zone.trim();
    let note_valid = request
        .customer_safe_arrival_note
        .as_deref()
        .is_none_or(|note| (1..=1000).contains(&note.trim().chars().count()));
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && request.expected_series_version >= 0
        && request.window_start_epoch_seconds > 0
        && request.window_end_epoch_seconds > request.window_start_epoch_seconds
        && request.window_end_epoch_seconds - request.window_start_epoch_seconds <= 4 * 60 * 60
        && (1..=80).contains(&time_zone.chars().count())
        && time_zone.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '/' | '_' | '-' | '+')
        })
        && note_valid
        && valid_assessment_communication_key(&request.idempotency_key)
}

pub fn validate_owner_first_visit_decision_request(
    request: &DecideOwnerProviderFirstVisitRequest,
) -> bool {
    let note_valid = request
        .customer_safe_note
        .as_deref()
        .is_none_or(|note| (1..=1000).contains(&note.trim().chars().count()));
    let action_valid = match request.action.as_str() {
        "confirm" => {
            note_valid
                && request.confirmation_affirmation_text_version.as_deref()
                    == Some(OWNER_PROVIDER_FIRST_VISIT_CONFIRMATION_TEXT_VERSION)
        }
        "request_change" => {
            request.confirmation_affirmation_text_version.is_none()
                && request
                    .customer_safe_note
                    .as_deref()
                    .is_some_and(|note| !note.trim().is_empty())
        }
        _ => false,
    };
    request.expected_window_version > 0
        && action_valid
        && valid_assessment_communication_key(&request.idempotency_key)
}

pub fn validate_owner_initial_service_proposal_message_request(
    request: &CreateOwnerInitialServiceProposalMessageRequest,
) -> bool {
    matches!(
        request.message_kind.as_str(),
        "owner_question" | "owner_change_request"
    ) && (1..=2000).contains(&request.customer_safe_body.trim().chars().count())
        && request.expected_proposal_version > 0
        && valid_assessment_communication_key(&request.idempotency_key)
}

pub fn validate_provider_initial_service_proposal_response_request(
    request: &CreateProviderInitialServiceProposalResponseRequest,
) -> bool {
    validate_provider_invitation_preview_request(&PreviewOwnerProviderInvitationRequest {
        token: request.token.clone(),
    }) && (8..=160).contains(&request.in_reply_to_message_id.trim().chars().count())
        && (1..=2000).contains(&request.customer_safe_body.trim().chars().count())
        && request.expected_proposal_version > 0
        && request
            .related_proposal_id
            .as_deref()
            .is_none_or(|proposal_id| (8..=160).contains(&proposal_id.trim().chars().count()))
        && valid_assessment_communication_key(&request.idempotency_key)
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

async fn list_owner_provider_connection_progress(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
) -> Result<Option<Vec<OwnerProviderConnectionProgressEntry>>, sqlx::Error> {
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
        "SELECT invitation.id, invitation.provider_name,
                CASE
                    WHEN invitation.status IN ('pending_delivery', 'delivered', 'opened')
                         AND invitation.expires_at <= NOW()
                    THEN 'expired'
                    ELSE invitation.status
                END AS invitation_status,
                COALESCE(delivery.status, 'pending') AS delivery_status,
                EXTRACT(EPOCH FROM invitation.expires_at)::BIGINT AS expires_at_epoch_seconds,
                response.action AS response_action,
                response.response_code,
                response.responded_at_epoch_seconds,
                (
                    SELECT CASE
                        WHEN disclosure_grant.status = 'active'
                             AND disclosure_grant.expires_at <= NOW() THEN 'expired'
                        ELSE disclosure_grant.status
                    END
                    FROM owner_provider_disclosure_grants disclosure_grant
                    JOIN owner_provider_disclosure_receipts disclosure_receipt
                      ON disclosure_receipt.id = disclosure_grant.receipt_id
                    WHERE disclosure_grant.invitation_id = invitation.id
                    ORDER BY disclosure_receipt.grant_version DESC LIMIT 1
                ) AS disclosure_status
         FROM owner_provider_invitations invitation
         LEFT JOIN LATERAL (
             SELECT attempt.status
             FROM owner_provider_invitation_delivery_attempts attempt
             WHERE attempt.invitation_id = invitation.id
             ORDER BY attempt.attempt_number DESC
             LIMIT 1
         ) delivery ON TRUE
         LEFT JOIN LATERAL (
             SELECT opportunity.action, opportunity.response_code,
                    EXTRACT(EPOCH FROM opportunity.created_at)::BIGINT
                        AS responded_at_epoch_seconds
             FROM owner_provider_opportunity_responses opportunity
             WHERE opportunity.invitation_id = invitation.id
             ORDER BY CASE opportunity.action
                        WHEN 'express_interest' THEN 1
                        WHEN 'preliminary_question' THEN 2
                        WHEN 'decline' THEN 3
                        ELSE 4
                      END,
                      opportunity.created_at DESC, opportunity.id
             LIMIT 1
         ) response ON TRUE
         WHERE invitation.owner_user_id = $1 AND invitation.property_id = $2
         ORDER BY invitation.created_at DESC, invitation.id",
    )
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_all(pool)
    .await?;
    Ok(Some(
        rows.iter()
            .map(|row| {
                owner_provider_connection_progress_entry(
                    &row.get::<String, _>("id"),
                    &row.get::<String, _>("provider_name"),
                    &row.get::<String, _>("invitation_status"),
                    &row.get::<String, _>("delivery_status"),
                    row.get("expires_at_epoch_seconds"),
                    row.get("response_action"),
                    row.get("response_code"),
                    row.get("responded_at_epoch_seconds"),
                    row.get("disclosure_status"),
                    true,
                )
            })
            .collect(),
    ))
}

#[allow(clippy::too_many_arguments)]
fn owner_provider_connection_progress_entry(
    invitation_id: &str,
    provider_name: &str,
    invitation_status: &str,
    delivery_status: &str,
    expires_at_epoch_seconds: i64,
    response_action: Option<String>,
    response_code: Option<String>,
    responded_at_epoch_seconds: Option<i64>,
    disclosure_status: Option<String>,
    persisted: bool,
) -> OwnerProviderConnectionProgressEntry {
    let (progress_stage, status_label, owner_action_required, next_action) = match invitation_status
    {
        "activated" => (
            "relationship_activated",
            "Provider relationship activated",
            false,
            "complete_provider_setup",
        ),
        "revoked" => (
            "withdrawn",
            "Invitation withdrawn",
            false,
            "start_new_invitation",
        ),
        "opted_out" => (
            "contact_closed",
            "Recipient contact closed",
            false,
            "choose_another_provider",
        ),
        "declined" => (
            "declined",
            "Provider not available for this request",
            false,
            "choose_another_provider",
        ),
        "expired" => (
            "expired",
            "Invitation expired",
            false,
            "start_new_invitation",
        ),
        "failed" => (
            "delivery_failed",
            "Invitation was not delivered",
            true,
            "review_recipient",
        ),
        "opened"
            if response_action.as_deref() == Some("express_interest")
                && disclosure_status.as_deref() == Some("active") =>
        {
            (
                "assessment_access_approved",
                "Assessment access approved for this provider",
                false,
                "wait_for_assessment",
            )
        }
        "opened"
            if response_action.as_deref() == Some("express_interest")
                && disclosure_status.is_some() =>
        {
            (
                "assessment_access_ended",
                "Assessment access has ended",
                false,
                "review_connection",
            )
        }
        "opened" if response_action.as_deref() == Some("express_interest") => (
            "disclosure_decision",
            "Provider is interested in the next owner-approved review",
            true,
            "review_disclosure",
        ),
        "opened" if response_action.as_deref() == Some("preliminary_question") => (
            "question_received",
            "Provider asked a preliminary question",
            true,
            "review_question",
        ),
        "opened" => (
            "provider_reviewing",
            "Provider is reviewing the limited request",
            false,
            "wait_or_withdraw",
        ),
        "delivered" => (
            "awaiting_open",
            "Invitation delivered",
            false,
            "wait_or_withdraw",
        ),
        _ => ("sending", "Sending invitation", false, "wait"),
    };
    let safe_response_action = match invitation_status {
        "declined" => Some("decline".to_string()),
        "opened"
            if matches!(
                response_action.as_deref(),
                Some("express_interest" | "preliminary_question")
            ) =>
        {
            response_action
        }
        _ => None,
    };
    let response_label = match safe_response_action.as_deref() {
        Some("express_interest") => {
            Some("Interested in reviewing the next owner-approved details".to_string())
        }
        Some("preliminary_question") => Some(
            match response_code.as_deref() {
                Some("service_fit") => {
                    "Asked whether the requested care fits the provider's services"
                }
                Some("coarse_area_fit") => "Asked whether the general service area is a fit",
                Some("cadence_support") => "Asked whether the requested cadence is supported",
                Some("assessment_method") => "Asked how the yard assessment would be completed",
                _ => "Asked a preliminary question",
            }
            .to_string(),
        ),
        Some("decline") => Some("Not available for this request".to_string()),
        _ => None,
    };
    let safe_responded_at = safe_response_action
        .as_ref()
        .and(responded_at_epoch_seconds);
    OwnerProviderConnectionProgressEntry {
        invitation_id: invitation_id.to_string(),
        provider_name: provider_name.to_string(),
        invitation_status: invitation_status.to_string(),
        delivery_status: delivery_status.to_string(),
        progress_stage: progress_stage.to_string(),
        status_label: status_label.to_string(),
        owner_action_required,
        next_action: next_action.to_string(),
        latest_response_action: safe_response_action,
        response_label,
        expires_at_epoch_seconds,
        responded_at_epoch_seconds: safe_responded_at,
        persisted,
    }
}

async fn get_owner_provider_progress(
    pool: &PgPool,
    recipient_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
) -> Result<Option<OwnerProviderProgressEntry>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        "SELECT invitation.id AS invitation_id, invitation.owner_user_id,
                invitation.property_id, invitation.status AS invitation_status,
                invitation.expires_at <= NOW() AS invitation_expired,
                recipient_check.recipient_user_id,
                recipient_check.verified_email_fingerprint,
                recipient_check.status AS recipient_check_status,
                claim.id AS claim_id, claim.status AS claim_status,
                claim.version AS claim_version,
                claim.organization_id,
                organization.status AS organization_status,
                organization.organization_type,
                capability.status AS capability_status,
                capability.expires_at <= NOW() AS capability_expired,
                response.action AS response_action,
                response.response_code,
                response.responded_at_epoch_seconds,
                (
                    SELECT activation.id
                    FROM owner_provider_relationship_activations activation
                    WHERE activation.invitation_id = invitation.id
                    LIMIT 1
                ) AS activation_id,
                (
                    SELECT CASE
                        WHEN disclosure_grant.status = 'active'
                             AND disclosure_grant.expires_at <= NOW() THEN 'expired'
                        ELSE disclosure_grant.status
                    END
                    FROM owner_provider_disclosure_grants disclosure_grant
                    JOIN owner_provider_disclosure_receipts disclosure_receipt
                      ON disclosure_receipt.id = disclosure_grant.receipt_id
                    WHERE disclosure_grant.invitation_id = invitation.id
                      AND disclosure_grant.recipient_actor_user_id = $3
                    ORDER BY disclosure_receipt.grant_version DESC LIMIT 1
                ) AS disclosure_status,
                EXISTS (
                    SELECT 1 FROM organization_memberships membership
                    WHERE membership.organization_id = claim.organization_id
                      AND membership.user_id = $3 AND membership.status = 'active'
                ) AS active_membership
         FROM owner_provider_invitations invitation
         JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.invitation_id = invitation.id
         LEFT JOIN owner_provider_invitation_organization_claims claim
           ON claim.invitation_id = invitation.id
         LEFT JOIN organizations organization ON organization.id = claim.organization_id
         LEFT JOIN LATERAL (
             SELECT candidate.status, candidate.expires_at
             FROM owner_provider_invitation_response_capabilities candidate
             WHERE candidate.invitation_id = invitation.id
               AND candidate.actor_user_id = $3
             ORDER BY CASE WHEN candidate.status = 'active' THEN 0 ELSE 1 END,
                      candidate.created_at DESC, candidate.id
             LIMIT 1
         ) capability ON TRUE
         LEFT JOIN LATERAL (
             SELECT opportunity.action, opportunity.response_code,
                    EXTRACT(EPOCH FROM opportunity.created_at)::BIGINT
                        AS responded_at_epoch_seconds
             FROM owner_provider_opportunity_responses opportunity
             WHERE opportunity.invitation_id = invitation.id
               AND opportunity.actor_user_id = $3
             ORDER BY CASE opportunity.action
                        WHEN 'express_interest' THEN 1
                        WHEN 'preliminary_question' THEN 2
                        ELSE 3
                      END,
                      opportunity.created_at DESC, opportunity.id
             LIMIT 1
         ) response ON TRUE
         WHERE invitation.token_hash = $1
           AND LOWER(invitation.recipient_email) = LOWER($2)
         ORDER BY claim.created_at DESC NULLS LAST LIMIT 1
         FOR UPDATE OF invitation",
    )
    .bind(token_hash)
    .bind(verified_email)
    .bind(recipient_user_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(row) = row else {
        transaction.rollback().await?;
        return Ok(None);
    };
    let recipient_checked = row.get::<String, _>("recipient_user_id") == recipient_user_id
        && row.get::<String, _>("verified_email_fingerprint") == verified_email_fingerprint
        && row.get::<String, _>("recipient_check_status") == "checked";
    if !recipient_checked {
        transaction.rollback().await?;
        return Err(sqlx::Error::RowNotFound);
    }
    let invitation_id: String = row.get("invitation_id");
    let owner_user_id: String = row.get("owner_user_id");
    let property_id: String = row.get("property_id");
    let invitation_status: String = row.get("invitation_status");
    let invitation_expired: bool = row.get("invitation_expired");
    let claim_status: Option<String> = row.get("claim_status");
    let claim_id: Option<String> = row.get("claim_id");
    let claim_version: Option<i64> = row.get("claim_version");
    let relationship_checked = claim_status
        .as_deref()
        .is_some_and(|status| matches!(status, "relationship_checked" | "claimed"));
    let organization_active = row
        .try_get::<String, _>("organization_status")
        .is_ok_and(|status| status == "active")
        && row
            .try_get::<String, _>("organization_type")
            .is_ok_and(|kind| kind == "yard_care_company")
        && row.get::<bool, _>("active_membership");
    let capability_status: Option<String> = row.get("capability_status");
    let capability_expired = row
        .try_get::<bool, _>("capability_expired")
        .unwrap_or(false);
    let response_action: Option<String> = row.get("response_action");
    let response_code: Option<String> = row.get("response_code");
    let responded_at: Option<i64> = row.get("responded_at_epoch_seconds");
    let activation_id: Option<String> = row.get("activation_id");
    let disclosure_status: Option<String> = row.get("disclosure_status");
    let terminal_status = if invitation_expired
        && matches!(
            invitation_status.as_str(),
            "pending_delivery" | "delivered" | "opened"
        ) {
        "expired"
    } else {
        invitation_status.as_str()
    };
    let relationship_effective = relationship_checked && organization_active;
    let capability_effective = capability_status.as_deref() == Some("active")
        && !capability_expired
        && terminal_status == "opened"
        && relationship_effective;
    if capability_status.as_deref() == Some("active") && !capability_effective {
        let (next_status, reason) = if terminal_status == "expired" || capability_expired {
            ("expired", "capability_expired")
        } else if terminal_status != "opened" {
            ("revoked", "invitation_closed")
        } else {
            ("suspended", "provider_relationship_inactive")
        };
        reconcile_owner_provider_response_capability(
            &mut transaction,
            &invitation_id,
            &owner_user_id,
            &property_id,
            next_status,
            reason,
        )
        .await?;
    }
    let own_report = response_action.as_deref() == Some("report");
    let terminal = matches!(
        terminal_status,
        "failed" | "expired" | "declined" | "opted_out" | "revoked" | "activated"
    );
    let progress = if terminal {
        let (stage, label, next_action) = match terminal_status {
            "activated" => (
                "relationship_activated",
                "Provider relationship activated",
                "complete_provider_setup",
            ),
            "declined" => ("closed", "Response recorded and invitation closed", "none"),
            "opted_out" if own_report => {
                ("closed", "Safety item routed and contact blocked", "none")
            }
            "opted_out" => ("closed", "Recipient contact is closed", "none"),
            "revoked" => ("closed", "Owner withdrew this invitation", "none"),
            "expired" => ("closed", "Invitation expired", "request_new_invitation"),
            _ => ("closed", "Invitation delivery failed", "none"),
        };
        OwnerProviderProgressEntry {
            invitation_id,
            activation_id,
            organization_claim_id: None,
            organization_claim_status: None,
            organization_claim_version: None,
            progress_stage: stage.to_string(),
            status_label: label.to_string(),
            next_action: next_action.to_string(),
            recipient_email_checked: true,
            organization_relationship_checked: false,
            opportunity_response_capability: false,
            response_action: None,
            response_label: None,
            responded_at_epoch_seconds: None,
            closed: true,
        }
    } else if !relationship_effective {
        OwnerProviderProgressEntry {
            invitation_id,
            activation_id,
            organization_claim_id: claim_id.clone(),
            organization_claim_status: claim_status.clone(),
            organization_claim_version: claim_version,
            progress_stage: "organization_check_required".to_string(),
            status_label: "Provider organization relationship required".to_string(),
            next_action: "complete_organization_check".to_string(),
            recipient_email_checked: true,
            organization_relationship_checked: false,
            opportunity_response_capability: false,
            response_action: None,
            response_label: None,
            responded_at_epoch_seconds: None,
            closed: false,
        }
    } else if !capability_effective {
        OwnerProviderProgressEntry {
            invitation_id,
            activation_id,
            organization_claim_id: claim_id.clone(),
            organization_claim_status: claim_status.clone(),
            organization_claim_version: claim_version,
            progress_stage: "response_authorization_required".to_string(),
            status_label: "Limited response acknowledgement required".to_string(),
            next_action: "acknowledge_withheld_data".to_string(),
            recipient_email_checked: true,
            organization_relationship_checked: true,
            opportunity_response_capability: false,
            response_action: None,
            response_label: None,
            responded_at_epoch_seconds: None,
            closed: false,
        }
    } else if disclosure_status.as_deref() == Some("active")
        && response_action.as_deref() == Some("express_interest")
    {
        OwnerProviderProgressEntry {
            invitation_id,
            activation_id,
            organization_claim_id: None,
            organization_claim_status: None,
            organization_claim_version: None,
            progress_stage: "assessment_access_ready".to_string(),
            status_label: "Owner-approved assessment details are ready".to_string(),
            next_action: "review_owner_approved_details".to_string(),
            recipient_email_checked: true,
            organization_relationship_checked: true,
            opportunity_response_capability: true,
            response_action: Some("express_interest".to_string()),
            response_label: Some(
                "Interest recorded; the owner approved selected assessment details".to_string(),
            ),
            responded_at_epoch_seconds: responded_at,
            closed: false,
        }
    } else if disclosure_status.is_some() && response_action.as_deref() == Some("express_interest")
    {
        OwnerProviderProgressEntry {
            invitation_id,
            activation_id,
            organization_claim_id: None,
            organization_claim_status: None,
            organization_claim_version: None,
            progress_stage: "assessment_access_closed".to_string(),
            status_label: "Owner-approved assessment access has ended".to_string(),
            next_action: "contact_owner".to_string(),
            recipient_email_checked: true,
            organization_relationship_checked: true,
            opportunity_response_capability: true,
            response_action: Some("express_interest".to_string()),
            response_label: Some(
                "Interest remains recorded; assessment details are no longer available".to_string(),
            ),
            responded_at_epoch_seconds: responded_at,
            closed: false,
        }
    } else if matches!(
        response_action.as_deref(),
        Some("express_interest" | "preliminary_question")
    ) {
        let label = if response_action.as_deref() == Some("express_interest") {
            "Interest recorded; waiting for the owner's next decision".to_string()
        } else {
            match response_code.as_deref() {
                Some("service_fit") => "Service-fit question recorded",
                Some("coarse_area_fit") => "General-area question recorded",
                Some("cadence_support") => "Cadence question recorded",
                Some("assessment_method") => "Assessment-method question recorded",
                _ => "Preliminary question recorded",
            }
            .to_string()
        };
        OwnerProviderProgressEntry {
            invitation_id,
            activation_id,
            organization_claim_id: None,
            organization_claim_status: None,
            organization_claim_version: None,
            progress_stage: "response_recorded".to_string(),
            status_label: label.clone(),
            next_action: "wait_for_owner".to_string(),
            recipient_email_checked: true,
            organization_relationship_checked: true,
            opportunity_response_capability: true,
            response_action,
            response_label: Some(label),
            responded_at_epoch_seconds: responded_at,
            closed: false,
        }
    } else {
        OwnerProviderProgressEntry {
            invitation_id,
            activation_id,
            organization_claim_id: None,
            organization_claim_status: None,
            organization_claim_version: None,
            progress_stage: "response_ready".to_string(),
            status_label: "Limited request ready for response".to_string(),
            next_action: "respond_to_limited_request".to_string(),
            recipient_email_checked: true,
            organization_relationship_checked: true,
            opportunity_response_capability: true,
            response_action: None,
            response_label: None,
            responded_at_epoch_seconds: None,
            closed: false,
        }
    };
    transaction.commit().await?;
    Ok(Some(progress))
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

enum PersistedProviderInboxOutcome {
    Loaded(OwnerProviderInboxEntry),
    Closed(OwnerProviderInboxEntry),
    NotFound,
    InvalidState,
}

enum PersistedOpportunityResponseOutcome {
    Recorded(OwnerProviderOpportunityResponseRecord),
    Replayed(OwnerProviderOpportunityResponseRecord),
    NotFound,
    InvalidState,
    Conflict,
}

enum PersistedDisclosureReviewOutcome {
    Loaded(OwnerProviderDisclosureReview),
    NotFound,
    InvalidState,
}

enum PersistedDisclosureGrantOutcome {
    Created(OwnerProviderDisclosureGrantRecord),
    Replayed(OwnerProviderDisclosureGrantRecord),
    NotFound,
    InvalidState,
    Conflict,
}

enum PersistedDisclosureAccessOutcome {
    Loaded(OwnerProviderDisclosureAccess),
    Closed(OwnerProviderDisclosureAccess),
    NotFound,
    InvalidState,
}

enum PersistedDisclosureRevokeOutcome {
    Revoked(OwnerProviderDisclosureReceiptView),
    Replayed(OwnerProviderDisclosureReceiptView),
    NotFound,
    InvalidState(OwnerProviderDisclosureReceiptView),
    Conflict,
}

enum PersistedAssessmentCreateOutcome {
    Created(OwnerProviderAssessmentRecord),
    Replayed(OwnerProviderAssessmentRecord),
    NotFound,
    InvalidState,
    Conflict,
}

enum PersistedAssessmentWindowDecisionOutcome {
    Updated(OwnerProviderAssessmentRecord),
    Replayed(OwnerProviderAssessmentRecord),
    NotFound,
    InvalidState(OwnerProviderAssessmentRecord),
    Conflict,
}

enum PersistedAssessmentWindowProposalOutcome {
    Updated(OwnerProviderAssessmentRecord),
    Replayed(OwnerProviderAssessmentRecord),
    NotFound,
    InvalidState(OwnerProviderAssessmentRecord),
    Conflict,
}

enum PersistedAssessmentTransitionOutcome {
    Updated(OwnerProviderAssessmentRecord),
    Replayed(OwnerProviderAssessmentRecord),
    NotFound,
    InvalidState(OwnerProviderAssessmentRecord),
    Conflict,
}

enum PersistedAssessmentCommunicationWriteOutcome<T> {
    Created(T),
    Replayed(T),
    NotFound,
    InvalidState(OwnerProviderAssessmentStatusRecord),
    Conflict,
}

enum PersistedInitialServiceProposalWriteOutcome {
    Published(OwnerProviderInitialServiceProposalRecord),
    Replayed(OwnerProviderInitialServiceProposalRecord),
    NotFound,
    InvalidState,
    Conflict,
}

enum PersistedInitialServiceProposalDecisionOutcome {
    Decided(OwnerProviderInitialServiceProposalDecisionRecord),
    Replayed(OwnerProviderInitialServiceProposalDecisionRecord),
    NotFound,
    InvalidState(OwnerProviderInitialServiceProposalRecord),
    Conflict,
}

enum PersistedInitialServiceProposalMessageWriteOutcome {
    Created(OwnerProviderInitialServiceProposalMessageRecord),
    Replayed(OwnerProviderInitialServiceProposalMessageRecord),
    NotFound,
    InvalidState(OwnerProviderInitialServiceProposalRecord),
    Conflict,
}

enum PersistedRelationshipActivationOutcome {
    Activated(OwnerProviderRelationshipActivationRecord),
    Replayed(OwnerProviderRelationshipActivationRecord),
    NotFound,
    InvalidState,
    Conflict,
}

enum PersistedFirstVisitOutcome {
    Saved(OwnerProviderFirstVisitRecord),
    Replayed(OwnerProviderFirstVisitRecord),
    NotFound,
    InvalidState(OwnerProviderFirstVisitRecord),
    Conflict,
}

fn disclosure_review_version(
    invitation_id: &str,
    capability_id: &str,
    capability_version: i64,
    property_version: i64,
    brief_id: &str,
    brief_version: i64,
    media_ids: &[String],
) -> String {
    let source = format!(
        "{invitation_id}|{capability_id}|{capability_version}|{property_version}|{brief_id}|{brief_version}|{}|{OWNER_PROVIDER_CONSENT_TEXT_VERSION}|{OWNER_PROVIDER_RETENTION_NOTICE_VERSION}",
        media_ids.join(",")
    );
    format!(
        "disclosure_review_v1_{:x}",
        Sha256::digest(source.as_bytes())
    )
}

fn formatted_property_address(row: &sqlx::postgres::PgRow) -> String {
    let line_2: String = row.get("address_line_2");
    let mut lines = vec![row.get::<String, _>("address_line_1")];
    if !line_2.trim().is_empty() {
        lines.push(line_2);
    }
    lines.push(format!(
        "{}, {} {}",
        row.get::<String, _>("city"),
        row.get::<String, _>("region"),
        row.get::<String, _>("postal_code")
    ));
    lines.join(", ")
}

async fn disclosure_media_options<'e, E>(
    executor: E,
    owner_user_id: &str,
    property_id: &str,
    brief_id: &str,
) -> Result<Vec<OwnerProviderDisclosureMediaOption>, sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
    let rows = sqlx::query(
        "SELECT id, shot_type, file_name, upload_mode, thumbnail_object_key
         FROM owner_intake_media
         WHERE owner_user_id = $1 AND property_id = $2 AND brief_id = $3
           AND status = 'ready'
         ORDER BY created_at, id",
    )
    .bind(owner_user_id)
    .bind(property_id)
    .bind(brief_id)
    .fetch_all(executor)
    .await?;
    let storage = PhotoStorageConfig::from_env();
    Ok(rows
        .iter()
        .map(|row| OwnerProviderDisclosureMediaOption {
            media_id: row.get("id"),
            shot_type: row.get("shot_type"),
            file_label: safe_media_file_name(&row.get::<String, _>("file_name")),
            thumbnail_url: storage.thumbnail_url(
                &row.get::<String, _>("upload_mode"),
                row.get::<Option<String>, _>("thumbnail_object_key")
                    .as_deref(),
            ),
        })
        .collect())
}

fn disclosure_review_from_row(
    row: &sqlx::postgres::PgRow,
    media_options: Vec<OwnerProviderDisclosureMediaOption>,
) -> OwnerProviderDisclosureReview {
    let media_ids: Vec<_> = media_options
        .iter()
        .map(|media| media.media_id.clone())
        .collect();
    let capability_id: String = row.get("capability_id");
    let capability_version: i64 = row.get("capability_version");
    let property_version: i64 = row.get("property_version");
    let brief_id: String = row.get("brief_id");
    let brief_version: i64 = row.get("brief_version");
    let invitation_id: String = row.get("invitation_id");
    OwnerProviderDisclosureReview {
        review_version: disclosure_review_version(
            &invitation_id,
            &capability_id,
            capability_version,
            property_version,
            &brief_id,
            brief_version,
            &media_ids,
        ),
        invitation_id,
        property_id: row.get("property_id"),
        property_name: row.get("property_name"),
        provider_organization_id: row.get("organization_id"),
        provider_organization_name: row.get("organization_name"),
        purpose: "yard_assessment".to_string(),
        brief_id,
        brief_version,
        exact_address: formatted_property_address(row),
        yard_areas: row.get("yard_areas"),
        care_goals: row.get("care_goals"),
        cadence_preference: row.get("cadence_preference"),
        access_considerations: row.get("considerations"),
        owner_contact: format!(
            "{} — {}",
            row.get::<String, _>("owner_display_name"),
            row.get::<String, _>("owner_verified_email")
        ),
        available_categories: OWNER_PROVIDER_DISCLOSURE_CATEGORIES
            .iter()
            .map(|category| (*category).to_string())
            .collect(),
        media_options,
        consent_text_version: OWNER_PROVIDER_CONSENT_TEXT_VERSION.to_string(),
        retention_notice_version: OWNER_PROVIDER_RETENTION_NOTICE_VERSION.to_string(),
        retention_notice: "Access lasts only until the displayed assessment deadline. Revocation ends future access but does not erase information already viewed or records that must be retained.".to_string(),
        authority_boundary: "This approval permits only a yard assessment. It does not accept pricing, start service, schedule work, or assign a crew.".to_string(),
        expires_at_epoch_seconds: row.get("expires_at_epoch_seconds"),
        can_approve: true,
        persisted: true,
    }
}

const DISCLOSURE_ELIGIBILITY_QUERY: &str =
    "SELECT invitation.id AS invitation_id, invitation.property_id,
            invitation.expires_at,
            EXTRACT(EPOCH FROM invitation.expires_at)::BIGINT AS expires_at_epoch_seconds,
            property.display_name AS property_name, property.version AS property_version,
            property.address_line_1, property.address_line_2, property.city,
            property.region, property.postal_code,
            workspace.display_name AS owner_display_name,
            workspace.verified_email AS owner_verified_email,
            brief.id AS brief_id, brief.version AS brief_version, brief.yard_areas,
            brief.care_goals, brief.cadence_preference, brief.considerations,
            capability.id AS capability_id, capability.version AS capability_version,
            capability.actor_user_id AS recipient_actor_user_id,
            capability.organization_id,
            organization.display_name AS organization_name
     FROM owner_provider_invitations invitation
     JOIN owner_workspaces workspace ON workspace.owner_user_id = invitation.owner_user_id
     JOIN owner_properties property ON property.id = invitation.property_id
     JOIN owner_yard_briefs brief ON brief.id = invitation.brief_id
     JOIN owner_provider_invitation_response_capabilities capability
       ON capability.invitation_id = invitation.id
      AND capability.brief_id = brief.id
      AND capability.brief_version = brief.version
     JOIN owner_provider_invitation_recipient_checks recipient_check
       ON recipient_check.id = capability.recipient_check_id
      AND recipient_check.invitation_id = invitation.id
      AND recipient_check.recipient_user_id = capability.actor_user_id
     JOIN owner_provider_invitation_organization_claims claim
       ON claim.id = capability.claim_id
      AND claim.invitation_id = invitation.id
      AND claim.organization_id = capability.organization_id
     JOIN organizations organization ON organization.id = capability.organization_id
     WHERE invitation.id = $1 AND invitation.owner_user_id = $2
       AND invitation.property_id = $3 AND invitation.status = 'opened'
       AND invitation.expires_at > NOW() AND workspace.status = 'active'
       AND property.status <> 'archived' AND property.address_status = 'owner_confirmed'
       AND brief.status = 'ready'
       AND NOT EXISTS (
           SELECT 1 FROM owner_yard_briefs newer
           WHERE newer.property_id = property.id AND newer.version > brief.version
       )
       AND recipient_check.status = 'checked'
       AND claim.status IN ('relationship_checked', 'claimed')
       AND organization.status = 'active'
       AND organization.organization_type = 'yard_care_company'
       AND capability.status = 'active' AND capability.expires_at > NOW()
       AND EXISTS (
           SELECT 1 FROM organization_memberships membership
           WHERE membership.organization_id = organization.id
             AND membership.user_id = capability.actor_user_id
             AND membership.status = 'active'
       )
       AND EXISTS (
           SELECT 1 FROM owner_provider_opportunity_responses response
           WHERE response.capability_id = capability.id
             AND response.invitation_id = invitation.id
             AND response.actor_user_id = capability.actor_user_id
             AND response.action = 'express_interest'
             AND response.response_code = 'ready_for_owner_disclosure'
             AND response.status = 'recorded'
       )
       AND NOT EXISTS (
           SELECT 1 FROM owner_provider_recipient_suppressions suppression
           WHERE suppression.recipient_email_fingerprint = invitation.recipient_email_fingerprint
       )
       AND NOT EXISTS (
           SELECT 1 FROM owner_provider_disclosure_grants active_grant
           WHERE active_grant.invitation_id = invitation.id
             AND active_grant.status = 'active'
       )
     ORDER BY capability.created_at DESC LIMIT 1";

async fn get_owner_provider_disclosure_review(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    invitation_id: &str,
) -> Result<PersistedDisclosureReviewOutcome, sqlx::Error> {
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_provider_invitations
             WHERE id = $1 AND owner_user_id = $2 AND property_id = $3
         )",
    )
    .bind(invitation_id)
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_one(pool)
    .await?;
    if !exists {
        return Ok(PersistedDisclosureReviewOutcome::NotFound);
    }
    let row = sqlx::query(DISCLOSURE_ELIGIBILITY_QUERY)
        .bind(invitation_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(pool)
        .await?;
    let Some(row) = row else {
        return Ok(PersistedDisclosureReviewOutcome::InvalidState);
    };
    let brief_id: String = row.get("brief_id");
    let media = disclosure_media_options(pool, owner_user_id, property_id, &brief_id).await?;
    Ok(PersistedDisclosureReviewOutcome::Loaded(
        disclosure_review_from_row(&row, media),
    ))
}

const DISCLOSURE_GRANT_REPLAY_QUERY: &str =
    "SELECT receipt.id AS receipt_id, disclosure_grant.id AS grant_id, receipt.invitation_id,
            receipt.property_id, receipt.organization_id, receipt.purpose,
            receipt.approved_categories, receipt.withheld_categories,
            receipt.selected_media_ids, receipt.brief_id, receipt.brief_version,
            receipt.grant_version, receipt.consent_text_version,
            receipt.retention_notice_version, receipt.review_version,
            disclosure_grant.status,
            EXTRACT(EPOCH FROM disclosure_grant.effective_at)::BIGINT
                AS effective_at_epoch_seconds,
            EXTRACT(EPOCH FROM disclosure_grant.expires_at)::BIGINT
                AS expires_at_epoch_seconds,
            disclosure_grant.version
     FROM owner_provider_disclosure_receipts receipt
     JOIN owner_provider_disclosure_grants disclosure_grant
       ON disclosure_grant.receipt_id = receipt.id
     WHERE receipt.owner_user_id = $1 AND receipt.idempotency_key = $2
       AND receipt.property_id = $3 AND receipt.invitation_id = $4";

async fn disclosure_grant_replay(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    owner_user_id: &str,
    property_id: &str,
    invitation_id: &str,
    request: &CreateOwnerProviderDisclosureGrantRequest,
) -> Result<Option<PersistedDisclosureGrantOutcome>, sqlx::Error> {
    let replay = sqlx::query(DISCLOSURE_GRANT_REPLAY_QUERY)
        .bind(owner_user_id)
        .bind(request.idempotency_key.trim())
        .bind(property_id)
        .bind(invitation_id)
        .fetch_optional(&mut **transaction)
        .await?;
    let Some(row) = replay else {
        return Ok(None);
    };
    let mut approved_categories = request.approved_categories.clone();
    approved_categories.sort();
    let mut selected_media_ids = request.selected_media_ids.clone();
    selected_media_ids.sort();
    let exact = row.get::<String, _>("purpose") == request.purpose
        && row.get::<Vec<String>, _>("approved_categories") == approved_categories
        && row.get::<Vec<String>, _>("selected_media_ids") == selected_media_ids
        && row.get::<String, _>("consent_text_version") == request.consent_text_version
        && row.get::<String, _>("retention_notice_version") == request.retention_notice_version
        && row.get::<String, _>("review_version") == request.expected_review_version;
    Ok(Some(if exact {
        PersistedDisclosureGrantOutcome::Replayed(disclosure_grant_from_row(&row))
    } else {
        PersistedDisclosureGrantOutcome::Conflict
    }))
}

async fn disclosure_grant_replay_from_pool(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    invitation_id: &str,
    request: &CreateOwnerProviderDisclosureGrantRequest,
) -> Result<Option<PersistedDisclosureGrantOutcome>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let replay = disclosure_grant_replay(
        &mut transaction,
        owner_user_id,
        property_id,
        invitation_id,
        request,
    )
    .await?;
    transaction.commit().await?;
    Ok(replay)
}

async fn create_owner_provider_disclosure_grant(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    invitation_id: &str,
    mut request: CreateOwnerProviderDisclosureGrantRequest,
) -> Result<PersistedDisclosureGrantOutcome, sqlx::Error> {
    request.approved_categories.sort();
    request.selected_media_ids.sort();
    let mut transaction = pool.begin().await?;
    if let Some(replay) = disclosure_grant_replay(
        &mut transaction,
        owner_user_id,
        property_id,
        invitation_id,
        &request,
    )
    .await?
    {
        transaction.commit().await?;
        return Ok(replay);
    }
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_provider_invitations
             WHERE id = $1 AND owner_user_id = $2 AND property_id = $3
         )",
    )
    .bind(invitation_id)
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_one(&mut *transaction)
    .await?;
    if !exists {
        transaction.rollback().await?;
        return Ok(PersistedDisclosureGrantOutcome::NotFound);
    }
    let locking_query = format!("{DISCLOSURE_ELIGIBILITY_QUERY} FOR UPDATE OF invitation, property, brief, capability, recipient_check, claim, organization");
    let eligibility = sqlx::query(&locking_query)
        .bind(invitation_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(eligibility) = eligibility else {
        if let Some(replay) = disclosure_grant_replay(
            &mut transaction,
            owner_user_id,
            property_id,
            invitation_id,
            &request,
        )
        .await?
        {
            transaction.commit().await?;
            return Ok(replay);
        }
        transaction.rollback().await?;
        return Ok(PersistedDisclosureGrantOutcome::InvalidState);
    };
    let brief_id: String = eligibility.get("brief_id");
    let media =
        disclosure_media_options(&mut *transaction, owner_user_id, property_id, &brief_id).await?;
    let media_ids: Vec<_> = media.iter().map(|item| item.media_id.clone()).collect();
    let current_review_version = disclosure_review_version(
        invitation_id,
        &eligibility.get::<String, _>("capability_id"),
        eligibility.get("capability_version"),
        eligibility.get("property_version"),
        &brief_id,
        eligibility.get("brief_version"),
        &media_ids,
    );
    let selected_are_current = request
        .selected_media_ids
        .iter()
        .all(|selected| media_ids.contains(selected));
    if current_review_version != request.expected_review_version || !selected_are_current {
        transaction.rollback().await?;
        return Ok(PersistedDisclosureGrantOutcome::Conflict);
    }
    let withheld_categories: Vec<String> = OWNER_PROVIDER_DISCLOSURE_CATEGORIES
        .iter()
        .filter(|category| {
            !request
                .approved_categories
                .iter()
                .any(|approved| approved == **category)
        })
        .map(|category| (*category).to_string())
        .collect();
    let grant_version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(grant_version), 0) + 1
         FROM owner_provider_disclosure_receipts WHERE invitation_id = $1",
    )
    .bind(invitation_id)
    .fetch_one(&mut *transaction)
    .await?;
    let receipt_id = format!("owner_disclosure_receipt_{}", Uuid::new_v4().simple());
    let grant_id = format!("owner_disclosure_grant_{}", Uuid::new_v4().simple());
    sqlx::query(
        "INSERT INTO owner_provider_disclosure_receipts (
             id, owner_user_id, property_id, invitation_id, organization_id,
             recipient_actor_user_id, capability_id, brief_id, brief_version,
             purpose, approved_categories, withheld_categories, selected_media_ids,
             consent_text_version, retention_notice_version, review_version,
             grant_version, owner_affirmed_at, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'yard_assessment',
                   $10, $11, $12, $13, $14, $15, $16, NOW(), $17)",
    )
    .bind(&receipt_id)
    .bind(owner_user_id)
    .bind(property_id)
    .bind(invitation_id)
    .bind(eligibility.get::<String, _>("organization_id"))
    .bind(eligibility.get::<String, _>("recipient_actor_user_id"))
    .bind(eligibility.get::<String, _>("capability_id"))
    .bind(&brief_id)
    .bind(eligibility.get::<i64, _>("brief_version"))
    .bind(&request.approved_categories)
    .bind(&withheld_categories)
    .bind(&request.selected_media_ids)
    .bind(&request.consent_text_version)
    .bind(&request.retention_notice_version)
    .bind(&current_review_version)
    .bind(grant_version)
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    let row = sqlx::query(
        "INSERT INTO owner_provider_disclosure_grants (
             id, receipt_id, owner_user_id, property_id, invitation_id,
             organization_id, recipient_actor_user_id, purpose, approved_categories,
             brief_id, brief_version, selected_media_ids, status, effective_at, expires_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'yard_assessment', $8, $9, $10,
                   $11, 'active', NOW(), TO_TIMESTAMP($12))
         RETURNING id AS grant_id, receipt_id, invitation_id, property_id,
                   organization_id, purpose, approved_categories, brief_id,
                   brief_version, selected_media_ids, status,
                   EXTRACT(EPOCH FROM effective_at)::BIGINT AS effective_at_epoch_seconds,
                   EXTRACT(EPOCH FROM expires_at)::BIGINT AS expires_at_epoch_seconds,
                   version",
    )
    .bind(&grant_id)
    .bind(&receipt_id)
    .bind(owner_user_id)
    .bind(property_id)
    .bind(invitation_id)
    .bind(eligibility.get::<String, _>("organization_id"))
    .bind(eligibility.get::<String, _>("recipient_actor_user_id"))
    .bind(&request.approved_categories)
    .bind(&brief_id)
    .bind(eligibility.get::<i64, _>("brief_version"))
    .bind(&request.selected_media_ids)
    .bind(eligibility.get::<i64, _>("expires_at_epoch_seconds"))
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_disclosure_grant_events (
             id, grant_id, receipt_id, actor_user_id, event_kind,
             grant_version, idempotency_key
         ) VALUES ($1, $2, $3, $4, 'created', 1, $5)",
    )
    .bind(format!(
        "owner_disclosure_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(&grant_id)
    .bind(&receipt_id)
    .bind(owner_user_id)
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_disclosure_grant_created', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(owner_user_id)
    .bind(property_id)
    .bind(serde_json::json!({
        "receipt_id": receipt_id,
        "grant_id": grant_id,
        "invitation_id": invitation_id,
        "organization_id": eligibility.get::<String, _>("organization_id"),
        "purpose": "yard_assessment",
        "approved_categories": request.approved_categories,
        "withheld_categories": withheld_categories,
        "grant_version": grant_version,
        "status": "active"
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    let mut record = disclosure_grant_from_row(&row);
    record.withheld_categories = withheld_categories;
    record.grant_version = grant_version;
    Ok(PersistedDisclosureGrantOutcome::Created(record))
}

fn disclosure_grant_from_row(row: &sqlx::postgres::PgRow) -> OwnerProviderDisclosureGrantRecord {
    OwnerProviderDisclosureGrantRecord {
        receipt_id: row.get("receipt_id"),
        grant_id: row.get("grant_id"),
        invitation_id: row.get("invitation_id"),
        property_id: row.get("property_id"),
        organization_id: row.get("organization_id"),
        purpose: row.get("purpose"),
        approved_categories: row.get("approved_categories"),
        withheld_categories: row.try_get("withheld_categories").unwrap_or_default(),
        selected_media_ids: row.get("selected_media_ids"),
        brief_id: row.get("brief_id"),
        brief_version: row.get("brief_version"),
        grant_version: row.try_get("grant_version").unwrap_or(1),
        status: row.get("status"),
        effective_at_epoch_seconds: row.get("effective_at_epoch_seconds"),
        expires_at_epoch_seconds: row.get("expires_at_epoch_seconds"),
        version: row.get("version"),
        persisted: true,
    }
}

fn closed_provider_disclosure(
    invitation_id: String,
    status: &str,
    recovery_action: &str,
) -> OwnerProviderDisclosureAccess {
    OwnerProviderDisclosureAccess {
        invitation_id,
        status: status.to_string(),
        can_access: false,
        recovery_action: Some(recovery_action.to_string()),
        grant_id: None,
        receipt_id: None,
        organization_name: None,
        property_name: None,
        purpose: None,
        approved_categories: None,
        withheld_categories: None,
        brief_version: None,
        expires_at_epoch_seconds: None,
        exact_address: None,
        yard_brief: None,
        selected_yard_photos: None,
        owner_contact: None,
        access_considerations: None,
        authority_boundary: None,
        assessment: None,
        customer_safe_messages: None,
        private_notes: None,
        initial_service_proposal: None,
        initial_service_proposal_messages: None,
        persisted: true,
    }
}

async fn reconcile_provider_disclosure_grant(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    grant_id: &str,
    receipt_id: &str,
    actor_user_id: &str,
    current_version: i64,
    next_status: &str,
    reason_code: &str,
) -> Result<(), sqlx::Error> {
    let next_version = current_version + 1;
    sqlx::query(
        "UPDATE owner_provider_disclosure_grants
         SET status = $2, version = $3, updated_at = NOW()
         WHERE id = $1 AND status = 'active' AND version = $4",
    )
    .bind(grant_id)
    .bind(next_status)
    .bind(next_version)
    .bind(current_version)
    .execute(&mut **transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_disclosure_grant_events (
             id, grant_id, receipt_id, actor_user_id, event_kind, reason_code,
             grant_version, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (actor_user_id, idempotency_key) DO NOTHING",
    )
    .bind(format!(
        "owner_disclosure_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(grant_id)
    .bind(receipt_id)
    .bind(actor_user_id)
    .bind(next_status)
    .bind(reason_code)
    .bind(next_version)
    .bind(format!("access-reconcile-{grant_id}-{current_version}"))
    .execute(&mut **transaction)
    .await?;
    Ok(())
}

async fn open_owner_provider_disclosure(
    pool: &PgPool,
    recipient_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
) -> Result<PersistedDisclosureAccessOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let identity = sqlx::query(
        "SELECT invitation.id AS invitation_id
         FROM owner_provider_invitations invitation
         JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.invitation_id = invitation.id
         WHERE invitation.token_hash = $1
           AND LOWER(invitation.recipient_email) = LOWER($2)
           AND recipient_check.recipient_user_id = $3
           AND recipient_check.verified_email_fingerprint = $4
           AND recipient_check.status = 'checked'
         LIMIT 1",
    )
    .bind(token_hash)
    .bind(verified_email)
    .bind(recipient_user_id)
    .bind(verified_email_fingerprint)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(identity) = identity else {
        transaction.rollback().await?;
        return Ok(PersistedDisclosureAccessOutcome::NotFound);
    };
    let invitation_id: String = identity.get("invitation_id");
    let row = sqlx::query(
        "SELECT disclosure_grant.id AS grant_id, disclosure_grant.receipt_id,
                disclosure_grant.status AS grant_status,
                disclosure_grant.version AS grant_projection_version,
                disclosure_grant.approved_categories,
                disclosure_grant.selected_media_ids,
                EXTRACT(EPOCH FROM disclosure_grant.expires_at)::BIGINT
                    AS grant_expires_at,
                receipt.withheld_categories, receipt.grant_version,
                invitation.status AS invitation_status,
                invitation.expires_at <= NOW() AS invitation_expired,
                EXISTS (
                    SELECT 1 FROM owner_provider_recipient_suppressions suppression
                    WHERE suppression.recipient_email_fingerprint = invitation.recipient_email_fingerprint
                ) AS recipient_suppressed,
                claim.status AS claim_status,
                organization.id AS organization_id,
                organization.display_name AS organization_name,
                organization.status AS organization_status,
                organization.organization_type,
                capability.status AS capability_status,
                capability.expires_at <= NOW() AS capability_expired,
                EXISTS (
                    SELECT 1 FROM organization_memberships membership
                    WHERE membership.organization_id = organization.id
                      AND membership.user_id = $2 AND membership.status = 'active'
                ) AS active_membership,
                property.id AS property_id, property.owner_user_id,
                property.display_name AS property_name, property.address_line_1,
                property.address_line_2, property.city, property.region,
                property.postal_code, property.status AS property_status,
                workspace.display_name AS owner_display_name,
                workspace.verified_email AS owner_verified_email,
                workspace.status AS workspace_status,
                brief.id AS brief_id, brief.version AS brief_version,
                brief.status AS brief_status, brief.yard_areas, brief.care_goals,
                brief.cadence_preference, brief.considerations,
                EXISTS (
                    SELECT 1 FROM owner_yard_briefs newer
                    WHERE newer.property_id = property.id AND newer.version > brief.version
                ) AS newer_brief_exists
         FROM owner_provider_disclosure_grants disclosure_grant
         JOIN owner_provider_disclosure_receipts receipt
           ON receipt.id = disclosure_grant.receipt_id
         JOIN owner_provider_invitations invitation
           ON invitation.id = disclosure_grant.invitation_id
         JOIN owner_provider_invitation_response_capabilities capability
           ON capability.id = receipt.capability_id
         JOIN owner_provider_invitation_organization_claims claim
           ON claim.id = capability.claim_id
         JOIN organizations organization
           ON organization.id = disclosure_grant.organization_id
         JOIN owner_properties property ON property.id = disclosure_grant.property_id
         JOIN owner_workspaces workspace
           ON workspace.owner_user_id = disclosure_grant.owner_user_id
         JOIN owner_yard_briefs brief ON brief.id = disclosure_grant.brief_id
         WHERE disclosure_grant.invitation_id = $1
           AND disclosure_grant.recipient_actor_user_id = $2
           AND receipt.recipient_actor_user_id = $2
           AND disclosure_grant.organization_id = receipt.organization_id
           AND disclosure_grant.property_id = receipt.property_id
           AND disclosure_grant.brief_version = receipt.brief_version
         ORDER BY receipt.grant_version DESC LIMIT 1
         FOR UPDATE OF disclosure_grant",
    )
    .bind(&invitation_id)
    .bind(recipient_user_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(row) = row else {
        transaction.rollback().await?;
        return Ok(PersistedDisclosureAccessOutcome::InvalidState);
    };
    let grant_status: String = row.get("grant_status");
    if grant_status != "active" {
        transaction.commit().await?;
        let recovery = if grant_status == "expired" {
            "request_new_owner_approval"
        } else {
            "contact_owner"
        };
        return Ok(PersistedDisclosureAccessOutcome::Closed(
            closed_provider_disclosure(invitation_id, &grant_status, recovery),
        ));
    }
    let now_epoch = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    let grant_expires_at: i64 = row.get("grant_expires_at");
    let expired = grant_expires_at <= now_epoch
        || row.get::<bool, _>("invitation_expired")
        || row.get::<bool, _>("capability_expired");
    let effective = !expired
        && row.get::<String, _>("invitation_status") == "opened"
        && !row.get::<bool, _>("recipient_suppressed")
        && matches!(
            row.get::<String, _>("claim_status").as_str(),
            "relationship_checked" | "claimed"
        )
        && row.get::<String, _>("organization_status") == "active"
        && row.get::<String, _>("organization_type") == "yard_care_company"
        && row.get::<bool, _>("active_membership")
        && row.get::<String, _>("capability_status") == "active"
        && row.get::<String, _>("property_status") != "archived"
        && row.get::<String, _>("workspace_status") == "active"
        && row.get::<String, _>("brief_status") == "ready"
        && !row.get::<bool, _>("newer_brief_exists");
    if !effective {
        let next_status = if expired { "expired" } else { "suspended" };
        let reason = if expired {
            "access_expired"
        } else {
            "access_authority_inactive"
        };
        reconcile_provider_disclosure_grant(
            &mut transaction,
            &row.get::<String, _>("grant_id"),
            &row.get::<String, _>("receipt_id"),
            recipient_user_id,
            row.get("grant_projection_version"),
            next_status,
            reason,
        )
        .await?;
        transaction.commit().await?;
        return Ok(PersistedDisclosureAccessOutcome::Closed(
            closed_provider_disclosure(
                invitation_id,
                next_status,
                if expired {
                    "request_new_owner_approval"
                } else {
                    "contact_owner"
                },
            ),
        ));
    }
    let approved: Vec<String> = row.get("approved_categories");
    let selected_media_ids: Vec<String> = row.get("selected_media_ids");
    let media_rows = if approved
        .iter()
        .any(|category| category == "selected_yard_photos")
    {
        sqlx::query(
            "SELECT id, shot_type, file_name, upload_mode, object_key,
                    thumbnail_object_key
             FROM owner_intake_media
             WHERE id = ANY($1) AND property_id = $2 AND brief_id = $3
               AND owner_user_id = $4 AND status = 'ready'
             ORDER BY id",
        )
        .bind(&selected_media_ids)
        .bind(row.get::<String, _>("property_id"))
        .bind(row.get::<String, _>("brief_id"))
        .bind(row.get::<String, _>("owner_user_id"))
        .fetch_all(&mut *transaction)
        .await?
    } else {
        Vec::new()
    };
    if media_rows.len() != selected_media_ids.len() {
        reconcile_provider_disclosure_grant(
            &mut transaction,
            &row.get::<String, _>("grant_id"),
            &row.get::<String, _>("receipt_id"),
            recipient_user_id,
            row.get("grant_projection_version"),
            "suspended",
            "selected_media_unavailable",
        )
        .await?;
        transaction.commit().await?;
        return Ok(PersistedDisclosureAccessOutcome::Closed(
            closed_provider_disclosure(invitation_id, "suspended", "contact_owner"),
        ));
    }
    let storage = PhotoStorageConfig::from_env();
    let maximum_seconds = (grant_expires_at - now_epoch).clamp(1, u32::MAX as i64) as u32;
    let authorization_seconds = storage.display_authorization_seconds(maximum_seconds);
    let authorization_expires_at = now_epoch + i64::from(authorization_seconds);
    let selected_yard_photos = approved
        .iter()
        .any(|category| category == "selected_yard_photos")
        .then(|| {
            media_rows
                .iter()
                .map(|media| OwnerProviderDisclosurePhoto {
                    media_id: media.get("id"),
                    shot_type: media.get("shot_type"),
                    file_label: safe_media_file_name(&media.get::<String, _>("file_name")),
                    display_url: storage.display_url_for_seconds(
                        &media.get::<String, _>("upload_mode"),
                        &media.get::<String, _>("object_key"),
                        maximum_seconds,
                    ),
                    thumbnail_url: storage.thumbnail_url_for_seconds(
                        &media.get::<String, _>("upload_mode"),
                        media
                            .get::<Option<String>, _>("thumbnail_object_key")
                            .as_deref(),
                        maximum_seconds,
                    ),
                    authorization_expires_at_epoch_seconds: authorization_expires_at,
                })
                .collect()
        });
    let exact_address = approved
        .iter()
        .any(|category| category == "exact_address")
        .then(|| formatted_property_address(&row));
    let yard_brief = approved
        .iter()
        .any(|category| category == "yard_brief")
        .then(|| OwnerProviderDisclosureYardBrief {
            yard_areas: row.get("yard_areas"),
            care_goals: row.get("care_goals"),
            cadence_preference: row.get("cadence_preference"),
        });
    let owner_contact = approved
        .iter()
        .any(|category| category == "owner_contact")
        .then(|| {
            format!(
                "{} — {}",
                row.get::<String, _>("owner_display_name"),
                row.get::<String, _>("owner_verified_email")
            )
        });
    let access_considerations = approved
        .iter()
        .any(|category| category == "access_considerations")
        .then(|| row.get("considerations"));
    let assessment_query = format!(
        "{OWNER_PROVIDER_ASSESSMENT_SELECT}
         WHERE invitation_id = $1 AND provider_actor_user_id = $2
           AND disclosure_grant_id = $3
         LIMIT 1"
    );
    let assessment_row = sqlx::query(&assessment_query)
        .bind(&invitation_id)
        .bind(recipient_user_id)
        .bind(row.get::<String, _>("grant_id"))
        .fetch_optional(&mut *transaction)
        .await?;
    let assessment = assessment_row
        .as_ref()
        .map(owner_provider_assessment_from_row);
    let (
        customer_safe_messages,
        private_notes,
        initial_service_proposal,
        initial_service_proposal_messages,
    ) = if let Some(assessment) = &assessment {
        let message_rows = sqlx::query(&format!(
            "{OWNER_PROVIDER_ASSESSMENT_MESSAGE_SELECT}
             WHERE assessment_id = $1 ORDER BY created_at, id"
        ))
        .bind(&assessment.assessment_id)
        .fetch_all(&mut *transaction)
        .await?;
        let note_rows = sqlx::query(&format!(
            "{OWNER_PROVIDER_ASSESSMENT_PRIVATE_NOTE_SELECT}
             WHERE assessment_id = $1 AND organization_id = $2
             ORDER BY created_at, id"
        ))
        .bind(&assessment.assessment_id)
        .bind(&assessment.organization_id)
        .fetch_all(&mut *transaction)
        .await?;
        expire_owner_provider_initial_service_proposals(
            &mut transaction,
            &assessment.assessment_id,
        )
        .await?;
        let proposal_query = format!(
            "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT}
             WHERE assessment_id = $1 AND organization_id = $2
             ORDER BY proposal_version DESC LIMIT 1"
        );
        let proposal_row = sqlx::query(&proposal_query)
            .bind(&assessment.assessment_id)
            .bind(&assessment.organization_id)
            .fetch_optional(&mut *transaction)
            .await?;
        let proposal_message_query = format!(
            "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_MESSAGE_SELECT}
             WHERE assessment_id = $1 AND organization_id = $2
             ORDER BY created_at, id"
        );
        let proposal_message_rows = sqlx::query(&proposal_message_query)
            .bind(&assessment.assessment_id)
            .bind(&assessment.organization_id)
            .fetch_all(&mut *transaction)
            .await?;
        (
            Some(
                message_rows
                    .iter()
                    .map(owner_provider_assessment_message_from_row)
                    .collect(),
            ),
            Some(
                note_rows
                    .iter()
                    .map(owner_provider_assessment_private_note_from_row)
                    .collect(),
            ),
            proposal_row
                .as_ref()
                .map(owner_provider_initial_service_proposal_from_row),
            Some(
                proposal_message_rows
                    .iter()
                    .map(owner_provider_initial_service_proposal_message_from_row)
                    .collect(),
            ),
        )
    } else {
        (None, None, None, None)
    };
    let access = OwnerProviderDisclosureAccess {
        invitation_id,
        status: "active".to_string(),
        can_access: true,
        recovery_action: None,
        grant_id: Some(row.get("grant_id")),
        receipt_id: Some(row.get("receipt_id")),
        organization_name: Some(row.get("organization_name")),
        property_name: Some(row.get("property_name")),
        purpose: Some("yard_assessment".to_string()),
        approved_categories: Some(approved),
        withheld_categories: Some(row.get("withheld_categories")),
        brief_version: Some(row.get("brief_version")),
        expires_at_epoch_seconds: Some(grant_expires_at),
        exact_address,
        yard_brief,
        selected_yard_photos,
        owner_contact,
        access_considerations,
        authority_boundary: Some("Assessment access does not accept pricing, start service, schedule work, or assign a crew.".to_string()),
        assessment,
        customer_safe_messages,
        private_notes,
        initial_service_proposal,
        initial_service_proposal_messages,
        persisted: true,
    };
    transaction.commit().await?;
    Ok(PersistedDisclosureAccessOutcome::Loaded(access))
}

const DISCLOSURE_RECEIPT_SELECT: &str = "SELECT receipt.id AS receipt_id,
            disclosure_grant.id AS grant_id,
            receipt.invitation_id, receipt.property_id,
            property.display_name AS property_name, receipt.organization_id,
            organization.display_name AS organization_name, receipt.purpose,
            receipt.approved_categories, receipt.withheld_categories,
            receipt.selected_media_ids, receipt.brief_version,
            receipt.consent_text_version, receipt.retention_notice_version,
            receipt.grant_version,
            EXTRACT(EPOCH FROM receipt.owner_affirmed_at)::BIGINT
                AS affirmed_at_epoch_seconds,
            disclosure_grant.status,
            EXTRACT(EPOCH FROM disclosure_grant.effective_at)::BIGINT
                AS effective_at_epoch_seconds,
            EXTRACT(EPOCH FROM disclosure_grant.expires_at)::BIGINT
                AS expires_at_epoch_seconds,
            disclosure_grant.version, latest_event.event_kind AS latest_event_kind,
            latest_event.reason_code AS latest_reason_code,
            latest_event.created_at_epoch_seconds AS latest_event_at_epoch_seconds
     FROM owner_provider_disclosure_receipts receipt
     JOIN owner_provider_disclosure_grants disclosure_grant
       ON disclosure_grant.receipt_id = receipt.id
     JOIN owner_properties property ON property.id = receipt.property_id
     JOIN organizations organization ON organization.id = receipt.organization_id
     JOIN LATERAL (
         SELECT event.event_kind, event.reason_code,
                EXTRACT(EPOCH FROM event.created_at)::BIGINT AS created_at_epoch_seconds
         FROM owner_provider_disclosure_grant_events event
         WHERE event.grant_id = disclosure_grant.id
         ORDER BY event.created_at DESC, event.id DESC LIMIT 1
     ) latest_event ON TRUE";

async fn disclosure_receipt_photos<'e, E>(
    executor: E,
    media_ids: &[String],
) -> Result<Vec<OwnerProviderDisclosureReceiptPhoto>, sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
    if media_ids.is_empty() {
        return Ok(Vec::new());
    }
    let rows = sqlx::query(
        "SELECT id, file_name, shot_type FROM owner_intake_media
         WHERE id = ANY($1) ORDER BY id",
    )
    .bind(media_ids)
    .fetch_all(executor)
    .await?;
    Ok(rows
        .iter()
        .map(|row| OwnerProviderDisclosureReceiptPhoto {
            media_id: row.get("id"),
            file_label: safe_media_file_name(&row.get::<String, _>("file_name")),
            shot_type: row.get("shot_type"),
        })
        .collect())
}

fn disclosure_receipt_from_row(
    row: &sqlx::postgres::PgRow,
    selected_photos: Vec<OwnerProviderDisclosureReceiptPhoto>,
) -> OwnerProviderDisclosureReceiptView {
    OwnerProviderDisclosureReceiptView {
        receipt_id: row.get("receipt_id"),
        grant_id: row.get("grant_id"),
        invitation_id: row.get("invitation_id"),
        property_id: row.get("property_id"),
        property_name: row.get("property_name"),
        organization_id: row.get("organization_id"),
        organization_name: row.get("organization_name"),
        purpose: row.get("purpose"),
        approved_categories: row.get("approved_categories"),
        withheld_categories: row.get("withheld_categories"),
        selected_photos,
        brief_version: row.get("brief_version"),
        consent_text_version: row.get("consent_text_version"),
        retention_notice_version: row.get("retention_notice_version"),
        grant_version: row.get("grant_version"),
        affirmed_at_epoch_seconds: row.get("affirmed_at_epoch_seconds"),
        status: row.get("status"),
        effective_at_epoch_seconds: row.get("effective_at_epoch_seconds"),
        expires_at_epoch_seconds: row.get("expires_at_epoch_seconds"),
        version: row.get("version"),
        latest_event_kind: row.get("latest_event_kind"),
        latest_reason_code: row.get("latest_reason_code"),
        latest_event_at_epoch_seconds: row.get("latest_event_at_epoch_seconds"),
        persisted: true,
    }
}

async fn list_owner_provider_disclosure_receipts(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
) -> Result<Option<Vec<OwnerProviderDisclosureReceiptView>>, sqlx::Error> {
    let property_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_properties
             WHERE id = $1 AND owner_user_id = $2
         )",
    )
    .bind(property_id)
    .bind(owner_user_id)
    .fetch_one(pool)
    .await?;
    if !property_exists {
        return Ok(None);
    }
    let query = format!(
        "{DISCLOSURE_RECEIPT_SELECT}
         WHERE receipt.owner_user_id = $1 AND receipt.property_id = $2
         ORDER BY receipt.created_at DESC, receipt.id DESC"
    );
    let rows = sqlx::query(&query)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_all(pool)
        .await?;
    let mut receipts = Vec::with_capacity(rows.len());
    for row in rows {
        let media_ids: Vec<String> = row.get("selected_media_ids");
        let photos = disclosure_receipt_photos(pool, &media_ids).await?;
        receipts.push(disclosure_receipt_from_row(&row, photos));
    }
    Ok(Some(receipts))
}

async fn owner_provider_disclosure_receipt_by_grant(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    owner_user_id: &str,
    property_id: &str,
    grant_id: &str,
) -> Result<
    Option<(
        sqlx::postgres::PgRow,
        Vec<OwnerProviderDisclosureReceiptPhoto>,
    )>,
    sqlx::Error,
> {
    let query = format!(
        "{DISCLOSURE_RECEIPT_SELECT}
         WHERE receipt.owner_user_id = $1 AND receipt.property_id = $2
           AND disclosure_grant.id = $3"
    );
    let row = sqlx::query(&query)
        .bind(owner_user_id)
        .bind(property_id)
        .bind(grant_id)
        .fetch_optional(&mut **transaction)
        .await?;
    let Some(row) = row else {
        return Ok(None);
    };
    let media_ids: Vec<String> = row.get("selected_media_ids");
    let photos = disclosure_receipt_photos(&mut **transaction, &media_ids).await?;
    Ok(Some((row, photos)))
}

async fn revoke_owner_provider_disclosure_grant(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    grant_id: &str,
    request: RevokeOwnerProviderDisclosureGrantRequest,
) -> Result<PersistedDisclosureRevokeOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        "SELECT disclosure_grant.id, disclosure_grant.receipt_id,
                disclosure_grant.status, disclosure_grant.version,
                disclosure_grant.invitation_id, disclosure_grant.organization_id
         FROM owner_provider_disclosure_grants disclosure_grant
         JOIN owner_provider_disclosure_receipts receipt
           ON receipt.id = disclosure_grant.receipt_id
         WHERE disclosure_grant.id = $1 AND disclosure_grant.owner_user_id = $2
           AND disclosure_grant.property_id = $3
           AND receipt.owner_user_id = $2 AND receipt.property_id = $3
         FOR UPDATE OF disclosure_grant",
    )
    .bind(grant_id)
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PersistedDisclosureRevokeOutcome::NotFound);
    };
    let replay = sqlx::query(
        "SELECT grant_id, event_kind, reason_code, grant_version
         FROM owner_provider_disclosure_grant_events
         WHERE actor_user_id = $1 AND idempotency_key = $2",
    )
    .bind(owner_user_id)
    .bind(request.idempotency_key.trim())
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(replay) = replay {
        let exact = replay.get::<String, _>("grant_id") == grant_id
            && replay.get::<String, _>("event_kind") == "revoked"
            && replay.get::<Option<String>, _>("reason_code").as_deref()
                == Some(request.reason_code.as_str())
            && replay.get::<i64, _>("grant_version") == request.expected_version + 1;
        if !exact {
            transaction.rollback().await?;
            return Ok(PersistedDisclosureRevokeOutcome::Conflict);
        }
        let receipt = owner_provider_disclosure_receipt_by_grant(
            &mut transaction,
            owner_user_id,
            property_id,
            grant_id,
        )
        .await?
        .map(|(row, photos)| disclosure_receipt_from_row(&row, photos))
        .expect("locked owner disclosure grant should remain readable");
        transaction.commit().await?;
        return Ok(PersistedDisclosureRevokeOutcome::Replayed(receipt));
    }
    if current.get::<String, _>("status") != "active" {
        let receipt = owner_provider_disclosure_receipt_by_grant(
            &mut transaction,
            owner_user_id,
            property_id,
            grant_id,
        )
        .await?
        .map(|(row, photos)| disclosure_receipt_from_row(&row, photos))
        .expect("locked owner disclosure grant should remain readable");
        transaction.commit().await?;
        return Ok(PersistedDisclosureRevokeOutcome::InvalidState(receipt));
    }
    if current.get::<i64, _>("version") != request.expected_version {
        transaction.rollback().await?;
        return Ok(PersistedDisclosureRevokeOutcome::Conflict);
    }
    let next_version = request.expected_version + 1;
    sqlx::query(
        "UPDATE owner_provider_disclosure_grants
         SET status = 'revoked', version = $2, updated_at = NOW()
         WHERE id = $1",
    )
    .bind(grant_id)
    .bind(next_version)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_disclosure_grant_events (
             id, grant_id, receipt_id, actor_user_id, event_kind, reason_code,
             grant_version, idempotency_key
         ) VALUES ($1, $2, $3, $4, 'revoked', $5, $6, $7)",
    )
    .bind(format!(
        "owner_disclosure_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(grant_id)
    .bind(current.get::<String, _>("receipt_id"))
    .bind(owner_user_id)
    .bind(&request.reason_code)
    .bind(next_version)
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_disclosure_grant_revoked', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(owner_user_id)
    .bind(property_id)
    .bind(serde_json::json!({
        "grant_id": grant_id,
        "receipt_id": current.get::<String, _>("receipt_id"),
        "invitation_id": current.get::<String, _>("invitation_id"),
        "organization_id": current.get::<String, _>("organization_id"),
        "purpose": "yard_assessment",
        "status": "revoked",
        "reason_code": request.reason_code,
        "version": next_version
    }))
    .execute(&mut *transaction)
    .await?;
    let receipt = owner_provider_disclosure_receipt_by_grant(
        &mut transaction,
        owner_user_id,
        property_id,
        grant_id,
    )
    .await?
    .map(|(row, photos)| disclosure_receipt_from_row(&row, photos))
    .expect("revoked owner disclosure grant should remain readable");
    transaction.commit().await?;
    Ok(PersistedDisclosureRevokeOutcome::Revoked(receipt))
}

const OWNER_PROVIDER_ASSESSMENT_SELECT: &str =
    "SELECT id AS assessment_id, invitation_id, property_id, organization_id,
            disclosure_grant_id, assessment_method, status,
            EXTRACT(EPOCH FROM proposed_window_start)::BIGINT
                AS proposed_window_start_epoch_seconds,
            EXTRACT(EPOCH FROM proposed_window_end)::BIGINT
                AS proposed_window_end_epoch_seconds,
            time_zone, outcome_reason_code, owner_visible_summary, version
     FROM owner_provider_assessments";

fn owner_provider_assessment_from_row(
    row: &sqlx::postgres::PgRow,
) -> OwnerProviderAssessmentRecord {
    OwnerProviderAssessmentRecord {
        assessment_id: row.get("assessment_id"),
        invitation_id: row.get("invitation_id"),
        property_id: row.get("property_id"),
        organization_id: row.get("organization_id"),
        disclosure_grant_id: row.get("disclosure_grant_id"),
        assessment_method: row.get("assessment_method"),
        status: row.get("status"),
        proposed_window_start_epoch_seconds: row.get("proposed_window_start_epoch_seconds"),
        proposed_window_end_epoch_seconds: row.get("proposed_window_end_epoch_seconds"),
        time_zone: row.get("time_zone"),
        outcome_reason_code: row.get("outcome_reason_code"),
        owner_visible_summary: row.get("owner_visible_summary"),
        version: row.get("version"),
        persisted: true,
    }
}

fn owner_provider_assessment_status(
    assessment: &OwnerProviderAssessmentRecord,
) -> OwnerProviderAssessmentStatusRecord {
    OwnerProviderAssessmentStatusRecord {
        assessment_id: assessment.assessment_id.clone(),
        status: assessment.status.clone(),
        version: assessment.version,
        persisted: assessment.persisted,
    }
}

fn owner_provider_assessment_matches_request(
    assessment: &OwnerProviderAssessmentRecord,
    request: &CreateOwnerProviderAssessmentRequest,
) -> bool {
    assessment.disclosure_grant_id == request.disclosure_grant_id.trim()
        && assessment.assessment_method == request.assessment_method
        && assessment.proposed_window_start_epoch_seconds
            == request.proposed_window_start_epoch_seconds
        && assessment.proposed_window_end_epoch_seconds == request.proposed_window_end_epoch_seconds
        && assessment.time_zone.as_deref() == request.time_zone.as_deref().map(str::trim)
}

async fn load_owner_provider_assessment_replay(
    pool: &PgPool,
    provider_actor_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
    request: &CreateOwnerProviderAssessmentRequest,
) -> Result<Option<PersistedAssessmentCreateOutcome>, sqlx::Error> {
    let query = format!(
        "{OWNER_PROVIDER_ASSESSMENT_SELECT}
         WHERE provider_actor_user_id = $1 AND idempotency_key = $2
           AND invitation_id = (
               SELECT invitation.id
               FROM owner_provider_invitations invitation
               JOIN owner_provider_invitation_recipient_checks recipient_check
                 ON recipient_check.invitation_id = invitation.id
               WHERE invitation.token_hash = $3
                 AND LOWER(invitation.recipient_email) = LOWER($4)
                 AND recipient_check.recipient_user_id = $1
                 AND recipient_check.verified_email_fingerprint = $5
                 AND recipient_check.status = 'checked'
               LIMIT 1
           )"
    );
    let row = sqlx::query(&query)
        .bind(provider_actor_user_id)
        .bind(request.idempotency_key.trim())
        .bind(token_hash)
        .bind(verified_email)
        .bind(verified_email_fingerprint)
        .fetch_optional(pool)
        .await?;
    Ok(row.map(|row| {
        let assessment = owner_provider_assessment_from_row(&row);
        if owner_provider_assessment_matches_request(&assessment, request) {
            PersistedAssessmentCreateOutcome::Replayed(assessment)
        } else {
            PersistedAssessmentCreateOutcome::Conflict
        }
    }))
}

async fn create_owner_provider_assessment(
    pool: &PgPool,
    provider_actor_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
    request: CreateOwnerProviderAssessmentRequest,
) -> Result<PersistedAssessmentCreateOutcome, sqlx::Error> {
    if let Some(replay) = load_owner_provider_assessment_replay(
        pool,
        provider_actor_user_id,
        verified_email,
        verified_email_fingerprint,
        token_hash,
        &request,
    )
    .await?
    {
        return Ok(replay);
    }
    let mut transaction = pool.begin().await?;
    let identity = sqlx::query(
        "SELECT invitation.id AS invitation_id
         FROM owner_provider_invitations invitation
         JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.invitation_id = invitation.id
         WHERE invitation.token_hash = $1
           AND LOWER(invitation.recipient_email) = LOWER($2)
           AND recipient_check.recipient_user_id = $3
           AND recipient_check.verified_email_fingerprint = $4
           AND recipient_check.status = 'checked'
         LIMIT 1",
    )
    .bind(token_hash)
    .bind(verified_email)
    .bind(provider_actor_user_id)
    .bind(verified_email_fingerprint)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(identity) = identity else {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentCreateOutcome::NotFound);
    };
    let invitation_id: String = identity.get("invitation_id");
    let eligibility = sqlx::query(
        "SELECT invitation.owner_user_id, invitation.property_id,
                disclosure_grant.organization_id
         FROM owner_provider_invitations invitation
         JOIN owner_provider_invitation_response_capabilities capability
           ON capability.invitation_id = invitation.id
          AND capability.actor_user_id = $2
         JOIN owner_provider_opportunity_responses response
           ON response.capability_id = capability.id
          AND response.action = 'express_interest'
          AND response.status = 'recorded'
         JOIN owner_provider_invitation_organization_claims claim
           ON claim.id = capability.claim_id
          AND claim.organization_id = capability.organization_id
         JOIN organizations organization ON organization.id = capability.organization_id
         JOIN owner_provider_disclosure_grants disclosure_grant
           ON disclosure_grant.invitation_id = invitation.id
          AND disclosure_grant.organization_id = capability.organization_id
          AND disclosure_grant.recipient_actor_user_id = $2
         JOIN owner_properties property ON property.id = invitation.property_id
         JOIN owner_workspaces workspace
           ON workspace.owner_user_id = invitation.owner_user_id
         JOIN owner_yard_briefs brief ON brief.id = disclosure_grant.brief_id
         WHERE invitation.id = $1
           AND disclosure_grant.id = $3
           AND invitation.status = 'opened' AND invitation.expires_at > NOW()
           AND capability.status = 'active' AND capability.expires_at > NOW()
           AND claim.status IN ('relationship_checked', 'claimed')
           AND organization.status = 'active'
           AND organization.organization_type = 'yard_care_company'
           AND EXISTS (
               SELECT 1 FROM organization_memberships membership
               WHERE membership.organization_id = organization.id
                 AND membership.user_id = $2 AND membership.status = 'active'
           )
           AND disclosure_grant.status = 'active'
           AND disclosure_grant.expires_at > NOW()
           AND disclosure_grant.owner_user_id = invitation.owner_user_id
           AND disclosure_grant.property_id = invitation.property_id
           AND property.owner_user_id = invitation.owner_user_id
           AND property.status <> 'archived'
           AND workspace.status = 'active'
           AND brief.status = 'ready'
           AND brief.version = disclosure_grant.brief_version
           AND NOT EXISTS (
               SELECT 1 FROM owner_yard_briefs newer
               WHERE newer.property_id = property.id AND newer.version > brief.version
           )
           AND NOT EXISTS (
               SELECT 1 FROM owner_provider_recipient_suppressions suppression
               WHERE suppression.recipient_email_fingerprint = invitation.recipient_email_fingerprint
           )
         FOR UPDATE OF disclosure_grant",
    )
    .bind(&invitation_id)
    .bind(provider_actor_user_id)
    .bind(request.disclosure_grant_id.trim())
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(eligibility) = eligibility else {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentCreateOutcome::InvalidState);
    };
    let existing_assessment = sqlx::query_scalar::<_, String>(
        "SELECT id FROM owner_provider_assessments WHERE invitation_id = $1",
    )
    .bind(&invitation_id)
    .fetch_optional(&mut *transaction)
    .await?;
    if existing_assessment.is_some() {
        transaction.rollback().await?;
        return Ok(load_owner_provider_assessment_replay(
            pool,
            provider_actor_user_id,
            verified_email,
            verified_email_fingerprint,
            token_hash,
            &request,
        )
        .await?
        .unwrap_or(PersistedAssessmentCreateOutcome::Conflict));
    }
    let assessment_id = format!("owner_provider_assessment_{}", Uuid::new_v4().simple());
    let status = if request.assessment_method == "remote" {
        "remote_review"
    } else {
        "window_proposed"
    };
    let assessment_method = request.assessment_method.clone();
    let time_zone = request.time_zone.as_deref().map(str::trim);
    let row = sqlx::query(
        "INSERT INTO owner_provider_assessments (
             id, owner_user_id, property_id, invitation_id, organization_id,
             disclosure_grant_id, provider_actor_user_id, assessment_method,
             status, proposed_window_start, proposed_window_end, time_zone,
             idempotency_key
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9,
             TO_TIMESTAMP($10::DOUBLE PRECISION),
             TO_TIMESTAMP($11::DOUBLE PRECISION), $12, $13
         )
         RETURNING id AS assessment_id, invitation_id, property_id, organization_id,
                   disclosure_grant_id, assessment_method, status,
                   EXTRACT(EPOCH FROM proposed_window_start)::BIGINT
                       AS proposed_window_start_epoch_seconds,
                   EXTRACT(EPOCH FROM proposed_window_end)::BIGINT
                       AS proposed_window_end_epoch_seconds,
                   time_zone, outcome_reason_code, owner_visible_summary, version",
    )
    .bind(&assessment_id)
    .bind(eligibility.get::<String, _>("owner_user_id"))
    .bind(eligibility.get::<String, _>("property_id"))
    .bind(&invitation_id)
    .bind(eligibility.get::<String, _>("organization_id"))
    .bind(request.disclosure_grant_id.trim())
    .bind(provider_actor_user_id)
    .bind(&assessment_method)
    .bind(status)
    .bind(request.proposed_window_start_epoch_seconds)
    .bind(request.proposed_window_end_epoch_seconds)
    .bind(time_zone)
    .bind(request.idempotency_key.trim())
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_assessment_events (
             id, assessment_id, actor_user_id, event_kind,
             assessment_version, idempotency_key, event_data
         ) VALUES ($1, $2, $3, 'started', 1, $4, $5)",
    )
    .bind(format!(
        "owner_assessment_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(&assessment_id)
    .bind(provider_actor_user_id)
    .bind(request.idempotency_key.trim())
    .bind(serde_json::json!({
        "assessment_method": &assessment_method,
        "status": status,
        "has_proposed_window": request.proposed_window_start_epoch_seconds.is_some(),
    }))
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_assessment_started', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(eligibility.get::<String, _>("owner_user_id"))
    .bind(eligibility.get::<String, _>("property_id"))
    .bind(serde_json::json!({
        "assessment_id": assessment_id,
        "invitation_id": invitation_id,
        "organization_id": eligibility.get::<String, _>("organization_id"),
        "assessment_method": &assessment_method,
        "status": status,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(PersistedAssessmentCreateOutcome::Created(
        owner_provider_assessment_from_row(&row),
    ))
}

async fn list_owner_provider_assessments(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
) -> Result<Option<Vec<OwnerProviderAssessmentRecord>>, sqlx::Error> {
    let property_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
             SELECT 1 FROM owner_properties
             WHERE id = $1 AND owner_user_id = $2
         )",
    )
    .bind(property_id)
    .bind(owner_user_id)
    .fetch_one(pool)
    .await?;
    if !property_exists {
        return Ok(None);
    }
    let query = format!(
        "{OWNER_PROVIDER_ASSESSMENT_SELECT}
         WHERE owner_user_id = $1 AND property_id = $2
         ORDER BY updated_at DESC, id"
    );
    let rows = sqlx::query(&query)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_all(pool)
        .await?;
    Ok(Some(
        rows.iter()
            .map(owner_provider_assessment_from_row)
            .collect(),
    ))
}

async fn decide_owner_provider_assessment_window(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    assessment_id: &str,
    request: DecideOwnerProviderAssessmentWindowRequest,
) -> Result<PersistedAssessmentWindowDecisionOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let query = format!(
        "{OWNER_PROVIDER_ASSESSMENT_SELECT}
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3
         FOR UPDATE"
    );
    let current = sqlx::query(&query)
        .bind(assessment_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentWindowDecisionOutcome::NotFound);
    };
    let current = owner_provider_assessment_from_row(&current);
    let event_kind = if request.action == "confirm" {
        "window_confirmed"
    } else {
        "window_change_requested"
    };
    let next_status = if request.action == "confirm" {
        "owner_confirmed"
    } else {
        "window_change_requested"
    };
    let replay = sqlx::query(
        "SELECT event_kind, assessment_version
         FROM owner_provider_assessment_events
         WHERE actor_user_id = $1 AND idempotency_key = $2",
    )
    .bind(owner_user_id)
    .bind(request.idempotency_key.trim())
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(replay) = replay {
        let exact = replay.get::<String, _>("event_kind") == event_kind
            && replay.get::<i64, _>("assessment_version") == request.expected_version + 1
            && current.version == request.expected_version + 1
            && current.status == next_status;
        transaction.commit().await?;
        return Ok(if exact {
            PersistedAssessmentWindowDecisionOutcome::Replayed(current)
        } else {
            PersistedAssessmentWindowDecisionOutcome::Conflict
        });
    }
    if current.status != "window_proposed" || current.assessment_method != "on_site" {
        transaction.commit().await?;
        return Ok(PersistedAssessmentWindowDecisionOutcome::InvalidState(
            current,
        ));
    }
    if current.version != request.expected_version {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentWindowDecisionOutcome::Conflict);
    }
    let next_version = current.version + 1;
    let updated = sqlx::query(
        "UPDATE owner_provider_assessments
         SET status = $2, version = $3, updated_at = NOW()
         WHERE id = $1
         RETURNING id AS assessment_id, invitation_id, property_id, organization_id,
                   disclosure_grant_id, assessment_method, status,
                   EXTRACT(EPOCH FROM proposed_window_start)::BIGINT
                       AS proposed_window_start_epoch_seconds,
                   EXTRACT(EPOCH FROM proposed_window_end)::BIGINT
                       AS proposed_window_end_epoch_seconds,
                   time_zone, outcome_reason_code, owner_visible_summary, version",
    )
    .bind(assessment_id)
    .bind(next_status)
    .bind(next_version)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_assessment_events (
             id, assessment_id, actor_user_id, event_kind,
             assessment_version, idempotency_key, event_data
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(format!(
        "owner_assessment_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(assessment_id)
    .bind(owner_user_id)
    .bind(event_kind)
    .bind(next_version)
    .bind(request.idempotency_key.trim())
    .bind(serde_json::json!({
        "status": next_status,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(PersistedAssessmentWindowDecisionOutcome::Updated(
        owner_provider_assessment_from_row(&updated),
    ))
}

async fn transition_owner_provider_assessment(
    pool: &PgPool,
    provider_actor_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
    assessment_id: &str,
    request: TransitionOwnerProviderAssessmentRequest,
) -> Result<PersistedAssessmentTransitionOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let query = format!(
        "{OWNER_PROVIDER_ASSESSMENT_SELECT}
         WHERE id = $1 AND provider_actor_user_id = $2
           AND invitation_id = (
               SELECT invitation.id
               FROM owner_provider_invitations invitation
               JOIN owner_provider_invitation_recipient_checks recipient_check
                 ON recipient_check.invitation_id = invitation.id
               WHERE invitation.token_hash = $3
                 AND LOWER(invitation.recipient_email) = LOWER($4)
                 AND recipient_check.recipient_user_id = $2
                 AND recipient_check.verified_email_fingerprint = $5
                 AND recipient_check.status = 'checked'
               LIMIT 1
           )
         FOR UPDATE"
    );
    let current = sqlx::query(&query)
        .bind(assessment_id)
        .bind(provider_actor_user_id)
        .bind(token_hash)
        .bind(verified_email)
        .bind(verified_email_fingerprint)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentTransitionOutcome::NotFound);
    };
    let current = owner_provider_assessment_from_row(&current);
    let (event_kind, next_status) = match request.action.as_str() {
        "begin" => ("began", "in_progress"),
        "complete" => ("completed", "completed"),
        "cannot_assess" => ("cannot_assess", "cannot_assess"),
        "cancel" => ("cancelled", "cancelled"),
        _ => return Ok(PersistedAssessmentTransitionOutcome::Conflict),
    };
    let normalized_reason = request.reason_code.as_deref().map(str::trim);
    let normalized_summary = request.owner_visible_summary.as_deref().map(str::trim);
    let replay = sqlx::query(
        "SELECT assessment_id, event_kind, assessment_version
         FROM owner_provider_assessment_events
         WHERE actor_user_id = $1 AND idempotency_key = $2",
    )
    .bind(provider_actor_user_id)
    .bind(request.idempotency_key.trim())
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(replay) = replay {
        let exact = replay.get::<String, _>("assessment_id") == assessment_id
            && replay.get::<String, _>("event_kind") == event_kind
            && replay.get::<i64, _>("assessment_version") == request.expected_version + 1
            && current.version == request.expected_version + 1
            && current.status == next_status
            && current.outcome_reason_code.as_deref() == normalized_reason
            && current.owner_visible_summary.as_deref() == normalized_summary;
        transaction.commit().await?;
        return Ok(if exact {
            PersistedAssessmentTransitionOutcome::Replayed(current)
        } else {
            PersistedAssessmentTransitionOutcome::Conflict
        });
    }
    let state_valid = match request.action.as_str() {
        "begin" => matches!(current.status.as_str(), "remote_review" | "owner_confirmed"),
        "complete" => current.status == "in_progress",
        "cannot_assess" | "cancel" => matches!(
            current.status.as_str(),
            "remote_review"
                | "window_proposed"
                | "window_change_requested"
                | "owner_confirmed"
                | "in_progress"
        ),
        _ => false,
    };
    if !state_valid {
        transaction.commit().await?;
        return Ok(PersistedAssessmentTransitionOutcome::InvalidState(current));
    }
    if current.version != request.expected_version {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentTransitionOutcome::Conflict);
    }
    let authority_active = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
             SELECT 1
             FROM owner_provider_assessments assessment
             JOIN owner_provider_invitations invitation
               ON invitation.id = assessment.invitation_id
             JOIN owner_provider_invitation_response_capabilities capability
               ON capability.invitation_id = invitation.id
              AND capability.actor_user_id = $2
              AND capability.organization_id = assessment.organization_id
             JOIN owner_provider_opportunity_responses response
               ON response.capability_id = capability.id
              AND response.action = 'express_interest'
              AND response.status = 'recorded'
             JOIN owner_provider_invitation_organization_claims claim
               ON claim.id = capability.claim_id
              AND claim.organization_id = capability.organization_id
             JOIN organizations organization ON organization.id = assessment.organization_id
             JOIN owner_provider_disclosure_grants disclosure_grant
               ON disclosure_grant.id = assessment.disclosure_grant_id
              AND disclosure_grant.invitation_id = invitation.id
              AND disclosure_grant.organization_id = assessment.organization_id
              AND disclosure_grant.recipient_actor_user_id = $2
             JOIN owner_properties property ON property.id = assessment.property_id
             JOIN owner_workspaces workspace
               ON workspace.owner_user_id = assessment.owner_user_id
             JOIN owner_yard_briefs brief ON brief.id = disclosure_grant.brief_id
             WHERE assessment.id = $1
               AND invitation.status = 'opened' AND invitation.expires_at > NOW()
               AND capability.status = 'active' AND capability.expires_at > NOW()
               AND claim.status IN ('relationship_checked', 'claimed')
               AND organization.status = 'active'
               AND organization.organization_type = 'yard_care_company'
               AND EXISTS (
                   SELECT 1 FROM organization_memberships membership
                   WHERE membership.organization_id = organization.id
                     AND membership.user_id = $2 AND membership.status = 'active'
               )
               AND disclosure_grant.status = 'active'
               AND disclosure_grant.expires_at > NOW()
               AND disclosure_grant.owner_user_id = assessment.owner_user_id
               AND disclosure_grant.property_id = assessment.property_id
               AND property.owner_user_id = assessment.owner_user_id
               AND property.status <> 'archived'
               AND workspace.status = 'active'
               AND brief.status = 'ready'
               AND brief.version = disclosure_grant.brief_version
               AND NOT EXISTS (
                   SELECT 1 FROM owner_yard_briefs newer
                   WHERE newer.property_id = property.id AND newer.version > brief.version
               )
               AND NOT EXISTS (
                   SELECT 1 FROM owner_provider_recipient_suppressions suppression
                   WHERE suppression.recipient_email_fingerprint = invitation.recipient_email_fingerprint
               )
         )",
    )
    .bind(assessment_id)
    .bind(provider_actor_user_id)
    .fetch_one(&mut *transaction)
    .await?;
    if !authority_active {
        transaction.commit().await?;
        return Ok(PersistedAssessmentTransitionOutcome::InvalidState(current));
    }
    let next_version = current.version + 1;
    let updated = sqlx::query(
        "UPDATE owner_provider_assessments
         SET status = $2, outcome_reason_code = $3, owner_visible_summary = $4,
             version = $5, updated_at = NOW()
         WHERE id = $1
         RETURNING id AS assessment_id, invitation_id, property_id, organization_id,
                   disclosure_grant_id, assessment_method, status,
                   EXTRACT(EPOCH FROM proposed_window_start)::BIGINT
                       AS proposed_window_start_epoch_seconds,
                   EXTRACT(EPOCH FROM proposed_window_end)::BIGINT
                       AS proposed_window_end_epoch_seconds,
                   time_zone, outcome_reason_code, owner_visible_summary, version",
    )
    .bind(assessment_id)
    .bind(next_status)
    .bind(normalized_reason)
    .bind(normalized_summary)
    .bind(next_version)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_assessment_events (
             id, assessment_id, actor_user_id, event_kind,
             assessment_version, idempotency_key, event_data
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(format!(
        "owner_assessment_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(assessment_id)
    .bind(provider_actor_user_id)
    .bind(event_kind)
    .bind(next_version)
    .bind(request.idempotency_key.trim())
    .bind(serde_json::json!({
        "status": next_status,
        "reason_code": normalized_reason,
        "has_owner_visible_summary": normalized_summary.is_some(),
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(PersistedAssessmentTransitionOutcome::Updated(
        owner_provider_assessment_from_row(&updated),
    ))
}

async fn propose_provider_assessment_window(
    pool: &PgPool,
    provider_actor_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
    assessment_id: &str,
    request: ProposeProviderAssessmentWindowRequest,
) -> Result<PersistedAssessmentWindowProposalOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let Some((current, authority_active)) = load_provider_assessment_write_authority(
        &mut transaction,
        provider_actor_user_id,
        verified_email,
        verified_email_fingerprint,
        token_hash,
        assessment_id,
    )
    .await?
    else {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentWindowProposalOutcome::NotFound);
    };
    let replay = sqlx::query(
        "SELECT assessment_id, event_kind, assessment_version
         FROM owner_provider_assessment_events
         WHERE actor_user_id = $1 AND idempotency_key = $2",
    )
    .bind(provider_actor_user_id)
    .bind(request.idempotency_key.trim())
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(replay) = replay {
        let exact = replay.get::<String, _>("assessment_id") == assessment_id
            && replay.get::<String, _>("event_kind") == "window_proposed"
            && replay.get::<i64, _>("assessment_version") == request.expected_version + 1
            && current.version == request.expected_version + 1
            && current.status == "window_proposed"
            && current.proposed_window_start_epoch_seconds
                == Some(request.proposed_window_start_epoch_seconds)
            && current.proposed_window_end_epoch_seconds
                == Some(request.proposed_window_end_epoch_seconds)
            && current.time_zone.as_deref() == Some(request.time_zone.trim());
        transaction.commit().await?;
        return Ok(if exact {
            PersistedAssessmentWindowProposalOutcome::Replayed(current)
        } else {
            PersistedAssessmentWindowProposalOutcome::Conflict
        });
    }
    if !authority_active
        || current.assessment_method != "on_site"
        || current.status != "window_change_requested"
    {
        transaction.commit().await?;
        return Ok(PersistedAssessmentWindowProposalOutcome::InvalidState(
            current,
        ));
    }
    if current.version != request.expected_version {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentWindowProposalOutcome::Conflict);
    }
    let next_version = current.version + 1;
    let updated = sqlx::query(
        "UPDATE owner_provider_assessments
         SET status = 'window_proposed', proposed_window_start = TO_TIMESTAMP($2::DOUBLE PRECISION),
             proposed_window_end = TO_TIMESTAMP($3::DOUBLE PRECISION), time_zone = $4,
             version = $5, updated_at = NOW()
         WHERE id = $1
         RETURNING id AS assessment_id, invitation_id, property_id, organization_id,
                   disclosure_grant_id, assessment_method, status,
                   EXTRACT(EPOCH FROM proposed_window_start)::BIGINT
                       AS proposed_window_start_epoch_seconds,
                   EXTRACT(EPOCH FROM proposed_window_end)::BIGINT
                       AS proposed_window_end_epoch_seconds,
                   time_zone, outcome_reason_code, owner_visible_summary, version",
    )
    .bind(assessment_id)
    .bind(request.proposed_window_start_epoch_seconds)
    .bind(request.proposed_window_end_epoch_seconds)
    .bind(request.time_zone.trim())
    .bind(next_version)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_assessment_events (
             id, assessment_id, actor_user_id, event_kind,
             assessment_version, idempotency_key, event_data
         ) VALUES ($1, $2, $3, 'window_proposed', $4, $5, $6)",
    )
    .bind(format!(
        "owner_assessment_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(assessment_id)
    .bind(provider_actor_user_id)
    .bind(next_version)
    .bind(request.idempotency_key.trim())
    .bind(serde_json::json!({
        "status": "window_proposed",
        "replacement": true,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(PersistedAssessmentWindowProposalOutcome::Updated(
        owner_provider_assessment_from_row(&updated),
    ))
}

const OWNER_PROVIDER_ASSESSMENT_MESSAGE_SELECT: &str =
    "SELECT id AS message_id, assessment_id, author_role, message_kind,
            customer_safe_body, assessment_version_snapshot,
            EXTRACT(EPOCH FROM created_at)::BIGINT AS created_at_epoch_seconds
     FROM owner_provider_assessment_messages";

fn owner_provider_assessment_message_from_row(
    row: &sqlx::postgres::PgRow,
) -> OwnerProviderAssessmentMessageRecord {
    OwnerProviderAssessmentMessageRecord {
        message_id: row.get("message_id"),
        assessment_id: row.get("assessment_id"),
        author_role: row.get("author_role"),
        message_kind: row.get("message_kind"),
        customer_safe_body: row.get("customer_safe_body"),
        assessment_version_snapshot: row.get("assessment_version_snapshot"),
        created_at_epoch_seconds: row.get("created_at_epoch_seconds"),
        persisted: true,
    }
}

const OWNER_PROVIDER_ASSESSMENT_PRIVATE_NOTE_SELECT: &str =
    "SELECT id AS note_id, assessment_id, organization_id, author_user_id,
            note_kind, private_body, assessment_version_snapshot,
            EXTRACT(EPOCH FROM created_at)::BIGINT AS created_at_epoch_seconds
     FROM owner_provider_assessment_private_notes";

fn owner_provider_assessment_private_note_from_row(
    row: &sqlx::postgres::PgRow,
) -> OwnerProviderAssessmentPrivateNoteRecord {
    OwnerProviderAssessmentPrivateNoteRecord {
        note_id: row.get("note_id"),
        assessment_id: row.get("assessment_id"),
        organization_id: row.get("organization_id"),
        author_user_id: row.get("author_user_id"),
        note_kind: row.get("note_kind"),
        private_body: row.get("private_body"),
        assessment_version_snapshot: row.get("assessment_version_snapshot"),
        created_at_epoch_seconds: row.get("created_at_epoch_seconds"),
        persisted: true,
    }
}

fn assessment_accepts_communication(status: &str) -> bool {
    matches!(
        status,
        "remote_review"
            | "window_proposed"
            | "window_change_requested"
            | "owner_confirmed"
            | "in_progress"
    )
}

async fn load_provider_assessment_write_authority(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    provider_actor_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
    assessment_id: &str,
) -> Result<Option<(OwnerProviderAssessmentRecord, bool)>, sqlx::Error> {
    let query = format!(
        "{OWNER_PROVIDER_ASSESSMENT_SELECT}
         WHERE id = $1 AND provider_actor_user_id = $2
           AND invitation_id = (
               SELECT invitation.id
               FROM owner_provider_invitations invitation
               JOIN owner_provider_invitation_recipient_checks recipient_check
                 ON recipient_check.invitation_id = invitation.id
               WHERE invitation.token_hash = $3
                 AND LOWER(invitation.recipient_email) = LOWER($4)
                 AND recipient_check.recipient_user_id = $2
                 AND recipient_check.verified_email_fingerprint = $5
                 AND recipient_check.status = 'checked'
               LIMIT 1
           )
         FOR UPDATE"
    );
    let row = sqlx::query(&query)
        .bind(assessment_id)
        .bind(provider_actor_user_id)
        .bind(token_hash)
        .bind(verified_email)
        .bind(verified_email_fingerprint)
        .fetch_optional(&mut **transaction)
        .await?;
    let Some(row) = row else {
        return Ok(None);
    };
    let assessment = owner_provider_assessment_from_row(&row);
    let authority_active = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
             SELECT 1
             FROM owner_provider_assessments assessment
             JOIN owner_provider_invitations invitation
               ON invitation.id = assessment.invitation_id
             JOIN owner_provider_invitation_response_capabilities capability
               ON capability.invitation_id = invitation.id
              AND capability.actor_user_id = $2
              AND capability.organization_id = assessment.organization_id
             JOIN owner_provider_opportunity_responses response
               ON response.capability_id = capability.id
              AND response.action = 'express_interest' AND response.status = 'recorded'
             JOIN owner_provider_invitation_organization_claims claim
               ON claim.id = capability.claim_id
              AND claim.organization_id = capability.organization_id
             JOIN organizations organization ON organization.id = assessment.organization_id
             JOIN owner_provider_disclosure_grants disclosure_grant
               ON disclosure_grant.id = assessment.disclosure_grant_id
              AND disclosure_grant.invitation_id = invitation.id
              AND disclosure_grant.organization_id = assessment.organization_id
              AND disclosure_grant.recipient_actor_user_id = $2
             JOIN owner_properties property ON property.id = assessment.property_id
             JOIN owner_workspaces workspace
               ON workspace.owner_user_id = assessment.owner_user_id
             JOIN owner_yard_briefs brief ON brief.id = disclosure_grant.brief_id
             WHERE assessment.id = $1
               AND invitation.status = 'opened' AND invitation.expires_at > NOW()
               AND capability.status = 'active' AND capability.expires_at > NOW()
               AND claim.status IN ('relationship_checked', 'claimed')
               AND organization.status = 'active'
               AND organization.organization_type = 'yard_care_company'
               AND EXISTS (
                   SELECT 1 FROM organization_memberships membership
                   WHERE membership.organization_id = organization.id
                     AND membership.user_id = $2 AND membership.status = 'active'
               )
               AND disclosure_grant.status = 'active' AND disclosure_grant.expires_at > NOW()
               AND disclosure_grant.owner_user_id = assessment.owner_user_id
               AND disclosure_grant.property_id = assessment.property_id
               AND property.owner_user_id = assessment.owner_user_id
               AND property.status <> 'archived' AND workspace.status = 'active'
               AND brief.status = 'ready' AND brief.version = disclosure_grant.brief_version
               AND NOT EXISTS (
                   SELECT 1 FROM owner_yard_briefs newer
                   WHERE newer.property_id = property.id AND newer.version > brief.version
               )
               AND NOT EXISTS (
                   SELECT 1 FROM owner_provider_recipient_suppressions suppression
                   WHERE suppression.recipient_email_fingerprint = invitation.recipient_email_fingerprint
               )
         )",
    )
    .bind(assessment_id)
    .bind(provider_actor_user_id)
    .fetch_one(&mut **transaction)
    .await?;
    Ok(Some((assessment, authority_active)))
}

async fn create_owner_provider_assessment_message(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    assessment_id: &str,
    request: CreateOwnerAssessmentMessageRequest,
) -> Result<
    PersistedAssessmentCommunicationWriteOutcome<OwnerProviderAssessmentMessageRecord>,
    sqlx::Error,
> {
    let mut transaction = pool.begin().await?;
    let query = format!(
        "{OWNER_PROVIDER_ASSESSMENT_SELECT}
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3 FOR UPDATE"
    );
    let current = sqlx::query(&query)
        .bind(assessment_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentCommunicationWriteOutcome::NotFound);
    };
    let current = owner_provider_assessment_from_row(&current);
    let replay_query = format!(
        "{OWNER_PROVIDER_ASSESSMENT_MESSAGE_SELECT}
         WHERE author_user_id = $1 AND idempotency_key = $2"
    );
    let replay = sqlx::query(&replay_query)
        .bind(owner_user_id)
        .bind(request.idempotency_key.trim())
        .fetch_optional(&mut *transaction)
        .await?;
    if let Some(replay) = replay {
        let record = owner_provider_assessment_message_from_row(&replay);
        let exact = record.assessment_id == assessment_id
            && record.author_role == "owner"
            && record.message_kind == request.message_kind
            && record.customer_safe_body == request.customer_safe_body.trim()
            && record.assessment_version_snapshot == request.expected_assessment_version;
        transaction.commit().await?;
        return Ok(if exact {
            PersistedAssessmentCommunicationWriteOutcome::Replayed(record)
        } else {
            PersistedAssessmentCommunicationWriteOutcome::Conflict
        });
    }
    if !assessment_accepts_communication(&current.status) {
        transaction.commit().await?;
        return Ok(PersistedAssessmentCommunicationWriteOutcome::InvalidState(
            owner_provider_assessment_status(&current),
        ));
    }
    if current.version != request.expected_assessment_version {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentCommunicationWriteOutcome::Conflict);
    }
    let record = insert_owner_provider_assessment_message(
        &mut transaction,
        AssessmentMessageInsert {
            assessment_id,
            author_user_id: owner_user_id,
            author_role: "owner",
            message_kind: &request.message_kind,
            body: request.customer_safe_body.trim(),
            assessment_version: current.version,
            idempotency_key: request.idempotency_key.trim(),
        },
    )
    .await?;
    transaction.commit().await?;
    Ok(PersistedAssessmentCommunicationWriteOutcome::Created(
        record,
    ))
}

async fn create_provider_assessment_message(
    pool: &PgPool,
    provider_actor_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
    assessment_id: &str,
    request: CreateProviderAssessmentMessageRequest,
) -> Result<
    PersistedAssessmentCommunicationWriteOutcome<OwnerProviderAssessmentMessageRecord>,
    sqlx::Error,
> {
    let mut transaction = pool.begin().await?;
    let Some((current, authority_active)) = load_provider_assessment_write_authority(
        &mut transaction,
        provider_actor_user_id,
        verified_email,
        verified_email_fingerprint,
        token_hash,
        assessment_id,
    )
    .await?
    else {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentCommunicationWriteOutcome::NotFound);
    };
    let replay_query = format!(
        "{OWNER_PROVIDER_ASSESSMENT_MESSAGE_SELECT}
         WHERE author_user_id = $1 AND idempotency_key = $2"
    );
    let replay = sqlx::query(&replay_query)
        .bind(provider_actor_user_id)
        .bind(request.idempotency_key.trim())
        .fetch_optional(&mut *transaction)
        .await?;
    if let Some(replay) = replay {
        let record = owner_provider_assessment_message_from_row(&replay);
        let exact = record.assessment_id == assessment_id
            && record.author_role == "provider"
            && record.message_kind == request.message_kind
            && record.customer_safe_body == request.customer_safe_body.trim()
            && record.assessment_version_snapshot == request.expected_assessment_version;
        transaction.commit().await?;
        return Ok(if exact {
            PersistedAssessmentCommunicationWriteOutcome::Replayed(record)
        } else {
            PersistedAssessmentCommunicationWriteOutcome::Conflict
        });
    }
    if !authority_active || !assessment_accepts_communication(&current.status) {
        transaction.commit().await?;
        return Ok(PersistedAssessmentCommunicationWriteOutcome::InvalidState(
            owner_provider_assessment_status(&current),
        ));
    }
    if current.version != request.expected_assessment_version {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentCommunicationWriteOutcome::Conflict);
    }
    let record = insert_owner_provider_assessment_message(
        &mut transaction,
        AssessmentMessageInsert {
            assessment_id,
            author_user_id: provider_actor_user_id,
            author_role: "provider",
            message_kind: &request.message_kind,
            body: request.customer_safe_body.trim(),
            assessment_version: current.version,
            idempotency_key: request.idempotency_key.trim(),
        },
    )
    .await?;
    transaction.commit().await?;
    Ok(PersistedAssessmentCommunicationWriteOutcome::Created(
        record,
    ))
}

struct AssessmentMessageInsert<'a> {
    assessment_id: &'a str,
    author_user_id: &'a str,
    author_role: &'a str,
    message_kind: &'a str,
    body: &'a str,
    assessment_version: i64,
    idempotency_key: &'a str,
}

async fn insert_owner_provider_assessment_message(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    input: AssessmentMessageInsert<'_>,
) -> Result<OwnerProviderAssessmentMessageRecord, sqlx::Error> {
    let row = sqlx::query(
        "INSERT INTO owner_provider_assessment_messages (
             id, assessment_id, author_user_id, author_role, message_kind,
             customer_safe_body, assessment_version_snapshot, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id AS message_id, assessment_id, author_role, message_kind,
                   customer_safe_body, assessment_version_snapshot,
                   EXTRACT(EPOCH FROM created_at)::BIGINT AS created_at_epoch_seconds",
    )
    .bind(format!(
        "owner_assessment_message_{}",
        Uuid::new_v4().simple()
    ))
    .bind(input.assessment_id)
    .bind(input.author_user_id)
    .bind(input.author_role)
    .bind(input.message_kind)
    .bind(input.body)
    .bind(input.assessment_version)
    .bind(input.idempotency_key)
    .fetch_one(&mut **transaction)
    .await?;
    let record = owner_provider_assessment_message_from_row(&row);
    sqlx::query(
        "INSERT INTO owner_provider_assessment_events (
             id, assessment_id, actor_user_id, event_kind,
             assessment_version, idempotency_key, event_data
         ) VALUES ($1, $2, $3, 'customer_message_added', $4, $5, $6)",
    )
    .bind(format!(
        "owner_assessment_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(input.assessment_id)
    .bind(input.author_user_id)
    .bind(input.assessment_version)
    .bind(input.idempotency_key)
    .bind(serde_json::json!({
        "record_id": &record.message_id,
        "message_kind": input.message_kind,
        "author_role": input.author_role,
    }))
    .execute(&mut **transaction)
    .await?;
    Ok(record)
}

async fn create_provider_assessment_private_note(
    pool: &PgPool,
    provider_actor_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
    assessment_id: &str,
    request: CreateProviderAssessmentPrivateNoteRequest,
) -> Result<
    PersistedAssessmentCommunicationWriteOutcome<OwnerProviderAssessmentPrivateNoteRecord>,
    sqlx::Error,
> {
    let mut transaction = pool.begin().await?;
    let Some((current, authority_active)) = load_provider_assessment_write_authority(
        &mut transaction,
        provider_actor_user_id,
        verified_email,
        verified_email_fingerprint,
        token_hash,
        assessment_id,
    )
    .await?
    else {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentCommunicationWriteOutcome::NotFound);
    };
    let replay_query = format!(
        "{OWNER_PROVIDER_ASSESSMENT_PRIVATE_NOTE_SELECT}
         WHERE author_user_id = $1 AND idempotency_key = $2"
    );
    let replay = sqlx::query(&replay_query)
        .bind(provider_actor_user_id)
        .bind(request.idempotency_key.trim())
        .fetch_optional(&mut *transaction)
        .await?;
    if let Some(replay) = replay {
        let record = owner_provider_assessment_private_note_from_row(&replay);
        let exact = record.assessment_id == assessment_id
            && record.organization_id == current.organization_id
            && record.note_kind == request.note_kind
            && record.private_body == request.private_body.trim()
            && record.assessment_version_snapshot == request.expected_assessment_version;
        transaction.commit().await?;
        return Ok(if exact {
            PersistedAssessmentCommunicationWriteOutcome::Replayed(record)
        } else {
            PersistedAssessmentCommunicationWriteOutcome::Conflict
        });
    }
    if !authority_active || !assessment_accepts_communication(&current.status) {
        transaction.commit().await?;
        return Ok(PersistedAssessmentCommunicationWriteOutcome::InvalidState(
            owner_provider_assessment_status(&current),
        ));
    }
    if current.version != request.expected_assessment_version {
        transaction.rollback().await?;
        return Ok(PersistedAssessmentCommunicationWriteOutcome::Conflict);
    }
    let row = sqlx::query(
        "INSERT INTO owner_provider_assessment_private_notes (
             id, assessment_id, organization_id, author_user_id, note_kind,
             private_body, assessment_version_snapshot, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id AS note_id, assessment_id, organization_id, author_user_id,
                   note_kind, private_body, assessment_version_snapshot,
                   EXTRACT(EPOCH FROM created_at)::BIGINT AS created_at_epoch_seconds",
    )
    .bind(format!(
        "owner_assessment_private_note_{}",
        Uuid::new_v4().simple()
    ))
    .bind(assessment_id)
    .bind(&current.organization_id)
    .bind(provider_actor_user_id)
    .bind(&request.note_kind)
    .bind(request.private_body.trim())
    .bind(current.version)
    .bind(request.idempotency_key.trim())
    .fetch_one(&mut *transaction)
    .await?;
    let record = owner_provider_assessment_private_note_from_row(&row);
    sqlx::query(
        "INSERT INTO owner_provider_assessment_events (
             id, assessment_id, actor_user_id, event_kind,
             assessment_version, idempotency_key, event_data
         ) VALUES ($1, $2, $3, 'private_note_added', $4, $5, $6)",
    )
    .bind(format!(
        "owner_assessment_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(assessment_id)
    .bind(provider_actor_user_id)
    .bind(current.version)
    .bind(request.idempotency_key.trim())
    .bind(serde_json::json!({
        "record_id": &record.note_id,
        "note_kind": &record.note_kind,
    }))
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(PersistedAssessmentCommunicationWriteOutcome::Created(
        record,
    ))
}

async fn list_owner_provider_assessment_messages(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    assessment_id: &str,
) -> Result<Option<Vec<OwnerProviderAssessmentMessageRecord>>, sqlx::Error> {
    let authorized = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
             SELECT 1 FROM owner_provider_assessments
             WHERE id = $1 AND owner_user_id = $2 AND property_id = $3
         )",
    )
    .bind(assessment_id)
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_one(pool)
    .await?;
    if !authorized {
        return Ok(None);
    }
    let rows = sqlx::query(
        "SELECT message.id AS message_id, message.assessment_id,
                message.author_role, message.message_kind,
                message.customer_safe_body, message.assessment_version_snapshot,
                EXTRACT(EPOCH FROM message.created_at)::BIGINT AS created_at_epoch_seconds
         FROM owner_provider_assessment_owner_messages message
         WHERE message.assessment_id = $1
         ORDER BY message.created_at, message.id",
    )
    .bind(assessment_id)
    .fetch_all(pool)
    .await?;
    Ok(Some(
        rows.iter()
            .map(owner_provider_assessment_message_from_row)
            .collect(),
    ))
}

const OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT: &str =
    "SELECT id AS proposal_id, assessment_id, invitation_id, property_id,
            organization_id, disclosure_grant_id, proposal_version, status,
            title, customer_summary, included_scope, exclusions, cadence_code,
            cadence_detail, arrival_policy, weather_policy, cancellation_policy,
            proof_expectation, price_amount_minor, price_basis, currency_code,
            annualized_monthly_minor, revision_note,
            EXTRACT(EPOCH FROM issued_at)::BIGINT AS issued_at_epoch_seconds,
            EXTRACT(EPOCH FROM expires_at)::BIGINT AS expires_at_epoch_seconds
     FROM owner_provider_initial_service_proposals";

fn owner_provider_initial_service_proposal_from_row(
    row: &sqlx::postgres::PgRow,
) -> OwnerProviderInitialServiceProposalRecord {
    OwnerProviderInitialServiceProposalRecord {
        proposal_id: row.get("proposal_id"),
        assessment_id: row.get("assessment_id"),
        invitation_id: row.get("invitation_id"),
        property_id: row.get("property_id"),
        organization_id: row.get("organization_id"),
        disclosure_grant_id: row.get("disclosure_grant_id"),
        proposal_version: row.get("proposal_version"),
        status: row.get("status"),
        title: row.get("title"),
        customer_summary: row.get("customer_summary"),
        included_scope: row.get("included_scope"),
        exclusions: row.get("exclusions"),
        cadence_code: row.get("cadence_code"),
        cadence_detail: row.get("cadence_detail"),
        arrival_policy: row.get("arrival_policy"),
        weather_policy: row.get("weather_policy"),
        cancellation_policy: row.get("cancellation_policy"),
        proof_expectation: row.get("proof_expectation"),
        price_amount_minor: row.get("price_amount_minor"),
        price_basis: row.get("price_basis"),
        currency_code: row.get("currency_code"),
        annualized_monthly_minor: row.get("annualized_monthly_minor"),
        revision_note: row.get("revision_note"),
        issued_at_epoch_seconds: row.get("issued_at_epoch_seconds"),
        expires_at_epoch_seconds: row.get("expires_at_epoch_seconds"),
        persisted: true,
    }
}

const OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_MESSAGE_SELECT: &str =
    "SELECT id AS message_id, proposal_id, assessment_id, author_role,
            message_kind, customer_safe_body, proposal_version_snapshot,
            series_version_snapshot, in_reply_to_message_id,
            related_proposal_id,
            EXTRACT(EPOCH FROM created_at)::BIGINT AS created_at_epoch_seconds
     FROM owner_provider_initial_service_proposal_messages";

fn owner_provider_initial_service_proposal_message_from_row(
    row: &sqlx::postgres::PgRow,
) -> OwnerProviderInitialServiceProposalMessageRecord {
    OwnerProviderInitialServiceProposalMessageRecord {
        message_id: row.get("message_id"),
        proposal_id: row.get("proposal_id"),
        assessment_id: row.get("assessment_id"),
        author_role: row.get("author_role"),
        message_kind: row.get("message_kind"),
        customer_safe_body: row.get("customer_safe_body"),
        proposal_version_snapshot: row.get("proposal_version_snapshot"),
        series_version_snapshot: row.get("series_version_snapshot"),
        in_reply_to_message_id: row.get("in_reply_to_message_id"),
        related_proposal_id: row.get("related_proposal_id"),
        created_at_epoch_seconds: row.get("created_at_epoch_seconds"),
        persisted: true,
    }
}

fn normalized_proposal_items(items: &[String]) -> Vec<String> {
    items.iter().map(|item| item.trim().to_string()).collect()
}

fn annualized_monthly_minor(
    amount_minor: i64,
    price_basis: &str,
    cadence_code: &str,
) -> Option<i64> {
    match price_basis {
        "monthly" => Some(amount_minor),
        "per_visit" => match cadence_code {
            "weekly" => amount_minor.checked_mul(52).map(|annual| annual / 12),
            "every_two_weeks" => amount_minor.checked_mul(26).map(|annual| annual / 12),
            "monthly" => Some(amount_minor),
            _ => None,
        },
        _ => None,
    }
}

fn initial_service_proposal_matches_request(
    proposal: &OwnerProviderInitialServiceProposalRecord,
    assessment_id: &str,
    request: &PublishOwnerProviderInitialServiceProposalRequest,
) -> bool {
    proposal.assessment_id == assessment_id
        && proposal.proposal_version == request.expected_proposal_version + 1
        && proposal.title == request.title.trim()
        && proposal.customer_summary == request.customer_summary.trim()
        && proposal.included_scope == normalized_proposal_items(&request.included_scope)
        && proposal.exclusions == normalized_proposal_items(&request.exclusions)
        && proposal.cadence_code == request.cadence_code
        && proposal.cadence_detail == request.cadence_detail.trim()
        && proposal.arrival_policy == request.arrival_policy.trim()
        && proposal.weather_policy == request.weather_policy.trim()
        && proposal.cancellation_policy == request.cancellation_policy.trim()
        && proposal.proof_expectation == request.proof_expectation.trim()
        && proposal.price_amount_minor == request.price_amount_minor
        && proposal.price_basis == request.price_basis
        && proposal.currency_code == request.currency_code
        && proposal.annualized_monthly_minor
            == annualized_monthly_minor(
                request.price_amount_minor,
                &request.price_basis,
                &request.cadence_code,
            )
        && proposal.revision_note.as_deref() == request.revision_note.as_deref().map(str::trim)
        && proposal.expires_at_epoch_seconds == request.expires_at_epoch_seconds
}

async fn expire_owner_provider_initial_service_proposals(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    assessment_id: &str,
) -> Result<(), sqlx::Error> {
    let expired = sqlx::query(
        "UPDATE owner_provider_initial_service_proposals
         SET status = 'expired', updated_at = NOW()
         WHERE assessment_id = $1 AND status = 'sent' AND expires_at <= NOW()
         RETURNING id AS proposal_id, proposal_version",
    )
    .bind(assessment_id)
    .fetch_all(&mut **transaction)
    .await?;
    for row in expired {
        let proposal_id: String = row.get("proposal_id");
        let proposal_version: i64 = row.get("proposal_version");
        sqlx::query(
            "INSERT INTO owner_provider_initial_service_proposal_events (
                 id, proposal_id, actor_user_id, event_kind, proposal_version,
                 idempotency_key, event_data
             ) VALUES ($1, $2, 'system', 'expired', $3, $4, $5)
             ON CONFLICT (actor_user_id, idempotency_key) DO NOTHING",
        )
        .bind(format!(
            "owner_provider_proposal_event_{}",
            Uuid::new_v4().simple()
        ))
        .bind(&proposal_id)
        .bind(proposal_version)
        .bind(format!("proposal-expired-{proposal_id}"))
        .bind(serde_json::json!({ "status": "expired" }))
        .execute(&mut **transaction)
        .await?;
    }
    Ok(())
}

async fn publish_owner_provider_initial_service_proposal(
    pool: &PgPool,
    provider_actor_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
    assessment_id: &str,
    request: PublishOwnerProviderInitialServiceProposalRequest,
) -> Result<PersistedInitialServiceProposalWriteOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let Some((assessment, authority_active)) = load_provider_assessment_write_authority(
        &mut transaction,
        provider_actor_user_id,
        verified_email,
        verified_email_fingerprint,
        token_hash,
        assessment_id,
    )
    .await?
    else {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalWriteOutcome::NotFound);
    };

    let replay_query = format!(
        "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT}
         WHERE provider_actor_user_id = $1 AND idempotency_key = $2"
    );
    if let Some(row) = sqlx::query(&replay_query)
        .bind(provider_actor_user_id)
        .bind(request.idempotency_key.trim())
        .fetch_optional(&mut *transaction)
        .await?
    {
        let proposal = owner_provider_initial_service_proposal_from_row(&row);
        let exact = initial_service_proposal_matches_request(&proposal, assessment_id, &request);
        transaction.commit().await?;
        return Ok(if exact {
            PersistedInitialServiceProposalWriteOutcome::Replayed(proposal)
        } else {
            PersistedInitialServiceProposalWriteOutcome::Conflict
        });
    }

    if !authority_active || assessment.status != "completed" {
        transaction.commit().await?;
        return Ok(PersistedInitialServiceProposalWriteOutcome::InvalidState);
    }
    let now = sqlx::query_scalar::<_, i64>("SELECT EXTRACT(EPOCH FROM NOW())::BIGINT")
        .fetch_one(&mut *transaction)
        .await?;
    if request.expires_at_epoch_seconds < now + 60 * 60
        || request.expires_at_epoch_seconds > now + 30 * 24 * 60 * 60
    {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalWriteOutcome::Conflict);
    }
    expire_owner_provider_initial_service_proposals(&mut transaction, assessment_id).await?;
    let accepted_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
             SELECT 1 FROM owner_provider_initial_service_proposals
             WHERE assessment_id = $1 AND status = 'accepted'
         )",
    )
    .bind(assessment_id)
    .fetch_one(&mut *transaction)
    .await?;
    if accepted_exists {
        transaction.commit().await?;
        return Ok(PersistedInitialServiceProposalWriteOutcome::InvalidState);
    }
    let latest_version = sqlx::query_scalar::<_, Option<i64>>(
        "SELECT MAX(proposal_version)
         FROM owner_provider_initial_service_proposals WHERE assessment_id = $1",
    )
    .bind(assessment_id)
    .fetch_one(&mut *transaction)
    .await?
    .unwrap_or(0);
    if latest_version != request.expected_proposal_version {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalWriteOutcome::Conflict);
    }
    if latest_version > 0 {
        let superseded = sqlx::query(
            "UPDATE owner_provider_initial_service_proposals
             SET status = 'superseded', updated_at = NOW()
             WHERE assessment_id = $1 AND status = 'sent'
             RETURNING id, proposal_version",
        )
        .bind(assessment_id)
        .fetch_optional(&mut *transaction)
        .await?;
        if let Some(superseded) = superseded {
            sqlx::query(
                "INSERT INTO owner_provider_initial_service_proposal_events (
                     id, proposal_id, actor_user_id, event_kind, proposal_version,
                     idempotency_key, event_data
                 ) VALUES ($1, $2, $3, 'superseded', $4, $5, $6)",
            )
            .bind(format!(
                "owner_provider_proposal_event_{}",
                Uuid::new_v4().simple()
            ))
            .bind(superseded.get::<String, _>("id"))
            .bind(provider_actor_user_id)
            .bind(superseded.get::<i64, _>("proposal_version"))
            .bind(format!("{}-superseded", request.idempotency_key.trim()))
            .bind(serde_json::json!({ "status": "superseded" }))
            .execute(&mut *transaction)
            .await?;
        }
    }

    let proposal_id = format!("owner_provider_proposal_{}", Uuid::new_v4().simple());
    let proposal_version = latest_version + 1;
    let owner_user_id = sqlx::query_scalar::<_, String>(
        "SELECT owner_user_id FROM owner_provider_assessments WHERE id = $1",
    )
    .bind(assessment_id)
    .fetch_one(&mut *transaction)
    .await?;
    let included_scope = normalized_proposal_items(&request.included_scope);
    let exclusions = normalized_proposal_items(&request.exclusions);
    let annualized = annualized_monthly_minor(
        request.price_amount_minor,
        &request.price_basis,
        &request.cadence_code,
    );
    sqlx::query(
        "INSERT INTO owner_provider_initial_service_proposals (
             id, owner_user_id, property_id, invitation_id, organization_id,
             disclosure_grant_id, assessment_id, provider_actor_user_id,
             proposal_version, status, title, customer_summary, included_scope,
             exclusions, cadence_code, cadence_detail, arrival_policy,
             weather_policy, cancellation_policy, proof_expectation,
             price_amount_minor, price_basis, currency_code,
             annualized_monthly_minor, revision_note, expires_at, idempotency_key
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, 'sent', $10, $11, $12,
             $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
             TO_TIMESTAMP($25::DOUBLE PRECISION), $26
         )",
    )
    .bind(&proposal_id)
    .bind(&owner_user_id)
    .bind(&assessment.property_id)
    .bind(&assessment.invitation_id)
    .bind(&assessment.organization_id)
    .bind(&assessment.disclosure_grant_id)
    .bind(assessment_id)
    .bind(provider_actor_user_id)
    .bind(proposal_version)
    .bind(request.title.trim())
    .bind(request.customer_summary.trim())
    .bind(&included_scope)
    .bind(&exclusions)
    .bind(&request.cadence_code)
    .bind(request.cadence_detail.trim())
    .bind(request.arrival_policy.trim())
    .bind(request.weather_policy.trim())
    .bind(request.cancellation_policy.trim())
    .bind(request.proof_expectation.trim())
    .bind(request.price_amount_minor)
    .bind(&request.price_basis)
    .bind(&request.currency_code)
    .bind(annualized)
    .bind(request.revision_note.as_deref().map(str::trim))
    .bind(request.expires_at_epoch_seconds)
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_initial_service_proposal_events (
             id, proposal_id, actor_user_id, event_kind, proposal_version,
             idempotency_key, event_data
         ) VALUES ($1, $2, $3, 'sent', $4, $5, $6)",
    )
    .bind(format!(
        "owner_provider_proposal_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(&proposal_id)
    .bind(provider_actor_user_id)
    .bind(proposal_version)
    .bind(request.idempotency_key.trim())
    .bind(serde_json::json!({
        "status": "sent",
        "price_basis": request.price_basis,
        "currency_code": request.currency_code,
    }))
    .execute(&mut *transaction)
    .await?;
    let proposal_query = format!("{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT} WHERE id = $1");
    let row = sqlx::query(&proposal_query)
        .bind(&proposal_id)
        .fetch_one(&mut *transaction)
        .await?;
    transaction.commit().await?;
    Ok(PersistedInitialServiceProposalWriteOutcome::Published(
        owner_provider_initial_service_proposal_from_row(&row),
    ))
}

async fn list_owner_provider_initial_service_proposals(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
) -> Result<Option<Vec<OwnerProviderInitialServiceProposalRecord>>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let property_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
             SELECT 1 FROM owner_properties WHERE id = $1 AND owner_user_id = $2
         )",
    )
    .bind(property_id)
    .bind(owner_user_id)
    .fetch_one(&mut *transaction)
    .await?;
    if !property_exists {
        transaction.rollback().await?;
        return Ok(None);
    }
    let assessment_ids = sqlx::query_scalar::<_, String>(
        "SELECT DISTINCT assessment_id
         FROM owner_provider_initial_service_proposals
         WHERE owner_user_id = $1 AND property_id = $2",
    )
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_all(&mut *transaction)
    .await?;
    for assessment_id in assessment_ids {
        expire_owner_provider_initial_service_proposals(&mut transaction, &assessment_id).await?;
    }
    let query = format!(
        "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT}
         WHERE owner_user_id = $1 AND property_id = $2
         ORDER BY assessment_id, proposal_version DESC"
    );
    let rows = sqlx::query(&query)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_all(&mut *transaction)
        .await?;
    transaction.commit().await?;
    Ok(Some(
        rows.iter()
            .map(owner_provider_initial_service_proposal_from_row)
            .collect(),
    ))
}

async fn get_owner_provider_initial_service_proposal(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    proposal_id: &str,
) -> Result<Option<OwnerProviderInitialServiceProposalRecord>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let query = format!(
        "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT}
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3"
    );
    let proposal = sqlx::query(&query)
        .bind(proposal_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(proposal) = proposal else {
        transaction.rollback().await?;
        return Ok(None);
    };
    let assessment_id: String = proposal.get("assessment_id");
    expire_owner_provider_initial_service_proposals(&mut transaction, &assessment_id).await?;
    let proposal = sqlx::query(&query)
        .bind(proposal_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_one(&mut *transaction)
        .await?;
    transaction.commit().await?;
    Ok(Some(owner_provider_initial_service_proposal_from_row(
        &proposal,
    )))
}

async fn list_owner_provider_initial_service_proposal_messages(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    proposal_id: &str,
) -> Result<Option<Vec<OwnerProviderInitialServiceProposalMessageRecord>>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let proposal_query = format!(
        "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT}
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3"
    );
    let proposal = sqlx::query(&proposal_query)
        .bind(proposal_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(proposal) = proposal else {
        transaction.rollback().await?;
        return Ok(None);
    };
    let assessment_id: String = proposal.get("assessment_id");
    expire_owner_provider_initial_service_proposals(&mut transaction, &assessment_id).await?;
    let messages_query = format!(
        "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_MESSAGE_SELECT}
         WHERE assessment_id = $1 ORDER BY created_at, id"
    );
    let rows = sqlx::query(&messages_query)
        .bind(&assessment_id)
        .fetch_all(&mut *transaction)
        .await?;
    transaction.commit().await?;
    Ok(Some(
        rows.iter()
            .map(owner_provider_initial_service_proposal_message_from_row)
            .collect(),
    ))
}

async fn create_owner_initial_service_proposal_message(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    proposal_id: &str,
    request: CreateOwnerInitialServiceProposalMessageRequest,
) -> Result<PersistedInitialServiceProposalMessageWriteOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let proposal_query = format!(
        "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT}
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3 FOR UPDATE"
    );
    let proposal = sqlx::query(&proposal_query)
        .bind(proposal_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(proposal) = proposal else {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalMessageWriteOutcome::NotFound);
    };
    let assessment_id: String = proposal.get("assessment_id");
    expire_owner_provider_initial_service_proposals(&mut transaction, &assessment_id).await?;
    let refreshed_query = format!("{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT} WHERE id = $1");
    let proposal = owner_provider_initial_service_proposal_from_row(
        &sqlx::query(&refreshed_query)
            .bind(proposal_id)
            .fetch_one(&mut *transaction)
            .await?,
    );

    let replay_query = format!(
        "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_MESSAGE_SELECT}
         WHERE author_user_id = $1 AND idempotency_key = $2"
    );
    let replay = sqlx::query(&replay_query)
        .bind(owner_user_id)
        .bind(request.idempotency_key.trim())
        .fetch_optional(&mut *transaction)
        .await?;
    if let Some(replay) = replay {
        let record = owner_provider_initial_service_proposal_message_from_row(&replay);
        let exact = record.proposal_id == proposal_id
            && record.assessment_id == proposal.assessment_id
            && record.author_role == "owner"
            && record.message_kind == request.message_kind
            && record.customer_safe_body == request.customer_safe_body.trim()
            && record.proposal_version_snapshot == request.expected_proposal_version
            && record.series_version_snapshot == request.expected_proposal_version
            && record.in_reply_to_message_id.is_none()
            && record.related_proposal_id.is_none();
        transaction.commit().await?;
        return Ok(if exact {
            PersistedInitialServiceProposalMessageWriteOutcome::Replayed(record)
        } else {
            PersistedInitialServiceProposalMessageWriteOutcome::Conflict
        });
    }
    if proposal.status == "expired" {
        transaction.commit().await?;
        return Ok(PersistedInitialServiceProposalMessageWriteOutcome::InvalidState(proposal));
    }
    if proposal.status != "sent" || proposal.proposal_version != request.expected_proposal_version {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalMessageWriteOutcome::Conflict);
    }
    let latest_version = sqlx::query_scalar::<_, Option<i64>>(
        "SELECT MAX(proposal_version)
         FROM owner_provider_initial_service_proposals WHERE assessment_id = $1",
    )
    .bind(&proposal.assessment_id)
    .fetch_one(&mut *transaction)
    .await?
    .unwrap_or(0);
    if latest_version != proposal.proposal_version {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalMessageWriteOutcome::Conflict);
    }

    let message_id = format!(
        "owner_provider_proposal_message_{}",
        Uuid::new_v4().simple()
    );
    sqlx::query(
        "INSERT INTO owner_provider_initial_service_proposal_messages (
             id, proposal_id, assessment_id, owner_user_id, property_id,
             invitation_id, organization_id, author_user_id, author_role,
             message_kind, customer_safe_body, proposal_version_snapshot,
             series_version_snapshot, idempotency_key
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $4, 'owner', $8, $9, $10, $10, $11
         )",
    )
    .bind(&message_id)
    .bind(&proposal.proposal_id)
    .bind(&proposal.assessment_id)
    .bind(owner_user_id)
    .bind(&proposal.property_id)
    .bind(&proposal.invitation_id)
    .bind(&proposal.organization_id)
    .bind(&request.message_kind)
    .bind(request.customer_safe_body.trim())
    .bind(proposal.proposal_version)
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    let message_query =
        format!("{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_MESSAGE_SELECT} WHERE id = $1");
    let message = sqlx::query(&message_query)
        .bind(&message_id)
        .fetch_one(&mut *transaction)
        .await?;
    transaction.commit().await?;
    Ok(PersistedInitialServiceProposalMessageWriteOutcome::Created(
        owner_provider_initial_service_proposal_message_from_row(&message),
    ))
}

async fn create_provider_initial_service_proposal_response(
    pool: &PgPool,
    provider_actor_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
    assessment_id: &str,
    request: CreateProviderInitialServiceProposalResponseRequest,
) -> Result<PersistedInitialServiceProposalMessageWriteOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let Some((assessment, authority_active)) = load_provider_assessment_write_authority(
        &mut transaction,
        provider_actor_user_id,
        verified_email,
        verified_email_fingerprint,
        token_hash,
        assessment_id,
    )
    .await?
    else {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalMessageWriteOutcome::NotFound);
    };
    expire_owner_provider_initial_service_proposals(&mut transaction, assessment_id).await?;
    let current_query = format!(
        "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT}
         WHERE assessment_id = $1 ORDER BY proposal_version DESC LIMIT 1 FOR UPDATE"
    );
    let current = sqlx::query(&current_query)
        .bind(assessment_id)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalMessageWriteOutcome::NotFound);
    };
    let current = owner_provider_initial_service_proposal_from_row(&current);

    let replay_query = format!(
        "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_MESSAGE_SELECT}
         WHERE author_user_id = $1 AND idempotency_key = $2"
    );
    let replay = sqlx::query(&replay_query)
        .bind(provider_actor_user_id)
        .bind(request.idempotency_key.trim())
        .fetch_optional(&mut *transaction)
        .await?;
    if let Some(replay) = replay {
        let record = owner_provider_initial_service_proposal_message_from_row(&replay);
        let exact = record.assessment_id == assessment_id
            && record.author_role == "provider"
            && record.message_kind == "provider_response"
            && record.customer_safe_body == request.customer_safe_body.trim()
            && record.series_version_snapshot == request.expected_proposal_version
            && record.in_reply_to_message_id.as_deref()
                == Some(request.in_reply_to_message_id.trim())
            && record.related_proposal_id.as_deref()
                == request.related_proposal_id.as_deref().map(str::trim);
        transaction.commit().await?;
        return Ok(if exact {
            PersistedInitialServiceProposalMessageWriteOutcome::Replayed(record)
        } else {
            PersistedInitialServiceProposalMessageWriteOutcome::Conflict
        });
    }
    if !authority_active || assessment.status != "completed" || current.status != "sent" {
        transaction.commit().await?;
        return Ok(PersistedInitialServiceProposalMessageWriteOutcome::InvalidState(current));
    }
    if current.proposal_version != request.expected_proposal_version {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalMessageWriteOutcome::Conflict);
    }

    let reply_query = format!(
        "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_MESSAGE_SELECT}
         WHERE id = $1 AND assessment_id = $2"
    );
    let reply = sqlx::query(&reply_query)
        .bind(request.in_reply_to_message_id.trim())
        .bind(assessment_id)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(reply) = reply else {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalMessageWriteOutcome::Conflict);
    };
    let reply = owner_provider_initial_service_proposal_message_from_row(&reply);
    if reply.author_role != "owner"
        || !matches!(
            reply.message_kind.as_str(),
            "owner_question" | "owner_change_request"
        )
    {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalMessageWriteOutcome::Conflict);
    }
    let expected_related_proposal_id =
        (reply.proposal_id != current.proposal_id).then_some(current.proposal_id.as_str());
    if request.related_proposal_id.as_deref().map(str::trim) != expected_related_proposal_id {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalMessageWriteOutcome::Conflict);
    }

    let message_id = format!(
        "owner_provider_proposal_message_{}",
        Uuid::new_v4().simple()
    );
    let owner_user_id = sqlx::query_scalar::<_, String>(
        "SELECT owner_user_id FROM owner_provider_assessments WHERE id = $1",
    )
    .bind(assessment_id)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_initial_service_proposal_messages (
             id, proposal_id, assessment_id, owner_user_id, property_id,
             invitation_id, organization_id, author_user_id, author_role,
             message_kind, customer_safe_body, proposal_version_snapshot,
             series_version_snapshot, in_reply_to_message_id,
             related_proposal_id, idempotency_key
         ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, 'provider',
             'provider_response', $9, $10, $11, $12, $13, $14
         )",
    )
    .bind(&message_id)
    .bind(&reply.proposal_id)
    .bind(&current.assessment_id)
    .bind(&owner_user_id)
    .bind(&current.property_id)
    .bind(&current.invitation_id)
    .bind(&current.organization_id)
    .bind(provider_actor_user_id)
    .bind(request.customer_safe_body.trim())
    .bind(reply.proposal_version_snapshot)
    .bind(current.proposal_version)
    .bind(&reply.message_id)
    .bind(request.related_proposal_id.as_deref().map(str::trim))
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    let message_query =
        format!("{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_MESSAGE_SELECT} WHERE id = $1");
    let message = sqlx::query(&message_query)
        .bind(&message_id)
        .fetch_one(&mut *transaction)
        .await?;
    transaction.commit().await?;
    Ok(PersistedInitialServiceProposalMessageWriteOutcome::Created(
        owner_provider_initial_service_proposal_message_from_row(&message),
    ))
}

fn owner_provider_initial_service_proposal_decision_from_row(
    row: &sqlx::postgres::PgRow,
) -> OwnerProviderInitialServiceProposalDecisionRecord {
    OwnerProviderInitialServiceProposalDecisionRecord {
        decision_id: row.get("decision_id"),
        proposal_id: row.get("proposal_id"),
        action: row.get("action"),
        reason_code: row.get("reason_code"),
        customer_safe_note: row.get("customer_safe_note"),
        proposal_version: row.get("proposal_version"),
        affirmation_text_version: row.get("affirmation_text_version"),
        decided_at_epoch_seconds: row.get("decided_at_epoch_seconds"),
        acceptance_snapshot_id: row.get("acceptance_snapshot_id"),
        acceptance_snapshot_sha256: row.get("acceptance_snapshot_sha256"),
        persisted: true,
    }
}

async fn decide_owner_provider_initial_service_proposal(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    proposal_id: &str,
    request: DecideOwnerProviderInitialServiceProposalRequest,
) -> Result<PersistedInitialServiceProposalDecisionOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let query = format!(
        "{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT}
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3 FOR UPDATE"
    );
    let row = sqlx::query(&query)
        .bind(proposal_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(row) = row else {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalDecisionOutcome::NotFound);
    };
    let mut proposal = owner_provider_initial_service_proposal_from_row(&row);
    expire_owner_provider_initial_service_proposals(&mut transaction, &proposal.assessment_id)
        .await?;
    let refreshed_query = format!("{OWNER_PROVIDER_INITIAL_SERVICE_PROPOSAL_SELECT} WHERE id = $1");
    proposal = owner_provider_initial_service_proposal_from_row(
        &sqlx::query(&refreshed_query)
            .bind(proposal_id)
            .fetch_one(&mut *transaction)
            .await?,
    );

    let replay = sqlx::query(
        "SELECT decision.id AS decision_id, decision.proposal_id, decision.action,
                decision.reason_code, decision.customer_safe_note,
                decision.proposal_version, decision.affirmation_text_version,
                EXTRACT(EPOCH FROM decision.decided_at)::BIGINT AS decided_at_epoch_seconds,
                snapshot.id AS acceptance_snapshot_id,
                snapshot.snapshot_sha256 AS acceptance_snapshot_sha256
         FROM owner_provider_initial_service_proposal_decisions decision
         LEFT JOIN owner_provider_initial_service_proposal_acceptance_snapshots snapshot
           ON snapshot.decision_id = decision.id
         WHERE decision.owner_user_id = $1 AND decision.idempotency_key = $2",
    )
    .bind(owner_user_id)
    .bind(request.idempotency_key.trim())
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(replay) = replay {
        let decision = owner_provider_initial_service_proposal_decision_from_row(&replay);
        let exact = decision.proposal_id == proposal_id
            && decision.action == request.action
            && decision.reason_code.as_deref() == request.reason_code.as_deref()
            && decision.customer_safe_note.as_deref()
                == request.customer_safe_note.as_deref().map(str::trim)
            && decision.proposal_version == request.expected_proposal_version
            && decision.affirmation_text_version.as_deref()
                == request.affirmation_text_version.as_deref();
        transaction.commit().await?;
        return Ok(if exact {
            PersistedInitialServiceProposalDecisionOutcome::Replayed(decision)
        } else {
            PersistedInitialServiceProposalDecisionOutcome::Conflict
        });
    }
    if proposal.status == "expired" {
        transaction.commit().await?;
        return Ok(PersistedInitialServiceProposalDecisionOutcome::InvalidState(proposal));
    }
    if proposal.status != "sent" {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalDecisionOutcome::Conflict);
    }
    if proposal.proposal_version != request.expected_proposal_version {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalDecisionOutcome::Conflict);
    }
    let latest_version = sqlx::query_scalar::<_, Option<i64>>(
        "SELECT MAX(proposal_version)
         FROM owner_provider_initial_service_proposals WHERE assessment_id = $1",
    )
    .bind(&proposal.assessment_id)
    .fetch_one(&mut *transaction)
    .await?
    .unwrap_or(0);
    if latest_version != proposal.proposal_version {
        transaction.rollback().await?;
        return Ok(PersistedInitialServiceProposalDecisionOutcome::Conflict);
    }

    let decision_id = format!(
        "owner_provider_proposal_decision_{}",
        Uuid::new_v4().simple()
    );
    sqlx::query(
        "INSERT INTO owner_provider_initial_service_proposal_decisions (
             id, proposal_id, owner_user_id, action, reason_code,
             customer_safe_note, proposal_version, affirmation_text_version,
             idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    )
    .bind(&decision_id)
    .bind(proposal_id)
    .bind(owner_user_id)
    .bind(&request.action)
    .bind(request.reason_code.as_deref())
    .bind(request.customer_safe_note.as_deref().map(str::trim))
    .bind(request.expected_proposal_version)
    .bind(request.affirmation_text_version.as_deref())
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;

    let next_status = if request.action == "accept" {
        "accepted"
    } else {
        "declined"
    };
    sqlx::query(
        "UPDATE owner_provider_initial_service_proposals
         SET status = $2, updated_at = NOW() WHERE id = $1",
    )
    .bind(proposal_id)
    .bind(next_status)
    .execute(&mut *transaction)
    .await?;

    if request.action == "accept" {
        let snapshot = serde_json::json!({
            "proposal_id": proposal.proposal_id,
            "proposal_version": proposal.proposal_version,
            "assessment_id": proposal.assessment_id,
            "property_id": proposal.property_id,
            "organization_id": proposal.organization_id,
            "title": proposal.title,
            "customer_summary": proposal.customer_summary,
            "included_scope": proposal.included_scope,
            "exclusions": proposal.exclusions,
            "cadence_code": proposal.cadence_code,
            "cadence_detail": proposal.cadence_detail,
            "arrival_policy": proposal.arrival_policy,
            "weather_policy": proposal.weather_policy,
            "cancellation_policy": proposal.cancellation_policy,
            "proof_expectation": proposal.proof_expectation,
            "price_amount_minor": proposal.price_amount_minor,
            "price_basis": proposal.price_basis,
            "currency_code": proposal.currency_code,
            "annualized_monthly_minor": proposal.annualized_monthly_minor,
            "issued_at_epoch_seconds": proposal.issued_at_epoch_seconds,
            "expires_at_epoch_seconds": proposal.expires_at_epoch_seconds,
            "affirmation_text": OWNER_PROVIDER_PROPOSAL_ACCEPTANCE_TEXT,
            "affirmation_text_version": OWNER_PROVIDER_PROPOSAL_ACCEPTANCE_TEXT_VERSION,
        });
        let snapshot_sha256 = format!("{:x}", Sha256::digest(snapshot.to_string().as_bytes()));
        sqlx::query(
            "INSERT INTO owner_provider_initial_service_proposal_acceptance_snapshots (
                 id, proposal_id, decision_id, owner_user_id, property_id,
                 organization_id, assessment_id, proposal_version, snapshot,
                 snapshot_sha256
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        )
        .bind(format!(
            "owner_provider_proposal_snapshot_{}",
            Uuid::new_v4().simple()
        ))
        .bind(proposal_id)
        .bind(&decision_id)
        .bind(owner_user_id)
        .bind(property_id)
        .bind(&proposal.organization_id)
        .bind(&proposal.assessment_id)
        .bind(proposal.proposal_version)
        .bind(snapshot)
        .bind(snapshot_sha256)
        .execute(&mut *transaction)
        .await?;
    }
    sqlx::query(
        "INSERT INTO owner_provider_initial_service_proposal_events (
             id, proposal_id, actor_user_id, event_kind, proposal_version,
             idempotency_key, event_data
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(format!(
        "owner_provider_proposal_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(proposal_id)
    .bind(owner_user_id)
    .bind(next_status)
    .bind(proposal.proposal_version)
    .bind(request.idempotency_key.trim())
    .bind(serde_json::json!({ "status": next_status }))
    .execute(&mut *transaction)
    .await?;

    let decision = sqlx::query(
        "SELECT decision.id AS decision_id, decision.proposal_id, decision.action,
                decision.reason_code, decision.customer_safe_note,
                decision.proposal_version, decision.affirmation_text_version,
                EXTRACT(EPOCH FROM decision.decided_at)::BIGINT AS decided_at_epoch_seconds,
                snapshot.id AS acceptance_snapshot_id,
                snapshot.snapshot_sha256 AS acceptance_snapshot_sha256
         FROM owner_provider_initial_service_proposal_decisions decision
         LEFT JOIN owner_provider_initial_service_proposal_acceptance_snapshots snapshot
           ON snapshot.decision_id = decision.id
         WHERE decision.id = $1",
    )
    .bind(&decision_id)
    .fetch_one(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(PersistedInitialServiceProposalDecisionOutcome::Decided(
        owner_provider_initial_service_proposal_decision_from_row(&decision),
    ))
}

fn owner_provider_relationship_activation_from_row(
    row: &sqlx::postgres::PgRow,
) -> OwnerProviderRelationshipActivationRecord {
    OwnerProviderRelationshipActivationRecord {
        activation_id: row.get("activation_id"),
        owner_property_id: row.get("owner_property_id"),
        invitation_id: row.get("invitation_id"),
        organization_id: row.get("organization_id"),
        proposal_id: row.get("proposal_id"),
        proposal_version: row.get("proposal_version"),
        acceptance_snapshot_id: row.get("acceptance_snapshot_id"),
        acceptance_snapshot_sha256: row.get("acceptance_snapshot_sha256"),
        customer_account_id: row.get("customer_account_id"),
        customer_property_id: row.get("customer_property_id"),
        owner_membership_id: row.get("owner_membership_id"),
        portal_access_id: row.get("portal_access_id"),
        status: "provider_setup".to_string(),
        closed_competing_invitation_count: row.get("closed_competing_invitation_count"),
        activated_at_epoch_seconds: row.get("activated_at_epoch_seconds"),
        persisted: true,
    }
}

const OWNER_PROVIDER_RELATIONSHIP_ACTIVATION_SELECT: &str =
    "SELECT activation.id AS activation_id, activation.owner_property_id,
            activation.invitation_id, activation.organization_id,
            activation.proposal_id, activation.proposal_version,
            activation.acceptance_snapshot_id,
            activation.acceptance_snapshot_sha256,
            activation.customer_account_id, activation.customer_property_id,
            activation.owner_membership_id, portal_access.id AS portal_access_id,
            EXTRACT(EPOCH FROM activation.activated_at)::BIGINT AS activated_at_epoch_seconds,
            (SELECT COUNT(*) FROM owner_provider_relationship_activation_events event
             WHERE event.activation_id = activation.id
               AND event.event_kind = 'competing_invitation_closed')::BIGINT
                AS closed_competing_invitation_count,
            activation.activation_affirmation_text_version,
            activation.owner_confirmed, activation.idempotency_key
     FROM owner_provider_relationship_activations activation
     JOIN customer_portal_access_grants portal_access
       ON portal_access.activation_id = activation.id";

fn formatted_owner_service_address(row: &sqlx::postgres::PgRow) -> String {
    let mut lines = vec![row.get::<String, _>("address_line_1")];
    let address_line_2: String = row.get("address_line_2");
    if !address_line_2.trim().is_empty() {
        lines.push(address_line_2);
    }
    lines.push(format!(
        "{}, {} {}",
        row.get::<String, _>("city"),
        row.get::<String, _>("region"),
        row.get::<String, _>("postal_code")
    ));
    let country_code: String = row.get("country_code");
    if country_code != "US" {
        lines.push(country_code);
    }
    lines.join(", ")
}

async fn activate_owner_provider_relationship(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    proposal_id: &str,
    request: ActivateOwnerProviderRelationshipRequest,
) -> Result<PersistedRelationshipActivationOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;

    sqlx::query("SELECT pg_advisory_xact_lock(hashtext($1))")
        .bind(format!("owner-provider-activation:{property_id}"))
        .execute(&mut *transaction)
        .await?;

    let replay_query = format!(
        "{OWNER_PROVIDER_RELATIONSHIP_ACTIVATION_SELECT}
         WHERE activation.owner_user_id = $1 AND activation.idempotency_key = $2"
    );
    let replay = sqlx::query(&replay_query)
        .bind(owner_user_id)
        .bind(request.idempotency_key.trim())
        .fetch_optional(&mut *transaction)
        .await?;
    if let Some(replay) = replay {
        let record = owner_provider_relationship_activation_from_row(&replay);
        let exact = record.owner_property_id == property_id
            && record.proposal_id == proposal_id
            && record.proposal_version == request.expected_proposal_version
            && replay.get::<String, _>("activation_affirmation_text_version")
                == request.activation_affirmation_text_version.trim()
            && replay.get::<bool, _>("owner_confirmed") == request.owner_confirmed;
        transaction.commit().await?;
        return Ok(if exact {
            PersistedRelationshipActivationOutcome::Replayed(record)
        } else {
            PersistedRelationshipActivationOutcome::Conflict
        });
    }

    let eligibility = sqlx::query(
        "SELECT proposal.id AS proposal_id, proposal.proposal_version,
                proposal.status AS proposal_status, proposal.invitation_id,
                proposal.assessment_id, proposal.organization_id,
                decision.id AS decision_id, decision.action AS decision_action,
                decision.owner_user_id AS decision_owner_user_id,
                decision.proposal_version AS decision_proposal_version,
                accepted.id AS acceptance_snapshot_id,
                accepted.owner_user_id AS snapshot_owner_user_id,
                accepted.property_id AS snapshot_property_id,
                accepted.organization_id AS snapshot_organization_id,
                accepted.assessment_id AS snapshot_assessment_id,
                accepted.proposal_version AS snapshot_proposal_version,
                accepted.snapshot AS accepted_snapshot_json,
                accepted.snapshot_sha256 AS acceptance_snapshot_sha256,
                property.display_name AS property_display_name,
                property.address_line_1, property.address_line_2, property.city,
                property.region, property.postal_code, property.country_code,
                property.address_status, property.status AS property_status,
                workspace.display_name AS owner_display_name,
                workspace.verified_email AS owner_verified_email,
                workspace.status AS workspace_status,
                organization.status AS organization_status,
                organization.organization_type,
                invitation.owner_user_id AS invitation_owner_user_id,
                invitation.property_id AS invitation_property_id,
                invitation.status AS invitation_status
         FROM owner_provider_initial_service_proposals proposal
         JOIN owner_provider_initial_service_proposal_decisions decision
           ON decision.proposal_id = proposal.id
         JOIN owner_provider_initial_service_proposal_acceptance_snapshots accepted
           ON accepted.proposal_id = proposal.id AND accepted.decision_id = decision.id
         JOIN owner_properties property
           ON property.id = proposal.property_id
          AND property.owner_user_id = proposal.owner_user_id
         JOIN owner_workspaces workspace
           ON workspace.owner_user_id = proposal.owner_user_id
         JOIN organizations organization ON organization.id = proposal.organization_id
         JOIN owner_provider_invitations invitation
           ON invitation.id = proposal.invitation_id
         WHERE proposal.id = $1 AND proposal.owner_user_id = $2
           AND proposal.property_id = $3
         FOR UPDATE OF proposal, decision, accepted, property, workspace, organization, invitation",
    )
    .bind(proposal_id)
    .bind(owner_user_id)
    .bind(property_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(eligibility) = eligibility else {
        transaction.rollback().await?;
        return Ok(PersistedRelationshipActivationOutcome::NotFound);
    };

    let accepted_snapshot: serde_json::Value = eligibility.get("accepted_snapshot_json");
    let stored_snapshot_sha256: String = eligibility.get("acceptance_snapshot_sha256");
    let expected_organization_id: String = eligibility.get("organization_id");
    let calculated_snapshot_sha256 = format!(
        "{:x}",
        Sha256::digest(accepted_snapshot.to_string().as_bytes())
    );
    let snapshot_matches = calculated_snapshot_sha256 == stored_snapshot_sha256
        && accepted_snapshot
            .get("proposal_id")
            .and_then(|value| value.as_str())
            == Some(proposal_id)
        && accepted_snapshot
            .get("property_id")
            .and_then(|value| value.as_str())
            == Some(property_id)
        && accepted_snapshot
            .get("organization_id")
            .and_then(|value| value.as_str())
            == Some(expected_organization_id.as_str())
        && accepted_snapshot
            .get("proposal_version")
            .and_then(|value| value.as_i64())
            == Some(request.expected_proposal_version);
    let eligible = eligibility.get::<String, _>("proposal_status") == "accepted"
        && eligibility.get::<String, _>("decision_action") == "accept"
        && eligibility.get::<String, _>("decision_owner_user_id") == owner_user_id
        && eligibility.get::<i64, _>("proposal_version") == request.expected_proposal_version
        && eligibility.get::<i64, _>("decision_proposal_version")
            == request.expected_proposal_version
        && eligibility.get::<i64, _>("snapshot_proposal_version")
            == request.expected_proposal_version
        && eligibility.get::<String, _>("snapshot_owner_user_id") == owner_user_id
        && eligibility.get::<String, _>("snapshot_property_id") == property_id
        && eligibility.get::<String, _>("snapshot_organization_id") == expected_organization_id
        && eligibility.get::<String, _>("snapshot_assessment_id")
            == eligibility.get::<String, _>("assessment_id")
        && eligibility.get::<String, _>("workspace_status") == "active"
        && eligibility.get::<String, _>("property_status") != "archived"
        && eligibility.get::<String, _>("address_status") == "owner_confirmed"
        && eligibility.get::<String, _>("organization_status") == "active"
        && eligibility.get::<String, _>("organization_type") == "yard_care_company"
        && eligibility.get::<String, _>("invitation_owner_user_id") == owner_user_id
        && eligibility.get::<String, _>("invitation_property_id") == property_id
        && eligibility.get::<String, _>("invitation_status") == "opened"
        && snapshot_matches;
    if !eligible {
        transaction.rollback().await?;
        return Ok(PersistedRelationshipActivationOutcome::InvalidState);
    }

    let already_active = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_provider_active_relationships
             WHERE owner_property_id = $1 AND status = 'active'
         )",
    )
    .bind(property_id)
    .fetch_one(&mut *transaction)
    .await?;
    if already_active {
        transaction.rollback().await?;
        return Ok(PersistedRelationshipActivationOutcome::Conflict);
    }

    let activation_id = format!("owner_provider_activation_{}", Uuid::new_v4().simple());
    let customer_account_id = format!("acct_{}", Uuid::new_v4().simple());
    let customer_property_id = format!("property_{}", Uuid::new_v4().simple());
    let owner_membership_id = format!("membership_{}", Uuid::new_v4().simple());
    let portal_access_id = format!("portal_access_{}", Uuid::new_v4().simple());
    let organization_id = expected_organization_id;
    let invitation_id: String = eligibility.get("invitation_id");
    let owner_display_name: String = eligibility.get("owner_display_name");
    let owner_verified_email: String = eligibility.get("owner_verified_email");
    let property_display_name: String = eligibility.get("property_display_name");
    let service_address = formatted_owner_service_address(&eligibility);

    sqlx::query(
        "INSERT INTO customer_accounts (
             id, customer_name, billing_model, payment_status,
             service_approval_status, contracted_services_per_period,
             completed_services_this_period, billing_notes,
             primary_contact_name, contact_email, contact_phone,
             email_notifications_enabled, sms_notifications_enabled
         ) VALUES ($1, $2, 'manual_account', 'not_required', 'manager_review',
                   0, 0, NULL, $2, $3, NULL, TRUE, FALSE)",
    )
    .bind(&customer_account_id)
    .bind(&owner_display_name)
    .bind(&owner_verified_email)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO organization_customer_accounts (
             organization_id, account_id, relationship_type, status
         ) VALUES ($1, $2, 'owner', 'active')",
    )
    .bind(&organization_id)
    .bind(&customer_account_id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO customer_properties (
             id, organization_id, account_id, display_name, service_address, status
         ) VALUES ($1, $2, $3, $4, $5, 'onboarding')",
    )
    .bind(&customer_property_id)
    .bind(&organization_id)
    .bind(&customer_account_id)
    .bind(&property_display_name)
    .bind(&service_address)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO organization_memberships (
             id, organization_id, user_id, display_name, role, status,
             scope_type, scope_id
         ) VALUES ($1, $2, $3, $4, 'property_owner', 'active', 'property', $5)",
    )
    .bind(&owner_membership_id)
    .bind(&organization_id)
    .bind(owner_user_id)
    .bind(&owner_display_name)
    .bind(&customer_property_id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_relationship_activations (
             id, owner_user_id, owner_property_id, invitation_id,
             organization_id, assessment_id, proposal_id, proposal_decision_id,
             acceptance_snapshot_id, acceptance_snapshot_sha256,
             proposal_version, customer_account_id, customer_property_id,
             owner_membership_id, activation_affirmation_text_version,
             owner_confirmed, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                   $13, $14, $15, TRUE, $16)",
    )
    .bind(&activation_id)
    .bind(owner_user_id)
    .bind(property_id)
    .bind(&invitation_id)
    .bind(&organization_id)
    .bind(eligibility.get::<String, _>("assessment_id"))
    .bind(proposal_id)
    .bind(eligibility.get::<String, _>("decision_id"))
    .bind(eligibility.get::<String, _>("acceptance_snapshot_id"))
    .bind(&stored_snapshot_sha256)
    .bind(request.expected_proposal_version)
    .bind(&customer_account_id)
    .bind(&customer_property_id)
    .bind(&owner_membership_id)
    .bind(request.activation_affirmation_text_version.trim())
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO customer_portal_access_grants (
             id, activation_id, organization_id, account_id, property_id,
             user_id, access_role, status
         ) VALUES ($1, $2, $3, $4, $5, $6, 'property_owner', 'active')",
    )
    .bind(&portal_access_id)
    .bind(&activation_id)
    .bind(&organization_id)
    .bind(&customer_account_id)
    .bind(&customer_property_id)
    .bind(owner_user_id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_active_relationships (
             owner_property_id, activation_id, organization_id,
             customer_account_id, customer_property_id, status, activated_at
         ) VALUES ($1, $2, $3, $4, $5, 'active', NOW())",
    )
    .bind(property_id)
    .bind(&activation_id)
    .bind(&organization_id)
    .bind(&customer_account_id)
    .bind(&customer_property_id)
    .execute(&mut *transaction)
    .await?;

    let selected = sqlx::query(
        "UPDATE owner_provider_invitations
         SET status = 'activated', terminal_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND owner_user_id = $2 AND property_id = $3
           AND status = 'opened'",
    )
    .bind(&invitation_id)
    .bind(owner_user_id)
    .bind(property_id)
    .execute(&mut *transaction)
    .await?;
    if selected.rows_affected() != 1 {
        transaction.rollback().await?;
        return Ok(PersistedRelationshipActivationOutcome::InvalidState);
    }
    sqlx::query(
        "UPDATE owner_properties
         SET status = 'provider_setup', version = version + 1, updated_at = NOW()
         WHERE id = $1 AND owner_user_id = $2 AND status <> 'archived'",
    )
    .bind(property_id)
    .bind(owner_user_id)
    .execute(&mut *transaction)
    .await?;

    let competing_rows = sqlx::query(
        "UPDATE owner_provider_invitations
         SET status = 'revoked', terminal_at = NOW(), updated_at = NOW()
         WHERE owner_user_id = $1 AND property_id = $2 AND id <> $3
           AND status IN ('pending_delivery', 'delivered', 'opened')
         RETURNING id",
    )
    .bind(owner_user_id)
    .bind(property_id)
    .bind(&invitation_id)
    .fetch_all(&mut *transaction)
    .await?;
    for competing in &competing_rows {
        let competing_invitation_id: String = competing.get("id");
        sqlx::query(
            "UPDATE owner_provider_invitation_response_capabilities
             SET status = 'revoked', version = version + 1, updated_at = NOW()
             WHERE invitation_id = $1 AND status = 'active'",
        )
        .bind(&competing_invitation_id)
        .execute(&mut *transaction)
        .await?;
        let grants = sqlx::query(
            "UPDATE owner_provider_disclosure_grants
             SET status = 'revoked', version = version + 1, updated_at = NOW()
             WHERE invitation_id = $1 AND status = 'active'
             RETURNING id, receipt_id, version",
        )
        .bind(&competing_invitation_id)
        .fetch_all(&mut *transaction)
        .await?;
        for grant in grants {
            let grant_id: String = grant.get("id");
            sqlx::query(
                "INSERT INTO owner_provider_disclosure_grant_events (
                     id, grant_id, receipt_id, actor_user_id, event_kind,
                     reason_code, grant_version, idempotency_key
                 ) VALUES ($1, $2, $3, $4, 'revoked',
                           'competing_relationship_activated', $5, $6)",
            )
            .bind(format!(
                "owner_provider_grant_event_{}",
                Uuid::new_v4().simple()
            ))
            .bind(&grant_id)
            .bind(grant.get::<String, _>("receipt_id"))
            .bind(owner_user_id)
            .bind(grant.get::<i64, _>("version"))
            .bind(format!("activation:{activation_id}:grant:{grant_id}"))
            .execute(&mut *transaction)
            .await?;
        }
        sqlx::query(
            "INSERT INTO owner_provider_relationship_activation_events (
                 id, activation_id, actor_user_id, event_kind, target_id, event_data
             ) VALUES ($1, $2, $3, 'competing_invitation_closed', $4,
                       '{\"reason_code\":\"another_provider_activated\"}'::JSONB)",
        )
        .bind(format!(
            "owner_provider_activation_event_{}",
            Uuid::new_v4().simple()
        ))
        .bind(&activation_id)
        .bind(owner_user_id)
        .bind(&competing_invitation_id)
        .execute(&mut *transaction)
        .await?;
    }
    sqlx::query(
        "INSERT INTO owner_provider_relationship_activation_events (
             id, activation_id, actor_user_id, event_kind, target_id, event_data
         ) VALUES ($1, $2, $3, 'activated', $2,
                   '{\"status\":\"provider_setup\"}'::JSONB)",
    )
    .bind(format!(
        "owner_provider_activation_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(&activation_id)
    .bind(owner_user_id)
    .execute(&mut *transaction)
    .await?;

    let activation_query = format!(
        "{OWNER_PROVIDER_RELATIONSHIP_ACTIVATION_SELECT}
         WHERE activation.id = $1"
    );
    let activation = sqlx::query(&activation_query)
        .bind(&activation_id)
        .fetch_one(&mut *transaction)
        .await?;
    transaction.commit().await?;
    Ok(PersistedRelationshipActivationOutcome::Activated(
        owner_provider_relationship_activation_from_row(&activation),
    ))
}

const OWNER_PROVIDER_FIRST_VISIT_SELECT: &str = "SELECT activation.id AS activation_id,
            activation.owner_property_id, activation.invitation_id,
            activation.organization_id, organization.display_name AS organization_name,
            activation.customer_account_id, activation.customer_property_id,
            COALESCE(series.status, 'awaiting_provider') AS first_visit_status,
            COALESCE(series.current_version, 0) AS current_version,
            proposal.id AS first_visit_proposal_id,
            EXTRACT(EPOCH FROM proposal.window_start)::BIGINT AS window_start_epoch_seconds,
            EXTRACT(EPOCH FROM proposal.window_end)::BIGINT AS window_end_epoch_seconds,
            proposal.time_zone, proposal.customer_safe_arrival_note,
            proposal.provider_actor_user_id, proposal.verified_email_fingerprint,
            proposal.idempotency_key AS proposal_idempotency_key,
            EXTRACT(EPOCH FROM proposal.created_at)::BIGINT AS proposed_at_epoch_seconds,
            decision.action AS owner_decision,
            decision.customer_safe_note AS owner_customer_safe_note,
            decision.confirmation_affirmation_text_version,
            decision.idempotency_key AS decision_idempotency_key,
            EXTRACT(EPOCH FROM decision.decided_at)::BIGINT AS decided_at_epoch_seconds
     FROM owner_provider_relationship_activations activation
     JOIN organizations organization ON organization.id = activation.organization_id
     JOIN owner_provider_active_relationships relationship
       ON relationship.activation_id = activation.id
     LEFT JOIN owner_provider_first_visit_series series
       ON series.activation_id = activation.id
     LEFT JOIN owner_provider_first_visit_proposals proposal
       ON proposal.activation_id = activation.id
      AND proposal.proposal_version = series.current_version
     LEFT JOIN owner_provider_first_visit_decisions decision
       ON decision.proposal_id = proposal.id";

fn owner_provider_first_visit_from_row(
    row: &sqlx::postgres::PgRow,
) -> OwnerProviderFirstVisitRecord {
    OwnerProviderFirstVisitRecord {
        activation_id: row.get("activation_id"),
        owner_property_id: row.get("owner_property_id"),
        invitation_id: row.get("invitation_id"),
        organization_id: row.get("organization_id"),
        organization_name: row.get("organization_name"),
        customer_account_id: row.get("customer_account_id"),
        customer_property_id: row.get("customer_property_id"),
        status: row.get("first_visit_status"),
        current_version: row.get("current_version"),
        proposal_id: row.get("first_visit_proposal_id"),
        window_start_epoch_seconds: row.get("window_start_epoch_seconds"),
        window_end_epoch_seconds: row.get("window_end_epoch_seconds"),
        time_zone: row.get("time_zone"),
        customer_safe_arrival_note: row.get("customer_safe_arrival_note"),
        owner_decision: row.get("owner_decision"),
        owner_customer_safe_note: row.get("owner_customer_safe_note"),
        proposed_at_epoch_seconds: row.get("proposed_at_epoch_seconds"),
        decided_at_epoch_seconds: row.get("decided_at_epoch_seconds"),
        persisted: true,
    }
}

async fn get_owner_provider_first_visit(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    activation_id: &str,
) -> Result<Option<OwnerProviderFirstVisitRecord>, sqlx::Error> {
    let query = format!(
        "{OWNER_PROVIDER_FIRST_VISIT_SELECT}
         WHERE activation.id = $1 AND activation.owner_user_id = $2
           AND activation.owner_property_id = $3 AND relationship.status = 'active'"
    );
    Ok(sqlx::query(&query)
        .bind(activation_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(pool)
        .await?
        .map(|row| owner_provider_first_visit_from_row(&row)))
}

async fn get_provider_first_visit(
    pool: &PgPool,
    provider_actor_user_id: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
    activation_id: &str,
) -> Result<Option<OwnerProviderFirstVisitRecord>, sqlx::Error> {
    let query = format!(
        "{OWNER_PROVIDER_FIRST_VISIT_SELECT}
         JOIN owner_provider_invitations invitation
           ON invitation.id = activation.invitation_id
         JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.invitation_id = invitation.id
         JOIN owner_provider_invitation_organization_claims claim
           ON claim.invitation_id = invitation.id
          AND claim.organization_id = activation.organization_id
         WHERE activation.id = $1 AND relationship.status = 'active'
           AND invitation.token_hash = $2 AND invitation.status = 'activated'
           AND recipient_check.recipient_user_id = $3
           AND recipient_check.verified_email_fingerprint = $4
           AND recipient_check.status = 'checked'
           AND claim.actor_user_id = $3
           AND claim.status IN ('relationship_checked', 'claimed')
           AND organization.status = 'active'
           AND EXISTS (
               SELECT 1 FROM organization_memberships membership
               WHERE membership.organization_id = activation.organization_id
                 AND membership.user_id = $3 AND membership.status = 'active'
           )"
    );
    Ok(sqlx::query(&query)
        .bind(activation_id)
        .bind(token_hash)
        .bind(provider_actor_user_id)
        .bind(verified_email_fingerprint)
        .fetch_optional(pool)
        .await?
        .map(|row| owner_provider_first_visit_from_row(&row)))
}

async fn load_first_visit_in_transaction(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    activation_id: &str,
) -> Result<OwnerProviderFirstVisitRecord, sqlx::Error> {
    let query = format!(
        "{OWNER_PROVIDER_FIRST_VISIT_SELECT}
         WHERE activation.id = $1 AND relationship.status = 'active'"
    );
    let row = sqlx::query(&query)
        .bind(activation_id)
        .fetch_one(&mut **transaction)
        .await?;
    Ok(owner_provider_first_visit_from_row(&row))
}

fn trimmed_optional(value: Option<&str>) -> Option<&str> {
    value.map(str::trim)
}

async fn propose_provider_first_visit(
    pool: &PgPool,
    provider_actor_user_id: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
    activation_id: &str,
    request: ProposeProviderFirstVisitRequest,
) -> Result<PersistedFirstVisitOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    sqlx::query("SELECT pg_advisory_xact_lock(hashtext($1))")
        .bind(format!("owner-provider-first-visit:{activation_id}"))
        .execute(&mut *transaction)
        .await?;

    let replay_query = format!(
        "{OWNER_PROVIDER_FIRST_VISIT_SELECT}
         WHERE proposal.provider_actor_user_id = $1
           AND proposal.idempotency_key = $2"
    );
    if let Some(replay) = sqlx::query(&replay_query)
        .bind(provider_actor_user_id)
        .bind(request.idempotency_key.trim())
        .fetch_optional(&mut *transaction)
        .await?
    {
        let record = owner_provider_first_visit_from_row(&replay);
        let exact = record.activation_id == activation_id
            && record.current_version == request.expected_series_version + 1
            && record.window_start_epoch_seconds == Some(request.window_start_epoch_seconds)
            && record.window_end_epoch_seconds == Some(request.window_end_epoch_seconds)
            && record.time_zone.as_deref() == Some(request.time_zone.trim())
            && record.customer_safe_arrival_note.as_deref()
                == trimmed_optional(request.customer_safe_arrival_note.as_deref());
        transaction.commit().await?;
        return Ok(if exact {
            PersistedFirstVisitOutcome::Replayed(record)
        } else {
            PersistedFirstVisitOutcome::Conflict
        });
    }

    let authority = sqlx::query(
        "SELECT activation.id, COALESCE(series.current_version, 0) AS current_version,
                COALESCE(series.status, 'awaiting_provider') AS first_visit_status,
                activation.invitation_id, activation.organization_id,
                activation.owner_property_id, activation.customer_account_id,
                activation.customer_property_id
         FROM owner_provider_relationship_activations activation
         JOIN owner_provider_active_relationships relationship
           ON relationship.activation_id = activation.id AND relationship.status = 'active'
         JOIN organizations organization
           ON organization.id = activation.organization_id AND organization.status = 'active'
         JOIN owner_provider_invitations invitation
           ON invitation.id = activation.invitation_id
          AND invitation.status = 'activated' AND invitation.token_hash = $2
         JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.invitation_id = invitation.id
          AND recipient_check.recipient_user_id = $3
          AND recipient_check.verified_email_fingerprint = $4
          AND recipient_check.status = 'checked'
         JOIN owner_provider_invitation_organization_claims claim
           ON claim.invitation_id = invitation.id
          AND claim.organization_id = activation.organization_id
          AND claim.actor_user_id = $3
          AND claim.status IN ('relationship_checked', 'claimed')
         LEFT JOIN owner_provider_first_visit_series series
           ON series.activation_id = activation.id
         WHERE activation.id = $1
           AND EXISTS (
               SELECT 1 FROM organization_memberships membership
               WHERE membership.organization_id = activation.organization_id
                 AND membership.user_id = $3 AND membership.status = 'active'
           )
         FOR UPDATE OF activation",
    )
    .bind(activation_id)
    .bind(token_hash)
    .bind(provider_actor_user_id)
    .bind(verified_email_fingerprint)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(authority) = authority else {
        transaction.rollback().await?;
        return Ok(PersistedFirstVisitOutcome::NotFound);
    };

    sqlx::query(
        "INSERT INTO owner_provider_first_visit_series (activation_id)
         VALUES ($1) ON CONFLICT (activation_id) DO NOTHING",
    )
    .bind(activation_id)
    .execute(&mut *transaction)
    .await?;
    let current_version: i64 = authority.get("current_version");
    let current_status: String = authority.get("first_visit_status");
    if current_version != request.expected_series_version
        || !matches!(
            current_status.as_str(),
            "awaiting_provider" | "change_requested"
        )
        || request.window_start_epoch_seconds <= current_epoch_seconds()
    {
        let record = load_first_visit_in_transaction(&mut transaction, activation_id).await?;
        transaction.commit().await?;
        return Ok(PersistedFirstVisitOutcome::InvalidState(record));
    }

    let next_version = current_version + 1;
    let proposal_id = format!("owner_provider_first_visit_{}", Uuid::new_v4().simple());
    sqlx::query(
        "INSERT INTO owner_provider_first_visit_proposals (
             id, activation_id, proposal_version, provider_actor_user_id,
             verified_email_fingerprint, invitation_id, organization_id,
             owner_property_id, customer_account_id, customer_property_id,
             window_start, window_end, time_zone, customer_safe_arrival_note,
             idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                   TO_TIMESTAMP($11), TO_TIMESTAMP($12), $13, $14, $15)",
    )
    .bind(&proposal_id)
    .bind(activation_id)
    .bind(next_version)
    .bind(provider_actor_user_id)
    .bind(verified_email_fingerprint)
    .bind(authority.get::<String, _>("invitation_id"))
    .bind(authority.get::<String, _>("organization_id"))
    .bind(authority.get::<String, _>("owner_property_id"))
    .bind(authority.get::<String, _>("customer_account_id"))
    .bind(authority.get::<String, _>("customer_property_id"))
    .bind(request.window_start_epoch_seconds)
    .bind(request.window_end_epoch_seconds)
    .bind(request.time_zone.trim())
    .bind(trimmed_optional(
        request.customer_safe_arrival_note.as_deref(),
    ))
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "UPDATE owner_provider_first_visit_series
         SET current_version = $2, status = 'proposed', updated_at = NOW()
         WHERE activation_id = $1 AND current_version = $3",
    )
    .bind(activation_id)
    .bind(next_version)
    .bind(current_version)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_first_visit_events (
             id, activation_id, proposal_id, actor_user_id, event_kind,
             proposal_version, event_data
         ) VALUES ($1, $2, $3, $4, 'window_proposed', $5,
                   '{\"status\":\"proposed\"}'::JSONB)",
    )
    .bind(format!(
        "owner_provider_first_visit_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(activation_id)
    .bind(&proposal_id)
    .bind(provider_actor_user_id)
    .bind(next_version)
    .execute(&mut *transaction)
    .await?;
    let record = load_first_visit_in_transaction(&mut transaction, activation_id).await?;
    transaction.commit().await?;
    Ok(PersistedFirstVisitOutcome::Saved(record))
}

async fn decide_owner_provider_first_visit(
    pool: &PgPool,
    owner_user_id: &str,
    property_id: &str,
    activation_id: &str,
    request: DecideOwnerProviderFirstVisitRequest,
) -> Result<PersistedFirstVisitOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    sqlx::query("SELECT pg_advisory_xact_lock(hashtext($1))")
        .bind(format!("owner-provider-first-visit:{activation_id}"))
        .execute(&mut *transaction)
        .await?;

    let replay = sqlx::query(
        "SELECT decision.activation_id, decision.proposal_version,
                decision.action, decision.customer_safe_note,
                decision.confirmation_affirmation_text_version
         FROM owner_provider_first_visit_decisions decision
         WHERE decision.owner_user_id = $1 AND decision.idempotency_key = $2",
    )
    .bind(owner_user_id)
    .bind(request.idempotency_key.trim())
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(replay) = replay {
        let exact = replay.get::<String, _>("activation_id") == activation_id
            && replay.get::<i64, _>("proposal_version") == request.expected_window_version
            && replay.get::<String, _>("action") == request.action
            && replay
                .get::<Option<String>, _>("customer_safe_note")
                .as_deref()
                == trimmed_optional(request.customer_safe_note.as_deref())
            && replay
                .get::<Option<String>, _>("confirmation_affirmation_text_version")
                .as_deref()
                == trimmed_optional(request.confirmation_affirmation_text_version.as_deref());
        let record = load_first_visit_in_transaction(&mut transaction, activation_id).await?;
        transaction.commit().await?;
        return Ok(if exact {
            PersistedFirstVisitOutcome::Replayed(record)
        } else {
            PersistedFirstVisitOutcome::Conflict
        });
    }

    let current = get_owner_provider_first_visit_in_transaction(
        &mut transaction,
        owner_user_id,
        property_id,
        activation_id,
    )
    .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(PersistedFirstVisitOutcome::NotFound);
    };
    if current.status != "proposed" || current.current_version != request.expected_window_version {
        transaction.commit().await?;
        return Ok(PersistedFirstVisitOutcome::InvalidState(current));
    }
    let proposal_id = current
        .proposal_id
        .as_deref()
        .expect("a proposed first-visit state must identify its proposal");
    let decision_id = format!(
        "owner_provider_first_visit_decision_{}",
        Uuid::new_v4().simple()
    );
    sqlx::query(
        "INSERT INTO owner_provider_first_visit_decisions (
             id, activation_id, proposal_id, owner_user_id, action,
             proposal_version, customer_safe_note,
             confirmation_affirmation_text_version, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    )
    .bind(&decision_id)
    .bind(activation_id)
    .bind(proposal_id)
    .bind(owner_user_id)
    .bind(&request.action)
    .bind(request.expected_window_version)
    .bind(trimmed_optional(request.customer_safe_note.as_deref()))
    .bind(trimmed_optional(
        request.confirmation_affirmation_text_version.as_deref(),
    ))
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;
    let (next_status, event_kind) = if request.action == "confirm" {
        ("confirmed", "window_confirmed")
    } else {
        ("change_requested", "window_change_requested")
    };
    sqlx::query(
        "UPDATE owner_provider_first_visit_series
         SET status = $2, updated_at = NOW(),
             confirmed_at = CASE WHEN $2 = 'confirmed' THEN NOW() ELSE NULL END
         WHERE activation_id = $1 AND current_version = $3 AND status = 'proposed'",
    )
    .bind(activation_id)
    .bind(next_status)
    .bind(request.expected_window_version)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO owner_provider_first_visit_events (
             id, activation_id, proposal_id, actor_user_id, event_kind,
             proposal_version, event_data
         ) VALUES ($1, $2, $3, $4, $5, $6, JSONB_BUILD_OBJECT('status', $7::TEXT))",
    )
    .bind(format!(
        "owner_provider_first_visit_event_{}",
        Uuid::new_v4().simple()
    ))
    .bind(activation_id)
    .bind(proposal_id)
    .bind(owner_user_id)
    .bind(event_kind)
    .bind(request.expected_window_version)
    .bind(next_status)
    .execute(&mut *transaction)
    .await?;
    let record = load_first_visit_in_transaction(&mut transaction, activation_id).await?;
    transaction.commit().await?;
    Ok(PersistedFirstVisitOutcome::Saved(record))
}

async fn get_owner_provider_first_visit_in_transaction(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    owner_user_id: &str,
    property_id: &str,
    activation_id: &str,
) -> Result<Option<OwnerProviderFirstVisitRecord>, sqlx::Error> {
    let query = format!(
        "{OWNER_PROVIDER_FIRST_VISIT_SELECT}
         WHERE activation.id = $1 AND activation.owner_user_id = $2
           AND activation.owner_property_id = $3 AND relationship.status = 'active'"
    );
    Ok(sqlx::query(&query)
        .bind(activation_id)
        .bind(owner_user_id)
        .bind(property_id)
        .fetch_optional(&mut **transaction)
        .await?
        .map(|row| owner_provider_first_visit_from_row(&row)))
}

async fn open_owner_provider_inbox(
    pool: &PgPool,
    recipient_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    token_hash: &str,
) -> Result<PersistedProviderInboxOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        "SELECT invitation.id AS invitation_id, invitation.owner_user_id,
                invitation.property_id, invitation.provider_name,
                invitation.owner_name_snapshot, invitation.coarse_area_snapshot,
                invitation.care_goals_snapshot, invitation.cadence_snapshot,
                invitation.status AS invitation_status,
                invitation.expires_at <= NOW() AS invitation_expired,
                recipient_check.recipient_user_id,
                recipient_check.verified_email_fingerprint,
                recipient_check.status AS recipient_check_status,
                claim.status AS claim_status, claim.organization_id,
                organization.display_name AS organization_name,
                organization.status AS organization_status,
                organization.organization_type,
                capability.id AS capability_id, capability.status AS capability_status,
                capability.version AS capability_version,
                capability.expires_at <= NOW() AS capability_expired,
                capability.allowed_actions, capability.withheld_categories,
                EXISTS (
                    SELECT 1 FROM organization_memberships membership
                    WHERE membership.organization_id = claim.organization_id
                      AND membership.user_id = $3 AND membership.status = 'active'
                ) AS active_membership
         FROM owner_provider_invitations invitation
         JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.invitation_id = invitation.id
         LEFT JOIN owner_provider_invitation_organization_claims claim
           ON claim.invitation_id = invitation.id
          AND claim.status IN ('relationship_checked', 'claimed', 'disputed',
                               'duplicate_review', 'under_review', 'bootstrap_ready')
         LEFT JOIN organizations organization ON organization.id = claim.organization_id
         LEFT JOIN owner_provider_invitation_response_capabilities capability
           ON capability.invitation_id = invitation.id AND capability.actor_user_id = $3
         WHERE invitation.token_hash = $1
           AND LOWER(invitation.recipient_email) = LOWER($2)
         ORDER BY claim.created_at DESC NULLS LAST LIMIT 1
         FOR UPDATE OF invitation",
    )
    .bind(token_hash)
    .bind(verified_email)
    .bind(recipient_user_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(row) = row else {
        transaction.rollback().await?;
        return Ok(PersistedProviderInboxOutcome::NotFound);
    };
    let recipient_checked = row.get::<String, _>("recipient_user_id") == recipient_user_id
        && row.get::<String, _>("verified_email_fingerprint") == verified_email_fingerprint
        && row.get::<String, _>("recipient_check_status") == "checked";
    if !recipient_checked {
        transaction.rollback().await?;
        return Ok(PersistedProviderInboxOutcome::InvalidState);
    }
    let capability_id: Option<String> = row.get("capability_id");
    if capability_id.is_none() {
        transaction.rollback().await?;
        return Ok(PersistedProviderInboxOutcome::InvalidState);
    }
    let invitation_status: String = row.get("invitation_status");
    let invitation_expired: bool = row.get("invitation_expired");
    let capability_status: String = row.get("capability_status");
    let capability_expired: bool = row.get("capability_expired");
    let claim_status: Option<String> = row.get("claim_status");
    let relationship_active = claim_status
        .as_deref()
        .is_some_and(|status| matches!(status, "relationship_checked" | "claimed"));
    let organization_active = row
        .try_get::<String, _>("organization_status")
        .is_ok_and(|status| status == "active")
        && row
            .try_get::<String, _>("organization_type")
            .is_ok_and(|kind| kind == "yard_care_company")
        && row.get::<bool, _>("active_membership");
    let effective = invitation_status == "opened"
        && !invitation_expired
        && capability_status == "active"
        && !capability_expired
        && relationship_active
        && organization_active;
    if !effective {
        let (next_status, recovery_action, reason) = if invitation_expired || capability_expired {
            ("expired", "request_new_invitation", "capability_expired")
        } else if invitation_status != "opened" {
            ("revoked", "review_invitation_status", "invitation_closed")
        } else {
            (
                "suspended",
                "resolve_provider_relationship",
                "provider_relationship_inactive",
            )
        };
        if capability_status == "active" {
            reconcile_owner_provider_response_capability(
                &mut transaction,
                &row.get::<String, _>("invitation_id"),
                &row.get::<String, _>("owner_user_id"),
                &row.get::<String, _>("property_id"),
                next_status,
                reason,
            )
            .await?;
        }
        transaction.commit().await?;
        return Ok(PersistedProviderInboxOutcome::Closed(
            OwnerProviderInboxEntry {
                invitation_id: row.get("invitation_id"),
                status: next_status.to_string(),
                can_review_limited_request: false,
                capability_id: None,
                capability_version: None,
                organization_id: None,
                organization_name: None,
                provider_name: None,
                owner_name: None,
                coarse_area: None,
                care_goals: Vec::new(),
                cadence: None,
                allowed_actions: Vec::new(),
                withheld_categories: vec![
                    "exact_address".to_string(),
                    "yard_photos".to_string(),
                    "owner_contact".to_string(),
                    "access_considerations".to_string(),
                    "pricing_and_work_authority".to_string(),
                ],
                opportunity_response_capability: false,
                recovery_action: Some(recovery_action.to_string()),
            },
        ));
    }
    transaction.commit().await?;
    Ok(PersistedProviderInboxOutcome::Loaded(
        OwnerProviderInboxEntry {
            invitation_id: row.get("invitation_id"),
            status: "active".to_string(),
            can_review_limited_request: true,
            capability_id: row.get("capability_id"),
            capability_version: row.get("capability_version"),
            organization_id: row.get("organization_id"),
            organization_name: row.get("organization_name"),
            provider_name: Some(row.get("provider_name")),
            owner_name: Some(row.get("owner_name_snapshot")),
            coarse_area: Some(row.get("coarse_area_snapshot")),
            care_goals: row.get("care_goals_snapshot"),
            cadence: Some(row.get("cadence_snapshot")),
            allowed_actions: row.get("allowed_actions"),
            withheld_categories: row.get("withheld_categories"),
            opportunity_response_capability: true,
            recovery_action: None,
        },
    ))
}

async fn create_owner_provider_opportunity_response(
    pool: &PgPool,
    recipient_user_id: &str,
    verified_email: &str,
    verified_email_fingerprint: &str,
    request: CreateOwnerProviderOpportunityResponseRequest,
    token_hash: &str,
) -> Result<PersistedOpportunityResponseOutcome, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let replay = sqlx::query(
        "SELECT response.id, response.capability_id, response.invitation_id,
                response.organization_id, response.action, response.response_code,
                response.expected_capability_version,
                response.status, response.assigned_function,
                capability.status AS capability_status,
                capability.version AS capability_version
         FROM owner_provider_opportunity_responses response
         JOIN owner_provider_invitation_response_capabilities capability
           ON capability.id = response.capability_id
         JOIN owner_provider_invitations invitation ON invitation.id = response.invitation_id
         WHERE response.actor_user_id = $1 AND response.idempotency_key = $2
           AND response.capability_id = $3 AND invitation.token_hash = $4
           AND LOWER(invitation.recipient_email) = LOWER($5)",
    )
    .bind(recipient_user_id)
    .bind(request.idempotency_key.trim())
    .bind(request.capability_id.trim())
    .bind(token_hash)
    .bind(verified_email)
    .fetch_optional(&mut *transaction)
    .await?;
    if let Some(row) = replay {
        let exact_replay = row.get::<String, _>("action") == request.action
            && row.get::<String, _>("response_code") == request.response_code
            && row.get::<i64, _>("expected_capability_version")
                == request.expected_capability_version;
        if !exact_replay {
            transaction.rollback().await?;
            return Ok(PersistedOpportunityResponseOutcome::Conflict);
        }
        transaction.commit().await?;
        return Ok(PersistedOpportunityResponseOutcome::Replayed(
            owner_provider_opportunity_response_from_row(&row, true),
        ));
    }

    let eligibility = sqlx::query(
        "SELECT capability.id AS capability_id, capability.invitation_id,
                capability.organization_id, capability.owner_user_id,
                capability.property_id, capability.status AS capability_status,
                capability.version AS capability_version,
                capability.expires_at <= NOW() AS capability_expired,
                capability.allowed_actions,
                invitation.recipient_email, invitation.status AS invitation_status,
                invitation.expires_at <= NOW() AS invitation_expired,
                recipient_check.recipient_user_id,
                recipient_check.verified_email_fingerprint,
                recipient_check.status AS recipient_check_status,
                claim.status AS claim_status,
                organization.status AS organization_status,
                organization.organization_type,
                EXISTS (
                    SELECT 1 FROM organization_memberships membership
                    WHERE membership.organization_id = capability.organization_id
                      AND membership.user_id = $4 AND membership.status = 'active'
                ) AS active_membership
         FROM owner_provider_invitation_response_capabilities capability
         JOIN owner_provider_invitations invitation
           ON invitation.id = capability.invitation_id
         JOIN owner_provider_invitation_recipient_checks recipient_check
           ON recipient_check.id = capability.recipient_check_id
         JOIN owner_provider_invitation_organization_claims claim
           ON claim.id = capability.claim_id
         JOIN organizations organization ON organization.id = capability.organization_id
         WHERE capability.id = $1 AND invitation.token_hash = $2
           AND LOWER(invitation.recipient_email) = LOWER($3)
           AND capability.actor_user_id = $4
         FOR UPDATE OF capability, invitation",
    )
    .bind(request.capability_id.trim())
    .bind(token_hash)
    .bind(verified_email)
    .bind(recipient_user_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(eligibility) = eligibility else {
        transaction.rollback().await?;
        return Ok(PersistedOpportunityResponseOutcome::NotFound);
    };
    let recipient_checked = eligibility.get::<String, _>("recipient_user_id") == recipient_user_id
        && eligibility.get::<String, _>("verified_email_fingerprint") == verified_email_fingerprint
        && eligibility.get::<String, _>("recipient_check_status") == "checked";
    if !recipient_checked {
        transaction.rollback().await?;
        return Ok(PersistedOpportunityResponseOutcome::InvalidState);
    }
    if eligibility.get::<i64, _>("capability_version") != request.expected_capability_version {
        transaction.rollback().await?;
        return Ok(PersistedOpportunityResponseOutcome::Conflict);
    }
    let invitation_status: String = eligibility.get("invitation_status");
    let invitation_expired: bool = eligibility.get("invitation_expired");
    let capability_status: String = eligibility.get("capability_status");
    let capability_expired: bool = eligibility.get("capability_expired");
    let claim_status: String = eligibility.get("claim_status");
    let allowed_actions: Vec<String> = eligibility.get("allowed_actions");
    let relationship_active = matches!(claim_status.as_str(), "relationship_checked" | "claimed");
    let organization_active = eligibility.get::<String, _>("organization_status") == "active"
        && eligibility.get::<String, _>("organization_type") == "yard_care_company"
        && eligibility.get::<bool, _>("active_membership");
    let effective = invitation_status == "opened"
        && !invitation_expired
        && capability_status == "active"
        && !capability_expired
        && relationship_active
        && organization_active
        && allowed_actions
            .iter()
            .any(|action| action == &request.action);
    if !effective {
        if capability_status == "active" {
            let (next_status, reason) = if invitation_expired || capability_expired {
                ("expired", "capability_expired")
            } else if invitation_status != "opened" {
                ("revoked", "invitation_closed")
            } else {
                ("suspended", "provider_relationship_inactive")
            };
            reconcile_owner_provider_response_capability(
                &mut transaction,
                &eligibility.get::<String, _>("invitation_id"),
                &eligibility.get::<String, _>("owner_user_id"),
                &eligibility.get::<String, _>("property_id"),
                next_status,
                reason,
            )
            .await?;
            transaction.commit().await?;
        } else {
            transaction.rollback().await?;
        }
        return Ok(PersistedOpportunityResponseOutcome::InvalidState);
    }
    let duplicate_action = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
             SELECT 1 FROM owner_provider_opportunity_responses
             WHERE capability_id = $1 AND action = $2
         )",
    )
    .bind(request.capability_id.trim())
    .bind(&request.action)
    .fetch_one(&mut *transaction)
    .await?;
    if duplicate_action {
        transaction.rollback().await?;
        return Ok(PersistedOpportunityResponseOutcome::Conflict);
    }

    let invitation_id: String = eligibility.get("invitation_id");
    let organization_id: String = eligibility.get("organization_id");
    let owner_user_id: String = eligibility.get("owner_user_id");
    let property_id: String = eligibility.get("property_id");
    let response_id = format!("owner_provider_response_{}", Uuid::new_v4().simple());
    let assigned_function = (request.action == "report").then_some("trust_and_safety");
    let response_status = if request.action == "report" {
        "routed"
    } else {
        "recorded"
    };
    sqlx::query(
        "INSERT INTO owner_provider_opportunity_responses (
             id, capability_id, invitation_id, organization_id, actor_user_id,
             action, response_code, expected_capability_version,
             assigned_function, status, idempotency_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
    )
    .bind(&response_id)
    .bind(request.capability_id.trim())
    .bind(&invitation_id)
    .bind(&organization_id)
    .bind(recipient_user_id)
    .bind(&request.action)
    .bind(&request.response_code)
    .bind(request.expected_capability_version)
    .bind(assigned_function)
    .bind(response_status)
    .bind(request.idempotency_key.trim())
    .execute(&mut *transaction)
    .await?;

    if request.action == "decline" {
        sqlx::query(
            "UPDATE owner_provider_invitations
             SET status = 'declined', terminal_at = NOW(), updated_at = NOW()
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
            "declined",
            "provider_declined_limited_request",
        )
        .await?;
        sqlx::query(
            "INSERT INTO owner_acquisition_events (
                 id, owner_user_id, property_id, event_kind, event_data
             ) VALUES ($1, $2, $3, 'provider_invitation_declined', $4)",
        )
        .bind(format!("owner_event_{}", Uuid::new_v4()))
        .bind(&owner_user_id)
        .bind(&property_id)
        .bind(serde_json::json!({ "invitation_id": invitation_id }))
        .execute(&mut *transaction)
        .await?;
    } else if request.action == "report" {
        let existing_report = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(
                 SELECT 1 FROM owner_provider_invitation_abuse_reports
                 WHERE invitation_id = $1 AND reporter_user_id = $2
             )",
        )
        .bind(&invitation_id)
        .bind(recipient_user_id)
        .fetch_one(&mut *transaction)
        .await?;
        if existing_report {
            transaction.rollback().await?;
            return Ok(PersistedOpportunityResponseOutcome::Conflict);
        }
        let recipient_email: String = eligibility.get("recipient_email");
        let report_id = format!("owner_provider_abuse_{}", Uuid::new_v4().simple());
        let severity = abuse_report_severity(&request.response_code);
        sqlx::query(
            "INSERT INTO owner_provider_invitation_abuse_reports (
                 id, invitation_id, invitation_reference_hash, reporter_user_id,
                 reporter_email_fingerprint, category, customer_safe_description,
                 block_future_invitations, severity, assigned_function, status,
                 idempotency_key
             ) VALUES ($1, $2, $3, $4, $5, $6, '', TRUE, $7,
                       'trust_and_safety', 'submitted', $8)",
        )
        .bind(&report_id)
        .bind(&invitation_id)
        .bind(format!("{:x}", Sha256::digest(invitation_id.as_bytes())))
        .bind(recipient_user_id)
        .bind(email_fingerprint(&recipient_email))
        .bind(&request.response_code)
        .bind(severity)
        .bind(request.idempotency_key.trim())
        .execute(&mut *transaction)
        .await?;
        sqlx::query(
            "UPDATE owner_provider_invitations
             SET status = 'opted_out', terminal_at = NOW(), updated_at = NOW()
             WHERE id = $1",
        )
        .bind(&invitation_id)
        .execute(&mut *transaction)
        .await?;
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
        reconcile_owner_provider_response_capability(
            &mut transaction,
            &invitation_id,
            &owner_user_id,
            &property_id,
            "revoked",
            "provider_safety_reported",
        )
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
            "severity": severity,
            "blocked": true,
        }))
        .execute(&mut *transaction)
        .await?;
    }
    sqlx::query(
        "INSERT INTO owner_acquisition_events (
             id, owner_user_id, property_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'provider_invitation_opportunity_response_recorded', $4)",
    )
    .bind(format!("owner_event_{}", Uuid::new_v4()))
    .bind(&owner_user_id)
    .bind(&property_id)
    .bind(serde_json::json!({
        "invitation_id": invitation_id,
        "capability_id": request.capability_id.trim(),
        "response_id": response_id,
        "action": request.action,
        "status": response_status,
    }))
    .execute(&mut *transaction)
    .await?;
    let row = sqlx::query(
        "SELECT response.id, response.capability_id, response.invitation_id,
                response.organization_id, response.action, response.response_code,
                response.status, response.assigned_function,
                capability.status AS capability_status,
                capability.version AS capability_version
         FROM owner_provider_opportunity_responses response
         JOIN owner_provider_invitation_response_capabilities capability
           ON capability.id = response.capability_id
         WHERE response.id = $1",
    )
    .bind(&response_id)
    .fetch_one(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(PersistedOpportunityResponseOutcome::Recorded(
        owner_provider_opportunity_response_from_row(&row, true),
    ))
}

fn owner_provider_opportunity_response_from_row(
    row: &sqlx::postgres::PgRow,
    persisted: bool,
) -> OwnerProviderOpportunityResponseRecord {
    let capability_status: String = row.get("capability_status");
    OwnerProviderOpportunityResponseRecord {
        response_id: row.get("id"),
        capability_id: row.get("capability_id"),
        invitation_id: row.get("invitation_id"),
        organization_id: row.get("organization_id"),
        action: row.get("action"),
        response_code: row.get("response_code"),
        status: row.get("status"),
        assigned_function: row.get("assigned_function"),
        capability_status: capability_status.clone(),
        capability_version: row.get("capability_version"),
        opportunity_response_capability: capability_status == "active",
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

    fn initial_service_proposal_request() -> PublishOwnerProviderInitialServiceProposalRequest {
        PublishOwnerProviderInitialServiceProposalRequest {
            token: new_owner_provider_invitation_token(),
            expected_proposal_version: 0,
            title: "Every-two-week yard care".to_string(),
            customer_summary: "Routine care based on the completed assessment.".to_string(),
            included_scope: vec!["Mow and edge turf".to_string()],
            exclusions: vec!["Tree work above eight feet".to_string()],
            cadence_code: "every_two_weeks".to_string(),
            cadence_detail: "One visit every two weeks".to_string(),
            arrival_policy: "Confirm the first service day with the owner.".to_string(),
            weather_policy: "Unsafe weather may move the visit.".to_string(),
            cancellation_policy: "Cancel at least 24 hours before service.".to_string(),
            proof_expectation: "Send a completion note after each visit.".to_string(),
            price_amount_minor: 12_000,
            price_basis: "per_visit".to_string(),
            currency_code: "USD".to_string(),
            revision_note: None,
            expires_at_epoch_seconds: current_epoch_seconds() + 7 * 24 * 60 * 60,
            idempotency_key: "proposal-publish-001".to_string(),
        }
    }

    #[test]
    fn validates_initial_service_proposal_and_decision_boundaries() {
        let proposal = initial_service_proposal_request();
        assert!(validate_initial_service_proposal_request(&proposal));
        assert_eq!(
            annualized_monthly_minor(12_000, "per_visit", "every_two_weeks"),
            Some(26_000)
        );
        assert_eq!(annualized_monthly_minor(12_000, "fixed", "one_time"), None);

        let mut invalid_revision = proposal.clone();
        invalid_revision.expected_proposal_version = 1;
        assert!(!validate_initial_service_proposal_request(
            &invalid_revision
        ));
        invalid_revision.revision_note = Some("Adjusted after assessment review.".to_string());
        assert!(validate_initial_service_proposal_request(&invalid_revision));
        invalid_revision.currency_code = "usd".to_string();
        assert!(!validate_initial_service_proposal_request(
            &invalid_revision
        ));

        let acceptance = DecideOwnerProviderInitialServiceProposalRequest {
            action: "accept".to_string(),
            expected_proposal_version: 1,
            reason_code: None,
            customer_safe_note: None,
            affirmation_text_version: Some(
                OWNER_PROVIDER_PROPOSAL_ACCEPTANCE_TEXT_VERSION.to_string(),
            ),
            idempotency_key: "proposal-accept-001".to_string(),
        };
        assert!(validate_initial_service_proposal_decision_request(
            &acceptance
        ));
        assert!(!validate_initial_service_proposal_decision_request(
            &DecideOwnerProviderInitialServiceProposalRequest {
                affirmation_text_version: Some("unknown-text".to_string()),
                ..acceptance.clone()
            }
        ));
        assert!(validate_initial_service_proposal_decision_request(
            &DecideOwnerProviderInitialServiceProposalRequest {
                action: "decline".to_string(),
                reason_code: Some("scope".to_string()),
                affirmation_text_version: None,
                ..acceptance
            }
        ));

        let activation = ActivateOwnerProviderRelationshipRequest {
            expected_proposal_version: 1,
            activation_affirmation_text_version: OWNER_PROVIDER_ACTIVATION_AFFIRMATION_TEXT_VERSION
                .to_string(),
            owner_confirmed: true,
            idempotency_key: "owner-provider-activation-001".to_string(),
        };
        assert!(validate_owner_provider_relationship_activation_request(
            &activation
        ));
        assert!(!validate_owner_provider_relationship_activation_request(
            &ActivateOwnerProviderRelationshipRequest {
                owner_confirmed: false,
                ..activation.clone()
            }
        ));
        assert!(!validate_owner_provider_relationship_activation_request(
            &ActivateOwnerProviderRelationshipRequest {
                activation_affirmation_text_version: "unknown-text".to_string(),
                ..activation
            }
        ));

        let first_visit = ProposeProviderFirstVisitRequest {
            token:
                "owner_provider_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
                    .to_string(),
            expected_series_version: 0,
            window_start_epoch_seconds: 1_800_000_000,
            window_end_epoch_seconds: 1_800_007_200,
            time_zone: "America/Phoenix".to_string(),
            customer_safe_arrival_note: Some("Please unlock the side gate.".to_string()),
            idempotency_key: "provider-first-visit-001".to_string(),
        };
        assert!(validate_provider_first_visit_request(&first_visit));
        assert!(!validate_provider_first_visit_request(
            &ProposeProviderFirstVisitRequest {
                window_end_epoch_seconds: first_visit.window_start_epoch_seconds + 14_401,
                ..first_visit.clone()
            }
        ));
        let first_visit_confirmation = DecideOwnerProviderFirstVisitRequest {
            expected_window_version: 1,
            action: "confirm".to_string(),
            customer_safe_note: None,
            confirmation_affirmation_text_version: Some(
                OWNER_PROVIDER_FIRST_VISIT_CONFIRMATION_TEXT_VERSION.to_string(),
            ),
            idempotency_key: "owner-first-visit-confirm-001".to_string(),
        };
        assert!(validate_owner_first_visit_decision_request(
            &first_visit_confirmation
        ));
        assert!(!validate_owner_first_visit_decision_request(
            &DecideOwnerProviderFirstVisitRequest {
                confirmation_affirmation_text_version: Some("unknown-text".to_string()),
                ..first_visit_confirmation.clone()
            }
        ));
        assert!(validate_owner_first_visit_decision_request(
            &DecideOwnerProviderFirstVisitRequest {
                action: "request_change".to_string(),
                customer_safe_note: Some("Please offer an afternoon window.".to_string()),
                confirmation_affirmation_text_version: None,
                ..first_visit_confirmation
            }
        ));
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
        assert!(validate_provider_inbox_request(
            &OpenOwnerProviderInboxRequest {
                token: new_owner_provider_invitation_token(),
            }
        ));
        let opportunity_response = CreateOwnerProviderOpportunityResponseRequest {
            token: new_owner_provider_invitation_token(),
            capability_id: "owner_provider_capability_001".to_string(),
            expected_capability_version: 1,
            action: "preliminary_question".to_string(),
            response_code: "service_fit".to_string(),
            block_future_invitations: false,
            idempotency_key: "provider-opportunity-response-001".to_string(),
        };
        assert!(validate_provider_opportunity_response_request(
            &opportunity_response
        ));
        for (action, response_code, block_future_invitations) in [
            ("express_interest", "ready_for_owner_disclosure", false),
            ("decline", "capacity_unavailable", false),
            ("report", "unsafe_contact", true),
        ] {
            assert!(validate_provider_opportunity_response_request(
                &CreateOwnerProviderOpportunityResponseRequest {
                    action: action.to_string(),
                    response_code: response_code.to_string(),
                    block_future_invitations,
                    ..opportunity_response.clone()
                }
            ));
        }
        assert!(!validate_provider_opportunity_response_request(
            &CreateOwnerProviderOpportunityResponseRequest {
                action: "submit_proposal".to_string(),
                response_code: "ready_for_owner_disclosure".to_string(),
                ..opportunity_response.clone()
            }
        ));
        assert!(!validate_provider_opportunity_response_request(
            &CreateOwnerProviderOpportunityResponseRequest {
                action: "report".to_string(),
                response_code: "unsafe_contact".to_string(),
                block_future_invitations: false,
                ..opportunity_response
            }
        ));
        let disclosure_grant = CreateOwnerProviderDisclosureGrantRequest {
            expected_review_version: format!("disclosure_review_v1_{}", "0".repeat(64)),
            purpose: "yard_assessment".to_string(),
            approved_categories: vec![
                "exact_address".to_string(),
                "selected_yard_photos".to_string(),
            ],
            selected_media_ids: vec!["owner_media_00000001".to_string()],
            consent_text_version: OWNER_PROVIDER_CONSENT_TEXT_VERSION.to_string(),
            retention_notice_version: OWNER_PROVIDER_RETENTION_NOTICE_VERSION.to_string(),
            owner_affirmed: true,
            idempotency_key: "provider-disclosure-001".to_string(),
        };
        assert!(validate_provider_disclosure_grant_request(
            &disclosure_grant
        ));
        assert!(!validate_provider_disclosure_grant_request(
            &CreateOwnerProviderDisclosureGrantRequest {
                owner_affirmed: false,
                ..disclosure_grant.clone()
            }
        ));
        assert!(!validate_provider_disclosure_grant_request(
            &CreateOwnerProviderDisclosureGrantRequest {
                selected_media_ids: vec![],
                ..disclosure_grant.clone()
            }
        ));
        assert!(!validate_provider_disclosure_grant_request(
            &CreateOwnerProviderDisclosureGrantRequest {
                approved_categories: vec!["pricing_and_work_authority".to_string()],
                selected_media_ids: vec![],
                ..disclosure_grant
            }
        ));
        let disclosure_revoke = RevokeOwnerProviderDisclosureGrantRequest {
            expected_version: 1,
            reason_code: "owner_choice".to_string(),
            owner_confirmed: true,
            idempotency_key: "provider-disclosure-revoke-001".to_string(),
        };
        assert!(validate_provider_disclosure_revoke_request(
            &disclosure_revoke
        ));
        assert!(!validate_provider_disclosure_revoke_request(
            &RevokeOwnerProviderDisclosureGrantRequest {
                owner_confirmed: false,
                ..disclosure_revoke.clone()
            }
        ));
        assert!(!validate_provider_disclosure_revoke_request(
            &RevokeOwnerProviderDisclosureGrantRequest {
                reason_code: "erase_everything".to_string(),
                ..disclosure_revoke
            }
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
