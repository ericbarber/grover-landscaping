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

#[derive(Clone, Debug, Serialize, sqlx::FromRow)]
pub struct MarketingFunnelCounts {
    pub page_views: i64,
    pub cta_clicks: i64,
    pub form_starts: i64,
    pub submissions: i64,
    pub failures: i64,
}

#[derive(Clone, Debug, Serialize, sqlx::FromRow)]
pub struct MarketingFunnelSegment {
    pub segment: String,
    pub page_views: i64,
    pub cta_clicks: i64,
    pub form_starts: i64,
    pub submissions: i64,
}

#[derive(Clone, Debug, Serialize)]
pub struct MarketingDashboardResponse {
    pub window_days: i32,
    pub totals: MarketingFunnelCounts,
    pub by_persona: Vec<MarketingFunnelSegment>,
    pub by_campaign: Vec<MarketingFunnelSegment>,
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

    pub async fn dashboard(&self) -> Result<MarketingDashboardResponse, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(MarketingDashboardResponse {
                window_days: 30,
                totals: MarketingFunnelCounts {
                    page_views: 0,
                    cta_clicks: 0,
                    form_starts: 0,
                    submissions: 0,
                    failures: 0,
                },
                by_persona: Vec::new(),
                by_campaign: Vec::new(),
            });
        };
        let totals = sqlx::query_as::<_, MarketingFunnelCounts>(
            "SELECT COUNT(DISTINCT session_id) FILTER (WHERE event_name='page_view')::bigint AS page_views, COUNT(DISTINCT session_id) FILTER (WHERE event_name='cta_clicked')::bigint AS cta_clicks, COUNT(DISTINCT session_id) FILTER (WHERE event_name='form_started')::bigint AS form_starts, COUNT(DISTINCT session_id) FILTER (WHERE event_name='form_submitted')::bigint AS submissions, COUNT(*) FILTER (WHERE event_name='form_failed')::bigint AS failures FROM marketing_conversion_events WHERE occurred_at >= NOW() - INTERVAL '30 days'",
        ).fetch_one(pool).await?;
        let segment_query = |field: &str| {
            format!(
            "SELECT {field} AS segment, COUNT(DISTINCT session_id) FILTER (WHERE event_name='page_view')::bigint AS page_views, COUNT(DISTINCT session_id) FILTER (WHERE event_name='cta_clicked')::bigint AS cta_clicks, COUNT(DISTINCT session_id) FILTER (WHERE event_name='form_started')::bigint AS form_starts, COUNT(DISTINCT session_id) FILTER (WHERE event_name='form_submitted')::bigint AS submissions FROM marketing_conversion_events WHERE occurred_at >= NOW() - INTERVAL '30 days' GROUP BY {field} ORDER BY submissions DESC, page_views DESC LIMIT 12"
        )
        };
        let by_persona = sqlx::query_as::<_, MarketingFunnelSegment>(&segment_query("persona"))
            .fetch_all(pool)
            .await?;
        let by_campaign = sqlx::query_as::<_, MarketingFunnelSegment>(&segment_query(
            "COALESCE(NULLIF(campaign, ''), 'Direct / untagged')",
        ))
        .fetch_all(pool)
        .await?;
        Ok(MarketingDashboardResponse {
            window_days: 30,
            totals,
            by_persona,
            by_campaign,
        })
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
