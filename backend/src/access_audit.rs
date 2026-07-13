use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub enum AccessAuditEventKind {
    Login,
    InviteAccepted,
    RoleChanged,
    AccountViewed,
    PortfolioChanged,
    CrewAssignmentChanged,
    BidApproved,
    BidRejected,
    BidConverted,
    ReportDelivered,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct AccessAuditEvent {
    pub id: String,
    pub actor_user_id: String,
    pub organization_id: String,
    pub event_kind: AccessAuditEventKind,
    pub target_id: String,
    pub occurred_at: String,
}

pub fn access_audit_event_is_complete(event: &AccessAuditEvent) -> bool {
    !event.id.trim().is_empty()
        && !event.actor_user_id.trim().is_empty()
        && !event.organization_id.trim().is_empty()
        && !event.target_id.trim().is_empty()
        && !event.occurred_at.trim().is_empty()
}

#[cfg(test)]
mod tests {
    use super::{access_audit_event_is_complete, AccessAuditEvent, AccessAuditEventKind};

    fn complete_event() -> AccessAuditEvent {
        AccessAuditEvent {
            id: "audit_1001".to_string(),
            actor_user_id: "user_manager_1001".to_string(),
            organization_id: "org_demo_landscaping".to_string(),
            event_kind: AccessAuditEventKind::PortfolioChanged,
            target_id: "portfolio_1001".to_string(),
            occurred_at: "2026-06-29T09:00:00Z".to_string(),
        }
    }

    #[test]
    fn accepts_complete_audit_event() {
        assert!(access_audit_event_is_complete(&complete_event()));
    }

    #[test]
    fn requires_actor_user_id() {
        let mut event = complete_event();
        event.actor_user_id = " ".to_string();

        assert!(!access_audit_event_is_complete(&event));
    }

    #[test]
    fn requires_organization_id() {
        let mut event = complete_event();
        event.organization_id = "".to_string();

        assert!(!access_audit_event_is_complete(&event));
    }
}
