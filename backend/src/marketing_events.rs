use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize)]
pub struct CreateMarketingEventRequest {
    pub session_id: String,
    pub event_name: String,
    pub persona: String,
    pub detail: Option<String>,
    pub source: Option<String>,
    pub medium: Option<String>,
    pub campaign: Option<String>,
    pub landing_path: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct MarketingEventResponse {
    pub id: String,
    pub accepted: bool,
}

#[derive(Clone, Debug, Default)]
pub struct MarketingEventRepository {
    pool: Option<PgPool>,
}

impl MarketingEventRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn record(&self, request: CreateMarketingEventRequest) -> MarketingEventResponse {
        let id = format!("mevt_{}", Uuid::new_v4());
        let Some(pool) = &self.pool else {
            return MarketingEventResponse { id, accepted: true };
        };
        let result = sqlx::query(
            "INSERT INTO marketing_conversion_events (id, session_id, event_name, persona, detail, source, medium, campaign, landing_path) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        )
        .bind(&id)
        .bind(request.session_id.trim())
        .bind(request.event_name.trim())
        .bind(request.persona.trim())
        .bind(trimmed(request.detail))
        .bind(trimmed(request.source))
        .bind(trimmed(request.medium))
        .bind(trimmed(request.campaign))
        .bind(request.landing_path.trim())
        .execute(pool)
        .await;
        if let Err(ref error) = result {
            tracing::warn!(%error, "marketing conversion event could not be recorded");
        }
        MarketingEventResponse {
            id,
            accepted: result.is_ok(),
        }
    }
}

pub fn validate_marketing_event(request: &CreateMarketingEventRequest) -> bool {
    (8..=100).contains(&request.session_id.trim().len())
        && matches!(
            request.event_name.trim(),
            "page_view"
                | "persona_selected"
                | "tour_step_selected"
                | "cta_clicked"
                | "form_started"
                | "form_submitted"
                | "form_failed"
        )
        && matches!(
            request.persona.trim(),
            "yard_owner" | "property_manager" | "landscaping_company" | "crew_lead"
        )
        && request
            .detail
            .as_deref()
            .map(|v| v.trim().len() <= 120)
            .unwrap_or(true)
        && request.landing_path.trim().starts_with('/')
        && request.landing_path.trim().len() <= 500
        && [
            request.source.as_deref(),
            request.medium.as_deref(),
            request.campaign.as_deref(),
        ]
        .into_iter()
        .flatten()
        .all(|value| value.trim().len() <= 120)
}

fn trimmed(value: Option<String>) -> Option<String> {
    value
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_only_bounded_funnel_events() {
        let request = CreateMarketingEventRequest {
            session_id: "session_123456".into(),
            event_name: "cta_clicked".into(),
            persona: "landscaping_company".into(),
            detail: Some("hero".into()),
            source: None,
            medium: None,
            campaign: None,
            landing_path: "/".into(),
        };
        assert!(validate_marketing_event(&request));
        let invalid = CreateMarketingEventRequest {
            event_name: "fingerprint".into(),
            ..request
        };
        assert!(!validate_marketing_event(&invalid));
    }
}
