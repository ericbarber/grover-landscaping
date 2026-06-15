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
    stop_progress_response(day_plan_id, stop_id, status, false)
}

pub fn persisted_stop_progress_response(
    day_plan_id: &str,
    stop_id: &str,
    status: &str,
) -> StopProgressResponse {
    stop_progress_response(day_plan_id, stop_id, status, true)
}

fn stop_progress_response(
    day_plan_id: &str,
    stop_id: &str,
    status: &str,
    persisted: bool,
) -> StopProgressResponse {
    StopProgressResponse {
        day_plan_id: day_plan_id.to_string(),
        stop_id: stop_id.to_string(),
        status: status.to_string(),
        persisted,
    }
}

#[cfg(test)]
mod tests {
    use super::{
        is_valid_stop_progress_status, local_stop_progress_response,
        persisted_stop_progress_response,
    };

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

    #[test]
    fn local_response_is_not_persisted() {
        let response = local_stop_progress_response("day_plan_1", "stop_1", "pending");

        assert!(!response.persisted);
    }

    #[test]
    fn persisted_response_is_persisted() {
        let response = persisted_stop_progress_response("day_plan_1", "stop_1", "finished");

        assert!(response.persisted);
    }
}
