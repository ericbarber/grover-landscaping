use crate::{accounts::CustomerAccountSummary, JobAddOn, JobDetail, PhotoEvidence};
use serde::Serialize;

#[derive(Clone, Debug, Default)]
pub struct CompletionReportPersistence {
    pub persisted: bool,
    pub share_token: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct CompletionReportResponse {
    pub report_id: String,
    pub job_id: String,
    pub report_status: String,
    pub persisted: bool,
    pub ready_for_customer: bool,
    pub checklist_progress: u32,
    pub before_photos: u32,
    pub after_photos: u32,
    pub issue_photos: u32,
    pub share_url: Option<String>,
    pub job: JobDetail,
    pub account: CustomerAccountSummary,
    pub photo_evidence: Vec<PhotoEvidence>,
    pub completed_add_ons: Vec<JobAddOn>,
}

pub fn is_valid_completion_report_lifecycle_status(status: &str) -> bool {
    matches!(
        status,
        "draft" | "submitted" | "in_review" | "changes_requested" | "delivered"
    )
}

pub fn completion_report_manager_queue_label(status: &str) -> Option<&'static str> {
    match status {
        "draft" => Some("Draft"),
        "submitted" => Some("Ready for review"),
        "in_review" => Some("In review"),
        "changes_requested" => Some("Changes requested"),
        "delivered" => Some("Delivered"),
        _ => None,
    }
}

pub fn completion_report_is_active_manager_queue_status(status: &str) -> bool {
    matches!(status, "draft" | "submitted" | "in_review" | "changes_requested")
}

pub fn completion_report_is_visible_to_customer(status: &str, delivered_at_present: bool) -> bool {
    status == "delivered" && delivered_at_present
}

pub fn completion_report_share_link_is_available(
    status: &str,
    delivered_at_present: bool,
    share_token_present: bool,
) -> bool {
    completion_report_is_visible_to_customer(status, delivered_at_present) && share_token_present
}

pub fn completion_report_is_ready_for_delivery(
    status: &str,
    reviewed_at_present: bool,
    failed_quality_check_count: u32,
) -> bool {
    status == "in_review" && reviewed_at_present && failed_quality_check_count == 0
}

pub fn completion_report_lifecycle_transition_is_allowed(
    from_status: Option<&str>,
    to_status: &str,
) -> bool {
    matches!(
        (from_status, to_status),
        (None, "draft")
            | (None, "submitted")
            | (Some("draft"), "submitted")
            | (Some("submitted"), "in_review")
            | (Some("in_review"), "changes_requested")
            | (Some("in_review"), "delivered")
            | (Some("changes_requested"), "submitted")
    )
}

pub fn build_completion_report(
    job: JobDetail,
    account: CustomerAccountSummary,
    photo_evidence: Vec<PhotoEvidence>,
    add_ons: Vec<JobAddOn>,
) -> CompletionReportResponse {
    let checklist_progress = completion_progress(&job);
    let before_photo_evidence = count_photo_type(&photo_evidence, "before");
    let after_photo_evidence = count_photo_type(&photo_evidence, "after");
    let issue_photos = count_photo_type(&photo_evidence, "issue");
    let before_photos = job.before_photos.max(before_photo_evidence);
    let after_photos = job.after_photos.max(after_photo_evidence);
    let ready_for_customer = checklist_progress == 100 && before_photos > 0 && after_photos > 0;

    CompletionReportResponse {
        report_id: completion_report_id(&job.id),
        job_id: job.id.clone(),
        report_status: if ready_for_customer { "ready" } else { "draft" }.to_string(),
        persisted: false,
        ready_for_customer,
        checklist_progress,
        before_photos,
        after_photos,
        issue_photos,
        share_url: None,
        job,
        account,
        photo_evidence,
        completed_add_ons: add_ons
            .into_iter()
            .filter(|add_on| add_on.status == "completed")
            .collect(),
    }
}

pub fn completion_report_id(job_id: &str) -> String {
    format!("report_{job_id}")
}

pub fn shared_report_url(share_token: &str) -> String {
    format!("/reports/{share_token}")
}

pub fn apply_completion_report_persistence(
    report: &mut CompletionReportResponse,
    persistence: CompletionReportPersistence,
) {
    report.persisted = persistence.persisted;
    report.share_url = persistence.share_token.as_deref().map(shared_report_url);
}

fn completion_progress(job: &JobDetail) -> u32 {
    if job.checklist_items == 0 {
        return 0;
    }

    ((job.completed_checklist_items as f64 / job.checklist_items as f64) * 100.0).round() as u32
}

fn count_photo_type(photo_evidence: &[PhotoEvidence], photo_type: &str) -> u32 {
    photo_evidence
        .iter()
        .filter(|photo| photo.photo_type == photo_type)
        .count() as u32
}

#[cfg(test)]
mod tests {
    use super::{
        apply_completion_report_persistence, build_completion_report,
        completion_report_is_active_manager_queue_status, completion_report_is_ready_for_delivery,
        completion_report_is_visible_to_customer, completion_report_lifecycle_transition_is_allowed,
        completion_report_manager_queue_label, completion_report_share_link_is_available,
        is_valid_completion_report_lifecycle_status, CompletionReportPersistence,
    };
    use crate::{
        accounts::CustomerAccountSummary, ChecklistItem, JobAddOn, JobDetail, PhotoEvidence,
    };

    fn job(completed_checklist_items: u32, before_photos: u32, after_photos: u32) -> JobDetail {
        JobDetail {
            id: "job_1001".to_string(),
            customer_name: "Sample Customer".to_string(),
            property_address: "123 Oak Street".to_string(),
            status: "completed".to_string(),
            scheduled_date: "2026-06-15".to_string(),
            before_photos,
            after_photos,
            checklist_items: 4,
            completed_checklist_items,
            checklist: vec![ChecklistItem {
                id: "completion-notes".to_string(),
                label: "Submit completion notes".to_string(),
                completed: completed_checklist_items == 4,
            }],
        }
    }

    fn account() -> CustomerAccountSummary {
        CustomerAccountSummary {
            job_id: "job_1001".to_string(),
            account_id: "acct_1001".to_string(),
            customer_name: "Sample Customer".to_string(),
            billing_model: "per_job".to_string(),
            payment_status: "paid".to_string(),
            service_approval_status: "approved".to_string(),
            contracted_services_per_period: 1,
            completed_services_this_period: 1,
            billing_notes: "Ready for customer delivery.".to_string(),
        }
    }

    fn photo(id: &str, photo_type: &str) -> PhotoEvidence {
        PhotoEvidence {
            id: id.to_string(),
            job_id: "job_1001".to_string(),
            photo_type: photo_type.to_string(),
            file_name: format!("{photo_type}.jpg"),
            content_type: "image/jpeg".to_string(),
            object_key: format!("local/jobs/job_1001/{photo_type}/{id}.jpg"),
            status: "uploaded".to_string(),
            upload_mode: "local-placeholder",
            display_url: format!("local://local/jobs/job_1001/{photo_type}/{id}.jpg"),
        }
    }

    fn add_on(id: &str, status: &str) -> JobAddOn {
        JobAddOn {
            id: id.to_string(),
            job_id: "job_1001".to_string(),
            service_name: "Sprinkler repair".to_string(),
            service_description: None,
            quantity: 1,
            unit_price_cents: 12_500,
            note: None,
            status: status.to_string(),
        }
    }

    #[test]
    fn accepts_completion_report_lifecycle_statuses() {
        assert!(is_valid_completion_report_lifecycle_status("draft"));
        assert!(is_valid_completion_report_lifecycle_status("submitted"));
        assert!(is_valid_completion_report_lifecycle_status("in_review"));
        assert!(is_valid_completion_report_lifecycle_status("changes_requested"));
        assert!(is_valid_completion_report_lifecycle_status("delivered"));
    }

    #[test]
    fn rejects_unknown_completion_report_lifecycle_statuses() {
        assert!(!is_valid_completion_report_lifecycle_status("ready"));
        assert!(!is_valid_completion_report_lifecycle_status("archived"));
    }

    #[test]
    fn maps_completion_report_statuses_to_manager_queue_labels() {
        assert_eq!(completion_report_manager_queue_label("draft"), Some("Draft"));
        assert_eq!(
            completion_report_manager_queue_label("submitted"),
            Some("Ready for review")
        );
        assert_eq!(
            completion_report_manager_queue_label("in_review"),
            Some("In review")
        );
        assert_eq!(
            completion_report_manager_queue_label("changes_requested"),
            Some("Changes requested")
        );
        assert_eq!(
            completion_report_manager_queue_label("delivered"),
            Some("Delivered")
        );
        assert_eq!(completion_report_manager_queue_label("ready"), None);
    }

    #[test]
    fn active_manager_queue_statuses_exclude_delivered_and_unknown_statuses() {
        assert!(completion_report_is_active_manager_queue_status("draft"));
        assert!(completion_report_is_active_manager_queue_status("submitted"));
        assert!(completion_report_is_active_manager_queue_status("in_review"));
        assert!(completion_report_is_active_manager_queue_status("changes_requested"));
        assert!(!completion_report_is_active_manager_queue_status("delivered"));
        assert!(!completion_report_is_active_manager_queue_status("ready"));
    }

    #[test]
    fn customer_visibility_requires_delivery_status_and_timestamp() {
        assert!(completion_report_is_visible_to_customer("delivered", true));
        assert!(!completion_report_is_visible_to_customer("delivered", false));
        assert!(!completion_report_is_visible_to_customer("in_review", true));
        assert!(!completion_report_is_visible_to_customer("submitted", true));
    }

    #[test]
    fn share_link_requires_customer_visibility_and_token() {
        assert!(completion_report_share_link_is_available("delivered", true, true));
        assert!(!completion_report_share_link_is_available("delivered", true, false));
        assert!(!completion_report_share_link_is_available("delivered", false, true));
        assert!(!completion_report_share_link_is_available("in_review", true, true));
        assert!(!completion_report_share_link_is_available("submitted", true, true));
    }

    #[test]
    fn delivery_readiness_requires_review_status_timestamp_and_passing_checks() {
        assert!(completion_report_is_ready_for_delivery("in_review", true, 0));
        assert!(!completion_report_is_ready_for_delivery("in_review", false, 0));
        assert!(!completion_report_is_ready_for_delivery("in_review", true, 1));
        assert!(!completion_report_is_ready_for_delivery("submitted", true, 0));
        assert!(!completion_report_is_ready_for_delivery("delivered", true, 0));
    }

    #[test]
    fn allows_expected_completion_report_lifecycle_transitions() {
        assert!(completion_report_lifecycle_transition_is_allowed(None, "draft"));
        assert!(completion_report_lifecycle_transition_is_allowed(None, "submitted"));
        assert!(completion_report_lifecycle_transition_is_allowed(Some("draft"), "submitted"));
        assert!(completion_report_lifecycle_transition_is_allowed(Some("submitted"), "in_review"));
        assert!(completion_report_lifecycle_transition_is_allowed(Some("in_review"), "changes_requested"));
        assert!(completion_report_lifecycle_transition_is_allowed(Some("in_review"), "delivered"));
        assert!(completion_report_lifecycle_transition_is_allowed(Some("changes_requested"), "submitted"));
    }

    #[test]
    fn rejects_unexpected_completion_report_lifecycle_transitions() {
        assert!(!completion_report_lifecycle_transition_is_allowed(Some("draft"), "delivered"));
        assert!(!completion_report_lifecycle_transition_is_allowed(Some("submitted"), "delivered"));
        assert!(!completion_report_lifecycle_transition_is_allowed(Some("changes_requested"), "delivered"));
        assert!(!completion_report_lifecycle_transition_is_allowed(Some("delivered"), "in_review"));
        assert!(!completion_report_lifecycle_transition_is_allowed(Some("delivered"), "delivered"));
        assert!(!completion_report_lifecycle_transition_is_allowed(None, "delivered"));
        assert!(!completion_report_lifecycle_transition_is_allowed(Some("ready"), "submitted"));
    }

    #[test]
    fn report_is_draft_until_checklist_and_required_photos_are_complete() {
        let report = build_completion_report(
            job(3, 1, 1),
            account(),
            vec![photo("issue_1", "issue")],
            Vec::new(),
        );

        assert_eq!(report.report_status, "draft");
        assert_eq!(report.report_id, "report_job_1001");
        assert!(!report.persisted);
        assert!(!report.ready_for_customer);
        assert_eq!(report.checklist_progress, 75);
        assert_eq!(report.issue_photos, 1);
    }

    #[test]
    fn report_is_ready_when_checklist_and_required_photos_are_present() {
        let report = build_completion_report(
            job(4, 0, 0),
            account(),
            vec![photo("before_1", "before"), photo("after_1", "after")],
            Vec::new(),
        );

        assert_eq!(report.report_status, "ready");
        assert_eq!(report.report_id, "report_job_1001");
        assert!(!report.persisted);
        assert!(report.ready_for_customer);
        assert_eq!(report.checklist_progress, 100);
        assert_eq!(report.before_photos, 1);
        assert_eq!(report.after_photos, 1);
    }

    #[test]
    fn persistence_result_sets_report_share_url() {
        let mut report = build_completion_report(job(4, 1, 1), account(), Vec::new(), Vec::new());

        apply_completion_report_persistence(
            &mut report,
            CompletionReportPersistence {
                persisted: true,
                share_token: Some("share_report_job_1001".to_string()),
            },
        );

        assert!(report.persisted);
        assert_eq!(
            report.share_url,
            Some("/reports/share_report_job_1001".to_string())
        );
    }

    #[test]
    fn report_includes_only_completed_add_ons() {
        let report = build_completion_report(
            job(4, 1, 1),
            account(),
            Vec::new(),
            vec![
                add_on("scheduled", "scheduled"),
                add_on("completed", "completed"),
            ],
        );

        assert_eq!(report.completed_add_ons.len(), 1);
        assert_eq!(report.completed_add_ons[0].id, "completed");
    }
}
