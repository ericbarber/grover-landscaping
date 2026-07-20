use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
pub struct CreateMarketingLeadRequest {
    pub full_name: String,
    pub email: String,
    pub company_name: Option<String>,
    pub persona: String,
    pub team_size: Option<String>,
    pub intent: String,
    pub message: Option<String>,
    pub source: Option<String>,
    pub medium: Option<String>,
    pub campaign: Option<String>,
    pub landing_path: String,
    pub consent_to_contact: bool,
    pub website: Option<String>,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct MarketingLeadResponse {
    pub id: String,
    pub status: &'static str,
    pub persisted: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum MarketingLeadWriteResult {
    Saved(MarketingLeadResponse),
    Unavailable,
}

#[derive(Clone, Debug, Default)]
pub struct MarketingLeadRepository {
    pool: Option<PgPool>,
}

impl MarketingLeadRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn create(&self, request: CreateMarketingLeadRequest) -> MarketingLeadWriteResult {
        let request = normalize_marketing_lead_request(request);
        let id = format!("lead_{}", Uuid::new_v4());

        if let Some(pool) = &self.pool {
            let result = sqlx::query(
                r#"
                INSERT INTO marketing_leads (
                    id,
                    full_name,
                    email,
                    company_name,
                    persona,
                    team_size,
                    intent,
                    message,
                    source,
                    medium,
                    campaign,
                    landing_path,
                    consent_to_contact
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                "#,
            )
            .bind(&id)
            .bind(&request.full_name)
            .bind(&request.email)
            .bind(&request.company_name)
            .bind(&request.persona)
            .bind(&request.team_size)
            .bind(&request.intent)
            .bind(&request.message)
            .bind(&request.source)
            .bind(&request.medium)
            .bind(&request.campaign)
            .bind(&request.landing_path)
            .bind(request.consent_to_contact)
            .execute(pool)
            .await;

            return match result {
                Ok(_) => MarketingLeadWriteResult::Saved(MarketingLeadResponse {
                    id,
                    status: "received",
                    persisted: true,
                }),
                Err(error) => {
                    tracing::error!(%error, "persisted marketing lead creation failed");
                    MarketingLeadWriteResult::Unavailable
                }
            };
        }

        MarketingLeadWriteResult::Saved(MarketingLeadResponse {
            id,
            status: "received",
            persisted: false,
        })
    }
}

pub fn validate_marketing_lead_request(
    request: &CreateMarketingLeadRequest,
) -> Result<(), &'static str> {
    let full_name = request.full_name.trim();
    if full_name.len() < 2 || full_name.len() > 120 {
        return Err("full_name_invalid");
    }

    let email = request.email.trim();
    if email.len() > 254 || !email.contains('@') || email.starts_with('@') || email.ends_with('@') {
        return Err("email_invalid");
    }

    if request
        .company_name
        .as_deref()
        .map(|value| value.trim().len() > 160)
        .unwrap_or(false)
    {
        return Err("company_name_too_long");
    }

    if !matches!(
        request.persona.trim(),
        "yard_owner" | "property_manager" | "landscaping_company" | "crew_lead"
    ) {
        return Err("persona_invalid");
    }

    if request
        .team_size
        .as_deref()
        .map(|value| value.trim().len() > 80)
        .unwrap_or(false)
    {
        return Err("team_size_too_long");
    }

    if !matches!(
        request.intent.trim(),
        "demo" | "portfolio_discussion" | "early_access"
    ) {
        return Err("intent_invalid");
    }

    if request
        .message
        .as_deref()
        .map(|value| value.trim().len() > 2000)
        .unwrap_or(false)
    {
        return Err("message_too_long");
    }

    for (value, error) in [
        (request.source.as_deref(), "source_too_long"),
        (request.medium.as_deref(), "medium_too_long"),
        (request.campaign.as_deref(), "campaign_too_long"),
    ] {
        if value.map(|item| item.trim().len() > 120).unwrap_or(false) {
            return Err(error);
        }
    }

    let landing_path = request.landing_path.trim();
    if !landing_path.starts_with('/') || landing_path.len() > 500 {
        return Err("landing_path_invalid");
    }

    if !request.consent_to_contact {
        return Err("contact_consent_required");
    }

    Ok(())
}

pub fn is_marketing_lead_spam(request: &CreateMarketingLeadRequest) -> bool {
    request
        .website
        .as_deref()
        .map(str::trim)
        .map(|value| !value.is_empty())
        .unwrap_or(false)
}

fn normalize_marketing_lead_request(
    request: CreateMarketingLeadRequest,
) -> CreateMarketingLeadRequest {
    CreateMarketingLeadRequest {
        full_name: request.full_name.trim().to_string(),
        email: request.email.trim().to_lowercase(),
        company_name: optional_trimmed(request.company_name),
        persona: request.persona.trim().to_string(),
        team_size: optional_trimmed(request.team_size),
        intent: request.intent.trim().to_string(),
        message: optional_trimmed(request.message),
        source: optional_trimmed(request.source),
        medium: optional_trimmed(request.medium),
        campaign: optional_trimmed(request.campaign),
        landing_path: request.landing_path.trim().to_string(),
        consent_to_contact: request.consent_to_contact,
        website: None,
    }
}

fn optional_trimmed(value: Option<String>) -> Option<String> {
    value
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid_request() -> CreateMarketingLeadRequest {
        CreateMarketingLeadRequest {
            full_name: "Jordan Rivera".to_string(),
            email: "jordan@example.com".to_string(),
            company_name: Some("Rivera Landscape".to_string()),
            persona: "landscaping_company".to_string(),
            team_size: Some("6-20".to_string()),
            intent: "demo".to_string(),
            message: Some("We manage three crews.".to_string()),
            source: Some("google".to_string()),
            medium: Some("cpc".to_string()),
            campaign: Some("phoenix_launch".to_string()),
            landing_path: "/".to_string(),
            consent_to_contact: true,
            website: None,
        }
    }

    #[test]
    fn validates_complete_marketing_leads() {
        assert_eq!(validate_marketing_lead_request(&valid_request()), Ok(()));
    }

    #[test]
    fn rejects_invalid_identity_persona_intent_and_consent() {
        let mut request = valid_request();
        request.email = "invalid".to_string();
        assert_eq!(
            validate_marketing_lead_request(&request),
            Err("email_invalid")
        );

        request = valid_request();
        request.persona = "unknown".to_string();
        assert_eq!(
            validate_marketing_lead_request(&request),
            Err("persona_invalid")
        );

        request = valid_request();
        request.intent = "newsletter".to_string();
        assert_eq!(
            validate_marketing_lead_request(&request),
            Err("intent_invalid")
        );

        request = valid_request();
        request.consent_to_contact = false;
        assert_eq!(
            validate_marketing_lead_request(&request),
            Err("contact_consent_required")
        );
    }

    #[test]
    fn detects_honeypot_spam_without_rejecting_normal_requests() {
        let mut request = valid_request();
        assert!(!is_marketing_lead_spam(&request));
        request.website = Some("https://spam.example".to_string());
        assert!(is_marketing_lead_spam(&request));
    }
}
