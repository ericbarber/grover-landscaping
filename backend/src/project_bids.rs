#[path = "postgres_project_bids.rs"]
mod postgres_project_bids;

use crate::db::DatabaseConfig;
use crate::notifications::validate_notification_recipient;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone, Debug, Deserialize)]
pub struct CreateProjectBidLineItemRequest {
    pub service_id: String,
    pub service_name: String,
    pub service_description: Option<String>,
    pub quantity: u32,
    pub unit_price_cents: u32,
    pub note: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct CreateProjectBidRequest {
    pub customer_message: Option<String>,
    pub line_items: Vec<CreateProjectBidLineItemRequest>,
}

#[derive(Clone, Debug, Serialize)]
pub struct ProjectBidLineItemResponse {
    pub id: String,
    pub service_id: String,
    pub service_name: String,
    pub service_description: Option<String>,
    pub quantity: u32,
    pub unit_price_cents: u32,
    pub note: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct ProjectBidResponse {
    pub id: String,
    pub day_plan_id: String,
    pub customer_account_id: String,
    pub source_amendment_id: String,
    pub status: String,
    pub line_items: Vec<ProjectBidLineItemResponse>,
    pub customer_message: Option<String>,
    pub total_cents: u64,
    pub share_url: Option<String>,
    pub sent_at: Option<String>,
    pub responded_at: Option<String>,
    pub share_expires_at: Option<String>,
    pub share_revoked_at: Option<String>,
    pub delivery_status: Option<String>,
    pub delivery_channel: Option<String>,
    pub delivery_recipient: Option<String>,
    pub converted_job_id: Option<String>,
    pub converted_at: Option<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize)]
pub struct SendProjectBidRequest {
    pub channel: String,
    pub recipient: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct ProjectBidDecisionRequest {
    pub decision: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct CustomerProjectBidResponse {
    pub id: String,
    pub status: String,
    pub line_items: Vec<ProjectBidLineItemResponse>,
    pub customer_message: Option<String>,
    pub total_cents: u64,
    pub sent_at: Option<String>,
    pub responded_at: Option<String>,
    pub expires_at: Option<String>,
}

#[derive(Clone, Debug, Default)]
pub struct ProjectBidRepository {
    pool: Option<PgPool>,
}

impl ProjectBidRepository {
    #[allow(dead_code)]
    pub fn new() -> Self {
        let pool = DatabaseConfig::from_env().and_then(|config| {
            PgPoolOptions::new()
                .max_connections(5)
                .connect_lazy(&config.database_url)
                .ok()
        });

        Self { pool }
    }

    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn save_draft(
        &self,
        day_plan_id: &str,
        amendment_id: &str,
        request: CreateProjectBidRequest,
    ) -> ProjectBidResponse {
        let response = local_project_bid_response(day_plan_id, amendment_id, request);

        if let Some(pool) = &self.pool {
            if let Ok(Some(persisted)) = postgres_project_bids::save_draft(pool, &response).await {
                return persisted;
            }
        }

        response
    }

    pub async fn list_for_day_plan(&self, day_plan_id: &str) -> Vec<ProjectBidResponse> {
        if let Some(pool) = &self.pool {
            if let Ok(bids) = postgres_project_bids::list_for_day_plan(pool, day_plan_id).await {
                return bids;
            }
        }

        Vec::new()
    }

    pub async fn list_for_account(
        &self,
        account_id: &str,
        organization_ids: &[String],
    ) -> Vec<ProjectBidResponse> {
        if organization_ids.is_empty() {
            return Vec::new();
        }

        if let Some(pool) = &self.pool {
            if let Ok(bids) =
                postgres_project_bids::list_for_account(pool, account_id, organization_ids).await
            {
                return bids;
            }
        }

        Vec::new()
    }

    pub async fn send(
        &self,
        day_plan_id: &str,
        bid_id: &str,
        request: &SendProjectBidRequest,
    ) -> Option<ProjectBidResponse> {
        let pool = self.pool.as_ref()?;
        postgres_project_bids::send(pool, day_plan_id, bid_id, request)
            .await
            .ok()
            .flatten()
    }

    pub async fn revoke(&self, day_plan_id: &str, bid_id: &str) -> Option<ProjectBidResponse> {
        let pool = self.pool.as_ref()?;
        postgres_project_bids::revoke(pool, day_plan_id, bid_id)
            .await
            .ok()
            .flatten()
    }

    pub async fn convert_to_job_add_ons(
        &self,
        day_plan_id: &str,
        bid_id: &str,
        actor_user_id: &str,
    ) -> Option<ProjectBidResponse> {
        let pool = self.pool.as_ref()?;
        postgres_project_bids::convert_to_job_add_ons(pool, day_plan_id, bid_id, actor_user_id)
            .await
            .ok()
            .flatten()
    }

    pub async fn shared_for_token(&self, share_token: &str) -> Option<ProjectBidResponse> {
        let pool = self.pool.as_ref()?;
        postgres_project_bids::shared_for_token(pool, share_token)
            .await
            .ok()
            .flatten()
    }

    pub async fn decide_shared(
        &self,
        share_token: &str,
        decision: &str,
    ) -> Option<ProjectBidResponse> {
        let pool = self.pool.as_ref()?;
        postgres_project_bids::decide_shared(pool, share_token, decision)
            .await
            .ok()
            .flatten()
    }
}

pub fn validate_project_bid_decision(request: &ProjectBidDecisionRequest) -> Result<(), String> {
    match request.decision.as_str() {
        "approve" | "reject" => Ok(()),
        _ => Err(format!("unsupported bid decision: {}", request.decision)),
    }
}

pub fn customer_project_bid_response(bid: &ProjectBidResponse) -> CustomerProjectBidResponse {
    CustomerProjectBidResponse {
        id: bid.id.clone(),
        status: bid.status.clone(),
        line_items: bid.line_items.clone(),
        customer_message: bid.customer_message.clone(),
        total_cents: bid.total_cents,
        sent_at: bid.sent_at.clone(),
        responded_at: bid.responded_at.clone(),
        expires_at: bid.share_expires_at.clone(),
    }
}

pub fn validate_send_project_bid_request(request: &SendProjectBidRequest) -> Result<(), String> {
    validate_notification_recipient(&request.channel, &request.recipient)
}

pub fn validate_project_bid_request(request: &CreateProjectBidRequest) -> Result<(), String> {
    if request.line_items.is_empty() {
        return Err("at least one line item is required".to_string());
    }

    if request.line_items.len() > 25 {
        return Err("a bid cannot contain more than 25 line items".to_string());
    }

    if request
        .customer_message
        .as_deref()
        .is_some_and(|message| message.trim().is_empty())
    {
        return Err("customer_message cannot be blank".to_string());
    }

    if request
        .customer_message
        .as_deref()
        .is_some_and(|message| message.chars().count() > 2_000)
    {
        return Err("customer_message cannot exceed 2000 characters".to_string());
    }

    for item in &request.line_items {
        if item.service_id.trim().is_empty() || item.service_name.trim().is_empty() {
            return Err("line item service id and name are required".to_string());
        }
        if item.quantity == 0 {
            return Err("line item quantity must be greater than zero".to_string());
        }
        if item.quantity > 999 {
            return Err("line item quantity cannot exceed 999".to_string());
        }
        if item.unit_price_cents > 200_000_000 {
            return Err("line item unit price cannot exceed $2,000,000".to_string());
        }
        if item
            .note
            .as_deref()
            .is_some_and(|note| note.trim().is_empty())
        {
            return Err("line item note cannot be blank".to_string());
        }
    }

    Ok(())
}

fn local_project_bid_response(
    day_plan_id: &str,
    amendment_id: &str,
    request: CreateProjectBidRequest,
) -> ProjectBidResponse {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let id = format!("bid_{amendment_id}_{nonce}");
    let line_items = request
        .line_items
        .into_iter()
        .enumerate()
        .map(|(index, item)| ProjectBidLineItemResponse {
            id: format!("{id}_line_{}", index + 1),
            service_id: item.service_id,
            service_name: item.service_name,
            service_description: item.service_description,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            note: item.note,
        })
        .collect::<Vec<_>>();
    let total_cents = project_bid_total_cents(&line_items);

    ProjectBidResponse {
        id,
        day_plan_id: day_plan_id.to_string(),
        customer_account_id: "unresolved_local_customer".to_string(),
        source_amendment_id: amendment_id.to_string(),
        status: "draft".to_string(),
        line_items,
        customer_message: request.customer_message,
        total_cents,
        share_url: None,
        sent_at: None,
        responded_at: None,
        share_expires_at: None,
        share_revoked_at: None,
        delivery_status: None,
        delivery_channel: None,
        delivery_recipient: None,
        converted_job_id: None,
        converted_at: None,
        persisted: false,
    }
}

fn project_bid_total_cents(line_items: &[ProjectBidLineItemResponse]) -> u64 {
    line_items
        .iter()
        .map(|item| u64::from(item.quantity) * u64::from(item.unit_price_cents))
        .sum()
}

#[cfg(test)]
mod tests {
    use super::{
        local_project_bid_response, validate_project_bid_decision, validate_project_bid_request,
        validate_send_project_bid_request, CreateProjectBidLineItemRequest,
        CreateProjectBidRequest, ProjectBidDecisionRequest, SendProjectBidRequest,
    };

    fn valid_request() -> CreateProjectBidRequest {
        CreateProjectBidRequest {
            customer_message: Some("We found additional work during your service.".to_string()),
            line_items: vec![CreateProjectBidLineItemRequest {
                service_id: "service_sprinkler_repair".to_string(),
                service_name: "Sprinkler repair".to_string(),
                service_description: None,
                quantity: 2,
                unit_price_cents: 8500,
                note: None,
            }],
        }
    }

    #[test]
    fn bid_validation_requires_line_items() {
        let mut request = valid_request();
        request.line_items.clear();

        assert!(validate_project_bid_request(&request).is_err());
    }

    #[test]
    fn local_bid_totals_quantity_and_unit_price() {
        let response = local_project_bid_response("plan_1", "amendment_1", valid_request());

        assert_eq!(response.status, "draft");
        assert_eq!(response.total_cents, 17_000);
        assert!(!response.persisted);
    }

    #[test]
    fn customer_bid_decision_accepts_only_terminal_answers() {
        assert!(validate_project_bid_decision(&ProjectBidDecisionRequest {
            decision: "approve".to_string(),
        })
        .is_ok());
        assert!(validate_project_bid_decision(&ProjectBidDecisionRequest {
            decision: "defer".to_string(),
        })
        .is_err());
    }

    #[test]
    fn bid_delivery_validates_email_and_e164_recipients() {
        assert!(validate_send_project_bid_request(&SendProjectBidRequest {
            channel: "email".to_string(),
            recipient: "customer@example.com".to_string(),
        })
        .is_ok());
        assert!(validate_send_project_bid_request(&SendProjectBidRequest {
            channel: "sms".to_string(),
            recipient: "+16025550123".to_string(),
        })
        .is_ok());
        assert!(validate_send_project_bid_request(&SendProjectBidRequest {
            channel: "sms".to_string(),
            recipient: "602-555-0123".to_string(),
        })
        .is_err());
    }
}
