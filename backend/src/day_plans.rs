use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanStop {
    pub id: String,
    pub job_id: String,
    pub customer_name: String,
    pub property_address: String,
    pub stop_order: u32,
    pub job_status: String,
    pub estimated_drive_minutes: u32,
    pub estimated_service_minutes: u32,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanSummary {
    pub id: String,
    pub crew_id: String,
    pub crew_name: String,
    pub service_date: String,
    pub status: String,
    pub route_status: String,
    pub stops: Vec<DayPlanStop>,
}
