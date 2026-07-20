use grover_landscaping_api::{
    day_plans::{
        AmendmentService, CreateDayPlanAmendmentRequest, DayPlanRepository,
        PersistedMutationResult, PersistedReadResult, ReviewDayPlanAmendmentRequest,
    },
    db::{JobAddOnStatusUpdate, JobRepository, ResourceReadResult},
    project_bids::{
        CreateProjectBidLineItemRequest, CreateProjectBidRequest, ProjectBidDraftResult,
        ProjectBidListResult, ProjectBidMutationResult, ProjectBidRepository, ProjectBidSendResult,
        SendProjectBidRequest, SharedProjectBidReadResult,
    },
};
use sqlx::{postgres::PgPoolOptions, Row};
use std::time::Duration;
mod common;

fn applied<T: std::fmt::Debug>(result: PersistedMutationResult<T>, context: &str) -> T {
    match result {
        PersistedMutationResult::Applied(value) => value,
        other => panic!("{context}, got {other:?}"),
    }
}

fn loaded<T: std::fmt::Debug>(result: PersistedReadResult<T>, context: &str) -> T {
    match result {
        PersistedReadResult::Loaded(value) => value,
        other => panic!("{context}, got {other:?}"),
    }
}

fn loaded_bids(
    result: ProjectBidListResult,
    context: &str,
) -> Vec<grover_landscaping_api::project_bids::ProjectBidResponse> {
    match result {
        ProjectBidListResult::Loaded(bids) => bids,
        ProjectBidListResult::Unavailable => panic!("{context}: unavailable"),
    }
}

fn updated_bid(
    result: ProjectBidMutationResult,
    context: &str,
) -> grover_landscaping_api::project_bids::ProjectBidResponse {
    match result {
        ProjectBidMutationResult::Updated(bid) => bid,
        ProjectBidMutationResult::Conflict => panic!("{context}: conflict"),
        ProjectBidMutationResult::Unavailable => panic!("{context}: unavailable"),
    }
}

fn shared_bid(
    result: SharedProjectBidReadResult,
    context: &str,
) -> grover_landscaping_api::project_bids::ProjectBidResponse {
    match result {
        SharedProjectBidReadResult::Loaded(bid) => bid,
        SharedProjectBidReadResult::NotFound => panic!("{context}: not found"),
        SharedProjectBidReadResult::Unavailable => panic!("{context}: unavailable"),
    }
}

#[tokio::test]
async fn repository_deduplicates_offline_day_plan_amendments() {
    let Some(config) = common::database_config() else {
        return;
    };

    let jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let repository = DayPlanRepository::new();
    let mutation_id = uuid::Uuid::new_v4().to_string();
    let request = || CreateDayPlanAmendmentRequest {
        amendment_type: "remove_stop".to_string(),
        requested_by_crew_id: "crew_1001".to_string(),
        stop_id: Some("stop_1001".to_string()),
        service: None,
        note: Some("Offline gate access conflict".to_string()),
        client_mutation_id: Some(mutation_id.clone()),
    };

    let first = applied(
        repository
            .create_amendment("day_plan_2026_06_15_crew_1001", request())
            .await,
        "first amendment should persist",
    );
    let replay = applied(
        repository
            .create_amendment("day_plan_2026_06_15_crew_1001", request())
            .await,
        "idempotent amendment replay should recover the persisted request",
    );
    let count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM day_plan_amendment_requests WHERE id = $1")
            .bind(&first.id)
            .fetch_one(&jobs.pool().expect("database pool should be available"))
            .await
            .unwrap();

    assert!(first.persisted);
    assert!(replay.persisted);
    assert_eq!(replay.id, first.id);
    assert_eq!(
        first.id,
        format!(
            "amendment_offline_{}",
            uuid::Uuid::parse_str(&mutation_id).unwrap().simple()
        )
    );
    assert_eq!(count, 1);
}

#[tokio::test]
async fn repository_reports_rejected_persisted_amendment_writes() {
    let Some(config) = common::database_config() else {
        return;
    };
    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let repository = DayPlanRepository::new();
    let day_plan_id = "day_plan_missing";

    let creation = repository
        .create_amendment(
            day_plan_id,
            CreateDayPlanAmendmentRequest {
                amendment_type: "add_stop".to_string(),
                requested_by_crew_id: "crew_1001".to_string(),
                stop_id: None,
                service: None,
                note: Some("Missing persisted route".to_string()),
                client_mutation_id: None,
            },
        )
        .await;
    let review = repository
        .review_amendment(
            day_plan_id,
            "amendment_missing",
            ReviewDayPlanAmendmentRequest {
                decision: "approve".to_string(),
                manager_note: None,
            },
        )
        .await;

    assert!(matches!(creation, PersistedMutationResult::Unavailable));
    assert!(matches!(review, PersistedMutationResult::Conflict));
}

#[tokio::test]
async fn repository_reports_unavailable_persisted_amendment_reads() {
    let pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let repository = DayPlanRepository::from_pool(pool);

    let result = repository
        .list_amendments("day_plan_2026_06_15_crew_1001")
        .await;

    assert!(matches!(result, PersistedReadResult::Unavailable));
}

#[tokio::test]
async fn repository_reports_unavailable_persisted_project_bid_lists() {
    let pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let repository = ProjectBidRepository::from_pool(pool);

    assert!(matches!(
        repository
            .list_for_day_plan("day_plan_2026_06_15_crew_1001")
            .await,
        ProjectBidListResult::Unavailable
    ));
    assert!(matches!(
        repository
            .list_for_account("acct_1001", &["org_demo_landscaping".to_string()])
            .await,
        ProjectBidListResult::Unavailable
    ));
    assert!(matches!(
        repository
            .save_draft(
                "day_plan_2026_06_15_crew_1001",
                "amendment_missing",
                CreateProjectBidRequest {
                    customer_message: None,
                    line_items: vec![CreateProjectBidLineItemRequest {
                        service_id: "service_test".to_string(),
                        service_name: "Test service".to_string(),
                        service_description: None,
                        quantity: 1,
                        unit_price_cents: 100,
                        note: None,
                    }],
                },
            )
            .await,
        ProjectBidDraftResult::Unavailable
    ));
    assert!(matches!(
        repository
            .revoke("day_plan_2026_06_15_crew_1001", "bid_missing")
            .await,
        ProjectBidMutationResult::Unavailable
    ));
    assert!(matches!(
        repository
            .convert_to_job_add_ons(
                "day_plan_2026_06_15_crew_1001",
                "bid_missing",
                "manager_test",
            )
            .await,
        ProjectBidMutationResult::Unavailable
    ));
    assert!(matches!(
        repository.shared_for_token("share_missing").await,
        SharedProjectBidReadResult::Unavailable
    ));
    assert!(matches!(
        repository.decide_shared("share_missing", "approve").await,
        ProjectBidMutationResult::Unavailable
    ));
}

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

    let created = applied(
        repository
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
                    client_mutation_id: None,
                },
            )
            .await,
        "route amendment should persist",
    );

    assert!(created.persisted);
    assert!(created.requires_bid);

    let amendments = loaded(
        repository.list_amendments(day_plan_id).await,
        "persisted amendments should load",
    );
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

    let reviewed = applied(
        repository
            .review_amendment(
                day_plan_id,
                &created.id,
                ReviewDayPlanAmendmentRequest {
                    decision: "send_to_bid_review".to_string(),
                    manager_note: Some("Prepare an itemized customer estimate.".to_string()),
                },
            )
            .await,
        "route amendment review should persist",
    );

    assert!(reviewed.persisted);
    assert_eq!(reviewed.status, "bid_review");
    assert_eq!(
        reviewed.manager_note.as_deref(),
        Some("Prepare an itemized customer estimate.")
    );

    let bid_repository = ProjectBidRepository::new();
    let ProjectBidDraftResult::Saved(bid) = bid_repository
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
        .await
    else {
        panic!("project bid draft should persist");
    };

    assert!(bid.persisted);
    assert_eq!(bid.customer_account_id, "acct_1001");
    assert_eq!(bid.total_cents, 17_000);
    sqlx::query("DELETE FROM access_audit_events WHERE target_id = $1")
        .bind(&bid.id)
        .execute(&pool)
        .await
        .expect("test bid audit rows should reset");

    let bids = loaded_bids(
        bid_repository.list_for_day_plan(day_plan_id).await,
        "day-plan bid list should load",
    );
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

    let shared = shared_bid(
        bid_repository.shared_for_token(share_token).await,
        "sent bid should load from its share token",
    );
    assert_eq!(shared.total_cents, 17_000);

    let revoked = updated_bid(
        bid_repository.revoke(day_plan_id, &bid.id).await,
        "unanswered bid link should be revocable",
    );
    assert!(revoked.share_revoked_at.is_some());
    assert!(revoked.share_url.is_none());
    assert_eq!(revoked.delivery_status.as_deref(), Some("skipped"));
    assert!(matches!(
        bid_repository.shared_for_token(share_token).await,
        SharedProjectBidReadResult::NotFound
    ));

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

    let approved = updated_bid(
        bid_repository
            .decide_shared(resent_share_token, "approve")
            .await,
        "sent bid should accept one customer decision",
    );
    assert_eq!(approved.status, "approved");
    assert!(approved.responded_at.is_some());
    assert!(matches!(
        bid_repository
            .decide_shared(resent_share_token, "reject")
            .await,
        ProjectBidMutationResult::Conflict
    ));

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

    let converted = updated_bid(
        bid_repository
            .convert_to_job_add_ons(day_plan_id, &bid.id, manager_actor_user_id)
            .await,
        "approved bid should convert to job add-ons",
    );
    assert_eq!(converted.status, "converted");
    assert_eq!(converted.converted_job_id.as_deref(), Some("job_1001"));
    assert!(converted.converted_at.is_some());

    let converted_again = updated_bid(
        bid_repository
            .convert_to_job_add_ons(day_plan_id, &bid.id, manager_actor_user_id)
            .await,
        "bid conversion should be idempotent",
    );
    assert_eq!(converted_again.converted_at, converted.converted_at);

    let account_bid_history = loaded_bids(
        bid_repository
            .list_for_account("acct_1001", &["org_demo_landscaping".to_string()])
            .await,
        "account bid history should load",
    );
    let account_bid = account_bid_history
        .iter()
        .find(|item| item.id == bid.id)
        .expect("customer account bid history should include converted bid");
    assert_eq!(account_bid.status, "converted");
    assert_eq!(account_bid.customer_account_id, "acct_1001");
    assert_eq!(account_bid.converted_job_id.as_deref(), Some("job_1001"));

    assert!(loaded_bids(
        bid_repository
            .list_for_account("acct_1001", &["org_other".to_string()])
            .await,
        "outside organization bid history should load",
    )
    .is_empty());
    assert!(loaded_bids(
        bid_repository
            .list_for_account("acct_other", &["org_demo_landscaping".to_string()])
            .await,
        "outside account bid history should load",
    )
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

    let ResourceReadResult::Loaded(crew_add_ons) = jobs.list_job_add_ons("job_1001").await else {
        panic!("persisted job add-ons should load");
    };
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
