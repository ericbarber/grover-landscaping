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

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustomerAccountSummaryResult {
    Loaded(CustomerAccountSummary),
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CreateCustomerAccountRequest {
    pub organization_id: String,
    pub relationship_type: String,
    pub customer_name: String,
    pub billing_model: String,
    pub payment_status: String,
    pub service_approval_status: String,
    pub contracted_services_per_period: u32,
    pub billing_notes: Option<String>,
    pub primary_contact_name: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub email_notifications_enabled: bool,
    pub sms_notifications_enabled: bool,
    pub quiet_hours_start: Option<String>,
    pub quiet_hours_end: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct UpdateCustomerAccountRequest {
    pub customer_name: String,
    pub billing_model: String,
    pub payment_status: String,
    pub service_approval_status: String,
    pub contracted_services_per_period: u32,
    pub billing_notes: Option<String>,
    pub primary_contact_name: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub email_notifications_enabled: bool,
    pub sms_notifications_enabled: bool,
    pub quiet_hours_start: Option<String>,
    pub quiet_hours_end: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct UpdateCustomerAccountRelationshipRequest {
    pub relationship_type: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerAccountRecord {
    pub account_id: String,
    pub organization_id: String,
    pub relationship_type: String,
    pub customer_name: String,
    pub billing_model: String,
    pub payment_status: String,
    pub service_approval_status: String,
    pub contracted_services_per_period: u32,
    pub completed_services_this_period: u32,
    pub billing_notes: String,
    pub primary_contact_name: String,
    pub contact_email: String,
    pub contact_phone: String,
    pub email_notifications_enabled: bool,
    pub sms_notifications_enabled: bool,
    pub quiet_hours_start: String,
    pub quiet_hours_end: String,
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

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CustomerAccountArchiveError {
    NotFound,
    HasCurrentProperties,
    HasActiveJobs,
    Persistence,
}

pub fn valid_customer_account_relationship(relationship_type: &str) -> bool {
    matches!(
        relationship_type.trim(),
        "service_provider" | "property_manager" | "owner"
    )
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

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerPropertyActivationReadiness {
    pub property_id: String,
    pub profile_ready: bool,
    pub crew_ready: bool,
    pub ready: bool,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerAccountOnboardingProgress {
    pub account_id: String,
    pub customer_details_ready: bool,
    pub property_count: u32,
    pub service_ready_property_count: u32,
    pub active_property_count: u32,
    pub properties_needing_attention: Vec<CustomerPropertyOnboardingAttention>,
    pub complete: bool,
    pub persisted: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CustomerPropertyOnboardingAttention {
    pub property_id: String,
    pub display_name: String,
    pub status: String,
    pub reasons: Vec<String>,
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

    pub async fn list_archived(&self, organization_ids: &[String]) -> Vec<CustomerAccountRecord> {
        let Some(pool) = &self.pool else {
            return Vec::new();
        };
        list_accounts_by_relationship_status(pool, organization_ids, "archived")
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

    pub async fn archive(
        &self,
        account_id: &str,
        organization_ids: &[String],
        actor_user_id: &str,
    ) -> Result<(), CustomerAccountArchiveError> {
        let Some(pool) = &self.pool else {
            let exists = seed_accounts(organization_ids)
                .iter()
                .any(|account| account.account_id == account_id);
            return if exists {
                Err(CustomerAccountArchiveError::HasCurrentProperties)
            } else {
                Err(CustomerAccountArchiveError::NotFound)
            };
        };
        archive_account(pool, account_id, organization_ids, actor_user_id).await
    }

    pub async fn reactivate(
        &self,
        account_id: &str,
        organization_ids: &[String],
        actor_user_id: &str,
    ) -> Result<CustomerAccountRecord, CustomerAccountArchiveError> {
        let Some(pool) = &self.pool else {
            return Err(CustomerAccountArchiveError::NotFound);
        };
        reactivate_account(pool, account_id, organization_ids, actor_user_id).await
    }

    pub async fn update_relationship(
        &self,
        account_id: &str,
        organization_ids: &[String],
        relationship_type: &str,
        actor_user_id: &str,
    ) -> Result<CustomerAccountRecord, CustomerAccountArchiveError> {
        let Some(pool) = &self.pool else {
            return Err(CustomerAccountArchiveError::NotFound);
        };
        update_account_relationship(
            pool,
            account_id,
            organization_ids,
            relationship_type,
            actor_user_id,
        )
        .await
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

    pub async fn property_activation_readiness(
        &self,
        account_id: &str,
        property_id: &str,
        organization_ids: &[String],
    ) -> Option<CustomerPropertyActivationReadiness> {
        let Some(pool) = &self.pool else {
            return local_property_activation_readiness(account_id, property_id, organization_ids);
        };
        property_activation_readiness(pool, account_id, property_id, organization_ids)
            .await
            .ok()
            .flatten()
    }

    pub async fn account_onboarding_progress(
        &self,
        account_id: &str,
        organization_ids: &[String],
    ) -> Option<CustomerAccountOnboardingProgress> {
        let Some(pool) = &self.pool else {
            return local_account_onboarding_progress(account_id, organization_ids);
        };
        account_onboarding_progress(pool, account_id, organization_ids)
            .await
            .ok()
            .flatten()
    }

    pub async fn get_account_for_job(&self, job_id: &str) -> CustomerAccountSummaryResult {
        let Some(pool) = &self.pool else {
            return CustomerAccountSummaryResult::Loaded(seed_summary(job_id));
        };
        match account_summary_for_job(pool, job_id).await {
            Ok(Some(summary)) => CustomerAccountSummaryResult::Loaded(summary),
            Ok(None) => CustomerAccountSummaryResult::NotFound,
            Err(error) => {
                tracing::error!(%error, job_id, "persisted job-account summary failed");
                CustomerAccountSummaryResult::Unavailable
            }
        }
    }
}

async fn account_summary_for_job(
    pool: &PgPool,
    job_id: &str,
) -> Result<Option<CustomerAccountSummary>, sqlx::Error> {
    let row = sqlx::query(
        r#"SELECT
            job.id AS job_id,
            account.id AS account_id,
            account.customer_name,
            account.billing_model,
            account.payment_status,
            account.service_approval_status,
            account.contracted_services_per_period,
            account.completed_services_this_period,
            COALESCE(account.billing_notes, '') AS billing_notes
        FROM service_jobs job
        JOIN customer_accounts account ON account.id = job.customer_account_id
        WHERE job.id = $1"#,
    )
    .bind(job_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|row| CustomerAccountSummary {
        job_id: row.get("job_id"),
        account_id: row.get("account_id"),
        customer_name: row.get("customer_name"),
        billing_model: row.get("billing_model"),
        payment_status: row.get("payment_status"),
        service_approval_status: row.get("service_approval_status"),
        contracted_services_per_period: row.get::<i32, _>("contracted_services_per_period") as u32,
        completed_services_this_period: row.get::<i32, _>("completed_services_this_period") as u32,
        billing_notes: row.get("billing_notes"),
    }))
}

pub fn validate_create_customer_account_request(
    request: &CreateCustomerAccountRequest,
) -> Result<(), &'static str> {
    if request.organization_id.trim().is_empty() {
        return Err("organization_id_required");
    }
    if !valid_customer_account_relationship(&request.relationship_type) {
        return Err("relationship_type_invalid");
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
    if request
        .primary_contact_name
        .as_deref()
        .is_some_and(|value| value.trim().len() > 160)
    {
        return Err("primary_contact_name_too_long");
    }
    if request.contact_email.as_deref().is_some_and(|value| {
        let value = value.trim();
        !value.is_empty()
            && (value.len() > 254
                || !value.contains('@')
                || value.starts_with('@')
                || value.ends_with('@'))
    }) {
        return Err("contact_email_invalid");
    }
    if request.contact_phone.as_deref().is_some_and(|value| {
        let value = value.trim();
        !value.is_empty()
            && (!value.starts_with('+')
                || !(8..=16).contains(&value.len())
                || !value[1..]
                    .chars()
                    .all(|character| character.is_ascii_digit()))
    }) {
        return Err("contact_phone_invalid");
    }
    if request.email_notifications_enabled
        && request
            .contact_email
            .as_deref()
            .is_none_or(|value| value.trim().is_empty())
    {
        return Err("email_notifications_require_contact_email");
    }
    if request.sms_notifications_enabled
        && request
            .contact_phone
            .as_deref()
            .is_none_or(|value| value.trim().is_empty())
    {
        return Err("sms_notifications_require_contact_phone");
    }
    if request.quiet_hours_start.is_some() != request.quiet_hours_end.is_some() {
        return Err("quiet_hours_pair_required");
    }
    if request
        .quiet_hours_start
        .as_deref()
        .into_iter()
        .chain(request.quiet_hours_end.as_deref())
        .any(|value| !valid_quiet_hour(value.trim()))
    {
        return Err("quiet_hours_invalid");
    }
    Ok(())
}

pub fn validate_update_customer_account_request(
    request: &UpdateCustomerAccountRequest,
) -> Result<(), &'static str> {
    let create_request = CreateCustomerAccountRequest {
        organization_id: "validation".to_string(),
        relationship_type: "service_provider".to_string(),
        customer_name: request.customer_name.clone(),
        billing_model: request.billing_model.clone(),
        payment_status: request.payment_status.clone(),
        service_approval_status: request.service_approval_status.clone(),
        contracted_services_per_period: request.contracted_services_per_period,
        billing_notes: request.billing_notes.clone(),
        primary_contact_name: request.primary_contact_name.clone(),
        contact_email: request.contact_email.clone(),
        contact_phone: request.contact_phone.clone(),
        email_notifications_enabled: request.email_notifications_enabled,
        sms_notifications_enabled: request.sms_notifications_enabled,
        quiet_hours_start: request.quiet_hours_start.clone(),
        quiet_hours_end: request.quiet_hours_end.clone(),
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
    request.relationship_type = request.relationship_type.trim().to_string();
    request.customer_name = request.customer_name.trim().to_string();
    request.billing_model = request.billing_model.trim().to_string();
    request.payment_status = request.payment_status.trim().to_string();
    request.service_approval_status = request.service_approval_status.trim().to_string();
    request.billing_notes = request
        .billing_notes
        .map(|notes| notes.trim().to_string())
        .filter(|notes| !notes.is_empty());
    normalize_account_contacts(
        &mut request.primary_contact_name,
        &mut request.contact_email,
        &mut request.contact_phone,
    );
    normalize_quiet_hours(&mut request.quiet_hours_start, &mut request.quiet_hours_end);
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
    normalize_account_contacts(
        &mut request.primary_contact_name,
        &mut request.contact_email,
        &mut request.contact_phone,
    );
    normalize_quiet_hours(&mut request.quiet_hours_start, &mut request.quiet_hours_end);
    request
}

fn valid_quiet_hour(value: &str) -> bool {
    let Some((hour, minute)) = value.split_once(':') else {
        return false;
    };
    hour.len() == 2
        && minute.len() == 2
        && hour.parse::<u8>().is_ok_and(|value| value < 24)
        && minute.parse::<u8>().is_ok_and(|value| value < 60)
}

fn normalize_quiet_hours(start: &mut Option<String>, end: &mut Option<String>) {
    *start = start
        .take()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());
    *end = end
        .take()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());
}

fn normalize_account_contacts(
    name: &mut Option<String>,
    email: &mut Option<String>,
    phone: &mut Option<String>,
) {
    *name = name
        .take()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());
    *email = email
        .take()
        .map(|value| value.trim().to_ascii_lowercase())
        .filter(|value| !value.is_empty());
    *phone = phone
        .take()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());
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
            , primary_contact_name, contact_email, contact_phone,
            email_notifications_enabled, sms_notifications_enabled,
            quiet_hours_start, quiet_hours_end
        ) VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9,$10,$11,$12,$13::time,$14::time)"#,
    )
    .bind(&account_id)
    .bind(&request.customer_name)
    .bind(&request.billing_model)
    .bind(&request.payment_status)
    .bind(&request.service_approval_status)
    .bind(request.contracted_services_per_period as i32)
    .bind(&request.billing_notes)
    .bind(&request.primary_contact_name)
    .bind(&request.contact_email)
    .bind(&request.contact_phone)
    .bind(request.email_notifications_enabled)
    .bind(request.sms_notifications_enabled)
    .bind(&request.quiet_hours_start)
    .bind(&request.quiet_hours_end)
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        "INSERT INTO organization_customer_accounts (organization_id, account_id, relationship_type) VALUES ($1,$2,$3)",
    )
    .bind(&request.organization_id)
    .bind(&account_id)
    .bind(&request.relationship_type)
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
            billing_notes = $8, primary_contact_name = $9, contact_email = $10,
            contact_phone = $11, email_notifications_enabled = $12,
            sms_notifications_enabled = $13, quiet_hours_start = $14::time,
            quiet_hours_end = $15::time, updated_at = NOW()
        FROM organization_customer_accounts relation
        WHERE account.id = $1
          AND relation.account_id = account.id
          AND relation.organization_id = ANY($2)
          AND relation.status = 'active'
        RETURNING account.id, relation.organization_id, relation.relationship_type, account.customer_name,
            account.billing_model, account.payment_status, account.service_approval_status,
            account.contracted_services_per_period, account.completed_services_this_period,
            COALESCE(account.billing_notes, '') AS billing_notes,
            COALESCE(account.primary_contact_name, '') AS primary_contact_name,
            COALESCE(account.contact_email, '') AS contact_email,
            COALESCE(account.contact_phone, '') AS contact_phone,
            account.email_notifications_enabled, account.sms_notifications_enabled,
            COALESCE(TO_CHAR(account.quiet_hours_start, 'HH24:MI'), '') AS quiet_hours_start,
            COALESCE(TO_CHAR(account.quiet_hours_end, 'HH24:MI'), '') AS quiet_hours_end"#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .bind(&request.customer_name)
    .bind(&request.billing_model)
    .bind(&request.payment_status)
    .bind(&request.service_approval_status)
    .bind(request.contracted_services_per_period as i32)
    .bind(&request.billing_notes)
    .bind(&request.primary_contact_name)
    .bind(&request.contact_email)
    .bind(&request.contact_phone)
    .bind(request.email_notifications_enabled)
    .bind(request.sms_notifications_enabled)
    .bind(&request.quiet_hours_start)
    .bind(&request.quiet_hours_end)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|row| account_record_from_row(row, true)))
}

async fn archive_account(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
    actor_user_id: &str,
) -> Result<(), CustomerAccountArchiveError> {
    let mut transaction = pool
        .begin()
        .await
        .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    let relation = sqlx::query(
        r#"SELECT organization_id
        FROM organization_customer_accounts
        WHERE account_id = $1
          AND organization_id = ANY($2)
          AND status = 'active'
        FOR UPDATE"#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_optional(&mut *transaction)
    .await
    .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    let Some(relation) = relation else {
        return Err(CustomerAccountArchiveError::NotFound);
    };
    let organization_id: String = relation.get("organization_id");
    let current_property_count: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)
        FROM customer_properties
        WHERE account_id = $1
          AND organization_id = $2
          AND status <> 'archived'"#,
    )
    .bind(account_id)
    .bind(&organization_id)
    .fetch_one(&mut *transaction)
    .await
    .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    if current_property_count > 0 {
        return Err(CustomerAccountArchiveError::HasCurrentProperties);
    }
    let active_job_count: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)
        FROM service_jobs
        WHERE customer_account_id = $1
          AND status IN ('scheduled', 'in_progress')"#,
    )
    .bind(account_id)
    .fetch_one(&mut *transaction)
    .await
    .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    if active_job_count > 0 {
        return Err(CustomerAccountArchiveError::HasActiveJobs);
    }
    sqlx::query(
        r#"UPDATE organization_customer_accounts
        SET status = 'archived', updated_at = NOW()
        WHERE organization_id = $1 AND account_id = $2 AND status = 'active'"#,
    )
    .bind(&organization_id)
    .bind(account_id)
    .execute(&mut *transaction)
    .await
    .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    sqlx::query(
        r#"INSERT INTO access_audit_events (
            id, actor_user_id, organization_id, event_kind, target_id, occurred_at
        ) VALUES ($1, $2, $3, 'account_archived', $4, NOW())"#,
    )
    .bind(format!("audit_account_archive_{}", Uuid::new_v4().simple()))
    .bind(actor_user_id)
    .bind(&organization_id)
    .bind(account_id)
    .execute(&mut *transaction)
    .await
    .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    transaction
        .commit()
        .await
        .map_err(|_| CustomerAccountArchiveError::Persistence)
}

async fn reactivate_account(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
    actor_user_id: &str,
) -> Result<CustomerAccountRecord, CustomerAccountArchiveError> {
    let mut transaction = pool
        .begin()
        .await
        .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    let row = sqlx::query(
        r#"UPDATE organization_customer_accounts relation
        SET status = 'active', updated_at = NOW()
        FROM customer_accounts account
        WHERE relation.account_id = $1
          AND relation.organization_id = ANY($2)
          AND relation.status = 'archived'
          AND account.id = relation.account_id
        RETURNING account.id, relation.organization_id, relation.relationship_type, account.customer_name,
            account.billing_model, account.payment_status, account.service_approval_status,
            account.contracted_services_per_period, account.completed_services_this_period,
            COALESCE(account.billing_notes, '') AS billing_notes,
            COALESCE(account.primary_contact_name, '') AS primary_contact_name,
            COALESCE(account.contact_email, '') AS contact_email,
            COALESCE(account.contact_phone, '') AS contact_phone,
            account.email_notifications_enabled, account.sms_notifications_enabled,
            COALESCE(TO_CHAR(account.quiet_hours_start, 'HH24:MI'), '') AS quiet_hours_start,
            COALESCE(TO_CHAR(account.quiet_hours_end, 'HH24:MI'), '') AS quiet_hours_end"#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_optional(&mut *transaction)
    .await
    .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    let Some(row) = row else {
        return Err(CustomerAccountArchiveError::NotFound);
    };
    let record = account_record_from_row(row, true);
    sqlx::query(
        r#"INSERT INTO access_audit_events (
            id, actor_user_id, organization_id, event_kind, target_id, occurred_at
        ) VALUES ($1, $2, $3, 'account_reactivated', $4, NOW())"#,
    )
    .bind(format!(
        "audit_account_reactivate_{}",
        Uuid::new_v4().simple()
    ))
    .bind(actor_user_id)
    .bind(&record.organization_id)
    .bind(account_id)
    .execute(&mut *transaction)
    .await
    .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    transaction
        .commit()
        .await
        .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    Ok(record)
}

async fn update_account_relationship(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
    relationship_type: &str,
    actor_user_id: &str,
) -> Result<CustomerAccountRecord, CustomerAccountArchiveError> {
    let mut transaction = pool
        .begin()
        .await
        .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    let row = sqlx::query(
        r#"UPDATE organization_customer_accounts relation
        SET relationship_type = $3, updated_at = NOW()
        FROM customer_accounts account
        WHERE relation.account_id = $1
          AND relation.organization_id = ANY($2)
          AND relation.status = 'active'
          AND account.id = relation.account_id
        RETURNING account.id, relation.organization_id, relation.relationship_type, account.customer_name,
            account.billing_model, account.payment_status, account.service_approval_status,
            account.contracted_services_per_period, account.completed_services_this_period,
            COALESCE(account.billing_notes, '') AS billing_notes,
            COALESCE(account.primary_contact_name, '') AS primary_contact_name,
            COALESCE(account.contact_email, '') AS contact_email,
            COALESCE(account.contact_phone, '') AS contact_phone,
            account.email_notifications_enabled, account.sms_notifications_enabled,
            COALESCE(TO_CHAR(account.quiet_hours_start, 'HH24:MI'), '') AS quiet_hours_start,
            COALESCE(TO_CHAR(account.quiet_hours_end, 'HH24:MI'), '') AS quiet_hours_end"#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .bind(relationship_type)
    .fetch_optional(&mut *transaction)
    .await
    .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    let Some(row) = row else {
        return Err(CustomerAccountArchiveError::NotFound);
    };
    let record = account_record_from_row(row, true);
    sqlx::query(
        r#"INSERT INTO access_audit_events (
            id, actor_user_id, organization_id, event_kind, target_id, occurred_at
        ) VALUES ($1, $2, $3, 'account_relationship_updated', $4, NOW())"#,
    )
    .bind(format!(
        "audit_account_relationship_{}",
        Uuid::new_v4().simple()
    ))
    .bind(actor_user_id)
    .bind(&record.organization_id)
    .bind(account_id)
    .execute(&mut *transaction)
    .await
    .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    transaction
        .commit()
        .await
        .map_err(|_| CustomerAccountArchiveError::Persistence)?;
    Ok(record)
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

async fn property_activation_readiness(
    pool: &PgPool,
    account_id: &str,
    property_id: &str,
    organization_ids: &[String],
) -> Result<Option<CustomerPropertyActivationReadiness>, sqlx::Error> {
    let row = sqlx::query(
        r#"SELECT
            property.id AS property_id,
            EXISTS (
                SELECT 1 FROM property_onboarding_profiles profile
                WHERE profile.property_id = property.id
                  AND profile.organization_id = property.organization_id
                  AND profile.onboarding_status = 'active'
            ) AS profile_ready,
            EXISTS (
                SELECT 1 FROM property_crew_assignments assignment
                WHERE assignment.property_id = property.id
                  AND assignment.organization_id = property.organization_id
                  AND assignment.active
            ) AS crew_ready
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
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|row| {
        let profile_ready: bool = row.get("profile_ready");
        let crew_ready: bool = row.get("crew_ready");
        CustomerPropertyActivationReadiness {
            property_id: row.get("property_id"),
            profile_ready,
            crew_ready,
            ready: profile_ready && crew_ready,
            persisted: true,
        }
    }))
}

async fn account_onboarding_progress(
    pool: &PgPool,
    account_id: &str,
    organization_ids: &[String],
) -> Result<Option<CustomerAccountOnboardingProgress>, sqlx::Error> {
    let row = sqlx::query(
        r#"SELECT
            account.id AS account_id,
            (
                account.service_approval_status = 'approved'
                AND account.contracted_services_per_period > 0
                AND NULLIF(BTRIM(account.primary_contact_name), '') IS NOT NULL
                AND (
                    NULLIF(BTRIM(account.contact_email), '') IS NOT NULL
                    OR NULLIF(BTRIM(account.contact_phone), '') IS NOT NULL
                )
            ) AS customer_details_ready,
            COUNT(property.id) FILTER (
                WHERE property.status <> 'archived'
            )::BIGINT AS property_count,
            COUNT(property.id) FILTER (
                WHERE property.status <> 'archived'
                  AND (
                    property.status = 'active'
                    OR (
                        EXISTS (
                            SELECT 1 FROM property_onboarding_profiles profile
                            WHERE profile.property_id = property.id
                              AND profile.organization_id = property.organization_id
                              AND profile.onboarding_status = 'active'
                        )
                        AND EXISTS (
                            SELECT 1 FROM property_crew_assignments assignment
                            WHERE assignment.property_id = property.id
                              AND assignment.organization_id = property.organization_id
                              AND assignment.active
                        )
                    )
                  )
            )::BIGINT AS service_ready_property_count,
            COUNT(property.id) FILTER (
                WHERE property.status = 'active'
            )::BIGINT AS active_property_count
        FROM customer_accounts account
        JOIN organization_customer_accounts relation
          ON relation.account_id = account.id
         AND relation.organization_id = ANY($2)
         AND relation.status = 'active'
        LEFT JOIN customer_properties property
          ON property.account_id = account.id
         AND property.organization_id = relation.organization_id
        WHERE account.id = $1
        GROUP BY account.id"#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(None);
    };
    let attention_rows = sqlx::query(
        r#"SELECT
            property.id AS property_id,
            property.display_name,
            property.status,
            EXISTS (
                SELECT 1 FROM property_onboarding_profiles profile
                WHERE profile.property_id = property.id
                  AND profile.organization_id = property.organization_id
                  AND profile.onboarding_status = 'active'
            ) AS profile_ready,
            EXISTS (
                SELECT 1 FROM property_crew_assignments assignment
                WHERE assignment.property_id = property.id
                  AND assignment.organization_id = property.organization_id
                  AND assignment.active
            ) AS crew_ready
        FROM customer_properties property
        JOIN organization_customer_accounts relation
          ON relation.account_id = property.account_id
         AND relation.organization_id = property.organization_id
         AND relation.organization_id = ANY($2)
         AND relation.status = 'active'
        WHERE property.account_id = $1
          AND property.status <> 'archived'
        ORDER BY property.display_name, property.id"#,
    )
    .bind(account_id)
    .bind(organization_ids)
    .fetch_all(pool)
    .await?;
    let properties_needing_attention = attention_rows
        .into_iter()
        .filter_map(|row| {
            let status: String = row.get("status");
            let profile_ready: bool = row.get("profile_ready");
            let crew_ready: bool = row.get("crew_ready");
            let mut reasons = Vec::new();
            if !profile_ready {
                reasons.push("operational_profile_incomplete".to_string());
            }
            if !crew_ready {
                reasons.push("crew_unassigned".to_string());
            }
            if status == "blocked" {
                reasons.push("property_blocked".to_string());
            } else if status != "active" && profile_ready && crew_ready {
                reasons.push("activation_pending".to_string());
            }
            if reasons.is_empty() {
                None
            } else {
                Some(CustomerPropertyOnboardingAttention {
                    property_id: row.get("property_id"),
                    display_name: row.get("display_name"),
                    status,
                    reasons,
                })
            }
        })
        .collect();
    Ok(Some({
        let customer_details_ready: bool = row.get("customer_details_ready");
        let property_count = row.get::<i64, _>("property_count") as u32;
        let service_ready_property_count = row.get::<i64, _>("service_ready_property_count") as u32;
        let active_property_count = row.get::<i64, _>("active_property_count") as u32;
        CustomerAccountOnboardingProgress {
            account_id: row.get("account_id"),
            customer_details_ready,
            property_count,
            service_ready_property_count,
            active_property_count,
            properties_needing_attention,
            complete: customer_details_ready
                && property_count > 0
                && active_property_count == property_count,
            persisted: true,
        }
    }))
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
    list_accounts_by_relationship_status(pool, organization_ids, "active").await
}

async fn list_accounts_by_relationship_status(
    pool: &PgPool,
    organization_ids: &[String],
    relationship_status: &str,
) -> Result<Vec<CustomerAccountRecord>, sqlx::Error> {
    let rows = sqlx::query(
        r#"SELECT account.id, relation.organization_id, relation.relationship_type, account.customer_name,
            account.billing_model, account.payment_status, account.service_approval_status,
            account.contracted_services_per_period, account.completed_services_this_period,
            COALESCE(account.billing_notes, '') AS billing_notes,
            COALESCE(account.primary_contact_name, '') AS primary_contact_name,
            COALESCE(account.contact_email, '') AS contact_email,
            COALESCE(account.contact_phone, '') AS contact_phone,
            account.email_notifications_enabled, account.sms_notifications_enabled,
            COALESCE(TO_CHAR(account.quiet_hours_start, 'HH24:MI'), '') AS quiet_hours_start,
            COALESCE(TO_CHAR(account.quiet_hours_end, 'HH24:MI'), '') AS quiet_hours_end
        FROM organization_customer_accounts relation
        JOIN customer_accounts account ON account.id = relation.account_id
        WHERE relation.organization_id = ANY($1) AND relation.status = $2
        ORDER BY account.customer_name"#,
    )
    .bind(organization_ids)
    .bind(relationship_status)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|row| account_record_from_row(row, true))
        .collect())
}

fn account_record_from_row(row: sqlx::postgres::PgRow, persisted: bool) -> CustomerAccountRecord {
    CustomerAccountRecord {
        account_id: row.get("id"),
        organization_id: row.get("organization_id"),
        relationship_type: row.get("relationship_type"),
        customer_name: row.get("customer_name"),
        billing_model: row.get("billing_model"),
        payment_status: row.get("payment_status"),
        service_approval_status: row.get("service_approval_status"),
        contracted_services_per_period: row.get::<i32, _>("contracted_services_per_period") as u32,
        completed_services_this_period: row.get::<i32, _>("completed_services_this_period") as u32,
        billing_notes: row.get("billing_notes"),
        primary_contact_name: row.get("primary_contact_name"),
        contact_email: row.get("contact_email"),
        contact_phone: row.get("contact_phone"),
        email_notifications_enabled: row.get("email_notifications_enabled"),
        sms_notifications_enabled: row.get("sms_notifications_enabled"),
        quiet_hours_start: row.get("quiet_hours_start"),
        quiet_hours_end: row.get("quiet_hours_end"),
        persisted,
    }
}

fn record_from_request(
    account_id: String,
    request: &CreateCustomerAccountRequest,
    persisted: bool,
) -> CustomerAccountRecord {
    CustomerAccountRecord {
        account_id,
        organization_id: request.organization_id.clone(),
        relationship_type: request.relationship_type.clone(),
        customer_name: request.customer_name.clone(),
        billing_model: request.billing_model.clone(),
        payment_status: request.payment_status.clone(),
        service_approval_status: request.service_approval_status.clone(),
        contracted_services_per_period: request.contracted_services_per_period,
        completed_services_this_period: 0,
        billing_notes: request.billing_notes.clone().unwrap_or_default(),
        primary_contact_name: request.primary_contact_name.clone().unwrap_or_default(),
        contact_email: request.contact_email.clone().unwrap_or_default(),
        contact_phone: request.contact_phone.clone().unwrap_or_default(),
        email_notifications_enabled: request.email_notifications_enabled,
        sms_notifications_enabled: request.sms_notifications_enabled,
        quiet_hours_start: request.quiet_hours_start.clone().unwrap_or_default(),
        quiet_hours_end: request.quiet_hours_end.clone().unwrap_or_default(),
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
        relationship_type: "service_provider".to_string(),
        customer_name: request.customer_name.clone(),
        billing_model: request.billing_model.clone(),
        payment_status: request.payment_status.clone(),
        service_approval_status: request.service_approval_status.clone(),
        contracted_services_per_period: request.contracted_services_per_period,
        completed_services_this_period: 0,
        billing_notes: request.billing_notes.clone().unwrap_or_default(),
        primary_contact_name: request.primary_contact_name.clone().unwrap_or_default(),
        contact_email: request.contact_email.clone().unwrap_or_default(),
        contact_phone: request.contact_phone.clone().unwrap_or_default(),
        email_notifications_enabled: request.email_notifications_enabled,
        sms_notifications_enabled: request.sms_notifications_enabled,
        quiet_hours_start: request.quiet_hours_start.clone().unwrap_or_default(),
        quiet_hours_end: request.quiet_hours_end.clone().unwrap_or_default(),
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

fn local_property_activation_readiness(
    account_id: &str,
    property_id: &str,
    organization_ids: &[String],
) -> Option<CustomerPropertyActivationReadiness> {
    seed_properties(account_id, organization_ids)
        .into_iter()
        .find(|property| property.property_id == property_id)
        .map(|property| CustomerPropertyActivationReadiness {
            property_id: property.property_id,
            profile_ready: true,
            crew_ready: true,
            ready: true,
            persisted: false,
        })
}

fn local_account_onboarding_progress(
    account_id: &str,
    organization_ids: &[String],
) -> Option<CustomerAccountOnboardingProgress> {
    let account = seed_accounts(organization_ids)
        .into_iter()
        .find(|account| account.account_id == account_id)?;
    let properties = seed_properties(account_id, organization_ids);
    let property_count = properties
        .iter()
        .filter(|property| property.status != "archived")
        .count() as u32;
    let active_property_count = properties
        .iter()
        .filter(|property| property.status == "active")
        .count() as u32;
    let customer_details_ready = account.service_approval_status == "approved"
        && account.contracted_services_per_period > 0
        && !account.primary_contact_name.is_empty()
        && (!account.contact_email.is_empty() || !account.contact_phone.is_empty());
    Some(CustomerAccountOnboardingProgress {
        account_id: account.account_id,
        customer_details_ready,
        property_count,
        service_ready_property_count: active_property_count,
        active_property_count,
        properties_needing_attention: properties
            .iter()
            .filter(|property| property.status != "archived" && property.status != "active")
            .map(|property| CustomerPropertyOnboardingAttention {
                property_id: property.property_id.clone(),
                display_name: property.display_name.clone(),
                status: property.status.clone(),
                reasons: vec![
                    "operational_profile_incomplete".to_string(),
                    "crew_unassigned".to_string(),
                ],
            })
            .collect(),
        complete: customer_details_ready
            && property_count > 0
            && active_property_count == property_count,
        persisted: false,
    })
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
            relationship_type: "owner".to_string(),
            customer_name: "Sample Customer".to_string(),
            billing_model: "per_job".to_string(),
            payment_status: "pending".to_string(),
            service_approval_status: "approved".to_string(),
            contracted_services_per_period: 1,
            billing_notes: Some("Payment can be marked complete after service.".to_string()),
            primary_contact_name: Some("Sample Customer".to_string()),
            contact_email: Some("customer@example.com".to_string()),
            contact_phone: None,
            email_notifications_enabled: true,
            sms_notifications_enabled: false,
            quiet_hours_start: None,
            quiet_hours_end: None,
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
            primary_contact_name: Some("Pat Customer".to_string()),
            contact_email: Some("pat@example.com".to_string()),
            contact_phone: None,
            email_notifications_enabled: true,
            sms_notifications_enabled: false,
            quiet_hours_start: Some("20:00".to_string()),
            quiet_hours_end: Some("07:00".to_string()),
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
        let mut invalid_email = update_request();
        invalid_email.contact_email = Some("not-an-email".to_string());
        assert_eq!(
            validate_update_customer_account_request(&invalid_email),
            Err("contact_email_invalid")
        );
        let mut invalid_phone = update_request();
        invalid_phone.contact_phone = Some("480-555-0100".to_string());
        assert_eq!(
            validate_update_customer_account_request(&invalid_phone),
            Err("contact_phone_invalid")
        );
        let mut missing_email = update_request();
        missing_email.contact_email = None;
        assert_eq!(
            validate_update_customer_account_request(&missing_email),
            Err("email_notifications_require_contact_email")
        );
        let mut incomplete_quiet_hours = update_request();
        incomplete_quiet_hours.quiet_hours_end = None;
        assert_eq!(
            validate_update_customer_account_request(&incomplete_quiet_hours),
            Err("quiet_hours_pair_required")
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
