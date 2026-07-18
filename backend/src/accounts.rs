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
