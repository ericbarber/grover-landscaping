pub const VALID_DAY_PLAN_STATUSES: [&str; 3] = ["draft", "published", "archived"];
pub const VALID_ROUTE_STATUSES: [&str; 2] = ["manual", "optimized"];

pub fn is_valid_day_plan_status(status: &str) -> bool {
    VALID_DAY_PLAN_STATUSES.contains(&status)
}

pub fn is_valid_route_status(status: &str) -> bool {
    VALID_ROUTE_STATUSES.contains(&status)
}

#[cfg(test)]
mod tests {
    use super::{is_valid_day_plan_status, is_valid_route_status};

    #[test]
    fn accepts_known_day_plan_statuses() {
        assert!(is_valid_day_plan_status("draft"));
        assert!(is_valid_day_plan_status("published"));
        assert!(is_valid_day_plan_status("archived"));
    }

    #[test]
    fn rejects_unknown_day_plan_statuses() {
        assert!(!is_valid_day_plan_status("scheduled"));
        assert!(!is_valid_day_plan_status("done"));
        assert!(!is_valid_day_plan_status(""));
    }

    #[test]
    fn accepts_known_route_statuses() {
        assert!(is_valid_route_status("manual"));
        assert!(is_valid_route_status("optimized"));
    }

    #[test]
    fn rejects_unknown_route_statuses() {
        assert!(!is_valid_route_status("automatic"));
        assert!(!is_valid_route_status("draft"));
        assert!(!is_valid_route_status(""));
    }
}
