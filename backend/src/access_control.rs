use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub enum AccessRole {
    OrganizationOwner,
    Manager,
    CrewLead,
    CrewMember,
    PropertyOwner,
    PropertyManager,
    SupportAdmin,
}

pub fn can_manage_organization(role: &AccessRole) -> bool {
    matches!(role, AccessRole::OrganizationOwner | AccessRole::SupportAdmin)
}

pub fn can_manage_schedule(role: &AccessRole) -> bool {
    matches!(
        role,
        AccessRole::OrganizationOwner | AccessRole::Manager | AccessRole::SupportAdmin
    )
}

pub fn can_view_crew_route(role: &AccessRole) -> bool {
    matches!(
        role,
        AccessRole::OrganizationOwner
            | AccessRole::Manager
            | AccessRole::CrewLead
            | AccessRole::CrewMember
            | AccessRole::SupportAdmin
    )
}

pub fn can_view_customer_portal(role: &AccessRole) -> bool {
    matches!(
        role,
        AccessRole::PropertyOwner | AccessRole::PropertyManager | AccessRole::SupportAdmin
    )
}

#[cfg(test)]
mod tests {
    use super::{
        can_manage_organization, can_manage_schedule, can_view_crew_route,
        can_view_customer_portal, AccessRole,
    };

    #[test]
    fn organization_owner_can_manage_organization_and_schedule() {
        assert!(can_manage_organization(&AccessRole::OrganizationOwner));
        assert!(can_manage_schedule(&AccessRole::OrganizationOwner));
    }

    #[test]
    fn crew_member_can_view_route_but_not_manage_schedule() {
        assert!(can_view_crew_route(&AccessRole::CrewMember));
        assert!(!can_manage_schedule(&AccessRole::CrewMember));
    }

    #[test]
    fn property_owner_can_view_customer_portal_only() {
        assert!(can_view_customer_portal(&AccessRole::PropertyOwner));
        assert!(!can_view_crew_route(&AccessRole::PropertyOwner));
        assert!(!can_manage_organization(&AccessRole::PropertyOwner));
    }
}
