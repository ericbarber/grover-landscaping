use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerAccountSummary {
    pub job_id: String,
    pub account_id: String,
    pub customer_name: String,
    pub billing_model: String,
    pub payment_status: String,
    pub service_approval_status: String,
    pub contracted_services_per_period: u32,
    pub completed_services_this_period: u32,
    pub billing_notes: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateCustomerAccountRequest {
    pub organization_id: String,
    pub customer_name: String,
    pub billing_model: String,
    pub payment_status: String,
    pub service_approval_status: String,
    pub contracted_services_per_period: u32,
    pub billing_notes: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct UpdateCustomerAccountRequest {
    pub customer_name: String,
    pub billing_model: String,
    pub payment_status: String,
    pub service_approval_status: String,
    pub contracted_services_per_period: u32,
    pub billing_notes: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerAccountRecord {
    pub account_id: String,
    pub organization_id: String,
    pub customer_name: String,
    pub billing_model: String,
    pub payment_status: String,
    pub service_approval_status: String,
    pub contracted_services_per_period: u32,
    pub completed_services_this_period: u32,
    pub billing_notes: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateCustomerPropertyRequest {
    pub organization_id: String,
    pub display_name: String,
    pub service_address: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct UpdateCustomerPropertyStatusRequest {
    pub status: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct UpdateCustomerPropertyIdentityRequest {
    pub display_name: String,
    pub service_address: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CustomerPropertyMutationError {
    NotFound,
    Duplicate,
    Persistence,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CustomerPropertyStatusError {
    NotFound,
    NotReady,
    InvalidTransition,
    Persistence,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerPropertyRecord {
    pub property_id: String,
    pub account_id: String,
    pub organization_id: String,
    pub display_name: String,
    pub service_address: String,
    pub status: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, Default)]
pub struct AccountRepository {
    pool: Option<PgPool>,
}

impl AccountRepository {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn list(&self, organization_ids: &[String]) -> Vec<CustomerAccountRecord> {
        let Some(pool) = &self.pool else {
            return seed_accounts(organization_ids);
        };
        list_accounts(pool, organization_ids)
            .await
            .unwrap_or_default()
    }

    pub async fn create(
        &self,
        request: CreateCustomerAccountRequest,
    ) -> Option<CustomerAccountRecord> {
        let request = normalize_request(request);
        let Some(pool) = &self.pool else {
            return Some(local_record(request));
        };
        create_account(pool, &request).await.ok()
    }

    pub async fn update(
        &self,
        account_id: &str,
        organization_ids: &[String],
        request: UpdateCustomerAccountRequest,
    ) -> Option<CustomerAccountRecord> {
        let request = normalize_update_request(request);
        let Some(pool) = &self.pool else {
            return local_update_record(account_id, organization_ids, &request);
        };
        update_account(pool, account_id, organization_ids, &request)
            .await
            .ok()
            .flatten()
    }

    pub async fn list_properties(
        &self,
        account_id: &str,
        organization_ids: &[String],
    ) -> Vec<CustomerPropertyRecord> {
        let Some(pool) = &self.pool else {
            return seed_properties(account_id, organization_ids);
        };
        list_properties(pool, account_id, organization_ids)
            .await
            .unwrap_or_default()
    }

    pub async fn create_property(
        &self,
        account_id: &str,
        request: CreateCustomerPropertyRequest,
    ) -> Result<CustomerPropertyRecord, CustomerPropertyMutationError> {
        let request = normalize_create_property_request(request);
        let Some(pool) = &self.pool else {
            return local_property_record(account_id, &request)
                .ok_or(CustomerPropertyMutationError::NotFound);
        };
        create_property(pool, account_id, &request)
            .await
            .map_err(map_property_sql_error)?
            .ok_or(CustomerPropertyMutationError::NotFound)
    }

    pub async fn update_property_identity(
        &self,
        account_id: &str,
        property_id: &str,
        organization_ids: &[String],
        request: UpdateCustomerPropertyIdentityRequest,
        actor_user_id: &str,
    ) -> Result<CustomerPropertyRecord, CustomerPropertyMutationError> {
        let request = normalize_update_property_identity_request(request);
        let Some(pool) = &self.pool else {
            return local_property_identity_record(
                account_id,
                property_id,
                organization_ids,
                &request,
            )
            .ok_or(CustomerPropertyMutationError::NotFound);
        };
        update_property_identity(
            pool,
            account_id,
            property_id,
            organization_ids,
            &request,
            actor_user_id,
        )
        .await
        .map_err(map_property_sql_error)?
        .ok_or(CustomerPropertyMutationError::NotFound)
    }

    pub async fn update_property_status(
        &self,
        account_id: &str,
        property_id: &str,
        organization_ids: &[String],
        request: UpdateCustomerPropertyStatusRequest,
        actor_user_id: &str,
    ) -> Result<CustomerPropertyRecord, CustomerPropertyStatusError> {
        let status = request.status.trim();
        let Some(pool) = &self.pool else {
            return local_property_status_record(account_id, property_id, organization_ids, status)
                .ok_or(CustomerPropertyStatusError::NotFound);
        };
        update_property_status(
            pool,
            account_id,
            property_id,
            organization_ids,
            status,
            actor_user_id,
        )
        .await
    }

    pub async fn get_account_for_job(&self, job_id: &str) -> CustomerAccountSummary {
        seed_summary(job_id)
    }
}

pub fn validate_create_customer_account_request(
    request: &CreateCustomerAccountRequest,
) -> Result<(), &'static str> {
    if request.organization_id.trim().is_empty() {
        return Err("organization_id_required");
    }
    if request.customer_name.trim().len() < 2 || request.customer_name.trim().len() > 160 {
        return Err("customer_name_invalid");
    }
    if !matches!(
        request.billing_model.trim(),
        "per_job" | "monthly_plan" | "prepaid_package" | "manual_account"
    ) {
        return Err("billing_model_invalid");
    }
    if !matches!(
        request.payment_status.trim(),
        "not_required" | "pending" | "paid" | "past_due" | "waived" | "manager_review"
    ) {
        return Err("payment_status_invalid");
    }
    if !matches!(
        request.service_approval_status.trim(),
        "approved" | "blocked" | "manager_review"
    ) {
        return Err("service_approval_status_invalid");
    }
    if request
        .billing_notes
        .as_deref()
        .map(|notes| notes.trim().len() > 1000)
        .unwrap_or(false)
    {
        return Err("billing_notes_too_long");
    }
    Ok(())
}

pub fn validate_update_customer_account_request(
    request: &UpdateCustomerAccountRequest,
) -> Result<(), &'static str> {
    let create_request = CreateCustomerAccountRequest {
        organization_id: "validation".to_string(),
        customer_name: request.customer_name.clone(),
        billing_model: request.billing_model.clone(),
        payment_status: request.payment_status.clone(),
        service_approval_status: request.service_approval_status.clone(),
        contracted_services_per_period: request.contracted_services_per_period,
        billing_notes: request.billing_notes.clone(),
    };
    validate_create_customer_account_request(&create_request)
}

pub fn validate_create_customer_property_request(
    request: &CreateCustomerPropertyRequest,
) -> Result<(), &'static str> {
    if request.organization_id.trim().is_empty() {
        return Err("organization_id_required");
    }
    if request.display_name.trim().len() < 2 || request.display_name.trim().len() > 160 {
        return Err("display_name_invalid");
    }
    if request.service_address.trim().len() < 5 || request.service_address.trim().len() > 240 {
        return Err("service_address_invalid");
    }
    Ok(())
}

pub fn validate_update_customer_property_status_request(
    request: &UpdateCustomerPropertyStatusRequest,
) -> Result<(), &'static str> {
    if matches!(request.status.trim(), "active" | "archived" | "onboarding") {
        Ok(())
    } else {
        Err("status_invalid")
    }
}

pub fn validate_update_customer_property_identity_request(
    request: &UpdateCustomerPropertyIdentityRequest,
) -> Result<(), &'static str> {
    validate_create_customer_property_request(&CreateCustomerPropertyRequest {
        organization_id: "validation".to_string(),
        display_name: request.display_name.clone(),
        service_address: request.service_address.clone(),
    })
}

fn normalize_request(mut request: CreateCustomerAccountRequest) -> CreateCustomerAccountRequest {
    request.organization_id = request.organization_id.trim().to_string();
    request.customer_name = request.customer_name.trim().to_string();
    request.billing_model = request.billing_model.trim().to_string();
    request.payment_status = request.payment_status.trim().to_string();
    request.service_approval_status = request.service_approval_status.trim().to_string();
    request.billing_notes = request
        .billing_notes
        .map(|notes| notes.trim().to_string())
        .filter(|notes| !notes.is_empty());
    request
}

fn normalize_update_request(
    mut request: UpdateCustomerAccountRequest,
) -> UpdateCustomerAccountRequest {
    request.customer_name = request.customer_name.trim().to_string();
    request.billing_model = request.billing_model.trim().to_string();
    request.payment_status = request.payment_status.trim().to_string();
    request.service_approval_status = request.service_approval_status.trim().to_string();
    request.billing_notes = request
        .billing_notes
        .map(|notes| notes.trim().to_string())
        .filter(|notes| !notes.is_empty());
    request
}

fn normalize_create_property_request(
    mut request: CreateCustomerPropertyRequest,
) -> CreateCustomerPropertyRequest {
    request.organization_id = request.organization_id.trim().to_string();
    request.display_name = request.display_name.trim().to_string();
    request.service_address = request.service_address.trim().to_string();
    request
}

fn normalize_update_property_identity_request(
    mut request: UpdateCustomerPropertyIdentityRequest,
) -> UpdateCustomerPropertyIdentityRequest {
    request.display_name = request.display_name.trim().to_string();
    request.service_address = request.service_address.trim().to_string();
    request
}

async fn create_account(
    pool: &PgPool,
    request: &CreateCustomerAccountRequest,
) -> Result<CustomerAccountRecord, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let account_id = format!("acct_{}", Uuid::new_v4().simple());
    sqlx::query(
        r#"INSERT INTO customer_accounts (
            id, customer_name, billing_model, payment_status,
            service_approval_status, contracted_services_per_period,
            completed_services_this_period, billing_notes
        ) VALUES ($1,$2,$3,$4,$5,$6,0,$7)"#,
    )
    .bind(&account_id)
    .bind(&request.customer_name)
    .bind(&request.billing_model)
    .bind(&request.payment_status)
    .bind(&request.service_approval_status)
    .bind(request.contracted_services_per_period as i32)
    .bind(&request.billing_notes)
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        "INSERT INTO organization_customer_accounts (organization_id, account_id) VALUES ($1,$2)",
    )
    .bind(&request.organization_id)
    .bind(&account_id)
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(record_from_request(account_id, request, true))
}

async fn update_account(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
    request: &UpdateCustomerAccountRequest,
) -> Result<Option<CustomerAccountRecord>, sqlx::Error> {
    let row = sqlx::query(
        r#"UPDATE customer_accounts account
        SET customer_name = $3, billing_model = $4, payment_status = $5,
            service_approval_status = $6, contracted_services_per_period = $7,
            billing_notes = $8, updated_at = NOW()
        FROM organization_customer_accounts relation
        WHERE account.id = $1
          AND relation.account_id = account.id
          AND relation.organization_id = ANY($2)
          AND relation.status = 'active'
        RETURNING account.id, relation.organization_id, account.customer_name,
            account.billing_model, account.payment_status, account.service_approval_status,
            account.contracted_services_per_period, account.completed_services_this_period,
            COALESCE(account.billing_notes, '') AS billing_notes"#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .bind(&request.customer_name)
    .bind(&request.billing_model)
    .bind(&request.payment_status)
    .bind(&request.service_approval_status)
    .bind(request.contracted_services_per_period as i32)
    .bind(&request.billing_notes)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|row| CustomerAccountRecord {
        account_id: row.get("id"),
        organization_id: row.get("organization_id"),
        customer_name: row.get("customer_name"),
        billing_model: row.get("billing_model"),
        payment_status: row.get("payment_status"),
        service_approval_status: row.get("service_approval_status"),
        contracted_services_per_period: row.get::<i32, _>("contracted_services_per_period") as u32,
        completed_services_this_period: row.get::<i32, _>("completed_services_this_period") as u32,
        billing_notes: row.get("billing_notes"),
        persisted: true,
    }))
}

async fn create_property(
    pool: &PgPool,
    account_id: &str,
    request: &CreateCustomerPropertyRequest,
) -> Result<Option<CustomerPropertyRecord>, sqlx::Error> {
    let property_id = format!("property_{}", Uuid::new_v4().simple());
    let row = sqlx::query(
        r#"INSERT INTO customer_properties (
            id, organization_id, account_id, display_name, service_address
        )
        SELECT $1, relation.organization_id, relation.account_id, $4, $5
        FROM organization_customer_accounts relation
        WHERE relation.organization_id = $2
          AND relation.account_id = $3
          AND relation.status = 'active'
        RETURNING id, account_id, organization_id, display_name, service_address, status"#,
    )
    .bind(&property_id)
    .bind(&request.organization_id)
    .bind(account_id)
    .bind(&request.display_name)
    .bind(&request.service_address)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|row| property_record_from_row(row, true)))
}

async fn update_property_status(
    pool: &PgPool,
    account_id: &str,
    property_id: &str,
    organization_ids: &[String],
    status: &str,
    actor_user_id: &str,
) -> Result<CustomerPropertyRecord, CustomerPropertyStatusError> {
    let mut transaction = pool
        .begin()
        .await
        .map_err(|_| CustomerPropertyStatusError::Persistence)?;
    let current = sqlx::query(
        r#"SELECT property.status, property.organization_id
        FROM customer_properties property
        JOIN organization_customer_accounts relation
          ON relation.organization_id = property.organization_id
         AND relation.account_id = property.account_id
         AND relation.status = 'active'
        WHERE property.id = $2
          AND property.account_id = $1
          AND property.organization_id = ANY($3)"#,
    )
    .bind(account_id)
    .bind(property_id)
    .bind(organization_ids)
    .fetch_optional(&mut *transaction)
    .await
    .map_err(|_| CustomerPropertyStatusError::Persistence)?;
    let Some(current) = current else {
        transaction
            .rollback()
            .await
            .map_err(|_| CustomerPropertyStatusError::Persistence)?;
        return Err(CustomerPropertyStatusError::NotFound);
    };
    let current_status: String = current.get("status");
    let organization_id: String = current.get("organization_id");
    if status == "onboarding" && current_status != "archived" {
        transaction
            .rollback()
            .await
            .map_err(|_| CustomerPropertyStatusError::Persistence)?;
        return Err(CustomerPropertyStatusError::InvalidTransition);
    }
    if status == "active" && current_status != "active" {
        let ready: bool = sqlx::query_scalar(
            r#"SELECT
                EXISTS (
                    SELECT 1 FROM property_onboarding_profiles profile
                    WHERE profile.property_id = $1
                      AND profile.organization_id = $2
                      AND profile.onboarding_status = 'active'
                )
                AND EXISTS (
                    SELECT 1 FROM property_crew_assignments assignment
                    WHERE assignment.property_id = $1
                      AND assignment.organization_id = $2
                      AND assignment.active
                )"#,
        )
        .bind(property_id)
        .bind(&organization_id)
        .fetch_one(&mut *transaction)
        .await
        .map_err(|_| CustomerPropertyStatusError::Persistence)?;
        if !ready {
            transaction
                .rollback()
                .await
                .map_err(|_| CustomerPropertyStatusError::Persistence)?;
            return Err(CustomerPropertyStatusError::NotReady);
        }
    }
    let row = sqlx::query(
        r#"UPDATE customer_properties property
        SET status = $4, updated_at = NOW()
        FROM organization_customer_accounts relation
        WHERE property.id = $2
          AND property.account_id = $1
          AND property.organization_id = ANY($3)
          AND relation.organization_id = property.organization_id
          AND relation.account_id = property.account_id
          AND relation.status = 'active'
        RETURNING property.id, property.account_id, property.organization_id,
            property.display_name, property.service_address, property.status"#,
    )
    .bind(account_id)
    .bind(property_id)
    .bind(organization_ids)
    .bind(status)
    .fetch_optional(&mut *transaction)
    .await
    .map_err(|_| CustomerPropertyStatusError::Persistence)?;
    let Some(row) = row else {
        transaction
            .rollback()
            .await
            .map_err(|_| CustomerPropertyStatusError::Persistence)?;
        return Err(CustomerPropertyStatusError::NotFound);
    };
    let record = property_record_from_row(row, true);
    if status == "archived" {
        sqlx::query(
            r#"UPDATE property_crew_assignments
            SET active = FALSE, ended_at = COALESCE(ended_at, NOW())
            WHERE property_id = $1 AND organization_id = $2 AND active"#,
        )
        .bind(property_id)
        .bind(&record.organization_id)
        .execute(&mut *transaction)
        .await
        .map_err(|_| CustomerPropertyStatusError::Persistence)?;
    }
    sqlx::query(
        r#"INSERT INTO access_audit_events (
            id, actor_user_id, organization_id, event_kind, target_id, occurred_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())"#,
    )
    .bind(format!("audit_property_status_{}", Uuid::new_v4().simple()))
    .bind(actor_user_id)
    .bind(&record.organization_id)
    .bind(match (status, current_status.as_str()) {
        ("archived", _) => "property_archived",
        ("onboarding", "archived") => "property_reactivated",
        ("active", _) => "property_activated",
        _ => "property_status_updated",
    })
    .bind(property_id)
    .execute(&mut *transaction)
    .await
    .map_err(|_| CustomerPropertyStatusError::Persistence)?;
    transaction
        .commit()
        .await
        .map_err(|_| CustomerPropertyStatusError::Persistence)?;
    Ok(record)
}

async fn update_property_identity(
    pool: &PgPool,
    account_id: &str,
    property_id: &str,
    organization_ids: &[String],
    request: &UpdateCustomerPropertyIdentityRequest,
    actor_user_id: &str,
) -> Result<Option<CustomerPropertyRecord>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let row = sqlx::query(
        r#"UPDATE customer_properties property
        SET display_name = $4, service_address = $5, updated_at = NOW()
        FROM organization_customer_accounts relation
        WHERE property.id = $2
          AND property.account_id = $1
          AND property.organization_id = ANY($3)
          AND relation.organization_id = property.organization_id
          AND relation.account_id = property.account_id
          AND relation.status = 'active'
        RETURNING property.id, property.account_id, property.organization_id,
            property.display_name, property.service_address, property.status"#,
    )
    .bind(account_id)
    .bind(property_id)
    .bind(organization_ids)
    .bind(&request.display_name)
    .bind(&request.service_address)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(row) = row else {
        transaction.rollback().await?;
        return Ok(None);
    };
    let record = property_record_from_row(row, true);
    sqlx::query(
        r#"INSERT INTO access_audit_events (
            id, actor_user_id, organization_id, event_kind, target_id, occurred_at
        ) VALUES ($1, $2, $3, 'property_identity_updated', $4, NOW())"#,
    )
    .bind(format!(
        "audit_property_identity_{}",
        Uuid::new_v4().simple()
    ))
    .bind(actor_user_id)
    .bind(&record.organization_id)
    .bind(property_id)
    .execute(&mut *transaction)
    .await?;
    transaction.commit().await?;
    Ok(Some(record))
}

fn map_property_sql_error(error: sqlx::Error) -> CustomerPropertyMutationError {
    match &error {
        sqlx::Error::Database(database_error)
            if database_error.code().as_deref() == Some("23505") =>
        {
            CustomerPropertyMutationError::Duplicate
        }
        _ => CustomerPropertyMutationError::Persistence,
    }
}

async fn list_properties(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
) -> Result<Vec<CustomerPropertyRecord>, sqlx::Error> {
    let rows = sqlx::query(
        r#"SELECT property.id, property.account_id, property.organization_id,
            property.display_name, property.service_address, property.status
        FROM customer_properties property
        JOIN organization_customer_accounts relation
          ON relation.organization_id = property.organization_id
         AND relation.account_id = property.account_id
        WHERE property.account_id = $1
          AND property.organization_id = ANY($2)
          AND relation.status = 'active'
        ORDER BY property.display_name"#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|row| property_record_from_row(row, true))
        .collect())
}

fn property_record_from_row(row: sqlx::postgres::PgRow, persisted: bool) -> CustomerPropertyRecord {
    CustomerPropertyRecord {
        property_id: row.get("id"),
        account_id: row.get("account_id"),
        organization_id: row.get("organization_id"),
        display_name: row.get("display_name"),
        service_address: row.get("service_address"),
        status: row.get("status"),
        persisted,
    }
}

async fn list_accounts(
    pool: &PgPool,
    organization_ids: &[String],
) -> Result<Vec<CustomerAccountRecord>, sqlx::Error> {
    let rows = sqlx::query(
        r#"SELECT account.id, relation.organization_id, account.customer_name,
            account.billing_model, account.payment_status, account.service_approval_status,
            account.contracted_services_per_period, account.completed_services_this_period,
            COALESCE(account.billing_notes, '') AS billing_notes
        FROM organization_customer_accounts relation
        JOIN customer_accounts account ON account.id = relation.account_id
        WHERE relation.organization_id = ANY($1) AND relation.status = 'active'
        ORDER BY account.customer_name"#,
    )
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|row| CustomerAccountRecord {
            account_id: row.get("id"),
            organization_id: row.get("organization_id"),
            customer_name: row.get("customer_name"),
            billing_model: row.get("billing_model"),
            payment_status: row.get("payment_status"),
            service_approval_status: row.get("service_approval_status"),
            contracted_services_per_period: row.get::<i32, _>("contracted_services_per_period")
                as u32,
            completed_services_this_period: row.get::<i32, _>("completed_services_this_period")
                as u32,
            billing_notes: row.get("billing_notes"),
            persisted: true,
        })
        .collect())
}

fn record_from_request(
    account_id: String,
    request: &CreateCustomerAccountRequest,
    persisted: bool,
) -> CustomerAccountRecord {
    CustomerAccountRecord {
        account_id,
        organization_id: request.organization_id.clone(),
        customer_name: request.customer_name.clone(),
        billing_model: request.billing_model.clone(),
        payment_status: request.payment_status.clone(),
        service_approval_status: request.service_approval_status.clone(),
        contracted_services_per_period: request.contracted_services_per_period,
        completed_services_this_period: 0,
        billing_notes: request.billing_notes.clone().unwrap_or_default(),
        persisted,
    }
}

fn local_record(request: CreateCustomerAccountRequest) -> CustomerAccountRecord {
    record_from_request("acct_local_new".to_string(), &request, false)
}

fn local_update_record(
    account_id: &str,
    organization_ids: &[String],
    request: &UpdateCustomerAccountRequest,
) -> Option<CustomerAccountRecord> {
    if account_id != "acct_1001"
        || !organization_ids
            .iter()
            .any(|id| id == "org_demo_landscaping")
    {
        return None;
    }
    Some(CustomerAccountRecord {
        account_id: account_id.to_string(),
        organization_id: "org_demo_landscaping".to_string(),
        customer_name: request.customer_name.clone(),
        billing_model: request.billing_model.clone(),
        payment_status: request.payment_status.clone(),
        service_approval_status: request.service_approval_status.clone(),
        contracted_services_per_period: request.contracted_services_per_period,
        completed_services_this_period: 0,
        billing_notes: request.billing_notes.clone().unwrap_or_default(),
        persisted: false,
    })
}

fn local_property_status_record(
    account_id: &str,
    property_id: &str,
    organization_ids: &[String],
    status: &str,
) -> Option<CustomerPropertyRecord> {
    let mut property = seed_properties(account_id, organization_ids)
        .into_iter()
        .find(|property| property.property_id == property_id)?;
    property.status = status.to_string();
    Some(property)
}

fn local_property_identity_record(
    account_id: &str,
    property_id: &str,
    organization_ids: &[String],
    request: &UpdateCustomerPropertyIdentityRequest,
) -> Option<CustomerPropertyRecord> {
    let mut property = seed_properties(account_id, organization_ids)
        .into_iter()
        .find(|property| property.property_id == property_id)?;
    property.display_name = request.display_name.clone();
    property.service_address = request.service_address.clone();
    Some(property)
}

fn local_property_record(
    account_id: &str,
    request: &CreateCustomerPropertyRequest,
) -> Option<CustomerPropertyRecord> {
    if account_id.trim().is_empty() {
        return None;
    }
    Some(CustomerPropertyRecord {
        property_id: format!("property_local_{}", Uuid::new_v4().simple()),
        account_id: account_id.to_string(),
        organization_id: request.organization_id.clone(),
        display_name: request.display_name.clone(),
        service_address: request.service_address.clone(),
        status: "onboarding".to_string(),
        persisted: false,
    })
}

fn seed_properties(account_id: &str, organization_ids: &[String]) -> Vec<CustomerPropertyRecord> {
    if account_id != "acct_1001"
        || !organization_ids
            .iter()
            .any(|id| id == "org_demo_landscaping")
    {
        return Vec::new();
    }
    vec![CustomerPropertyRecord {
        property_id: "property_1001".to_string(),
        account_id: account_id.to_string(),
        organization_id: "org_demo_landscaping".to_string(),
        display_name: "Sample Customer Home".to_string(),
        service_address: "123 Oak Street".to_string(),
        status: "active".to_string(),
        persisted: false,
    }]
}

fn seed_accounts(organization_ids: &[String]) -> Vec<CustomerAccountRecord> {
    if !organization_ids
        .iter()
        .any(|id| id == "org_demo_landscaping")
    {
        return Vec::new();
    }
    vec![record_from_request(
        "acct_1001".to_string(),
        &CreateCustomerAccountRequest {
            organization_id: "org_demo_landscaping".to_string(),
            customer_name: "Sample Customer".to_string(),
            billing_model: "per_job".to_string(),
            payment_status: "pending".to_string(),
            service_approval_status: "approved".to_string(),
            contracted_services_per_period: 1,
            billing_notes: Some("Payment can be marked complete after service.".to_string()),
        },
        false,
    )]
}

fn seed_summary(job_id: &str) -> CustomerAccountSummary {
    let account = if job_id == "job_1002" {
        (
            "acct_1002",
            "Demo Property Owner",
            "monthly_plan",
            "paid",
            4,
            2,
        )
    } else {
        ("acct_1001", "Sample Customer", "per_job", "pending", 1, 0)
    };
    CustomerAccountSummary {
        job_id: job_id.to_string(),
        account_id: account.0.to_string(),
        customer_name: account.1.to_string(),
        billing_model: account.2.to_string(),
        payment_status: account.3.to_string(),
        service_approval_status: "approved".to_string(),
        contracted_services_per_period: account.4,
        completed_services_this_period: account.5,
        billing_notes: String::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn update_request() -> UpdateCustomerAccountRequest {
        UpdateCustomerAccountRequest {
            customer_name: "Updated Customer".to_string(),
            billing_model: "monthly_plan".to_string(),
            payment_status: "paid".to_string(),
            service_approval_status: "approved".to_string(),
            contracted_services_per_period: 4,
            billing_notes: Some("Account is current.".to_string()),
        }
    }

    #[test]
    fn update_validation_reuses_account_field_rules() {
        assert_eq!(
            validate_update_customer_account_request(&update_request()),
            Ok(())
        );
        let mut invalid = update_request();
        invalid.payment_status = "unknown".to_string();
        assert_eq!(
            validate_update_customer_account_request(&invalid),
            Err("payment_status_invalid")
        );
    }

    #[test]
    fn property_validation_requires_identity_and_address() {
        let valid = CreateCustomerPropertyRequest {
            organization_id: "org_demo_landscaping".to_string(),
            display_name: "North yard".to_string(),
            service_address: "123 Oak Street".to_string(),
        };
        assert_eq!(validate_create_customer_property_request(&valid), Ok(()));
        assert_eq!(
            validate_create_customer_property_request(&CreateCustomerPropertyRequest {
                service_address: "x".to_string(),
                ..valid
            }),
            Err("service_address_invalid")
        );
    }

    #[test]
    fn property_status_validation_allows_only_lifecycle_actions() {
        for status in ["onboarding", "active", "archived"] {
            assert_eq!(
                validate_update_customer_property_status_request(
                    &UpdateCustomerPropertyStatusRequest {
                        status: status.to_string(),
                    },
                ),
                Ok(())
            );
        }
        assert_eq!(
            validate_update_customer_property_status_request(
                &UpdateCustomerPropertyStatusRequest {
                    status: "blocked".to_string(),
                },
            ),
            Err("status_invalid")
        );
    }

    #[test]
    fn property_identity_validation_reuses_creation_rules() {
        assert_eq!(
            validate_update_customer_property_identity_request(
                &UpdateCustomerPropertyIdentityRequest {
                    display_name: "Front courtyard".to_string(),
                    service_address: "789 Property Test Avenue".to_string(),
                },
            ),
            Ok(())
        );
        assert_eq!(
            validate_update_customer_property_identity_request(
                &UpdateCustomerPropertyIdentityRequest {
                    display_name: " ".to_string(),
                    service_address: "789 Property Test Avenue".to_string(),
                },
            ),
            Err("display_name_invalid")
        );
    }

    #[tokio::test]
    async fn local_updates_stay_tenant_scoped() {
        let repository = AccountRepository::new();
        assert!(repository
            .update(
                "acct_1001",
                &["org_demo_landscaping".to_string()],
                update_request(),
            )
            .await
            .is_some());
        assert!(repository
            .update("acct_1001", &["org_other".to_string()], update_request())
            .await
            .is_none());
    }
}
