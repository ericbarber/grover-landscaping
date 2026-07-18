use crate::access_control::AccessRole;
use serde::{Deserialize, Serialize};
use serde_json::json;
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
    pub verified_email: Option<String>,
    pub claim_roles: Vec<AccessRole>,
    pub memberships: Vec<OrganizationMembership>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct BootstrapOrganizationRequest {
    pub display_name: String,
    pub organization_type: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct BootstrapOrganizationResponse {
    pub organization_id: String,
    pub display_name: String,
    pub organization_type: String,
    pub membership: OrganizationMembership,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct OrganizationProfile {
    pub id: String,
    pub display_name: String,
    pub organization_type: String,
    pub status: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct UpdateOrganizationProfileRequest {
    pub display_name: String,
    pub organization_type: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum BootstrapOrganizationResult {
    Created(Box<BootstrapOrganizationResponse>),
    AlreadyMember,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum MembershipRoleUpdateResult {
    Updated(OrganizationMembership),
    LastActiveOwner,
    NotFound,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum MembershipStatusUpdateResult {
    Updated(OrganizationMembership),
    LastActiveOwner,
    NotManageable,
    NotFound,
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
pub struct ReissueOrganizationInvitationRequest {
    pub expires_at: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct UpdateOrganizationMembershipRoleRequest {
    pub role: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct UpdateOrganizationMembershipStatusRequest {
    pub status: String,
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
pub struct OrganizationInvitationSummary {
    pub id: String,
    pub organization_id: String,
    pub invitee_email: String,
    pub role: String,
    pub status: String,
    pub scope_type: String,
    pub scope_id: Option<String>,
    pub membership_id: String,
    pub expires_at: Option<String>,
    pub delivery_notification_id: Option<String>,
    pub delivery_status: Option<String>,
    pub delivery_attempt_count: i32,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct TeamAdministrationActivity {
    pub id: String,
    pub actor_user_id: String,
    pub organization_id: String,
    pub event_kind: String,
    pub target_id: String,
    pub occurred_at: String,
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
        verified_email: Option<String>,
        claim_roles: Vec<AccessRole>,
    ) -> PrincipalAccessSummary {
        let memberships = self.list_active_memberships(user_id).await;
        let _ = self.record_login_audit_events(user_id, &memberships).await;

        PrincipalAccessSummary {
            user_id: user_id.to_string(),
            username: username.to_string(),
            verified_email,
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

    pub async fn list_organization_memberships(
        &self,
        organization_id: &str,
    ) -> Vec<OrganizationMembership> {
        if let Some(pool) = &self.pool {
            if let Ok(memberships) = list_organization_memberships(pool, organization_id).await {
                return memberships;
            }
        }
        seed_memberships("local-development-user")
            .into_iter()
            .filter(|membership| membership.organization_id == organization_id)
            .collect()
    }

    pub async fn list_team_administration_activity(
        &self,
        organization_id: &str,
    ) -> Vec<TeamAdministrationActivity> {
        let Some(pool) = &self.pool else {
            return Vec::new();
        };
        list_team_administration_activity(pool, organization_id)
            .await
            .unwrap_or_default()
    }

    async fn record_login_audit_events(
        &self,
        user_id: &str,
        memberships: &[OrganizationMembership],
    ) -> Result<usize, sqlx::Error> {
        let Some(pool) = &self.pool else {
            return Ok(0);
        };
        if memberships.is_empty() {
            return Ok(0);
        }

        let mut transaction = pool.begin().await?;
        let mut inserted = 0;
        for membership in memberships {
            insert_access_audit_event(
                &mut transaction,
                user_id,
                &membership.organization_id,
                "login",
                user_id,
            )
            .await?;
            inserted += 1;
        }
        transaction.commit().await?;

        Ok(inserted)
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

    pub async fn bootstrap_organization(
        &self,
        user_id: &str,
        request: BootstrapOrganizationRequest,
    ) -> Result<BootstrapOrganizationResult, sqlx::Error> {
        let request = normalize_bootstrap_organization_request(request);
        if !self.list_active_memberships(user_id).await.is_empty() {
            return Ok(BootstrapOrganizationResult::AlreadyMember);
        }
        let Some(pool) = &self.pool else {
            return Ok(BootstrapOrganizationResult::Unavailable);
        };
        bootstrap_organization(pool, user_id, &request).await
    }

    pub async fn organization_profile(&self, organization_id: &str) -> Option<OrganizationProfile> {
        if let Some(pool) = &self.pool {
            return organization_profile(pool, organization_id)
                .await
                .ok()
                .flatten();
        }
        local_organization_profile(organization_id)
    }

    pub async fn update_organization_profile(
        &self,
        organization_id: &str,
        actor_user_id: &str,
        request: UpdateOrganizationProfileRequest,
    ) -> Option<OrganizationProfile> {
        let request = normalize_update_organization_profile_request(request);
        if validate_update_organization_profile_request(&request).is_err() {
            return None;
        }
        if let Some(pool) = &self.pool {
            return update_organization_profile(pool, organization_id, actor_user_id, &request)
                .await
                .ok()
                .flatten();
        }
        local_organization_profile(organization_id).map(|profile| OrganizationProfile {
            display_name: request.display_name,
            organization_type: request.organization_type,
            ..profile
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
            return create_invitation(pool, organization_id, actor_user_id, &request)
                .await
                .ok()
                .flatten();
        }

        Some(local_invitation_response(
            organization_id,
            actor_user_id,
            request,
        ))
    }

    pub async fn list_invitations(
        &self,
        organization_id: &str,
    ) -> Vec<OrganizationInvitationSummary> {
        let Some(pool) = &self.pool else {
            return Vec::new();
        };
        list_invitations(pool, organization_id)
            .await
            .unwrap_or_default()
    }

    pub async fn revoke_invitation(
        &self,
        organization_id: &str,
        invitation_id: &str,
        actor_user_id: &str,
    ) -> Option<OrganizationInvitationSummary> {
        let pool = self.pool.as_ref()?;
        revoke_invitation(pool, organization_id, invitation_id, actor_user_id)
            .await
            .ok()
            .flatten()
    }

    pub async fn reissue_invitation(
        &self,
        organization_id: &str,
        invitation_id: &str,
        actor_user_id: &str,
        request: ReissueOrganizationInvitationRequest,
    ) -> Option<OrganizationInvitationResponse> {
        let expires_at = request.expires_at.trim();
        if validate_reissue_invitation_request(&request).is_err() {
            return None;
        }
        let pool = self.pool.as_ref()?;
        reissue_invitation(
            pool,
            organization_id,
            invitation_id,
            actor_user_id,
            expires_at,
        )
        .await
        .ok()
        .flatten()
    }

    pub async fn accept_invitation(
        &self,
        token: &str,
        accepting_user_id: &str,
        accepting_email: Option<&str>,
    ) -> Option<OrganizationInvitationAcceptanceResponse> {
        if token.trim().is_empty() {
            return None;
        }
        let accepting_email = accepting_email?.trim().to_ascii_lowercase();
        if !valid_invitee_email(&accepting_email) {
            return None;
        }

        if let Some(pool) = &self.pool {
            if let Ok(accepted) =
                accept_invitation(pool, token.trim(), accepting_user_id, &accepting_email).await
            {
                return accepted;
            }
        }

        local_invitation_acceptance(token, accepting_user_id, &accepting_email)
    }

    pub async fn update_membership_role(
        &self,
        organization_id: &str,
        membership_id: &str,
        actor_user_id: &str,
        request: UpdateOrganizationMembershipRoleRequest,
    ) -> MembershipRoleUpdateResult {
        let role = request.role.trim();
        let Some(access_role) = access_role_from_storage(role) else {
            return MembershipRoleUpdateResult::NotFound;
        };

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

        let Some(membership) = local_membership_role_update(
            organization_id,
            membership_id,
            accepting_or_actor(actor_user_id),
            access_role,
        ) else {
            return MembershipRoleUpdateResult::NotFound;
        };
        if membership.id == "membership_local_owner_demo"
            && membership.role != AccessRole::OrganizationOwner
        {
            MembershipRoleUpdateResult::LastActiveOwner
        } else {
            MembershipRoleUpdateResult::Updated(membership)
        }
    }

    pub async fn update_membership_status(
        &self,
        organization_id: &str,
        membership_id: &str,
        actor_user_id: &str,
        request: UpdateOrganizationMembershipStatusRequest,
    ) -> MembershipStatusUpdateResult {
        let status = request.status.trim();
        if !matches!(status, "active" | "suspended") {
            return MembershipStatusUpdateResult::NotManageable;
        }
        if let Some(pool) = &self.pool {
            if let Ok(updated) = update_membership_status(
                pool,
                organization_id,
                membership_id,
                actor_user_id,
                status,
            )
            .await
            {
                return updated;
            }
        }
        let Some(membership) =
            seed_memberships("local-development-user")
                .into_iter()
                .find(|membership| {
                    membership.organization_id == organization_id && membership.id == membership_id
                })
        else {
            return MembershipStatusUpdateResult::NotFound;
        };
        if membership.role == AccessRole::OrganizationOwner && status == "suspended" {
            return MembershipStatusUpdateResult::LastActiveOwner;
        }
        MembershipStatusUpdateResult::Updated(OrganizationMembership {
            status: status.to_string(),
            ..membership
        })
    }
}

pub fn validate_bootstrap_organization_request(
    request: &BootstrapOrganizationRequest,
) -> Result<(), &'static str> {
    let display_name = request.display_name.trim();
    if display_name.len() < 2 || display_name.len() > 120 {
        return Err("display_name_invalid");
    }
    if !matches!(
        request.organization_type.trim(),
        "yard_care_company" | "property_management_company"
    ) {
        return Err("organization_type_invalid");
    }
    Ok(())
}

pub fn validate_update_organization_profile_request(
    request: &UpdateOrganizationProfileRequest,
) -> Result<(), &'static str> {
    validate_bootstrap_organization_request(&BootstrapOrganizationRequest {
        display_name: request.display_name.clone(),
        organization_type: request.organization_type.clone(),
    })
}

fn normalize_update_organization_profile_request(
    request: UpdateOrganizationProfileRequest,
) -> UpdateOrganizationProfileRequest {
    UpdateOrganizationProfileRequest {
        display_name: request.display_name.trim().to_string(),
        organization_type: request.organization_type.trim().to_string(),
    }
}

fn normalize_bootstrap_organization_request(
    request: BootstrapOrganizationRequest,
) -> BootstrapOrganizationRequest {
    BootstrapOrganizationRequest {
        display_name: request.display_name.trim().to_string(),
        organization_type: request.organization_type.trim().to_string(),
    }
}

async fn bootstrap_organization(
    pool: &PgPool,
    user_id: &str,
    request: &BootstrapOrganizationRequest,
) -> Result<BootstrapOrganizationResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    sqlx::query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))")
        .bind(user_id)
        .execute(&mut *transaction)
        .await?;
    let existing_membership: bool = sqlx::query_scalar(
        "SELECT EXISTS (SELECT 1 FROM organization_memberships WHERE user_id = $1 AND status = 'active')",
    )
    .bind(user_id)
    .fetch_one(&mut *transaction)
    .await?;
    if existing_membership {
        transaction.rollback().await?;
        return Ok(BootstrapOrganizationResult::AlreadyMember);
    }

    let organization_id = format!("org_{}", Uuid::new_v4().simple());
    let membership_id = format!("membership_{}", Uuid::new_v4().simple());
    sqlx::query(
        r#"
        INSERT INTO organizations (id, display_name, organization_type, status)
        VALUES ($1, $2, $3, 'active')
        "#,
    )
    .bind(&organization_id)
    .bind(&request.display_name)
    .bind(&request.organization_type)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        r#"
        INSERT INTO organization_memberships (
            id, organization_id, user_id, role, status, scope_type, scope_id
        )
        VALUES ($1, $2, $3, 'organization_owner', 'active', 'organization', $2)
        "#,
    )
    .bind(&membership_id)
    .bind(&organization_id)
    .bind(user_id)
    .execute(&mut *transaction)
    .await?;
    insert_access_audit_event(
        &mut transaction,
        user_id,
        &organization_id,
        "organization_bootstrapped",
        &organization_id,
    )
    .await?;
    transaction.commit().await?;

    Ok(BootstrapOrganizationResult::Created(Box::new(
        BootstrapOrganizationResponse {
            organization_id: organization_id.clone(),
            display_name: request.display_name.clone(),
            organization_type: request.organization_type.clone(),
            membership: OrganizationMembership {
                id: membership_id,
                organization_id: organization_id.clone(),
                organization_name: request.display_name.clone(),
                organization_type: request.organization_type.clone(),
                user_id: user_id.to_string(),
                role: AccessRole::OrganizationOwner,
                status: "active".to_string(),
                scope_type: "organization".to_string(),
                scope_id: Some(organization_id),
            },
            persisted: true,
        },
    )))
}

async fn organization_profile(
    pool: &PgPool,
    organization_id: &str,
) -> Result<Option<OrganizationProfile>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, display_name, organization_type, status FROM organizations WHERE id = $1",
    )
    .bind(organization_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(organization_profile_from_row))
}

async fn update_organization_profile(
    pool: &PgPool,
    organization_id: &str,
    actor_user_id: &str,
    request: &UpdateOrganizationProfileRequest,
) -> Result<Option<OrganizationProfile>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        r#"
        UPDATE organizations
        SET display_name = $2,
            organization_type = $3,
            updated_at = NOW()
        WHERE id = $1
          AND status = 'active'
        RETURNING id, display_name, organization_type, status
        "#,
    )
    .bind(organization_id)
    .bind(&request.display_name)
    .bind(&request.organization_type)
    .fetch_optional(&mut *transaction)
    .await?;
    if row.is_some() {
        insert_access_audit_event(
            &mut transaction,
            actor_user_id,
            organization_id,
            "organization_profile_updated",
            organization_id,
        )
        .await?;
    }
    transaction.commit().await?;
    Ok(row.map(organization_profile_from_row))
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

async fn list_organization_memberships(
    pool: &PgPool,
    organization_id: &str,
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
        JOIN organizations organization
          ON organization.id = membership.organization_id
        WHERE membership.organization_id = $1
          AND membership.status IN ('active', 'suspended')
        ORDER BY
          CASE membership.role WHEN 'organization_owner' THEN 0 ELSE 1 END,
          membership.user_id,
          membership.id
        "#,
    )
    .bind(organization_id)
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

async fn list_team_administration_activity(
    pool: &PgPool,
    organization_id: &str,
) -> Result<Vec<TeamAdministrationActivity>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            id,
            actor_user_id,
            organization_id,
            event_kind,
            target_id,
            occurred_at::text AS occurred_at
        FROM access_audit_events
        WHERE organization_id = $1
          AND event_kind IN (
            'organization_profile_updated',
            'invite_accepted',
            'invitation_revoked',
            'invitation_reissued',
            'role_changed',
            'membership_suspended',
            'membership_reactivated'
          )
        ORDER BY occurred_at DESC, id DESC
        LIMIT 25
        "#,
    )
    .bind(organization_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|row| TeamAdministrationActivity {
            id: row.get("id"),
            actor_user_id: row.get("actor_user_id"),
            organization_id: row.get("organization_id"),
            event_kind: row.get("event_kind"),
            target_id: row.get("target_id"),
            occurred_at: row.get("occurred_at"),
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
    let duplicate_lock_key = format!(
        "organization-invitation:{organization_id}:{}",
        request.invitee_email
    );
    sqlx::query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))")
        .bind(&duplicate_lock_key)
        .execute(&mut *transaction)
        .await?;
    let pending_exists: bool = sqlx::query_scalar(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM organization_invitations
            WHERE organization_id = $1
              AND LOWER(BTRIM(invitee_email)) = LOWER(BTRIM($2))
              AND status = 'pending'
              AND (expires_at IS NULL OR expires_at > NOW())
        )
        "#,
    )
    .bind(organization_id)
    .bind(&request.invitee_email)
    .fetch_one(&mut *transaction)
    .await?;
    if pending_exists {
        transaction.rollback().await?;
        return Ok(None);
    }

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

    sqlx::query(
        r#"
        INSERT INTO notification_outbox (
            id,
            organization_id,
            entity_type,
            entity_id,
            channel,
            recipient,
            template_key,
            payload
        )
        VALUES ($1, $2, 'organization_invitation', $3, 'email', $4, 'organization_invitation', $5)
        "#,
    )
    .bind(format!("notification_{}", Uuid::new_v4().simple()))
    .bind(organization_id)
    .bind(&invitation_id)
    .bind(&request.invitee_email)
    .bind(json!({
        "organization_id": organization_id,
        "invitation_id": invitation_id,
        "invitee_email": request.invitee_email,
        "role": role,
        "token": token,
        "acceptance_path": format!("/organization-invitations/{}", token),
        "expires_at": request.expires_at,
    }))
    .execute(&mut *transaction)
    .await?;

    transaction.commit().await?;

    Ok(row.map(organization_invitation_response_from_row))
}

async fn list_invitations(
    pool: &PgPool,
    organization_id: &str,
) -> Result<Vec<OrganizationInvitationSummary>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            id,
            organization_id,
            invitee_email,
            role,
            CASE
              WHEN invitation.status = 'pending'
                AND invitation.expires_at <= NOW()
              THEN 'expired'
              ELSE invitation.status
            END AS status,
            scope_type,
            scope_id,
            membership_id,
            invitation.expires_at::text AS expires_at,
            delivery.id AS delivery_notification_id,
            delivery.status AS delivery_status,
            COALESCE(delivery.attempt_count, 0) AS delivery_attempt_count
        FROM organization_invitations invitation
        LEFT JOIN LATERAL (
            SELECT id, status, attempt_count
            FROM notification_outbox
            WHERE entity_type = 'organization_invitation'
              AND entity_id = invitation.id
            ORDER BY created_at DESC, id DESC
            LIMIT 1
        ) delivery ON TRUE
        WHERE invitation.organization_id = $1
        ORDER BY invitation.created_at DESC, invitation.id DESC
        "#,
    )
    .bind(organization_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(organization_invitation_summary_from_row)
        .collect())
}

async fn revoke_invitation(
    pool: &PgPool,
    organization_id: &str,
    invitation_id: &str,
    actor_user_id: &str,
) -> Result<Option<OrganizationInvitationSummary>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        r#"
        UPDATE organization_invitations
        SET status = 'revoked',
            updated_at = NOW()
        WHERE id = $1
          AND organization_id = $2
          AND status = 'pending'
          AND (expires_at IS NULL OR expires_at > NOW())
        RETURNING
            id,
            organization_id,
            invitee_email,
            role,
            status,
            scope_type,
            scope_id,
            membership_id,
            expires_at::text AS expires_at
        "#,
    )
    .bind(invitation_id)
    .bind(organization_id)
    .fetch_optional(&mut *transaction)
    .await?;

    if let Some(invitation) = row.as_ref() {
        let membership_id: String = invitation.get("membership_id");
        sqlx::query(
            r#"
            UPDATE organization_memberships
            SET status = 'archived',
                updated_at = NOW()
            WHERE id = $1
              AND organization_id = $2
              AND status = 'invited'
            "#,
        )
        .bind(&membership_id)
        .bind(organization_id)
        .execute(&mut *transaction)
        .await?;
        insert_access_audit_event(
            &mut transaction,
            actor_user_id,
            organization_id,
            "invitation_revoked",
            invitation_id,
        )
        .await?;
    }

    transaction.commit().await?;
    Ok(row.map(organization_invitation_summary_from_row))
}

async fn reissue_invitation(
    pool: &PgPool,
    organization_id: &str,
    invitation_id: &str,
    actor_user_id: &str,
    expires_at: &str,
) -> Result<Option<OrganizationInvitationResponse>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let invitation = sqlx::query(
        r#"
        SELECT invitee_email, role, scope_type, scope_id, membership_id
        FROM organization_invitations
        WHERE id = $1
          AND organization_id = $2
          AND (
            status IN ('revoked', 'expired')
            OR (status = 'pending' AND expires_at <= NOW())
          )
          AND $3::timestamptz > NOW()
        FOR UPDATE
        "#,
    )
    .bind(invitation_id)
    .bind(organization_id)
    .bind(expires_at)
    .fetch_optional(&mut *transaction)
    .await?;

    let Some(invitation) = invitation else {
        transaction.rollback().await?;
        return Ok(None);
    };
    let invitee_email: String = invitation.get("invitee_email");
    let role: String = invitation.get("role");
    let scope_type: String = invitation.get("scope_type");
    let scope_id: Option<String> = invitation.get("scope_id");
    let membership_id: String = invitation.get("membership_id");
    let token = format!("invite_{}", Uuid::new_v4().simple());

    sqlx::query(
        r#"
        UPDATE organization_memberships
        SET user_id = $3,
            status = 'invited',
            updated_at = NOW()
        WHERE id = $1
          AND organization_id = $2
          AND status IN ('invited', 'archived')
        "#,
    )
    .bind(&membership_id)
    .bind(organization_id)
    .bind(&invitee_email)
    .execute(&mut *transaction)
    .await?;

    let row = sqlx::query(
        r#"
        UPDATE organization_invitations
        SET status = 'pending',
            token = $3,
            invited_by_user_id = $4,
            accepted_by_user_id = NULL,
            accepted_at = NULL,
            expires_at = $5::timestamptz,
            updated_at = NOW()
        WHERE id = $1
          AND organization_id = $2
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
    .bind(invitation_id)
    .bind(organization_id)
    .bind(&token)
    .bind(actor_user_id)
    .bind(expires_at)
    .fetch_one(&mut *transaction)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO notification_outbox (
            id, organization_id, entity_type, entity_id, channel, recipient,
            template_key, payload
        )
        VALUES ($1, $2, 'organization_invitation', $3, 'email', $4,
                'organization_invitation', $5)
        "#,
    )
    .bind(format!("notification_{}", Uuid::new_v4().simple()))
    .bind(organization_id)
    .bind(invitation_id)
    .bind(&invitee_email)
    .bind(json!({
        "organization_id": organization_id,
        "invitation_id": invitation_id,
        "invitee_email": invitee_email,
        "role": role,
        "scope_type": scope_type,
        "scope_id": scope_id,
        "token": token,
        "acceptance_path": format!("/organization-invitations/{}", token),
        "expires_at": expires_at,
        "reissued": true,
    }))
    .execute(&mut *transaction)
    .await?;
    insert_access_audit_event(
        &mut transaction,
        actor_user_id,
        organization_id,
        "invitation_reissued",
        invitation_id,
    )
    .await?;

    transaction.commit().await?;
    Ok(Some(organization_invitation_response_from_row(row)))
}

async fn accept_invitation(
    pool: &PgPool,
    token: &str,
    accepting_user_id: &str,
    accepting_email: &str,
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
          AND LOWER(BTRIM(invitee_email)) = LOWER(BTRIM($2))
          AND status = 'pending'
          AND (expires_at IS NULL OR expires_at > NOW())
        FOR UPDATE
        "#,
    )
    .bind(token)
    .bind(accepting_email)
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
) -> Result<MembershipRoleUpdateResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        r#"
        SELECT role, status
        FROM organization_memberships
        WHERE id = $1
          AND organization_id = $2
        FOR UPDATE
        "#,
    )
    .bind(membership_id)
    .bind(organization_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(MembershipRoleUpdateResult::NotFound);
    };
    let current_role: String = current.get("role");
    let current_status: String = current.get("status");
    if current_role == "organization_owner"
        && current_status == "active"
        && role != "organization_owner"
    {
        let active_owner_ids = sqlx::query_scalar::<_, String>(
            r#"
            SELECT id
            FROM organization_memberships
            WHERE organization_id = $1
              AND role = 'organization_owner'
              AND status = 'active'
            FOR UPDATE
            "#,
        )
        .bind(organization_id)
        .fetch_all(&mut *transaction)
        .await?;
        if active_owner_ids.len() <= 1 {
            transaction.rollback().await?;
            return Ok(MembershipRoleUpdateResult::LastActiveOwner);
        }
    }
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
    Ok(
        match row.and_then(|row| organization_membership_from_row(row, role)) {
            Some(membership) => MembershipRoleUpdateResult::Updated(membership),
            None => MembershipRoleUpdateResult::NotFound,
        },
    )
}

async fn update_membership_status(
    pool: &PgPool,
    organization_id: &str,
    membership_id: &str,
    actor_user_id: &str,
    status: &str,
) -> Result<MembershipStatusUpdateResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let current = sqlx::query(
        r#"
        SELECT role, status
        FROM organization_memberships
        WHERE id = $1
          AND organization_id = $2
        FOR UPDATE
        "#,
    )
    .bind(membership_id)
    .bind(organization_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(current) = current else {
        transaction.rollback().await?;
        return Ok(MembershipStatusUpdateResult::NotFound);
    };
    let current_role: String = current.get("role");
    let current_status: String = current.get("status");
    if !matches!(current_status.as_str(), "active" | "suspended") {
        transaction.rollback().await?;
        return Ok(MembershipStatusUpdateResult::NotManageable);
    }
    if current_role == "organization_owner" && current_status == "active" && status == "suspended" {
        let active_owner_ids = sqlx::query_scalar::<_, String>(
            r#"
            SELECT id
            FROM organization_memberships
            WHERE organization_id = $1
              AND role = 'organization_owner'
              AND status = 'active'
            FOR UPDATE
            "#,
        )
        .bind(organization_id)
        .fetch_all(&mut *transaction)
        .await?;
        if active_owner_ids.len() <= 1 {
            transaction.rollback().await?;
            return Ok(MembershipStatusUpdateResult::LastActiveOwner);
        }
    }
    let row = sqlx::query(
        r#"
        UPDATE organization_memberships membership
        SET status = $3,
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
    .bind(status)
    .fetch_optional(&mut *transaction)
    .await?;
    if current_status != status && row.is_some() {
        insert_access_audit_event(
            &mut transaction,
            actor_user_id,
            organization_id,
            if status == "active" {
                "membership_reactivated"
            } else {
                "membership_suspended"
            },
            membership_id,
        )
        .await?;
    }
    transaction.commit().await?;
    let role: String = row.as_ref().map(|row| row.get("role")).unwrap_or_default();
    Ok(
        match row.and_then(|row| organization_membership_from_row(row, role)) {
            Some(membership) => MembershipStatusUpdateResult::Updated(membership),
            None => MembershipStatusUpdateResult::NotFound,
        },
    )
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
    if request
        .expires_at
        .as_deref()
        .is_some_and(|expires_at| !valid_invitation_expiration(expires_at.trim()))
    {
        return Err("expires_at_invalid");
    }

    Ok(())
}

pub fn validate_reissue_invitation_request(
    request: &ReissueOrganizationInvitationRequest,
) -> Result<(), &'static str> {
    if !valid_invitation_expiration(request.expires_at.trim()) {
        return Err("expires_at_invalid");
    }
    Ok(())
}

fn valid_invitation_expiration(value: &str) -> bool {
    let bytes = value.as_bytes();
    if bytes.len() != 24
        || bytes[4] != b'-'
        || bytes[7] != b'-'
        || bytes[10] != b'T'
        || bytes[13] != b':'
        || bytes[16] != b':'
        || bytes[19] != b'.'
        || bytes[23] != b'Z'
    {
        return false;
    }
    let parse = |start: usize, end: usize| {
        bytes[start..end].iter().try_fold(0_u32, |value, byte| {
            byte.is_ascii_digit()
                .then_some(value * 10 + u32::from(byte - b'0'))
        })
    };
    let (Some(year), Some(month), Some(day), Some(hour), Some(minute), Some(second), Some(_)) = (
        parse(0, 4),
        parse(5, 7),
        parse(8, 10),
        parse(11, 13),
        parse(14, 16),
        parse(17, 19),
        parse(20, 23),
    ) else {
        return false;
    };
    let leap = year.is_multiple_of(4) && (!year.is_multiple_of(100) || year.is_multiple_of(400));
    let days = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if leap => 29,
        2 => 28,
        _ => return false,
    };
    day > 0 && day <= days && hour < 24 && minute < 60 && second < 60
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

fn organization_profile_from_row(row: sqlx::postgres::PgRow) -> OrganizationProfile {
    OrganizationProfile {
        id: row.get("id"),
        display_name: row.get("display_name"),
        organization_type: row.get("organization_type"),
        status: row.get("status"),
        persisted: true,
    }
}

fn local_organization_profile(organization_id: &str) -> Option<OrganizationProfile> {
    (organization_id == "org_demo_landscaping").then(|| OrganizationProfile {
        id: organization_id.to_string(),
        display_name: "Grover Demo Landscaping".to_string(),
        organization_type: "yard_care_company".to_string(),
        status: "active".to_string(),
        persisted: false,
    })
}

fn organization_invitation_summary_from_row(
    row: sqlx::postgres::PgRow,
) -> OrganizationInvitationSummary {
    OrganizationInvitationSummary {
        id: row.get("id"),
        organization_id: row.get("organization_id"),
        invitee_email: row.get("invitee_email"),
        role: row.get("role"),
        status: row.get("status"),
        scope_type: row.get("scope_type"),
        scope_id: row.get("scope_id"),
        membership_id: row.get("membership_id"),
        expires_at: row.get("expires_at"),
        delivery_notification_id: row.try_get("delivery_notification_id").ok().flatten(),
        delivery_status: row.try_get("delivery_status").ok().flatten(),
        delivery_attempt_count: row.try_get("delivery_attempt_count").unwrap_or(0),
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
    accepting_email: &str,
) -> Option<OrganizationInvitationAcceptanceResponse> {
    if !token.starts_with("invite_token_") || accepting_email != "invited@example.com" {
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
        access_role_from_storage, access_role_to_storage, validate_bootstrap_organization_request,
        validate_create_invitation_request, validate_reissue_invitation_request,
        validate_update_organization_profile_request, BootstrapOrganizationRequest,
        CreateOrganizationInvitationRequest, MembershipRoleUpdateResult,
        MembershipStatusUpdateResult, OrganizationRepository, ReissueOrganizationInvitationRequest,
        UpdateOrganizationMembershipRoleRequest, UpdateOrganizationMembershipStatusRequest,
        UpdateOrganizationProfileRequest,
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

        let mut expiring = request.clone();
        expiring.expires_at = Some("2026-07-25T12:00:00.000Z".to_string());
        assert_eq!(validate_create_invitation_request(&expiring), Ok(()));

        let mut impossible_expiration = request.clone();
        impossible_expiration.expires_at = Some("2026-02-30T12:00:00.000Z".to_string());
        assert_eq!(
            validate_create_invitation_request(&impossible_expiration),
            Err("expires_at_invalid")
        );

        let mut malformed_expiration = request.clone();
        malformed_expiration.expires_at = Some("2026-07-25 12:00:00Z".to_string());
        assert_eq!(
            validate_create_invitation_request(&malformed_expiration),
            Err("expires_at_invalid")
        );

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

        assert_eq!(
            validate_reissue_invitation_request(&ReissueOrganizationInvitationRequest {
                expires_at: "2026-08-01T12:00:00.000Z".to_string(),
            }),
            Ok(())
        );
        assert_eq!(
            validate_reissue_invitation_request(&ReissueOrganizationInvitationRequest {
                expires_at: "August 1".to_string(),
            }),
            Err("expires_at_invalid")
        );
    }

    #[test]
    fn validates_first_owner_organization_bootstrap() {
        assert_eq!(
            validate_bootstrap_organization_request(&BootstrapOrganizationRequest {
                display_name: "Grover Landscaping".to_string(),
                organization_type: "yard_care_company".to_string(),
            }),
            Ok(())
        );
        assert_eq!(
            validate_bootstrap_organization_request(&BootstrapOrganizationRequest {
                display_name: " ".to_string(),
                organization_type: "yard_care_company".to_string(),
            }),
            Err("display_name_invalid")
        );
        assert_eq!(
            validate_bootstrap_organization_request(&BootstrapOrganizationRequest {
                display_name: "Grover Landscaping".to_string(),
                organization_type: "platform".to_string(),
            }),
            Err("organization_type_invalid")
        );
        assert_eq!(
            validate_update_organization_profile_request(&UpdateOrganizationProfileRequest {
                display_name: "Updated Landscaping".to_string(),
                organization_type: "property_management_company".to_string(),
            }),
            Ok(())
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
            .accept_invitation(
                "invite_token_org_demo_landscaping_manager",
                "accepted-user",
                Some("invited@example.com"),
            )
            .await
            .expect("local invite token should be accepted");

        assert_eq!(accepted.invitation.status, "accepted");
        assert_eq!(accepted.membership.user_id, "accepted-user");
        assert_eq!(accepted.membership.role, AccessRole::Manager);
        assert!(!accepted.invitation.persisted);
    }

    #[tokio::test]
    async fn repository_guards_local_last_owner_role() {
        let repository = OrganizationRepository::default();

        let result = repository
            .update_membership_role(
                "org_demo_landscaping",
                "membership_local_owner_demo",
                "local-development-user",
                UpdateOrganizationMembershipRoleRequest {
                    role: "manager".to_string(),
                },
            )
            .await;

        assert_eq!(result, MembershipRoleUpdateResult::LastActiveOwner);
    }

    #[tokio::test]
    async fn repository_guards_local_last_owner_suspension() {
        let repository = OrganizationRepository::default();
        assert_eq!(
            repository
                .update_membership_status(
                    "org_demo_landscaping",
                    "membership_local_owner_demo",
                    "local-development-user",
                    UpdateOrganizationMembershipStatusRequest {
                        status: "suspended".to_string(),
                    },
                )
                .await,
            MembershipStatusUpdateResult::LastActiveOwner
        );
    }
}
