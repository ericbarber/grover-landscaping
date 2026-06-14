use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct StopProgressRequest {
    pub status: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct StopProgressResponse {
    pub day_plan_id: String,
    pub stop_id: String,
    pub status: String,
    pub persisted: bool,
}

pub fn local_stop_progress_response(
    day_plan_id: &str,
    stop_id: &str,
    status: &str,
) -> StopProgressResponse {
    StopProgressResponse {
        day_plan_id: day_plan_id.to_string(),
        stop_id: stop_id.to_string(),
        status: status.to_string(),
        persisted: false,
    }
}
