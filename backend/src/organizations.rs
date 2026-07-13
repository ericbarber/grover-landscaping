use crate::access_control::AccessRole;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use uuid::Uuid;

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

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateOrganizationInvitationRequest {
    pub invitee_email: String,
    pub role: String,
    pub scope_type: Option<String>,
    pub scope_id: Option<String>,
    pub expires_at: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct UpdateOrganizationMembershipRoleRequest {
    pub role: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OrganizationInvitationResponse {
    pub id: String,
    pub organization_id: String,
    pub invitee_email: String,
    pub role: String,
    pub status: String,
    pub scope_type: String,
    pub scope_id: Option<String>,
    pub token: String,
    pub membership_id: String,
    pub invited_by_user_id: String,
    pub accepted_by_user_id: Option<String>,
    pub expires_at: Option<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OrganizationInvitationAcceptanceResponse {
    pub invitation: OrganizationInvitationResponse,
    pub membership: OrganizationMembership,
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

    pub async fn create_invitation(
        &self,
        organization_id: &str,
        actor_user_id: &str,
        request: CreateOrganizationInvitationRequest,
    ) -> Option<OrganizationInvitationResponse> {
        let request = normalize_create_invitation_request(request);
        if validate_create_invitation_request(&request).is_err() {
            return None;
        }

        if let Some(pool) = &self.pool {
            if let Ok(Some(invitation)) =
                create_invitation(pool, organization_id, actor_user_id, &request).await
            {
                return Some(invitation);
            }
        }

        Some(local_invitation_response(
            organization_id,
            actor_user_id,
            request,
        ))
    }

    pub async fn accept_invitation(
        &self,
        token: &str,
        accepting_user_id: &str,
    ) -> Option<OrganizationInvitationAcceptanceResponse> {
        if token.trim().is_empty() {
            return None;
        }

        if let Some(pool) = &self.pool {
            if let Ok(accepted) = accept_invitation(pool, token.trim(), accepting_user_id).await {
                return accepted;
            }
        }

        local_invitation_acceptance(token, accepting_user_id)
    }

    pub async fn update_membership_role(
        &self,
        organization_id: &str,
        membership_id: &str,
        actor_user_id: &str,
        request: UpdateOrganizationMembershipRoleRequest,
    ) -> Option<OrganizationMembership> {
        let role = request.role.trim();
        let access_role = access_role_from_storage(role)?;

        if let Some(pool) = &self.pool {
            if let Ok(updated) = update_membership_role(
                pool,
                organization_id,
                membership_id,
                actor_user_id,
                access_role_to_storage(&access_role),
            )
            .await
            {
                return updated;
            }
        }

        local_membership_role_update(
            organization_id,
            membership_id,
            accepting_or_actor(actor_user_id),
            access_role,
        )
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
            organization_membership_from_row(row, role)
        })
        .collect())
}

async fn create_invitation(
    pool: &PgPool,
    organization_id: &str,
    actor_user_id: &str,
    request: &CreateOrganizationInvitationRequest,
) -> Result<Option<OrganizationInvitationResponse>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let invitation_id = format!("invitation_{}", Uuid::new_v4().simple());
    let membership_id = format!("membership_{}", Uuid::new_v4().simple());
    let token = format!("invite_{}", Uuid::new_v4().simple());
    let role = request.role.trim();
    let scope_type = request
        .scope_type
        .as_deref()
        .unwrap_or("organization")
        .trim()
        .to_string();
    let scope_id = request
        .scope_id
        .clone()
        .or_else(|| Some(organization_id.to_string()));

    sqlx::query(
        r#"
        INSERT INTO organization_memberships (
            id,
            organization_id,
            user_id,
            role,
            status,
            scope_type,
            scope_id
        )
        VALUES ($1, $2, $3, $4, 'invited', $5, $6)
        "#,
    )
    .bind(&membership_id)
    .bind(organization_id)
    .bind(&request.invitee_email)
    .bind(role)
    .bind(&scope_type)
    .bind(&scope_id)
    .execute(&mut *transaction)
    .await?;

    let row = sqlx::query(
        r#"
        INSERT INTO organization_invitations (
            id,
            organization_id,
            invitee_email,
            role,
            status,
            scope_type,
            scope_id,
            token,
            membership_id,
            invited_by_user_id,
            expires_at
        )
        VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10::timestamptz)
        RETURNING
            id,
            organization_id,
            invitee_email,
            role,
            status,
            scope_type,
            scope_id,
            token,
            membership_id,
            invited_by_user_id,
            accepted_by_user_id,
            expires_at::text AS expires_at
        "#,
    )
    .bind(&invitation_id)
    .bind(organization_id)
    .bind(&request.invitee_email)
    .bind(role)
    .bind(&scope_type)
    .bind(&scope_id)
    .bind(&token)
    .bind(&membership_id)
    .bind(actor_user_id)
    .bind(&request.expires_at)
    .fetch_optional(&mut *transaction)
    .await?;

    transaction.commit().await?;

    Ok(row.map(organization_invitation_response_from_row))
}

async fn accept_invitation(
    pool: &PgPool,
    token: &str,
    accepting_user_id: &str,
) -> Result<Option<OrganizationInvitationAcceptanceResponse>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let invitation_row = sqlx::query(
        r#"
        SELECT
            id,
            organization_id,
            invitee_email,
            role,
            status,
            scope_type,
            scope_id,
            token,
            membership_id,
            invited_by_user_id,
            accepted_by_user_id,
            expires_at::text AS expires_at
        FROM organization_invitations
        WHERE token = $1
          AND status = 'pending'
          AND (expires_at IS NULL OR expires_at > NOW())
        FOR UPDATE
        "#,
    )
    .bind(token)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(invitation_row) = invitation_row else {
        transaction.commit().await?;
        return Ok(None);
    };

    let invitation_id: String = invitation_row.get("id");
    let organization_id: String = invitation_row.get("organization_id");
    let membership_id: String = invitation_row.get("membership_id");

    sqlx::query(
        r#"
        UPDATE organization_invitations
        SET status = 'accepted',
            accepted_by_user_id = $2,
            accepted_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        "#,
    )
    .bind(&invitation_id)
    .bind(accepting_user_id)
    .execute(&mut *transaction)
    .await?;

    let membership_row = sqlx::query(
        r#"
        UPDATE organization_memberships membership
        SET user_id = $3,
            status = 'active',
            updated_at = NOW()
        FROM organizations organization
        WHERE membership.id = $1
          AND membership.organization_id = $2
          AND organization.id = membership.organization_id
        RETURNING
            membership.id,
            membership.organization_id,
            organization.display_name AS organization_name,
            organization.organization_type,
            membership.user_id,
            membership.role,
            membership.status,
            membership.scope_type,
            membership.scope_id
        "#,
    )
    .bind(&membership_id)
    .bind(&organization_id)
    .bind(accepting_user_id)
    .fetch_optional(&mut *transaction)
    .await?;

    insert_access_audit_event(
        &mut transaction,
        accepting_user_id,
        &organization_id,
        "invite_accepted",
        &membership_id,
    )
    .await?;

    transaction.commit().await?;

    let role: String = membership_row
        .as_ref()
        .map(|row| row.get("role"))
        .unwrap_or_default();
    let Some(membership) =
        membership_row.and_then(|row| organization_membership_from_row(row, role))
    else {
        return Ok(None);
    };
    let mut invitation = organization_invitation_response_from_row(invitation_row);
    invitation.status = "accepted".to_string();
    invitation.accepted_by_user_id = Some(accepting_user_id.to_string());

    Ok(Some(OrganizationInvitationAcceptanceResponse {
        invitation,
        membership,
    }))
}

async fn update_membership_role(
    pool: &PgPool,
    organization_id: &str,
    membership_id: &str,
    actor_user_id: &str,
    role: &str,
) -> Result<Option<OrganizationMembership>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        r#"
        UPDATE organization_memberships membership
        SET role = $3,
            updated_at = NOW()
        FROM organizations organization
        WHERE membership.id = $1
          AND membership.organization_id = $2
          AND organization.id = membership.organization_id
        RETURNING
            membership.id,
            membership.organization_id,
            organization.display_name AS organization_name,
            organization.organization_type,
            membership.user_id,
            membership.role,
            membership.status,
            membership.scope_type,
            membership.scope_id
        "#,
    )
    .bind(membership_id)
    .bind(organization_id)
    .bind(role)
    .fetch_optional(&mut *transaction)
    .await?;

    if row.is_some() {
        insert_access_audit_event(
            &mut transaction,
            actor_user_id,
            organization_id,
            "role_changed",
            membership_id,
        )
        .await?;
    }

    transaction.commit().await?;

    let role: String = row.as_ref().map(|row| row.get("role")).unwrap_or_default();
    Ok(row.and_then(|row| organization_membership_from_row(row, role)))
}

async fn insert_access_audit_event(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    actor_user_id: &str,
    organization_id: &str,
    event_kind: &str,
    target_id: &str,
) -> Result<(), sqlx::Error> {
    let audit_id = format!("audit_{}_{}", event_kind, Uuid::new_v4().simple());
    sqlx::query(
        r#"
        INSERT INTO access_audit_events (
            id,
            actor_user_id,
            organization_id,
            event_kind,
            target_id,
            occurred_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        "#,
    )
    .bind(audit_id)
    .bind(actor_user_id)
    .bind(organization_id)
    .bind(event_kind)
    .bind(target_id)
    .execute(&mut **transaction)
    .await?;

    Ok(())
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

pub fn access_role_to_storage(role: &AccessRole) -> &'static str {
    match role {
        AccessRole::OrganizationOwner => "organization_owner",
        AccessRole::Manager => "manager",
        AccessRole::CrewLead => "crew_lead",
        AccessRole::CrewMember => "crew_member",
        AccessRole::PropertyOwner => "property_owner",
        AccessRole::PropertyManager => "property_manager",
        AccessRole::SupportAdmin => "support_admin",
    }
}

pub fn is_valid_membership_scope_type(scope_type: &str) -> bool {
    matches!(
        scope_type,
        "organization" | "region" | "branch" | "crew" | "portfolio" | "property"
    )
}

pub fn validate_create_invitation_request(
    request: &CreateOrganizationInvitationRequest,
) -> Result<(), &'static str> {
    if !valid_invitee_email(&request.invitee_email) {
        return Err("invitee_email_invalid");
    }

    if access_role_from_storage(request.role.trim()).is_none() {
        return Err("role_invalid");
    }

    if !is_valid_membership_scope_type(
        request
            .scope_type
            .as_deref()
            .unwrap_or("organization")
            .trim(),
    ) {
        return Err("scope_type_invalid");
    }

    Ok(())
}

fn normalize_create_invitation_request(
    request: CreateOrganizationInvitationRequest,
) -> CreateOrganizationInvitationRequest {
    CreateOrganizationInvitationRequest {
        invitee_email: request.invitee_email.trim().to_ascii_lowercase(),
        role: request.role.trim().to_string(),
        scope_type: request
            .scope_type
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_string),
        scope_id: request
            .scope_id
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_string),
        expires_at: request
            .expires_at
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_string),
    }
}

fn valid_invitee_email(email: &str) -> bool {
    let email = email.trim();
    !email.is_empty()
        && email.len() <= 320
        && email.contains('@')
        && !email.contains(char::is_whitespace)
}

fn organization_membership_from_row(
    row: sqlx::postgres::PgRow,
    role: String,
) -> Option<OrganizationMembership> {
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
}

fn organization_invitation_response_from_row(
    row: sqlx::postgres::PgRow,
) -> OrganizationInvitationResponse {
    OrganizationInvitationResponse {
        id: row.get("id"),
        organization_id: row.get("organization_id"),
        invitee_email: row.get("invitee_email"),
        role: row.get("role"),
        status: row.get("status"),
        scope_type: row.get("scope_type"),
        scope_id: row.get("scope_id"),
        token: row.get("token"),
        membership_id: row.get("membership_id"),
        invited_by_user_id: row.get("invited_by_user_id"),
        accepted_by_user_id: row.get("accepted_by_user_id"),
        expires_at: row.get("expires_at"),
        persisted: true,
    }
}

fn local_invitation_response(
    organization_id: &str,
    actor_user_id: &str,
    request: CreateOrganizationInvitationRequest,
) -> OrganizationInvitationResponse {
    let role = request.role;
    let token = format!(
        "invite_token_{}_{}",
        organization_id,
        request.invitee_email.replace('@', "_at_")
    );
    OrganizationInvitationResponse {
        id: format!("invitation_{}_{}", organization_id, request.invitee_email),
        organization_id: organization_id.to_string(),
        invitee_email: request.invitee_email,
        role,
        status: "pending".to_string(),
        scope_type: request
            .scope_type
            .unwrap_or_else(|| "organization".to_string()),
        scope_id: request
            .scope_id
            .or_else(|| Some(organization_id.to_string())),
        token,
        membership_id: format!("membership_invited_{}", organization_id),
        invited_by_user_id: actor_user_id.to_string(),
        accepted_by_user_id: None,
        expires_at: request.expires_at,
        persisted: false,
    }
}

fn local_invitation_acceptance(
    token: &str,
    accepting_user_id: &str,
) -> Option<OrganizationInvitationAcceptanceResponse> {
    if !token.starts_with("invite_token_") {
        return None;
    }

    let invitation = OrganizationInvitationResponse {
        id: "invitation_local_acceptance".to_string(),
        organization_id: "org_demo_landscaping".to_string(),
        invitee_email: "invited@example.com".to_string(),
        role: "manager".to_string(),
        status: "accepted".to_string(),
        scope_type: "organization".to_string(),
        scope_id: Some("org_demo_landscaping".to_string()),
        token: token.to_string(),
        membership_id: "membership_local_accepted".to_string(),
        invited_by_user_id: "local-development-user".to_string(),
        accepted_by_user_id: Some(accepting_user_id.to_string()),
        expires_at: None,
        persisted: false,
    };
    let membership = OrganizationMembership {
        id: invitation.membership_id.clone(),
        organization_id: invitation.organization_id.clone(),
        organization_name: "Grover Demo Landscaping".to_string(),
        organization_type: "yard_care_company".to_string(),
        user_id: accepting_user_id.to_string(),
        role: AccessRole::Manager,
        status: "active".to_string(),
        scope_type: "organization".to_string(),
        scope_id: Some("org_demo_landscaping".to_string()),
    };

    Some(OrganizationInvitationAcceptanceResponse {
        invitation,
        membership,
    })
}

fn local_membership_role_update(
    organization_id: &str,
    membership_id: &str,
    actor_user_id: &str,
    role: AccessRole,
) -> Option<OrganizationMembership> {
    if organization_id != "org_demo_landscaping" {
        return None;
    }

    Some(OrganizationMembership {
        id: membership_id.to_string(),
        organization_id: organization_id.to_string(),
        organization_name: "Grover Demo Landscaping".to_string(),
        organization_type: "yard_care_company".to_string(),
        user_id: actor_user_id.to_string(),
        role,
        status: "active".to_string(),
        scope_type: "organization".to_string(),
        scope_id: Some(organization_id.to_string()),
    })
}

fn accepting_or_actor(actor_user_id: &str) -> &str {
    actor_user_id
}

#[cfg(test)]
mod tests {
    use super::{
        access_role_from_storage, access_role_to_storage, validate_create_invitation_request,
        CreateOrganizationInvitationRequest, OrganizationRepository,
        UpdateOrganizationMembershipRoleRequest,
    };
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
        assert_eq!(
            access_role_to_storage(&AccessRole::CrewMember),
            "crew_member"
        );
    }

    #[test]
    fn validates_invitation_payloads() {
        let request = CreateOrganizationInvitationRequest {
            invitee_email: "new.manager@example.com".to_string(),
            role: "manager".to_string(),
            scope_type: Some("organization".to_string()),
            scope_id: Some("org_demo_landscaping".to_string()),
            expires_at: None,
        };

        assert_eq!(validate_create_invitation_request(&request), Ok(()));

        let mut bad_email = request.clone();
        bad_email.invitee_email = "not-an-email".to_string();
        assert_eq!(
            validate_create_invitation_request(&bad_email),
            Err("invitee_email_invalid")
        );

        let mut bad_role = request;
        bad_role.role = "dispatcher".to_string();
        assert_eq!(
            validate_create_invitation_request(&bad_role),
            Err("role_invalid")
        );
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

    #[tokio::test]
    async fn repository_returns_local_invitation_without_database() {
        let repository = OrganizationRepository::default();

        let invitation = repository
            .create_invitation(
                "org_demo_landscaping",
                "local-development-user",
                CreateOrganizationInvitationRequest {
                    invitee_email: " New.Manager@Example.com ".to_string(),
                    role: "manager".to_string(),
                    scope_type: None,
                    scope_id: None,
                    expires_at: None,
                },
            )
            .await
            .expect("local invitation should be returned");

        assert_eq!(invitation.organization_id, "org_demo_landscaping");
        assert_eq!(invitation.invitee_email, "new.manager@example.com");
        assert_eq!(invitation.status, "pending");
        assert!(!invitation.persisted);
    }

    #[tokio::test]
    async fn repository_accepts_local_invitation_tokens_without_database() {
        let repository = OrganizationRepository::default();

        let accepted = repository
            .accept_invitation("invite_token_org_demo_landscaping_manager", "accepted-user")
            .await
            .expect("local invite token should be accepted");

        assert_eq!(accepted.invitation.status, "accepted");
        assert_eq!(accepted.membership.user_id, "accepted-user");
        assert_eq!(accepted.membership.role, AccessRole::Manager);
        assert!(!accepted.invitation.persisted);
    }

    #[tokio::test]
    async fn repository_returns_local_role_update_without_database() {
        let repository = OrganizationRepository::default();

        let membership = repository
            .update_membership_role(
                "org_demo_landscaping",
                "membership_local_owner_demo",
                "local-development-user",
                UpdateOrganizationMembershipRoleRequest {
                    role: "manager".to_string(),
                },
            )
            .await
            .expect("local role update should be returned");

        assert_eq!(membership.role, AccessRole::Manager);
        assert_eq!(membership.status, "active");
    }
}
