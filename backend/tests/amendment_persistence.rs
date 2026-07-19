use grover_landscaping_api::{
    day_plans::{
        AmendmentService, CreateDayPlanAmendmentRequest, DayPlanRepository,
        ReviewDayPlanAmendmentRequest,
    },
    db::{JobAddOnStatusUpdate, JobRepository},
    project_bids::{
        CreateProjectBidLineItemRequest, CreateProjectBidRequest, ProjectBidRepository,
        ProjectBidSendResult, SendProjectBidRequest,
    },
};
use sqlx::Row;
mod common;

#[tokio::test]
async fn repository_persists_and_lists_day_plan_amendments() {
    let Some(config) = common::database_config() else {
        return;
    };

    let jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let pool = jobs.pool().expect("database pool should be available");
    sqlx::query(
        "UPDATE customer_accounts SET contact_email = 'customer@example.com', email_notifications_enabled = TRUE, contact_phone = NULL, sms_notifications_enabled = FALSE, quiet_hours_start = NULL, quiet_hours_end = NULL WHERE id = 'acct_1001'",
    )
    .execute(&pool)
    .await
    .expect("customer notification fixture should reset");
    sqlx::query(
        "UPDATE day_plan_stops SET estimated_service_minutes = 45 WHERE day_plan_id = $1 AND id = $2",
    )
    .bind("day_plan_2026_06_15_crew_1001")
    .bind("stop_1001")
    .execute(&pool)
    .await
    .expect("source stop fixture should reset");

    let repository = DayPlanRepository::new();
    let day_plan_id = "day_plan_2026_06_15_crew_1001";
    let manager_actor_user_id = "user_project_bid_conversion_audit";

    let created = repository
        .create_amendment(
            day_plan_id,
            CreateDayPlanAmendmentRequest {
                amendment_type: "add_service".to_string(),
                requested_by_crew_id: "crew_1001".to_string(),
                stop_id: Some("stop_1001".to_string()),
                service: Some(AmendmentService {
                    id: "service_sprinkler_repair".to_string(),
                    name: "Sprinkler repair".to_string(),
                    description: Some("Replace a damaged sprinkler head".to_string()),
                    default_duration_minutes: Some(30),
                    default_price_cents: Some(8500),
                    requires_manager_approval: true,
                }),
                note: Some("Customer requested an onsite estimate.".to_string()),
            },
        )
        .await;

    assert!(created.persisted);
    assert!(created.requires_bid);

    let amendments = repository.list_amendments(day_plan_id).await;
    let persisted = amendments
        .iter()
        .find(|amendment| amendment.id == created.id)
        .expect("created amendment should be listed");

    assert_eq!(persisted.status, "submitted");
    assert_eq!(persisted.stop_id.as_deref(), Some("stop_1001"));
    assert_eq!(
        persisted
            .service
            .as_ref()
            .map(|service| service.id.as_str()),
        Some("service_sprinkler_repair")
    );

    let reviewed = repository
        .review_amendment(
            day_plan_id,
            &created.id,
            ReviewDayPlanAmendmentRequest {
                decision: "send_to_bid_review".to_string(),
                manager_note: Some("Prepare an itemized customer estimate.".to_string()),
            },
        )
        .await;

    assert!(reviewed.persisted);
    assert_eq!(reviewed.status, "bid_review");
    assert_eq!(
        reviewed.manager_note.as_deref(),
        Some("Prepare an itemized customer estimate.")
    );

    let bid_repository = ProjectBidRepository::new();
    let bid = bid_repository
        .save_draft(
            day_plan_id,
            &created.id,
            CreateProjectBidRequest {
                customer_message: Some(
                    "We found sprinkler work outside your regular service.".to_string(),
                ),
                line_items: vec![CreateProjectBidLineItemRequest {
                    service_id: "service_sprinkler_repair".to_string(),
                    service_name: "Sprinkler repair".to_string(),
                    service_description: Some("Replace damaged sprinkler heads".to_string()),
                    quantity: 2,
                    unit_price_cents: 8500,
                    note: None,
                }],
            },
        )
        .await;

    assert!(bid.persisted);
    assert_eq!(bid.customer_account_id, "acct_1001");
    assert_eq!(bid.total_cents, 17_000);
    sqlx::query("DELETE FROM access_audit_events WHERE target_id = $1")
        .bind(&bid.id)
        .execute(&pool)
        .await
        .expect("test bid audit rows should reset");

    let bids = bid_repository.list_for_day_plan(day_plan_id).await;
    assert!(bids.iter().any(|item| item.id == bid.id));

    let ProjectBidSendResult::Sent(sent) = bid_repository
        .send(
            day_plan_id,
            &bid.id,
            &SendProjectBidRequest {
                channel: "email".to_string(),
                recipient: "customer@example.com".to_string(),
            },
        )
        .await
    else {
        panic!("persisted draft bid should be sendable");
    };
    assert_eq!(sent.status, "sent");
    assert_eq!(sent.delivery_status.as_deref(), Some("queued"));
    assert_eq!(sent.delivery_channel.as_deref(), Some("email"));
    assert!(sent.share_expires_at.is_some());
    let share_token = sent
        .share_url
        .as_deref()
        .and_then(|url| url.strip_prefix("/bid-review/"))
        .expect("sent bid should expose a customer share token");

    let shared = bid_repository
        .shared_for_token(share_token)
        .await
        .expect("sent bid should load from its share token");
    assert_eq!(shared.total_cents, 17_000);

    let revoked = bid_repository
        .revoke(day_plan_id, &bid.id)
        .await
        .expect("unanswered bid link should be revocable");
    assert!(revoked.share_revoked_at.is_some());
    assert!(revoked.share_url.is_none());
    assert_eq!(revoked.delivery_status.as_deref(), Some("skipped"));
    assert!(bid_repository.shared_for_token(share_token).await.is_none());

    assert!(matches!(
        bid_repository
            .send(
                day_plan_id,
                &bid.id,
                &SendProjectBidRequest {
                    channel: "sms".to_string(),
                    recipient: "+16025550123".to_string(),
                },
            )
            .await,
        ProjectBidSendResult::PreferenceBlocked
    ));
    sqlx::query(
        "UPDATE customer_accounts SET contact_phone = $2, sms_notifications_enabled = TRUE WHERE id = $1",
    )
    .bind("acct_1001")
    .bind("+16025550123")
    .execute(&pool)
    .await
    .expect("test customer SMS preference should be enabled");

    let ProjectBidSendResult::Sent(resent) = bid_repository
        .send(
            day_plan_id,
            &bid.id,
            &SendProjectBidRequest {
                channel: "sms".to_string(),
                recipient: "+16025550123".to_string(),
            },
        )
        .await
    else {
        panic!("revoked bid should allow a new delivery and token");
    };
    let resent_share_token = resent
        .share_url
        .as_deref()
        .and_then(|url| url.strip_prefix("/bid-review/"))
        .expect("resent bid should expose a replacement token");
    assert_ne!(resent_share_token, share_token);
    assert_eq!(resent.delivery_channel.as_deref(), Some("sms"));

    let approved = bid_repository
        .decide_shared(resent_share_token, "approve")
        .await
        .expect("sent bid should accept one customer decision");
    assert_eq!(approved.status, "approved");
    assert!(approved.responded_at.is_some());
    assert!(bid_repository
        .decide_shared(resent_share_token, "reject")
        .await
        .is_none());

    let source_stop_before_conversion = sqlx::query(
        "SELECT estimated_service_minutes FROM day_plan_stops WHERE day_plan_id = $1 AND id = $2",
    )
    .bind(day_plan_id)
    .bind("stop_1001")
    .fetch_one(&pool)
    .await
    .expect("source stop should remain on the route");
    let service_minutes_before_conversion =
        source_stop_before_conversion.get::<i32, _>("estimated_service_minutes") as u32;

    let converted = bid_repository
        .convert_to_job_add_ons(day_plan_id, &bid.id, manager_actor_user_id)
        .await
        .expect("approved bid should convert to job add-ons");
    assert_eq!(converted.status, "converted");
    assert_eq!(converted.converted_job_id.as_deref(), Some("job_1001"));
    assert!(converted.converted_at.is_some());

    let converted_again = bid_repository
        .convert_to_job_add_ons(day_plan_id, &bid.id, manager_actor_user_id)
        .await
        .expect("bid conversion should be idempotent");
    assert_eq!(converted_again.converted_at, converted.converted_at);

    let account_bid_history = bid_repository
        .list_for_account("acct_1001", &["org_demo_landscaping".to_string()])
        .await;
    let account_bid = account_bid_history
        .iter()
        .find(|item| item.id == bid.id)
        .expect("customer account bid history should include converted bid");
    assert_eq!(account_bid.status, "converted");
    assert_eq!(account_bid.customer_account_id, "acct_1001");
    assert_eq!(account_bid.converted_job_id.as_deref(), Some("job_1001"));

    assert!(bid_repository
        .list_for_account("acct_1001", &["org_other".to_string()])
        .await
        .is_empty());
    assert!(bid_repository
        .list_for_account("acct_other", &["org_demo_landscaping".to_string()])
        .await
        .is_empty());

    let add_on_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM service_job_add_ons WHERE project_bid_id = $1",
    )
    .bind(&bid.id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(add_on_count, 1);

    let converted_stop = sqlx::query(
        "SELECT estimated_service_minutes FROM day_plan_stops WHERE day_plan_id = $1 AND id = $2",
    )
    .bind(day_plan_id)
    .bind("stop_1001")
    .fetch_one(&pool)
    .await
    .expect("converted add-on source stop should remain on the route");
    assert_eq!(
        converted_stop.get::<i32, _>("estimated_service_minutes") as u32,
        service_minutes_before_conversion + 30
    );

    let crew_add_ons = jobs.list_job_add_ons("job_1001").await;
    let converted_add_on = crew_add_ons
        .iter()
        .find(|add_on| add_on.id.contains(&bid.id))
        .expect("converted add-on should be visible through the job repository");
    assert_eq!(converted_add_on.service_name, "Sprinkler repair");
    assert_eq!(converted_add_on.status, "scheduled");

    let started = jobs
        .update_job_add_on_status("job_1001", &converted_add_on.id, "in_progress")
        .await;
    assert!(matches!(
        started,
        JobAddOnStatusUpdate::Updated(ref add_on) if add_on.status == "in_progress"
    ));

    let completed = jobs
        .update_job_add_on_status("job_1001", &converted_add_on.id, "completed")
        .await;
    assert!(matches!(
        completed,
        JobAddOnStatusUpdate::Updated(ref add_on) if add_on.status == "completed"
    ));

    let invalid_transition = jobs
        .update_job_add_on_status("job_1001", &converted_add_on.id, "scheduled")
        .await;
    assert_eq!(invalid_transition, JobAddOnStatusUpdate::InvalidTransition);

    let audit_kinds = sqlx::query_scalar::<_, String>(
        r#"
        SELECT string_agg(event_kind, ',' ORDER BY event_kind)
        FROM access_audit_events
        WHERE target_id = $1
          AND event_kind IN ('bid_approved', 'bid_converted')
        "#,
    )
    .bind(&bid.id)
    .fetch_one(&pool)
    .await
    .expect("bid audit kinds should be available");
    assert_eq!(audit_kinds, "bid_approved,bid_converted");

    let conversion_actor = sqlx::query_scalar::<_, String>(
        r#"
        SELECT actor_user_id
        FROM access_audit_events
        WHERE target_id = $1
          AND event_kind = 'bid_converted'
        "#,
    )
    .bind(&bid.id)
    .fetch_one(&pool)
    .await
    .expect("conversion audit actor should be available");
    assert_eq!(conversion_actor, manager_actor_user_id);
}
