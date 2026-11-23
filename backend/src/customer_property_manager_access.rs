use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, Row, Transaction};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

const INVITATION_LIFETIME_DAYS: i32 = 7;

#[derive(Clone, Debug, Deserialize)]
pub struct CreateCustomerPropertyManagerInvitationRequest {
    pub recipient_email: String,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct CustomerPropertyManagerInvitationRecord {
    pub invitation_id: String,
    pub activation_id: String,
    pub owner_property_id: String,
    pub organization_id: String,
    pub account_id: String,
    pub property_id: String,
    pub owner_user_id: String,
    pub recipient_email: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accepted_user_id: Option<String>,
    pub created_at_epoch_seconds: i64,
    pub expires_at_epoch_seconds: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accepted_at_epoch_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub revoked_at_epoch_seconds: Option<i64>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct CustomerPropertyManagerRecipientInvitation {
    pub invitation_id: String,
    pub status: String,
    pub expires_at_epoch_seconds: i64,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum InvitationCollectionResult<T> {
    Loaded(Vec<T>),
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum InvitationWriteResult {
    Created(CustomerPropertyManagerInvitationRecord),
    Replayed(CustomerPropertyManagerInvitationRecord),
    NotFound,
    InvalidState,
    Conflict,
    Unavailable,
}

#[derive(Clone, Debug, Default)]
pub struct CustomerPropertyManagerAccessRepository {
    pool: Option<PgPool>,
}

impl CustomerPropertyManagerAccessRepository {
    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn list_for_owner(
        &self,
        owner_user_id: &str,
        owner_property_id: &str,
        activation_id: &str,
    ) -> InvitationCollectionResult<CustomerPropertyManagerInvitationRecord> {
        let Some(pool) = &self.pool else {
            return InvitationCollectionResult::Unavailable;
        };
        match list_owner_invitations(pool, owner_user_id, owner_property_id, activation_id).await {
            Ok(records) => InvitationCollectionResult::Loaded(records),
            Err(error) => {
                tracing::error!(%error, owner_user_id, owner_property_id, activation_id, "customer Property Manager invitation list failed");
                InvitationCollectionResult::Unavailable
            }
        }
    }

    pub async fn list_for_recipient(
        &self,
        recipient_email: &str,
    ) -> InvitationCollectionResult<CustomerPropertyManagerRecipientInvitation> {
        let Some(pool) = &self.pool else {
            return InvitationCollectionResult::Unavailable;
        };
        match list_recipient_invitations(pool, &normalize_email(recipient_email)).await {
            Ok(records) => InvitationCollectionResult::Loaded(records),
            Err(error) => {
                tracing::error!(%error, "customer Property Manager recipient invitation list failed");
                InvitationCollectionResult::Unavailable
            }
        }
    }

    pub async fn create_invitation(
        &self,
        owner_user_id: &str,
        owner_property_id: &str,
        activation_id: &str,
        request: CreateCustomerPropertyManagerInvitationRequest,
    ) -> InvitationWriteResult {
        if !validate_create_request(&request) {
            return InvitationWriteResult::Conflict;
        }
        let Some(pool) = &self.pool else {
            return InvitationWriteResult::Unavailable;
        };
        match create_invitation(
            pool,
            owner_user_id,
            owner_property_id,
            activation_id,
            request,
        )
        .await
        {
            Ok(result) => result,
            Err(error) if is_unique_violation(&error) => InvitationWriteResult::Conflict,
            Err(error) => {
                tracing::error!(%error, owner_user_id, owner_property_id, activation_id, "customer Property Manager invitation creation failed");
                InvitationWriteResult::Unavailable
            }
        }
    }

    pub async fn accept_invitation(
        &self,
        invitation_id: &str,
        recipient_user_id: &str,
        verified_email: &str,
    ) -> InvitationWriteResult {
        if invitation_id.trim().is_empty() || normalize_email(verified_email).is_empty() {
            return InvitationWriteResult::NotFound;
        }
        let Some(pool) = &self.pool else {
            return InvitationWriteResult::Unavailable;
        };
        match accept_invitation(
            pool,
            invitation_id,
            recipient_user_id,
            &normalize_email(verified_email),
        )
        .await
        {
            Ok(result) => result,
            Err(error) if is_unique_violation(&error) => InvitationWriteResult::Conflict,
            Err(error) => {
                tracing::error!(%error, invitation_id, recipient_user_id, "customer Property Manager invitation acceptance failed");
                InvitationWriteResult::Unavailable
            }
        }
    }

    pub async fn revoke_invitation(
        &self,
        owner_user_id: &str,
        owner_property_id: &str,
        activation_id: &str,
        invitation_id: &str,
    ) -> InvitationWriteResult {
        let Some(pool) = &self.pool else {
            return InvitationWriteResult::Unavailable;
        };
        match revoke_invitation(
            pool,
            owner_user_id,
            owner_property_id,
            activation_id,
            invitation_id,
        )
        .await
        {
            Ok(result) => result,
            Err(error) => {
                tracing::error!(%error, owner_user_id, owner_property_id, activation_id, invitation_id, "customer Property Manager invitation revocation failed");
                InvitationWriteResult::Unavailable
            }
        }
    }
}

pub fn validate_create_request(request: &CreateCustomerPropertyManagerInvitationRequest) -> bool {
    let email = normalize_email(&request.recipient_email);
    email.len() >= 5
        && email.len() <= 254
        && email.contains('@')
        && !email.contains(char::is_whitespace)
        && (8..=128).contains(&request.idempotency_key.trim().len())
}

fn normalize_email(value: &str) -> String {
    value.trim().to_ascii_lowercase()
}

fn is_unique_violation(error: &sqlx::Error) -> bool {
    error
        .as_database_error()
        .and_then(|database_error| database_error.code())
        .is_some_and(|code| code == "23505")
}

const INVITATION_SELECT: &str = r#"
    SELECT invitation.id AS invitation_id,
           invitation.activation_id,
           activation.owner_property_id,
           invitation.organization_id,
           invitation.account_id,
           invitation.property_id,
           invitation.owner_user_id,
           invitation.recipient_email,
           invitation.status,
           invitation.accepted_user_id,
           EXTRACT(EPOCH FROM invitation.created_at)::BIGINT AS created_at_epoch_seconds,
           EXTRACT(EPOCH FROM invitation.expires_at)::BIGINT AS expires_at_epoch_seconds,
           EXTRACT(EPOCH FROM invitation.accepted_at)::BIGINT AS accepted_at_epoch_seconds,
           EXTRACT(EPOCH FROM invitation.revoked_at)::BIGINT AS revoked_at_epoch_seconds
    FROM customer_property_manager_invitations invitation
    JOIN owner_provider_relationship_activations activation
      ON activation.id = invitation.activation_id
     AND activation.owner_user_id = invitation.owner_user_id
     AND activation.organization_id = invitation.organization_id
     AND activation.customer_account_id = invitation.account_id
     AND activation.customer_property_id = invitation.property_id
"#;

fn invitation_from_row(row: &sqlx::postgres::PgRow) -> CustomerPropertyManagerInvitationRecord {
    CustomerPropertyManagerInvitationRecord {
        invitation_id: row.get("invitation_id"),
        activation_id: row.get("activation_id"),
        owner_property_id: row.get("owner_property_id"),
        organization_id: row.get("organization_id"),
        account_id: row.get("account_id"),
        property_id: row.get("property_id"),
        owner_user_id: row.get("owner_user_id"),
        recipient_email: row.get("recipient_email"),
        status: row.get("status"),
        accepted_user_id: row.get("accepted_user_id"),
        created_at_epoch_seconds: row.get("created_at_epoch_seconds"),
        expires_at_epoch_seconds: row.get("expires_at_epoch_seconds"),
        accepted_at_epoch_seconds: row.get("accepted_at_epoch_seconds"),
        revoked_at_epoch_seconds: row.get("revoked_at_epoch_seconds"),
        persisted: true,
    }
}

async fn list_owner_invitations(
    pool: &PgPool,
    owner_user_id: &str,
    owner_property_id: &str,
    activation_id: &str,
) -> Result<Vec<CustomerPropertyManagerInvitationRecord>, sqlx::Error> {
    let query = format!(
        "{INVITATION_SELECT}
         WHERE invitation.owner_user_id = $1
           AND activation.owner_property_id = $2
           AND invitation.activation_id = $3
         ORDER BY invitation.created_at DESC, invitation.id DESC"
    );
    let rows = sqlx::query(&query)
        .bind(owner_user_id)
        .bind(owner_property_id)
        .bind(activation_id)
        .fetch_all(pool)
        .await?;
    Ok(rows.iter().map(invitation_from_row).collect())
}

async fn list_recipient_invitations(
    pool: &PgPool,
    recipient_email: &str,
) -> Result<Vec<CustomerPropertyManagerRecipientInvitation>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id AS invitation_id,
               CASE WHEN status = 'pending' AND expires_at <= NOW()
                    THEN 'expired' ELSE status END AS effective_status,
               EXTRACT(EPOCH FROM expires_at)::BIGINT AS expires_at_epoch_seconds
        FROM customer_property_manager_invitations
        WHERE recipient_email = $1
          AND status IN ('pending', 'accepted')
        ORDER BY created_at DESC, id DESC
        "#,
    )
    .bind(recipient_email)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|row| CustomerPropertyManagerRecipientInvitation {
            invitation_id: row.get("invitation_id"),
            status: row.get("effective_status"),
            expires_at_epoch_seconds: row.get("expires_at_epoch_seconds"),
        })
        .collect())
}

async fn load_invitation_in_transaction(
    transaction: &mut Transaction<'_, Postgres>,
    invitation_id: &str,
) -> Result<CustomerPropertyManagerInvitationRecord, sqlx::Error> {
    let query = format!("{INVITATION_SELECT} WHERE invitation.id = $1");
    let row = sqlx::query(&query)
        .bind(invitation_id)
        .fetch_one(&mut **transaction)
        .await?;
    Ok(invitation_from_row(&row))
}

async fn expire_stale_invitation(
    transaction: &mut Transaction<'_, Postgres>,
    invitation_id: &str,
    actor_user_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE customer_property_manager_invitations
         SET status = 'expired'
         WHERE id = $1 AND status = 'pending' AND expires_at <= NOW()",
    )
    .bind(invitation_id)
    .execute(&mut **transaction)
    .await?;
    sqlx::query(
        "INSERT INTO customer_property_manager_access_events (
             id, invitation_id, actor_user_id, event_kind, event_data
         ) VALUES ($1, $2, $3, 'expired', '{\"status\":\"expired\"}'::JSONB)
         ON CONFLICT (invitation_id, event_kind) DO NOTHING",
    )
    .bind(format!("customer_pm_event_{}", Uuid::new_v4().simple()))
    .bind(invitation_id)
    .bind(actor_user_id)
    .execute(&mut **transaction)
    .await?;
    Ok(())
}

async fn create_invitation(
    pool: &PgPool,
    owner_user_id: &str,
    owner_property_id: &str,
    activation_id: &str,
    request: CreateCustomerPropertyManagerInvitationRequest,
) -> Result<InvitationWriteResult, sqlx::Error> {
    let recipient_email = normalize_email(&request.recipient_email);
    let idempotency_key = request.idempotency_key.trim();
    let mut transaction = pool.begin().await?;
    sqlx::query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))")
        .bind(format!(
            "customer-pm-invitation:{activation_id}:{recipient_email}"
        ))
        .execute(&mut *transaction)
        .await?;

    let eligibility = sqlx::query(
        r#"
        SELECT activation.organization_id, activation.customer_account_id,
               activation.customer_property_id
        FROM owner_provider_relationship_activations activation
        JOIN owner_provider_active_relationships relationship
          ON relationship.activation_id = activation.id
         AND relationship.owner_property_id = activation.owner_property_id
         AND relationship.organization_id = activation.organization_id
         AND relationship.customer_account_id = activation.customer_account_id
         AND relationship.customer_property_id = activation.customer_property_id
         AND relationship.status = 'active'
        JOIN organizations organization
          ON organization.id = activation.organization_id
         AND organization.status = 'active'
        JOIN organization_customer_accounts relation
          ON relation.organization_id = activation.organization_id
         AND relation.account_id = activation.customer_account_id
         AND relation.status = 'active'
        JOIN customer_properties property
          ON property.id = activation.customer_property_id
         AND property.organization_id = activation.organization_id
         AND property.account_id = activation.customer_account_id
         AND property.status <> 'archived'
        JOIN organization_memberships owner_membership
          ON owner_membership.id = activation.owner_membership_id
         AND owner_membership.organization_id = activation.organization_id
         AND owner_membership.user_id = activation.owner_user_id
         AND owner_membership.role = 'property_owner'
         AND owner_membership.status = 'active'
        JOIN customer_portal_access_grants owner_grant
          ON owner_grant.activation_id = activation.id
         AND owner_grant.organization_id = activation.organization_id
         AND owner_grant.account_id = activation.customer_account_id
         AND owner_grant.property_id = activation.customer_property_id
         AND owner_grant.user_id = activation.owner_user_id
         AND owner_grant.access_role = 'property_owner'
         AND owner_grant.status = 'active'
        WHERE activation.id = $1
          AND activation.owner_user_id = $2
          AND activation.owner_property_id = $3
        FOR UPDATE OF activation, relationship, property, owner_membership, owner_grant
        "#,
    )
    .bind(activation_id)
    .bind(owner_user_id)
    .bind(owner_property_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(eligibility) = eligibility else {
        transaction.rollback().await?;
        return Ok(InvitationWriteResult::InvalidState);
    };

    let replay_query = format!(
        "{INVITATION_SELECT}
         WHERE invitation.owner_user_id = $1 AND invitation.idempotency_key = $2"
    );
    if let Some(row) = sqlx::query(&replay_query)
        .bind(owner_user_id)
        .bind(idempotency_key)
        .fetch_optional(&mut *transaction)
        .await?
    {
        let record = invitation_from_row(&row);
        let exact = record.activation_id == activation_id
            && record.owner_property_id == owner_property_id
            && record.recipient_email == recipient_email;
        transaction.commit().await?;
        return Ok(if exact {
            InvitationWriteResult::Replayed(record)
        } else {
            InvitationWriteResult::Conflict
        });
    }

    let stale = sqlx::query(
        "SELECT id FROM customer_property_manager_invitations
         WHERE activation_id = $1 AND recipient_email = $2
           AND status = 'pending' AND expires_at <= NOW()
         FOR UPDATE",
    )
    .bind(activation_id)
    .bind(&recipient_email)
    .fetch_all(&mut *transaction)
    .await?;
    for row in stale {
        expire_stale_invitation(&mut transaction, &row.get::<String, _>("id"), owner_user_id)
            .await?;
    }
    let open_exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(
             SELECT 1 FROM customer_property_manager_invitations
             WHERE activation_id = $1 AND recipient_email = $2
               AND status IN ('pending', 'accepted')
         )",
    )
    .bind(activation_id)
    .bind(&recipient_email)
    .fetch_one(&mut *transaction)
    .await?;
    if open_exists {
        transaction.rollback().await?;
        return Ok(InvitationWriteResult::Conflict);
    }

    let invitation_id = format!("customer_pm_invitation_{}", Uuid::new_v4().simple());
    sqlx::query(
        r#"
        INSERT INTO customer_property_manager_invitations (
            id, activation_id, organization_id, account_id, property_id,
            owner_user_id, recipient_email, status, idempotency_key, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8,
                  NOW() + ($9 * INTERVAL '1 day'))
        "#,
    )
    .bind(&invitation_id)
    .bind(activation_id)
    .bind(eligibility.get::<String, _>("organization_id"))
    .bind(eligibility.get::<String, _>("customer_account_id"))
    .bind(eligibility.get::<String, _>("customer_property_id"))
    .bind(owner_user_id)
    .bind(&recipient_email)
    .bind(idempotency_key)
    .bind(INVITATION_LIFETIME_DAYS)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        r#"
        INSERT INTO customer_property_manager_access_events (
            id, invitation_id, actor_user_id, event_kind, event_data
        ) VALUES ($1, $2, $3, 'invited', jsonb_build_object(
            'activation_id', $4::TEXT, 'property_id', $5::TEXT,
            'recipient_email', $6::TEXT, 'status', 'pending'
        ))
        "#,
    )
    .bind(format!("customer_pm_event_{}", Uuid::new_v4().simple()))
    .bind(&invitation_id)
    .bind(owner_user_id)
    .bind(activation_id)
    .bind(eligibility.get::<String, _>("customer_property_id"))
    .bind(&recipient_email)
    .execute(&mut *transaction)
    .await?;
    let record = load_invitation_in_transaction(&mut transaction, &invitation_id).await?;
    transaction.commit().await?;
    Ok(InvitationWriteResult::Created(record))
}

async fn accept_invitation(
    pool: &PgPool,
    invitation_id: &str,
    recipient_user_id: &str,
    verified_email: &str,
) -> Result<InvitationWriteResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    sqlx::query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))")
        .bind(format!("customer-pm-accept:{invitation_id}"))
        .execute(&mut *transaction)
        .await?;
    let query = format!(
        "{INVITATION_SELECT}
         JOIN owner_provider_active_relationships relationship
           ON relationship.activation_id = invitation.activation_id
          AND relationship.organization_id = invitation.organization_id
          AND relationship.customer_account_id = invitation.account_id
          AND relationship.customer_property_id = invitation.property_id
          AND relationship.status = 'active'
         WHERE invitation.id = $1 AND invitation.recipient_email = $2
         FOR UPDATE OF invitation, relationship"
    );
    let row = sqlx::query(&query)
        .bind(invitation_id)
        .bind(verified_email)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(row) = row else {
        transaction.rollback().await?;
        return Ok(InvitationWriteResult::NotFound);
    };
    let current = invitation_from_row(&row);
    if current.status == "accepted" {
        transaction.commit().await?;
        return Ok(
            if current.accepted_user_id.as_deref() == Some(recipient_user_id) {
                InvitationWriteResult::Replayed(current)
            } else {
                InvitationWriteResult::Conflict
            },
        );
    }
    if current.status != "pending" {
        transaction.rollback().await?;
        return Ok(InvitationWriteResult::InvalidState);
    }
    let now_epoch_seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |duration| duration.as_secs() as i64);
    if current.expires_at_epoch_seconds <= now_epoch_seconds {
        expire_stale_invitation(&mut transaction, invitation_id, recipient_user_id).await?;
        transaction.commit().await?;
        return Ok(InvitationWriteResult::InvalidState);
    }

    sqlx::query(
        "UPDATE customer_property_manager_invitations
         SET status = 'accepted', accepted_user_id = $2, accepted_at = NOW()
         WHERE id = $1 AND status = 'pending'",
    )
    .bind(invitation_id)
    .bind(recipient_user_id)
    .execute(&mut *transaction)
    .await?;
    let membership_id = format!("membership_{}", Uuid::new_v4().simple());
    sqlx::query(
        r#"
        INSERT INTO organization_memberships (
            id, organization_id, user_id, display_name, role, status,
            scope_type, scope_id
        ) VALUES ($1, $2, $3, $4, 'property_manager', 'active', 'property', $5)
        ON CONFLICT (organization_id, user_id, role, scope_type, scope_id)
        DO UPDATE SET display_name = EXCLUDED.display_name,
                      status = 'active', updated_at = NOW()
        "#,
    )
    .bind(&membership_id)
    .bind(&current.organization_id)
    .bind(recipient_user_id)
    .bind(verified_email)
    .bind(&current.property_id)
    .execute(&mut *transaction)
    .await?;
    let grant_id = format!("portal_access_{}", Uuid::new_v4().simple());
    sqlx::query(
        r#"
        INSERT INTO customer_portal_access_grants (
            id, activation_id, organization_id, account_id, property_id,
            user_id, access_role, status, scope_type, scope_id,
            delegation_invitation_id
        ) VALUES ($1, $2, $3, $4, $5, $6, 'property_manager', 'active',
                  'property', $5, $7)
        ON CONFLICT (organization_id, account_id, property_id, user_id)
        DO UPDATE SET activation_id = EXCLUDED.activation_id,
                      access_role = 'property_manager', status = 'active',
                      revoked_at = NULL, scope_type = 'property',
                      scope_id = EXCLUDED.property_id,
                      delegation_invitation_id = EXCLUDED.delegation_invitation_id
        "#,
    )
    .bind(&grant_id)
    .bind(&current.activation_id)
    .bind(&current.organization_id)
    .bind(&current.account_id)
    .bind(&current.property_id)
    .bind(recipient_user_id)
    .bind(invitation_id)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        r#"
        INSERT INTO customer_property_manager_access_events (
            id, invitation_id, actor_user_id, event_kind, event_data
        ) VALUES ($1, $2, $3, 'accepted', jsonb_build_object(
            'activation_id', $4::TEXT, 'property_id', $5::TEXT,
            'recipient_user_id', $3::TEXT, 'status', 'accepted'
        ))
        "#,
    )
    .bind(format!("customer_pm_event_{}", Uuid::new_v4().simple()))
    .bind(invitation_id)
    .bind(recipient_user_id)
    .bind(&current.activation_id)
    .bind(&current.property_id)
    .execute(&mut *transaction)
    .await?;
    let record = load_invitation_in_transaction(&mut transaction, invitation_id).await?;
    transaction.commit().await?;
    Ok(InvitationWriteResult::Created(record))
}

async fn revoke_invitation(
    pool: &PgPool,
    owner_user_id: &str,
    owner_property_id: &str,
    activation_id: &str,
    invitation_id: &str,
) -> Result<InvitationWriteResult, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let query = format!(
        "{INVITATION_SELECT}
         WHERE invitation.id = $1 AND invitation.owner_user_id = $2
           AND activation.owner_property_id = $3
           AND invitation.activation_id = $4
         FOR UPDATE OF invitation, activation"
    );
    let row = sqlx::query(&query)
        .bind(invitation_id)
        .bind(owner_user_id)
        .bind(owner_property_id)
        .bind(activation_id)
        .fetch_optional(&mut *transaction)
        .await?;
    let Some(row) = row else {
        transaction.rollback().await?;
        return Ok(InvitationWriteResult::NotFound);
    };
    let current = invitation_from_row(&row);
    if current.status == "revoked" {
        transaction.commit().await?;
        return Ok(InvitationWriteResult::Replayed(current));
    }
    if !matches!(current.status.as_str(), "pending" | "accepted") {
        transaction.rollback().await?;
        return Ok(InvitationWriteResult::InvalidState);
    }
    sqlx::query(
        "UPDATE customer_property_manager_invitations
         SET status = 'revoked', revoked_at = NOW()
         WHERE id = $1 AND status IN ('pending', 'accepted')",
    )
    .bind(invitation_id)
    .execute(&mut *transaction)
    .await?;
    if let Some(accepted_user_id) = current.accepted_user_id.as_deref() {
        sqlx::query(
            "UPDATE customer_portal_access_grants
             SET status = 'revoked', revoked_at = NOW()
             WHERE delegation_invitation_id = $1 AND status = 'active'",
        )
        .bind(invitation_id)
        .execute(&mut *transaction)
        .await?;
        sqlx::query(
            "UPDATE organization_memberships
             SET status = 'suspended', updated_at = NOW()
             WHERE organization_id = $1 AND user_id = $2
               AND role = 'property_manager' AND scope_type = 'property'
               AND scope_id = $3 AND status = 'active'",
        )
        .bind(&current.organization_id)
        .bind(accepted_user_id)
        .bind(&current.property_id)
        .execute(&mut *transaction)
        .await?;
    }
    sqlx::query(
        r#"
        INSERT INTO customer_property_manager_access_events (
            id, invitation_id, actor_user_id, event_kind, event_data
        ) VALUES ($1, $2, $3, 'revoked', jsonb_build_object(
            'activation_id', $4::TEXT, 'property_id', $5::TEXT,
            'status', 'revoked'
        ))
        ON CONFLICT (invitation_id, event_kind) DO NOTHING
        "#,
    )
    .bind(format!("customer_pm_event_{}", Uuid::new_v4().simple()))
    .bind(invitation_id)
    .bind(owner_user_id)
    .bind(activation_id)
    .bind(&current.property_id)
    .execute(&mut *transaction)
    .await?;
    let record = load_invitation_in_transaction(&mut transaction, invitation_id).await?;
    transaction.commit().await?;
    Ok(InvitationWriteResult::Created(record))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_only_bounded_recipient_and_retry_identity() {
        assert!(validate_create_request(
            &CreateCustomerPropertyManagerInvitationRequest {
                recipient_email: " Manager@Example.com ".into(),
                idempotency_key: "manager-invite-001".into(),
            }
        ));
        assert!(!validate_create_request(
            &CreateCustomerPropertyManagerInvitationRequest {
                recipient_email: "not-an-email".into(),
                idempotency_key: "short".into(),
            }
        ));
    }
}
