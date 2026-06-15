use serde::{Deserialize, Serialize};

pub const VALID_STOP_PROGRESS_STATUSES: [&str; 3] = ["pending", "in_progress", "finished"];

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

pub fn is_valid_stop_progress_status(status: &str) -> bool {
    VALID_STOP_PROGRESS_STATUSES.contains(&status)
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

#[cfg(test)]
mod tests {
    use super::is_valid_stop_progress_status;

    #[test]
    fn accepts_known_stop_progress_statuses() {
        assert!(is_valid_stop_progress_status("pending"));
        assert!(is_valid_stop_progress_status("in_progress"));
        assert!(is_valid_stop_progress_status("finished"));
    }

    #[test]
    fn rejects_unknown_stop_progress_statuses() {
        assert!(!is_valid_stop_progress_status("done"));
        assert!(!is_valid_stop_progress_status("cancelled"));
        assert!(!is_valid_stop_progress_status(""));
    }
}
