use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
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

#[derive(Clone, Debug, Default)]
pub struct AccountRepository;

impl AccountRepository {
    pub fn new() -> Self {
        Self
    }

    pub async fn get_account_for_job(&self, job_id: &str) -> CustomerAccountSummary {
        match job_id {
            "job_1001" => CustomerAccountSummary {
                job_id: job_id.to_string(),
                account_id: "acct_1001".to_string(),
                customer_name: "Sample Customer".to_string(),
                billing_model: "per_job".to_string(),
                payment_status: "pending".to_string(),
                service_approval_status: "approved".to_string(),
                contracted_services_per_period: 1,
                completed_services_this_period: 0,
                billing_notes: "Payment can be marked complete after service.".to_string(),
            },
            "job_1002" => CustomerAccountSummary {
                job_id: job_id.to_string(),
                account_id: "acct_1002".to_string(),
                customer_name: "Demo Property Owner".to_string(),
                billing_model: "monthly_plan".to_string(),
                payment_status: "paid".to_string(),
                service_approval_status: "approved".to_string(),
                contracted_services_per_period: 4,
                completed_services_this_period: 2,
                billing_notes: "Monthly plan is current.".to_string(),
            },
            _ => CustomerAccountSummary {
                job_id: job_id.to_string(),
                account_id: "acct_unknown".to_string(),
                customer_name: "Unknown Customer".to_string(),
                billing_model: "manual_account".to_string(),
                payment_status: "manager_review".to_string(),
                service_approval_status: "manager_review".to_string(),
                contracted_services_per_period: 0,
                completed_services_this_period: 0,
                billing_notes: "Account requires manager review.".to_string(),
            },
        }
    }
}
