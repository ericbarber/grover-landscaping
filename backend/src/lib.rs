pub mod access_control;
pub mod accounts;
pub mod auth;
pub mod completion_reports;
pub mod day_plans;
pub mod db;
pub mod notifications;
pub mod project_bids;
pub mod property_portfolio_requests;
pub mod property_portfolios;
pub mod stop_progress;

use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize)]
pub struct JobSummary {
    pub id: String,
    pub customer_name: String,
    pub property_address: String,
    pub status: String,
    pub scheduled_date: String,
    pub before_photos: u32,
    pub after_photos: u32,
    pub checklist_items: u32,
    pub completed_checklist_items: u32,
}

#[derive(Clone, Debug, Serialize)]
pub struct JobDetail {
    pub id: String,
    pub customer_name: String,
    pub property_address: String,
    pub status: String,
    pub scheduled_date: String,
    pub before_photos: u32,
    pub after_photos: u32,
    pub checklist_items: u32,
    pub completed_checklist_items: u32,
    pub checklist: Vec<ChecklistItem>,
}

#[derive(Clone, Debug, Serialize)]
pub struct ChecklistItem {
    pub id: String,
    pub label: String,
    pub completed: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct JobAddOn {
    pub id: String,
    pub job_id: String,
    pub service_name: String,
    pub service_description: Option<String>,
    pub quantity: u32,
    pub unit_price_cents: u32,
    pub note: Option<String>,
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct PhotoUploadRequest {
    pub file_name: String,
    pub content_type: String,
    pub photo_type: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct PhotoUploadResponse {
    pub status: &'static str,
    pub job_id: String,
    pub photo_id: String,
    pub photo_type: String,
    pub file_name: String,
    pub content_type: String,
    pub upload_mode: &'static str,
    pub upload_url: String,
    pub object_key: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct PhotoEvidence {
    pub id: String,
    pub job_id: String,
    pub photo_type: String,
    pub file_name: String,
    pub content_type: String,
    pub object_key: String,
    pub status: String,
    pub upload_mode: &'static str,
    pub display_url: String,
}
