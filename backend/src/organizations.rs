use crate::access_control::AccessRole;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};

#[derive(Clone, Debug, Default)]
pub struct OrganizationRepository {
    pool: Option<PgPool>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OrganizationMembership {
    pub id: String,
    pub organization_id: String,
    pub organization_name: String,
    pub organization_type: String,
    pub user_id: String,
    pub role: AccessRole,
    pub status: String,
    pub scope_type: String,
    pub scope_id: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct PrincipalAccessSummary {
    pub user_id: String,
    pub username: String,
    pub claim_roles: Vec<AccessRole>,
    pub memberships: Vec<OrganizationMembership>,
}

impl OrganizationRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn principal_access_summary(
        &self,
        user_id: &str,
        username: &str,
        claim_roles: Vec<AccessRole>,
    ) -> PrincipalAccessSummary {
        let memberships = self.list_active_memberships(user_id).await;

        PrincipalAccessSummary {
            user_id: user_id.to_string(),
            username: username.to_string(),
            claim_roles,
            memberships,
        }
    }

    pub async fn list_active_memberships(&self, user_id: &str) -> Vec<OrganizationMembership> {
        if let Some(pool) = &self.pool {
            if let Ok(memberships) = list_active_memberships(pool, user_id).await {
                return memberships;
            }
        }

        seed_memberships(user_id)
    }

    pub async fn user_has_active_membership(
        &self,
        user_id: &str,
        organization_id: &str,
        required_role: fn(&AccessRole) -> bool,
    ) -> bool {
        self.list_active_memberships(user_id)
            .await
            .iter()
            .any(|membership| {
                membership.organization_id == organization_id && required_role(&membership.role)
            })
    }
}

async fn list_active_memberships(
    pool: &PgPool,
    user_id: &str,
) -> Result<Vec<OrganizationMembership>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            membership.id,
            membership.organization_id,
            organization.display_name AS organization_name,
            organization.organization_type,
            membership.user_id,
            membership.role,
            membership.status,
            membership.scope_type,
            membership.scope_id
        FROM organization_memberships membership
        JOIN organizations organization ON organization.id = membership.organization_id
        WHERE membership.user_id = $1
            AND membership.status = 'active'
            AND organization.status = 'active'
        ORDER BY organization.display_name ASC, membership.role ASC, membership.scope_type ASC
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .filter_map(|row| {
            let role: String = row.get("role");
            Some(OrganizationMembership {
                id: row.get("id"),
                organization_id: row.get("organization_id"),
                organization_name: row.get("organization_name"),
                organization_type: row.get("organization_type"),
                user_id: row.get("user_id"),
                role: access_role_from_storage(&role)?,
                status: row.get("status"),
                scope_type: row.get("scope_type"),
                scope_id: row.get("scope_id"),
            })
        })
        .collect())
}

fn seed_memberships(user_id: &str) -> Vec<OrganizationMembership> {
    if user_id != "local-development-user" {
        return Vec::new();
    }

    vec![OrganizationMembership {
        id: "membership_local_owner_demo".to_string(),
        organization_id: "org_demo_landscaping".to_string(),
        organization_name: "Grover Demo Landscaping".to_string(),
        organization_type: "yard_care_company".to_string(),
        user_id: user_id.to_string(),
        role: AccessRole::OrganizationOwner,
        status: "active".to_string(),
        scope_type: "organization".to_string(),
        scope_id: Some("org_demo_landscaping".to_string()),
    }]
}

pub fn access_role_from_storage(role: &str) -> Option<AccessRole> {
    match role {
        "organization_owner" => Some(AccessRole::OrganizationOwner),
        "manager" => Some(AccessRole::Manager),
        "crew_lead" => Some(AccessRole::CrewLead),
        "crew_member" => Some(AccessRole::CrewMember),
        "property_owner" => Some(AccessRole::PropertyOwner),
        "property_manager" => Some(AccessRole::PropertyManager),
        "support_admin" => Some(AccessRole::SupportAdmin),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::{access_role_from_storage, OrganizationRepository};
    use crate::access_control::{can_manage_schedule, AccessRole};

    #[test]
    fn maps_storage_roles_to_access_roles() {
        assert_eq!(
            access_role_from_storage("organization_owner"),
            Some(AccessRole::OrganizationOwner)
        );
        assert_eq!(
            access_role_from_storage("property_manager"),
            Some(AccessRole::PropertyManager)
        );
        assert_eq!(access_role_from_storage("unknown"), None);
    }

    #[tokio::test]
    async fn local_development_user_has_seed_membership_without_database() {
        let repository = OrganizationRepository::default();

        let memberships = repository
            .list_active_memberships("local-development-user")
            .await;

        assert_eq!(memberships.len(), 1);
        assert_eq!(memberships[0].organization_id, "org_demo_landscaping");
        assert_eq!(memberships[0].role, AccessRole::OrganizationOwner);
    }

    #[tokio::test]
    async fn unknown_user_has_no_seed_memberships_without_database() {
        let repository = OrganizationRepository::default();

        assert!(repository
            .list_active_memberships("other-user")
            .await
            .is_empty());
    }

    #[tokio::test]
    async fn membership_role_check_uses_active_seed_memberships() {
        let repository = OrganizationRepository::default();

        assert!(
            repository
                .user_has_active_membership(
                    "local-development-user",
                    "org_demo_landscaping",
                    can_manage_schedule,
                )
                .await
        );
    }
}
