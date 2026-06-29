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

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct AccessContext {
    pub user_id: String,
    pub organization_id: String,
    pub roles: Vec<AccessRole>,
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

pub fn can_manage_property_portfolios(role: &AccessRole) -> bool {
    matches!(
        role,
        AccessRole::OrganizationOwner
            | AccessRole::Manager
            | AccessRole::PropertyManager
            | AccessRole::SupportAdmin
    )
}

pub fn can_manage_crew_assignments(role: &AccessRole) -> bool {
    matches!(
        role,
        AccessRole::OrganizationOwner | AccessRole::Manager | AccessRole::SupportAdmin
    )
}

pub fn can_access_organization(context: &AccessContext, organization_id: &str) -> bool {
    context.organization_id == organization_id
}

pub fn can_manage_schedule_for_organization(
    context: &AccessContext,
    organization_id: &str,
) -> bool {
    can_access_organization(context, organization_id)
        && context.roles.iter().any(can_manage_schedule)
}

pub fn can_view_customer_portal_for_organization(
    context: &AccessContext,
    organization_id: &str,
) -> bool {
    can_access_organization(context, organization_id)
        && context.roles.iter().any(can_view_customer_portal)
}

pub fn can_manage_property_portfolios_for_organization(
    context: &AccessContext,
    organization_id: &str,
) -> bool {
    can_access_organization(context, organization_id)
        && context.roles.iter().any(can_manage_property_portfolios)
}

pub fn can_manage_crew_assignments_for_organization(
    context: &AccessContext,
    organization_id: &str,
) -> bool {
    can_access_organization(context, organization_id)
        && context.roles.iter().any(can_manage_crew_assignments)
}

#[cfg(test)]
mod tests {
    use super::{
        can_access_organization, can_manage_crew_assignments_for_organization,
        can_manage_organization, can_manage_property_portfolios_for_organization,
        can_manage_schedule, can_manage_schedule_for_organization, can_view_crew_route,
        can_view_customer_portal, can_view_customer_portal_for_organization, AccessContext,
        AccessRole,
    };

    fn manager_context() -> AccessContext {
        AccessContext {
            user_id: "user_manager_1001".to_string(),
            organization_id: "org_demo_landscaping".to_string(),
            roles: vec![AccessRole::Manager],
        }
    }

    fn property_owner_context() -> AccessContext {
        AccessContext {
            user_id: "user_property_owner_1001".to_string(),
            organization_id: "org_demo_landscaping".to_string(),
            roles: vec![AccessRole::PropertyOwner],
        }
    }

    fn property_manager_context() -> AccessContext {
        AccessContext {
            user_id: "user_property_manager_1001".to_string(),
            organization_id: "org_demo_landscaping".to_string(),
            roles: vec![AccessRole::PropertyManager],
        }
    }

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

    #[test]
    fn manager_can_manage_schedule_inside_own_organization() {
        assert!(can_manage_schedule_for_organization(
            &manager_context(),
            "org_demo_landscaping"
        ));
    }

    #[test]
    fn manager_cannot_manage_schedule_in_another_organization() {
        assert!(!can_manage_schedule_for_organization(
            &manager_context(),
            "org_other_landscaping"
        ));
    }

    #[test]
    fn property_owner_portal_access_is_organization_scoped() {
        let context = property_owner_context();

        assert!(can_access_organization(&context, "org_demo_landscaping"));
        assert!(can_view_customer_portal_for_organization(
            &context,
            "org_demo_landscaping"
        ));
        assert!(!can_view_customer_portal_for_organization(
            &context,
            "org_other_landscaping"
        ));
    }

    #[test]
    fn property_manager_can_manage_portfolios_inside_own_organization() {
        assert!(can_manage_property_portfolios_for_organization(
            &property_manager_context(),
            "org_demo_landscaping"
        ));
    }

    #[test]
    fn property_owner_cannot_manage_portfolios() {
        assert!(!can_manage_property_portfolios_for_organization(
            &property_owner_context(),
            "org_demo_landscaping"
        ));
    }

    #[test]
    fn manager_can_manage_crew_assignments_inside_own_organization() {
        assert!(can_manage_crew_assignments_for_organization(
            &manager_context(),
            "org_demo_landscaping"
        ));
    }

    #[test]
    fn property_manager_cannot_manage_crew_assignments() {
        assert!(!can_manage_crew_assignments_for_organization(
            &property_manager_context(),
            "org_demo_landscaping"
        ));
    }
}
