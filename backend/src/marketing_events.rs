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

#[derive(Clone, Debug, Serialize, sqlx::FromRow)]
pub struct CompanySetupStageCounts {
    pub stage: String,
    pub views: i64,
    pub starts: i64,
    pub completions: i64,
    pub failures: i64,
}

#[derive(Clone, Debug, Serialize)]
pub struct MarketingDashboardResponse {
    pub window_days: i32,
    pub totals: MarketingFunnelCounts,
    pub by_persona: Vec<MarketingFunnelSegment>,
    pub by_campaign: Vec<MarketingFunnelSegment>,
    pub company_setup_stages: Vec<CompanySetupStageCounts>,
    pub company_setup_resumes: i64,
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
                company_setup_stages: Vec::new(),
                company_setup_resumes: 0,
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
        let company_setup_stages = sqlx::query_as::<_, CompanySetupStageCounts>(
            r#"
            SELECT
                detail AS stage,
                COUNT(*) FILTER (WHERE event_name = 'setup_stage_viewed')::bigint AS views,
                COUNT(*) FILTER (WHERE event_name = 'setup_stage_started')::bigint AS starts,
                COUNT(*) FILTER (WHERE event_name = 'setup_stage_completed')::bigint AS completions,
                COUNT(*) FILTER (WHERE event_name = 'setup_stage_failed')::bigint AS failures
            FROM marketing_conversion_events
            WHERE occurred_at >= NOW() - INTERVAL '30 days'
              AND persona = 'landscaping_company'
              AND event_name IN (
                  'setup_stage_viewed', 'setup_stage_started',
                  'setup_stage_completed', 'setup_stage_failed'
              )
              AND detail IS NOT NULL
            GROUP BY detail
            ORDER BY MIN(occurred_at), detail
            "#,
        )
        .fetch_all(pool)
        .await?;
        let company_setup_resumes = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)::bigint
            FROM marketing_conversion_events
            WHERE occurred_at >= NOW() - INTERVAL '30 days'
              AND persona = 'landscaping_company'
              AND event_name = 'setup_resumed'
            "#,
        )
        .fetch_one(pool)
        .await?;
        Ok(MarketingDashboardResponse {
            window_days: 30,
            totals,
            by_persona,
            by_campaign,
            company_setup_stages,
            company_setup_resumes,
        })
    }
}

pub fn validate_marketing_event(request: &CreateMarketingEventRequest) -> bool {
    let event_name = request.event_name.trim();
    let detail = request.detail.as_deref().map(str::trim);
    let setup_detail_valid = !event_name.starts_with("setup_")
        || matches!(
            detail,
            Some(
                "organization"
                    | "organization_profile"
                    | "first_crew"
                    | "first_customer_property"
                    | "first_route"
                    | "first_service"
                    | "first_report"
                    | "first_value"
            )
        );
    (8..=100).contains(&request.session_id.trim().len())
        && matches!(
            event_name,
            "page_view"
                | "persona_selected"
                | "tour_step_selected"
                | "cta_clicked"
                | "form_started"
                | "form_submitted"
                | "form_failed"
                | "setup_stage_viewed"
                | "setup_stage_started"
                | "setup_stage_completed"
                | "setup_stage_failed"
                | "setup_resumed"
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
        && setup_detail_valid
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
            ..request.clone()
        };
        assert!(!validate_marketing_event(&invalid));
        let setup_event = CreateMarketingEventRequest {
            event_name: "setup_stage_completed".into(),
            detail: Some("first_route".into()),
            ..request
        };
        assert!(validate_marketing_event(&setup_event));
        let unsafe_setup_detail = CreateMarketingEventRequest {
            detail: Some("customer@example.com".into()),
            ..setup_event
        };
        assert!(!validate_marketing_event(&unsafe_setup_detail));
    }
}
