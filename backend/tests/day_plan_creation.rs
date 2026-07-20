use grover_landscaping_api::{
    day_plans::{
        draft_day_plan_id, AssignDayPlanStopRequest, CreateDayPlanRequest, DayPlanRepository,
        PersistedMutationResult, PersistedReadResult, ReorderDayPlanStopsRequest,
        TodayDayPlanResult,
    },
    db::JobRepository,
};
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::time::Duration;
mod common;

fn applied<T: std::fmt::Debug>(result: PersistedMutationResult<T>, context: &str) -> T {
    match result {
        PersistedMutationResult::Applied(value) => value,
        other => panic!("{context}, got {other:?}"),
    }
}

#[tokio::test]
async fn repository_distinguishes_unavailable_dispatch_setup_collections() {
    let pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let repository = DayPlanRepository::from_pool(pool);
    let organizations = vec!["org_demo_landscaping".to_string()];

    assert!(matches!(
        repository.list_crews(&organizations).await,
        PersistedReadResult::Unavailable
    ));
    assert!(matches!(
        repository.list_organization_branches(&organizations).await,
        PersistedReadResult::Unavailable
    ));
    assert!(matches!(
        repository.list_service_territories(&organizations).await,
        PersistedReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .list_organization_crews("org_demo_landscaping")
            .await,
        PersistedReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .create_crew(
                "org_demo_landscaping",
                grover_landscaping_api::day_plans::CreateCrewRequest {
                    name: "Unavailable Crew".to_string(),
                },
            )
            .await,
        PersistedMutationResult::Unavailable
    ));
    assert_eq!(
        repository
            .update_crew(
                "org_demo_landscaping",
                "crew_1001",
                "integration_user",
                grover_landscaping_api::day_plans::UpdateCrewRequest {
                    name: "Unavailable Crew".to_string(),
                    status: "active".to_string(),
                    daily_stop_capacity: Some(10),
                    lead_membership_id: None,
                    branch_id: None,
                    territory_id: None,
                },
            )
            .await,
        grover_landscaping_api::day_plans::UpdateCrewResult::Unavailable
    );
}

async fn reset_day_plan_fixture(pool: &PgPool, day_plan_id: &str) {
    sqlx::query("DELETE FROM stop_progress_mutations WHERE day_plan_id = $1")
        .bind(day_plan_id)
        .execute(pool)
        .await
        .expect("test stop-progress mutations should reset");
    sqlx::query("DELETE FROM access_audit_events WHERE target_id = $1")
        .bind(day_plan_id)
        .execute(pool)
        .await
        .expect("test day plan audit events should reset");
    sqlx::query("DELETE FROM day_plan_amendment_requests WHERE day_plan_id = $1")
        .bind(day_plan_id)
        .execute(pool)
        .await
        .expect("test day plan amendments should reset");
    sqlx::query("DELETE FROM day_plan_stops WHERE day_plan_id = $1")
        .bind(day_plan_id)
        .execute(pool)
        .await
        .expect("test day plan stops should reset");
    sqlx::query("DELETE FROM day_plans WHERE id = $1")
        .bind(day_plan_id)
        .execute(pool)
        .await
        .expect("test day plan should reset");
}

#[tokio::test]
async fn repository_creates_draft_day_plan() {
    let Some(config) = common::database_config() else {
        return;
    };

    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let day_plans = DayPlanRepository::new();
    let pool = _jobs.pool().expect("database pool should be available");
    sqlx::query(
        "UPDATE organizations SET time_zone = 'America/Phoenix', service_area_label = 'Phoenix metro' WHERE id = 'org_demo_landscaping'",
    )
    .execute(&pool)
    .await
    .expect("seed organization route defaults should be configurable");
    sqlx::query("UPDATE crews SET daily_stop_capacity = 7 WHERE id = 'crew_1001'")
        .execute(&pool)
        .await
        .expect("seed crew capacity should be configurable");
    let response = applied(
        day_plans
            .create_draft_day_plan(CreateDayPlanRequest {
                crew_id: "crew_1001".to_string(),
                service_date: "2026-06-16".to_string(),
            })
            .await,
        "draft creation should persist",
    );

    assert_eq!(response.id, "day_plan_2026_06_16_crew_1001");
    assert_eq!(response.status, "draft");
    assert_eq!(response.time_zone, "America/Phoenix");
    assert_eq!(
        response.service_area_label.as_deref(),
        Some("Phoenix metro")
    );
    assert_eq!(response.stop_capacity, 7);
    assert!(response.persisted);
}

#[tokio::test]
async fn repository_publishes_draft_day_plan() {
    let Some(config) = common::database_config() else {
        return;
    };

    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    reset_day_plan_fixture(&pool, "day_plan_2026_06_18_crew_1001").await;

    let day_plans = DayPlanRepository::new();
    let actor_user_id = "manager_publish_audit_test";
    let draft = applied(
        day_plans
            .create_draft_day_plan_as(
                CreateDayPlanRequest {
                    crew_id: "crew_1001".to_string(),
                    service_date: "2026-06-18".to_string(),
                },
                actor_user_id,
            )
            .await,
        "audited draft creation should persist",
    );
    let PersistedMutationResult::Applied(assigned_stop) = day_plans
        .assign_stop_as(
            &draft.id,
            AssignDayPlanStopRequest {
                job_id: "job_1001".to_string(),
                estimated_drive_minutes: Some(10),
                estimated_service_minutes: Some(45),
            },
            actor_user_id,
        )
        .await
    else {
        panic!("draft stop assignment should persist");
    };

    assert!(assigned_stop.persisted);

    let response = applied(
        day_plans
            .publish_day_plan_as(&draft.id, actor_user_id)
            .await,
        "audited route publication should persist",
    );

    assert_eq!(response.id, "day_plan_2026_06_18_crew_1001");
    assert_eq!(response.status, "published");
    assert_eq!(response.route_status, "manual");
    assert!(response.persisted);
    let published_actor: String = sqlx::query_scalar(
        "SELECT actor_user_id FROM access_audit_events WHERE target_id = $1 AND event_kind = 'route_published' ORDER BY occurred_at DESC LIMIT 1",
    )
    .bind(&draft.id)
    .fetch_one(&pool)
    .await
    .expect("route publication audit should be readable");
    assert_eq!(published_actor, actor_user_id);
}

#[tokio::test]
async fn repository_exposes_published_day_plan_to_crew_route() {
    let Some(config) = common::database_config() else {
        return;
    };

    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    let service_date: String = sqlx::query_scalar("SELECT CURRENT_DATE::text")
        .fetch_one(&pool)
        .await
        .expect("database current date should be readable");
    let crew_id = "crew_publish_route_test";
    let day_plan_id = draft_day_plan_id(crew_id, &service_date);

    sqlx::query("INSERT INTO crews (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING")
        .bind(crew_id)
        .bind("Publish Route Test Crew")
        .execute(&pool)
        .await
        .expect("test crew should be present");
    let prior_day_plan_ids =
        sqlx::query_scalar::<_, String>("SELECT id FROM day_plans WHERE crew_id = $1")
            .bind(crew_id)
            .fetch_all(&pool)
            .await
            .expect("prior test day plans should be readable");
    for prior_day_plan_id in prior_day_plan_ids {
        reset_day_plan_fixture(&pool, &prior_day_plan_id).await;
    }
    reset_day_plan_fixture(&pool, &day_plan_id).await;

    let day_plans = DayPlanRepository::new();
    let draft = applied(
        day_plans
            .create_draft_day_plan(CreateDayPlanRequest {
                crew_id: crew_id.to_string(),
                service_date,
            })
            .await,
        "crew route draft creation should persist",
    );
    let PersistedMutationResult::Applied(assigned_stop) = day_plans
        .assign_stop(
            &draft.id,
            AssignDayPlanStopRequest {
                job_id: "job_1001".to_string(),
                estimated_drive_minutes: Some(10),
                estimated_service_minutes: Some(45),
            },
        )
        .await
    else {
        panic!("draft stop assignment should persist");
    };

    assert!(assigned_stop.persisted);

    let before_publish = day_plans.today_for_crew(crew_id).await;
    assert!(
        matches!(before_publish, TodayDayPlanResult::NotFound),
        "draft route should be hidden, got {before_publish:?}"
    );

    let published = applied(
        day_plans.publish_day_plan(&draft.id).await,
        "crew route publication should persist",
    );
    assert!(published.persisted);

    let TodayDayPlanResult::Found(crew_route) = day_plans.today_for_crew(crew_id).await else {
        panic!("published persisted route should be found");
    };

    assert_eq!(crew_route.id, draft.id);
    assert_eq!(crew_route.status, "published");
    assert_eq!(crew_route.stops.len(), 1);
    assert_eq!(crew_route.stops[0].id, assigned_stop.stop_id);
}

#[tokio::test]
async fn repository_assigns_reorders_and_removes_day_plan_stops() {
    let Some(config) = common::database_config() else {
        return;
    };

    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    reset_day_plan_fixture(&pool, "day_plan_2026_06_20_crew_1001").await;

    let day_plans = DayPlanRepository::new();
    let actor_user_id = "manager_schedule_audit_test";
    let draft = applied(
        day_plans
            .create_draft_day_plan_as(
                CreateDayPlanRequest {
                    crew_id: "crew_1001".to_string(),
                    service_date: "2026-06-20".to_string(),
                },
                actor_user_id,
            )
            .await,
        "route-edit draft creation should persist",
    );

    let PersistedMutationResult::Applied(first_stop) = day_plans
        .assign_stop_as(
            &draft.id,
            AssignDayPlanStopRequest {
                job_id: "job_1001".to_string(),
                estimated_drive_minutes: Some(10),
                estimated_service_minutes: Some(45),
            },
            actor_user_id,
        )
        .await
    else {
        panic!("first draft stop assignment should persist");
    };
    let PersistedMutationResult::Applied(second_stop) = day_plans
        .assign_stop_as(
            &draft.id,
            AssignDayPlanStopRequest {
                job_id: "job_1002".to_string(),
                estimated_drive_minutes: Some(8),
                estimated_service_minutes: Some(60),
            },
            actor_user_id,
        )
        .await
    else {
        panic!("second draft stop assignment should persist");
    };

    assert!(first_stop.persisted);
    assert!(second_stop.persisted);
    assert_eq!(first_stop.stop_order, 1);
    assert_eq!(second_stop.stop_order, 2);

    let PersistedMutationResult::Applied(reorder) = day_plans
        .reorder_stops_as(
            &draft.id,
            ReorderDayPlanStopsRequest {
                stop_ids: vec![second_stop.stop_id.clone(), first_stop.stop_id.clone()],
            },
            actor_user_id,
        )
        .await
    else {
        panic!("draft stop reorder should persist");
    };

    assert!(reorder.persisted);

    let PersistedMutationResult::Applied(removal) = day_plans
        .remove_stop_as(&draft.id, &second_stop.stop_id, actor_user_id)
        .await
    else {
        panic!("draft stop removal should persist");
    };

    assert!(removal.persisted);

    let remaining_stop =
        sqlx::query("SELECT stop_order FROM day_plan_stops WHERE day_plan_id = $1 AND id = $2")
            .bind(&draft.id)
            .bind(&first_stop.stop_id)
            .fetch_one(&pool)
            .await
            .expect("remaining assigned stop should be present");

    assert_eq!(remaining_stop.get::<i32, _>("stop_order"), 1);

    let PersistedMutationResult::Applied(final_removal) = day_plans
        .remove_stop_as(&draft.id, &first_stop.stop_id, actor_user_id)
        .await
    else {
        panic!("final draft stop removal should persist");
    };
    assert!(final_removal.persisted);

    let audit_events = sqlx::query(
        r#"
        SELECT event_kind, actor_user_id
        FROM access_audit_events
        WHERE target_id = $1
        ORDER BY occurred_at, id
        "#,
    )
    .bind(&draft.id)
    .fetch_all(&pool)
    .await
    .expect("schedule audit events should be readable");
    let event_kinds = audit_events
        .iter()
        .map(|row| row.get::<String, _>("event_kind"))
        .collect::<Vec<_>>();
    assert_eq!(
        event_kinds,
        vec![
            "route_draft_saved",
            "route_stop_assigned",
            "route_stop_assigned",
            "route_stops_reordered",
            "route_stop_removed",
            "route_stop_removed",
        ]
    );
    assert!(audit_events
        .iter()
        .all(|row| row.get::<String, _>("actor_user_id") == actor_user_id));
    let assigned_job_id: String = sqlx::query_scalar(
        "SELECT metadata->>'job_id' FROM access_audit_events WHERE target_id = $1 AND event_kind = 'route_stop_assigned' ORDER BY occurred_at, id LIMIT 1",
    )
    .bind(&draft.id)
    .fetch_one(&pool)
    .await
    .expect("route assignment metadata should be readable");
    assert_eq!(assigned_job_id, "job_1001");
    let reordered_stop_count: String = sqlx::query_scalar(
        "SELECT metadata->>'stop_count' FROM access_audit_events WHERE target_id = $1 AND event_kind = 'route_stops_reordered' LIMIT 1",
    )
    .bind(&draft.id)
    .fetch_one(&pool)
    .await
    .expect("route reorder metadata should be readable");
    assert_eq!(reordered_stop_count, "2");
}

#[tokio::test]
async fn repository_blocks_stop_assignments_beyond_draft_capacity() {
    let Some(config) = common::database_config() else {
        return;
    };

    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    let day_plan_id = "day_plan_2026_06_21_crew_1001";
    reset_day_plan_fixture(&pool, day_plan_id).await;

    let day_plans = DayPlanRepository::new();
    let draft = applied(
        day_plans
            .create_draft_day_plan(CreateDayPlanRequest {
                crew_id: "crew_1001".to_string(),
                service_date: "2026-06-21".to_string(),
            })
            .await,
        "capacity-test draft creation should persist",
    );
    sqlx::query("UPDATE day_plans SET stop_capacity = 1 WHERE id = $1")
        .bind(&draft.id)
        .execute(&pool)
        .await
        .expect("test draft capacity should update");

    let PersistedMutationResult::Applied(first) = day_plans
        .assign_stop(
            &draft.id,
            AssignDayPlanStopRequest {
                job_id: "job_1001".to_string(),
                estimated_drive_minutes: Some(10),
                estimated_service_minutes: Some(45),
            },
        )
        .await
    else {
        panic!("first stop should fit within draft capacity");
    };
    let second = day_plans
        .assign_stop(
            &draft.id,
            AssignDayPlanStopRequest {
                job_id: "job_1002".to_string(),
                estimated_drive_minutes: Some(8),
                estimated_service_minutes: Some(60),
            },
        )
        .await;
    let stop_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM day_plan_stops WHERE day_plan_id = $1")
            .bind(&draft.id)
            .fetch_one(&pool)
            .await
            .expect("test draft stops should be countable");

    assert!(first.persisted);
    assert!(matches!(second, PersistedMutationResult::Conflict));
    assert_eq!(stop_count, 1);
}

#[tokio::test]
async fn repository_reports_rejected_persisted_route_stop_mutations() {
    let Some(config) = common::database_config() else {
        return;
    };

    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    let day_plans = DayPlanRepository::from_pool(pool);
    let missing_day_plan_id = "day_plan_2099_01_01_crew_missing";

    let draft_creation = day_plans
        .create_draft_day_plan(CreateDayPlanRequest {
            crew_id: "crew_missing".to_string(),
            service_date: "2099-01-01".to_string(),
        })
        .await;
    let publication = day_plans.publish_day_plan(missing_day_plan_id).await;
    let assignment = day_plans
        .assign_stop(
            missing_day_plan_id,
            AssignDayPlanStopRequest {
                job_id: "job_1001".to_string(),
                estimated_drive_minutes: Some(10),
                estimated_service_minutes: Some(45),
            },
        )
        .await;
    let removal = day_plans
        .remove_stop(missing_day_plan_id, "stop_missing")
        .await;
    let reorder = day_plans
        .reorder_stops(
            missing_day_plan_id,
            ReorderDayPlanStopsRequest {
                stop_ids: vec!["stop_missing".to_string()],
            },
        )
        .await;

    assert!(matches!(draft_creation, PersistedMutationResult::Conflict));
    assert!(matches!(publication, PersistedMutationResult::Conflict));
    assert!(matches!(assignment, PersistedMutationResult::Conflict));
    assert!(matches!(removal, PersistedMutationResult::Conflict));
    assert!(matches!(reorder, PersistedMutationResult::NotFound));
}

#[tokio::test]
async fn repository_fails_persisted_route_ownership_lookups_closed() {
    let Some(config) = common::database_config() else {
        return;
    };
    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    let repository = DayPlanRepository::from_pool(pool);

    assert_eq!(
        repository.organization_id_for_crew("crew_1001").await,
        PersistedReadResult::Loaded(Some("org_demo_landscaping".to_string()))
    );
    assert_eq!(
        repository.organization_id_for_crew("crew_missing").await,
        PersistedReadResult::Loaded(None)
    );
    assert_eq!(
        repository
            .organization_id_for_day_plan("day_plan_missing")
            .await,
        PersistedReadResult::Loaded(None)
    );

    let unavailable_pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let unavailable_repository = DayPlanRepository::from_pool(unavailable_pool);
    assert_eq!(
        unavailable_repository
            .organization_id_for_crew("crew_1001")
            .await,
        PersistedReadResult::Unavailable
    );
    assert_eq!(
        unavailable_repository
            .organization_id_for_day_plan("day_plan_2026_06_15_crew_1001")
            .await,
        PersistedReadResult::Unavailable
    );
}
