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

#[derive(Clone, Debug, Serialize)]
pub struct MarketingLeadRecord {
    pub id: String,
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
    pub status: String,
    pub assigned_to: Option<String>,
    pub next_action_at: Option<String>,
    pub created_at: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct UpdateMarketingLeadRequest {
    pub status: String,
    pub assigned_to: Option<String>,
    pub next_action_at: Option<String>,
    pub note: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct MarketingLeadHistoryRecord {
    pub id: String,
    pub actor_user_id: String,
    pub previous_status: String,
    pub new_status: String,
    pub assigned_to: Option<String>,
    pub next_action_at: Option<String>,
    pub note: Option<String>,
    pub occurred_at: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct MarketingLeadDetailResponse {
    pub lead: MarketingLeadRecord,
    pub history: Vec<MarketingLeadHistoryRecord>,
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

    pub async fn list(&self) -> Result<Vec<MarketingLeadRecord>, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(Vec::new());
        };
        sqlx::query_as::<_, MarketingLeadRow>(
            "SELECT id, full_name, email, company_name, persona, team_size, intent, message, source, medium, campaign, landing_path, status, assigned_to, next_action_at::text, created_at::text FROM marketing_leads ORDER BY created_at DESC LIMIT 250",
        )
        .fetch_all(pool).await.map(|rows| rows.into_iter().map(Into::into).collect())
    }

    pub async fn update_workflow(
        &self,
        lead_id: &str,
        actor_user_id: &str,
        request: UpdateMarketingLeadRequest,
    ) -> Result<Option<MarketingLeadDetailResponse>, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(None);
        };
        let mut transaction = pool.begin().await?;
        let previous_status = sqlx::query_scalar::<_, String>(
            "SELECT status FROM marketing_leads WHERE id = $1 FOR UPDATE",
        )
        .bind(lead_id)
        .fetch_optional(&mut *transaction)
        .await?;
        let Some(previous_status) = previous_status else {
            return Ok(None);
        };
        let row = sqlx::query_as::<_, MarketingLeadRow>(
            "UPDATE marketing_leads SET status=$2, assigned_to=$3, next_action_at=$4::timestamptz, updated_at=NOW() WHERE id=$1 RETURNING id, full_name, email, company_name, persona, team_size, intent, message, source, medium, campaign, landing_path, status, assigned_to, next_action_at::text, created_at::text",
        )
        .bind(lead_id).bind(request.status.trim()).bind(optional_trimmed(request.assigned_to.clone()))
        .bind(optional_trimmed(request.next_action_at.clone()))
        .fetch_one(&mut *transaction).await?;
        let history_id = format!("mlh_{}", Uuid::new_v4());
        sqlx::query("INSERT INTO marketing_lead_history (id, lead_id, actor_user_id, previous_status, new_status, assigned_to, next_action_at, note) VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz,$8)")
            .bind(&history_id).bind(lead_id).bind(actor_user_id).bind(&previous_status)
            .bind(request.status.trim()).bind(optional_trimmed(request.assigned_to))
            .bind(optional_trimmed(request.next_action_at)).bind(optional_trimmed(request.note))
            .execute(&mut *transaction).await?;
        transaction.commit().await?;
        let history = self.history(lead_id).await?;
        Ok(Some(MarketingLeadDetailResponse {
            lead: row.into(),
            history,
        }))
    }

    pub async fn history(
        &self,
        lead_id: &str,
    ) -> Result<Vec<MarketingLeadHistoryRecord>, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(Vec::new());
        };
        sqlx::query_as::<_, MarketingLeadHistoryRow>("SELECT id, actor_user_id, previous_status, new_status, assigned_to, next_action_at::text, note, occurred_at::text FROM marketing_lead_history WHERE lead_id=$1 ORDER BY occurred_at DESC")
            .bind(lead_id).fetch_all(pool).await
            .map(|rows| rows.into_iter().map(Into::into).collect())
    }
}

#[derive(sqlx::FromRow)]
struct MarketingLeadRow {
    id: String,
    full_name: String,
    email: String,
    company_name: Option<String>,
    persona: String,
    team_size: Option<String>,
    intent: String,
    message: Option<String>,
    source: Option<String>,
    medium: Option<String>,
    campaign: Option<String>,
    landing_path: String,
    status: String,
    assigned_to: Option<String>,
    next_action_at: Option<String>,
    created_at: String,
}

impl From<MarketingLeadRow> for MarketingLeadRecord {
    fn from(row: MarketingLeadRow) -> Self {
        Self {
            id: row.id,
            full_name: row.full_name,
            email: row.email,
            company_name: row.company_name,
            persona: row.persona,
            team_size: row.team_size,
            intent: row.intent,
            message: row.message,
            source: row.source,
            medium: row.medium,
            campaign: row.campaign,
            landing_path: row.landing_path,
            status: row.status,
            assigned_to: row.assigned_to,
            next_action_at: row.next_action_at,
            created_at: row.created_at,
        }
    }
}

#[derive(sqlx::FromRow)]
struct MarketingLeadHistoryRow {
    id: String,
    actor_user_id: String,
    previous_status: String,
    new_status: String,
    assigned_to: Option<String>,
    next_action_at: Option<String>,
    note: Option<String>,
    occurred_at: String,
}

impl From<MarketingLeadHistoryRow> for MarketingLeadHistoryRecord {
    fn from(row: MarketingLeadHistoryRow) -> Self {
        Self {
            id: row.id,
            actor_user_id: row.actor_user_id,
            previous_status: row.previous_status,
            new_status: row.new_status,
            assigned_to: row.assigned_to,
            next_action_at: row.next_action_at,
            note: row.note,
            occurred_at: row.occurred_at,
        }
    }
}

pub fn validate_marketing_lead_workflow(request: &UpdateMarketingLeadRequest) -> bool {
    matches!(
        request.status.trim(),
        "new" | "contacted" | "qualified" | "closed"
    ) && request
        .assigned_to
        .as_deref()
        .map(|v| v.trim().len() <= 160)
        .unwrap_or(true)
        && request
            .next_action_at
            .as_deref()
            .map(|v| v.trim().len() <= 40)
            .unwrap_or(true)
        && request
            .note
            .as_deref()
            .map(|v| v.trim().len() <= 2000)
            .unwrap_or(true)
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

    #[test]
    fn validates_bounded_lead_workflow_updates() {
        let mut request = UpdateMarketingLeadRequest {
            status: "contacted".to_string(),
            assigned_to: Some("Alex Morgan".to_string()),
            next_action_at: Some("2026-07-21T16:00:00Z".to_string()),
            note: Some("Discovery call scheduled.".to_string()),
        };
        assert!(validate_marketing_lead_workflow(&request));
        request.status = "deleted".to_string();
        assert!(!validate_marketing_lead_workflow(&request));
    }
}
