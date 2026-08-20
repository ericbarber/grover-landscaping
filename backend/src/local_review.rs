use crate::access_control::AccessRole;
use serde::Serialize;

pub const LOCAL_REVIEWER_HEADER: &str = "x-grover-local-reviewer";
pub const LOCAL_REVIEW_ORGANIZATION_ID: &str = "org_demo_landscaping";

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct LocalReviewerProfile {
    pub reviewer_id: String,
    pub user_id: String,
    pub display_name: String,
    pub verified_email: String,
    pub roles: Vec<AccessRole>,
}

pub fn local_reviewer_profiles() -> Vec<LocalReviewerProfile> {
    vec![
        profile(
            "organization-owner",
            "local-review-organization-owner",
            "Olivia — Organization Owner",
            "owner.local@example.test",
            AccessRole::OrganizationOwner,
        ),
        profile(
            "manager",
            "local-review-manager",
            "Marcus — Manager",
            "manager.local@example.test",
            AccessRole::Manager,
        ),
        profile(
            "crew-lead",
            "local-review-crew-lead",
            "Leah — Crew Lead",
            "crew.lead.local@example.test",
            AccessRole::CrewLead,
        ),
        profile(
            "crew-member",
            "local-review-crew-member",
            "Carlos — Crew Member",
            "crew.member.local@example.test",
            AccessRole::CrewMember,
        ),
        profile(
            "property-manager",
            "local-review-property-manager",
            "Priya — Property Manager",
            "property.manager.local@example.test",
            AccessRole::PropertyManager,
        ),
        profile(
            "property-owner",
            "local-review-property-owner",
            "Jamie — Property Owner",
            "property.owner.local@example.test",
            AccessRole::PropertyOwner,
        ),
        profile(
            "support-admin",
            "local-review-support-admin",
            "Sam — Support Administrator",
            "support.local@example.test",
            AccessRole::SupportAdmin,
        ),
    ]
}

pub fn default_local_reviewer() -> LocalReviewerProfile {
    local_reviewer_profiles()
        .into_iter()
        .next()
        .expect("local review mode must define a default reviewer")
}

pub fn local_reviewer_by_id(reviewer_id: &str) -> Option<LocalReviewerProfile> {
    local_reviewer_profiles()
        .into_iter()
        .find(|profile| profile.reviewer_id == reviewer_id)
}

pub fn local_reviewer_by_user_id(user_id: &str) -> Option<LocalReviewerProfile> {
    local_reviewer_profiles()
        .into_iter()
        .find(|profile| profile.user_id == user_id)
}

fn profile(
    reviewer_id: &str,
    user_id: &str,
    display_name: &str,
    verified_email: &str,
    role: AccessRole,
) -> LocalReviewerProfile {
    LocalReviewerProfile {
        reviewer_id: reviewer_id.to_string(),
        user_id: user_id.to_string(),
        display_name: display_name.to_string(),
        verified_email: verified_email.to_string(),
        roles: vec![role],
    }
}

#[cfg(test)]
mod tests {
    use super::{local_reviewer_by_id, local_reviewer_profiles};
    use std::collections::HashSet;

    #[test]
    fn reviewer_identifiers_and_users_are_unique() {
        let profiles = local_reviewer_profiles();
        let reviewer_ids = profiles
            .iter()
            .map(|profile| profile.reviewer_id.as_str())
            .collect::<HashSet<_>>();
        let user_ids = profiles
            .iter()
            .map(|profile| profile.user_id.as_str())
            .collect::<HashSet<_>>();

        assert_eq!(reviewer_ids.len(), profiles.len());
        assert_eq!(user_ids.len(), profiles.len());
        assert_eq!(
            local_reviewer_by_id("crew-member").unwrap().roles,
            vec![crate::access_control::AccessRole::CrewMember]
        );
    }
}
