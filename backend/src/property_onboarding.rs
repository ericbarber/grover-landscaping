use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};

use crate::notifications::validate_notification_recipient;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct UpsertPropertyOnboardingRequest {
    pub account_id: String,
    pub organization_id: String,
    pub service_address: String,
    pub access_notes: Option<String>,
    pub billing_contact_name: String,
    pub billing_contact_email: String,
    pub notification_contact_name: String,
    pub notification_email: Option<String>,
    pub notification_phone: Option<String>,
    pub onboarding_status: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PropertyOnboardingResponse {
    pub property_id: String,
    pub account_id: String,
    pub organization_id: String,
    pub service_address: String,
    pub access_notes: Option<String>,
    pub billing_contact_name: String,
    pub billing_contact_email: String,
    pub notification_contact_name: String,
    pub notification_email: Option<String>,
    pub notification_phone: Option<String>,
    pub onboarding_status: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PropertyOnboardingReadResult {
    Found(PropertyOnboardingResponse),
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PropertyOnboardingWriteResult {
    Saved(PropertyOnboardingResponse),
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, Default)]
pub struct PropertyOnboardingRepository {
    pool: Option<PgPool>,
}

impl PropertyOnboardingRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn get(
        &self,
        property_id: &str,
        organization_ids: &[String],
    ) -> PropertyOnboardingReadResult {
        if organization_ids.is_empty() {
            return PropertyOnboardingReadResult::NotFound;
        }

        if let Some(pool) = &self.pool {
            return match get_property_onboarding(pool, property_id, organization_ids).await {
                Ok(Some(profile)) => PropertyOnboardingReadResult::Found(profile),
                Ok(None) => PropertyOnboardingReadResult::NotFound,
                Err(error) => {
                    tracing::error!(%error, property_id, "persisted property onboarding read failed");
                    PropertyOnboardingReadResult::Unavailable
                }
            };
        }

        match seed_property_onboarding(property_id, organization_ids) {
            Some(profile) => PropertyOnboardingReadResult::Found(profile),
            None => PropertyOnboardingReadResult::NotFound,
        }
    }

    pub async fn upsert(
        &self,
        property_id: &str,
        request: UpsertPropertyOnboardingRequest,
    ) -> PropertyOnboardingWriteResult {
        let request = normalize_upsert_property_onboarding_request(request);

        if let Some(pool) = &self.pool {
            return match upsert_property_onboarding(pool, property_id, &request).await {
                Ok(Some(profile)) => PropertyOnboardingWriteResult::Saved(profile),
                Ok(None) => PropertyOnboardingWriteResult::Conflict,
                Err(error) => {
                    tracing::error!(%error, property_id, "persisted property onboarding write failed");
                    PropertyOnboardingWriteResult::Unavailable
                }
            };
        }

        PropertyOnboardingWriteResult::Saved(local_property_onboarding_response(
            property_id,
            request,
        ))
    }
}

pub fn is_valid_property_onboarding_status(status: &str) -> bool {
    matches!(status, "incomplete" | "active" | "blocked" | "archived")
}

pub fn validate_property_onboarding_request(
    request: &UpsertPropertyOnboardingRequest,
) -> Result<(), &'static str> {
    if request.account_id.trim().is_empty() {
        return Err("account_id_required");
    }

    if request.organization_id.trim().is_empty() {
        return Err("organization_id_required");
    }

    let service_address = request.service_address.trim();
    if service_address.len() < 5 || service_address.len() > 240 {
        return Err("service_address_invalid");
    }

    if request
        .access_notes
        .as_deref()
        .map(|notes| notes.trim().len() > 1000)
        .unwrap_or(false)
    {
        return Err("access_notes_too_long");
    }

    if request.billing_contact_name.trim().is_empty() {
        return Err("billing_contact_name_required");
    }

    if validate_notification_recipient("email", &request.billing_contact_email).is_err() {
        return Err("billing_contact_email_invalid");
    }

    if request.notification_contact_name.trim().is_empty() {
        return Err("notification_contact_name_required");
    }

    let notification_email = optional_trimmed_value(request.notification_email.as_deref());
    let notification_phone = optional_trimmed_value(request.notification_phone.as_deref());
    if notification_email.is_none() && notification_phone.is_none() {
        return Err("notification_destination_required");
    }

    if notification_email
        .as_deref()
        .map(|email| validate_notification_recipient("email", email).is_err())
        .unwrap_or(false)
    {
        return Err("notification_email_invalid");
    }

    if notification_phone
        .as_deref()
        .map(|phone| validate_notification_recipient("sms", phone).is_err())
        .unwrap_or(false)
    {
        return Err("notification_phone_invalid");
    }

    if !is_valid_property_onboarding_status(request.onboarding_status.trim()) {
        return Err("onboarding_status_invalid");
    }

    Ok(())
}

fn normalize_upsert_property_onboarding_request(
    request: UpsertPropertyOnboardingRequest,
) -> UpsertPropertyOnboardingRequest {
    UpsertPropertyOnboardingRequest {
        account_id: request.account_id.trim().to_string(),
        organization_id: request.organization_id.trim().to_string(),
        service_address: request.service_address.trim().to_string(),
        access_notes: optional_trimmed_value(request.access_notes.as_deref()),
        billing_contact_name: request.billing_contact_name.trim().to_string(),
        billing_contact_email: request.billing_contact_email.trim().to_string(),
        notification_contact_name: request.notification_contact_name.trim().to_string(),
        notification_email: optional_trimmed_value(request.notification_email.as_deref()),
        notification_phone: optional_trimmed_value(request.notification_phone.as_deref()),
        onboarding_status: request.onboarding_status.trim().to_string(),
    }
}

fn optional_trimmed_value(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

async fn get_property_onboarding(
    pool: &PgPool,
    property_id: &str,
    organization_ids: &[String],
) -> Result<Option<PropertyOnboardingResponse>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT
            property_id,
            account_id,
            organization_id,
            service_address,
            access_notes,
            billing_contact_name,
            billing_contact_email,
            notification_contact_name,
            notification_email,
            notification_phone,
            onboarding_status
        FROM property_onboarding_profiles
        WHERE property_id = $1
          AND organization_id = ANY($2)
        ORDER BY updated_at DESC
        LIMIT 1
        "#,
    )
    .bind(property_id)
    .bind(organization_ids)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(property_onboarding_response_from_row))
}

async fn upsert_property_onboarding(
    pool: &PgPool,
    property_id: &str,
    request: &UpsertPropertyOnboardingRequest,
) -> Result<Option<PropertyOnboardingResponse>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        INSERT INTO property_onboarding_profiles (
            property_id,
            account_id,
            organization_id,
            service_address,
            access_notes,
            billing_contact_name,
            billing_contact_email,
            notification_contact_name,
            notification_email,
            notification_phone,
            onboarding_status
        )
        SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        FROM customer_properties property
        WHERE property.id = $1
          AND property.account_id = $2
          AND property.organization_id = $3
          AND property.status <> 'archived'
        ON CONFLICT (property_id, organization_id) DO UPDATE SET
            account_id = EXCLUDED.account_id,
            service_address = EXCLUDED.service_address,
            access_notes = EXCLUDED.access_notes,
            billing_contact_name = EXCLUDED.billing_contact_name,
            billing_contact_email = EXCLUDED.billing_contact_email,
            notification_contact_name = EXCLUDED.notification_contact_name,
            notification_email = EXCLUDED.notification_email,
            notification_phone = EXCLUDED.notification_phone,
            onboarding_status = EXCLUDED.onboarding_status,
            updated_at = NOW()
        RETURNING
            property_id,
            account_id,
            organization_id,
            service_address,
            access_notes,
            billing_contact_name,
            billing_contact_email,
            notification_contact_name,
            notification_email,
            notification_phone,
            onboarding_status
        "#,
    )
    .bind(property_id)
    .bind(&request.account_id)
    .bind(&request.organization_id)
    .bind(&request.service_address)
    .bind(&request.access_notes)
    .bind(&request.billing_contact_name)
    .bind(&request.billing_contact_email)
    .bind(&request.notification_contact_name)
    .bind(&request.notification_email)
    .bind(&request.notification_phone)
    .bind(&request.onboarding_status)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(property_onboarding_response_from_row))
}

fn property_onboarding_response_from_row(row: sqlx::postgres::PgRow) -> PropertyOnboardingResponse {
    PropertyOnboardingResponse {
        property_id: row.get("property_id"),
        account_id: row.get("account_id"),
        organization_id: row.get("organization_id"),
        service_address: row.get("service_address"),
        access_notes: row.get("access_notes"),
        billing_contact_name: row.get("billing_contact_name"),
        billing_contact_email: row.get("billing_contact_email"),
        notification_contact_name: row.get("notification_contact_name"),
        notification_email: row.get("notification_email"),
        notification_phone: row.get("notification_phone"),
        onboarding_status: row.get("onboarding_status"),
        persisted: true,
    }
}

fn local_property_onboarding_response(
    property_id: &str,
    request: UpsertPropertyOnboardingRequest,
) -> PropertyOnboardingResponse {
    PropertyOnboardingResponse {
        property_id: property_id.trim().to_string(),
        account_id: request.account_id,
        organization_id: request.organization_id,
        service_address: request.service_address,
        access_notes: request.access_notes,
        billing_contact_name: request.billing_contact_name,
        billing_contact_email: request.billing_contact_email,
        notification_contact_name: request.notification_contact_name,
        notification_email: request.notification_email,
        notification_phone: request.notification_phone,
        onboarding_status: request.onboarding_status,
        persisted: false,
    }
}

fn seed_property_onboarding(
    property_id: &str,
    organization_ids: &[String],
) -> Option<PropertyOnboardingResponse> {
    if property_id != "property_1001"
        || !organization_ids
            .iter()
            .any(|organization_id| organization_id == "org_demo_landscaping")
    {
        return None;
    }

    Some(PropertyOnboardingResponse {
        property_id: "property_1001".to_string(),
        account_id: "acct_1001".to_string(),
        organization_id: "org_demo_landscaping".to_string(),
        service_address: "123 Oak Street".to_string(),
        access_notes: Some("Gate code required before backyard service.".to_string()),
        billing_contact_name: "Sample Customer".to_string(),
        billing_contact_email: "sample.customer@example.com".to_string(),
        notification_contact_name: "Sample Customer".to_string(),
        notification_email: Some("sample.customer@example.com".to_string()),
        notification_phone: None,
        onboarding_status: "active".to_string(),
        persisted: false,
    })
}

#[cfg(test)]
mod tests {
    use super::{
        is_valid_property_onboarding_status, validate_property_onboarding_request,
        PropertyOnboardingRepository, UpsertPropertyOnboardingRequest,
    };

    fn valid_request() -> UpsertPropertyOnboardingRequest {
        UpsertPropertyOnboardingRequest {
            account_id: "acct_1001".to_string(),
            organization_id: "org_demo_landscaping".to_string(),
            service_address: "123 Oak Street".to_string(),
            access_notes: Some("Gate code required.".to_string()),
            billing_contact_name: "Sample Customer".to_string(),
            billing_contact_email: "billing@example.com".to_string(),
            notification_contact_name: "Sample Customer".to_string(),
            notification_email: Some("notify@example.com".to_string()),
            notification_phone: Some("+16025550123".to_string()),
            onboarding_status: "active".to_string(),
        }
    }

    #[test]
    fn accepts_supported_onboarding_statuses() {
        assert!(is_valid_property_onboarding_status("incomplete"));
        assert!(is_valid_property_onboarding_status("active"));
        assert!(is_valid_property_onboarding_status("blocked"));
        assert!(is_valid_property_onboarding_status("archived"));
        assert!(!is_valid_property_onboarding_status("invited"));
    }

    #[test]
    fn validates_required_property_onboarding_fields() {
        assert_eq!(
            validate_property_onboarding_request(&valid_request()),
            Ok(())
        );

        let mut missing_address = valid_request();
        missing_address.service_address = "  ".to_string();
        assert_eq!(
            validate_property_onboarding_request(&missing_address),
            Err("service_address_invalid")
        );

        let mut bad_billing_email = valid_request();
        bad_billing_email.billing_contact_email = "not-an-email".to_string();
        assert_eq!(
            validate_property_onboarding_request(&bad_billing_email),
            Err("billing_contact_email_invalid")
        );
    }

    #[test]
    fn requires_at_least_one_notification_destination() {
        let mut request = valid_request();
        request.notification_email = Some(" ".to_string());
        request.notification_phone = None;

        assert_eq!(
            validate_property_onboarding_request(&request),
            Err("notification_destination_required")
        );
    }

    #[tokio::test]
    async fn repository_returns_local_upsert_when_database_is_unavailable() {
        let repository = PropertyOnboardingRepository::default();

        let PropertyOnboardingWriteResult::Saved(response) =
            repository.upsert(" property_1001 ", valid_request()).await
        else {
            panic!("local response should be returned");
        };

        assert_eq!(response.property_id, "property_1001");
        assert_eq!(response.service_address, "123 Oak Street");
        assert!(!response.persisted);
    }

    #[tokio::test]
    async fn repository_returns_seed_profile_when_database_is_unavailable() {
        let repository = PropertyOnboardingRepository::default();

        let PropertyOnboardingReadResult::Found(response) = repository
            .get("property_1001", &["org_demo_landscaping".to_string()])
            .await
        else {
            panic!("seed profile should be returned");
        };

        assert_eq!(response.account_id, "acct_1001");
        assert_eq!(response.onboarding_status, "active");
        assert!(!response.persisted);
    }
}
