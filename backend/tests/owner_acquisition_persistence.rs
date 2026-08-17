use grover_landscaping_api::owner_acquisition::{
    CreateOwnerIntakeMediaRequest, CreateOwnerPropertyRequest, OwnerAcquisitionRepository,
    OwnerMutationResult, OwnerReadResult, SaveOwnerWorkspaceRequest, SaveOwnerYardBriefRequest,
};
use grover_landscaping_api::PhotoUploadMetadata;
use sqlx::{postgres::PgPoolOptions, Row};
use std::time::Duration;

mod common;

fn workspace_request(display_name: &str) -> SaveOwnerWorkspaceRequest {
    SaveOwnerWorkspaceRequest {
        display_name: display_name.to_string(),
    }
}

fn property_request(address: &str) -> CreateOwnerPropertyRequest {
    CreateOwnerPropertyRequest {
        display_name: "Home".to_string(),
        address_line_1: address.to_string(),
        address_line_2: None,
        city: "Phoenix".to_string(),
        region: "AZ".to_string(),
        postal_code: "85004".to_string(),
        country_code: Some("US".to_string()),
        coarse_area: Some("Central Phoenix".to_string()),
        address_status: "owner_confirmed".to_string(),
        authority_attested: true,
    }
}

fn yard_brief_request(status: &str) -> SaveOwnerYardBriefRequest {
    SaveOwnerYardBriefRequest {
        status: status.to_string(),
        yard_areas: vec!["Front yard".to_string(), "Back yard".to_string()],
        care_goals: vec!["Routine upkeep".to_string()],
        cadence_preference: "every_two_weeks".to_string(),
        considerations: "Keep the side gate closed for the dog.".to_string(),
    }
}

#[tokio::test]
async fn repository_distinguishes_unavailable_owner_storage() {
    let pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let repository = OwnerAcquisitionRepository::from_pool(pool);

    assert!(matches!(
        repository.get_workspace("owner-unavailable").await,
        OwnerReadResult::Unavailable
    ));
    assert!(matches!(
        repository.list_properties("owner-unavailable").await,
        OwnerReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .get_latest_yard_brief("owner-unavailable", "property-1")
            .await,
        OwnerReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .save_workspace(
                "owner-unavailable",
                "owner@example.com",
                workspace_request("Owner Unavailable"),
            )
            .await,
        OwnerMutationResult::Unavailable
    ));
}

#[tokio::test]
async fn repository_persists_private_owner_properties_and_audit_events() {
    let Some(config) = common::database_config() else {
        return;
    };
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("migrations should run");

    let owner_a = "owner_acquisition_persistence_a";
    let owner_b = "owner_acquisition_persistence_b";
    sqlx::query("DELETE FROM owner_workspaces WHERE owner_user_id = ANY($1)")
        .bind(vec![owner_a, owner_b])
        .execute(&pool)
        .await
        .expect("test owner data should reset");

    let repository = OwnerAcquisitionRepository::from_pool(pool.clone());
    assert_eq!(
        repository
            .create_property(
                "owner_acquisition_missing_workspace",
                property_request("1 Missing Street"),
            )
            .await,
        OwnerMutationResult::NotFound
    );
    for (owner, email, name) in [
        (owner_a, "morgan@example.com", "Morgan Reyes"),
        (owner_b, "jamie@example.com", "Jamie Chen"),
    ] {
        assert!(matches!(
            repository
                .save_workspace(owner, email, workspace_request(name))
                .await,
            OwnerMutationResult::Saved(workspace)
                if workspace.owner_user_id == owner && workspace.persisted
        ));
    }

    let OwnerMutationResult::Saved(owner_a_property) = repository
        .create_property(owner_a, property_request("123 Oak Street"))
        .await
    else {
        panic!("owner A property should be saved");
    };
    assert!(owner_a_property.persisted);
    assert_eq!(
        repository
            .get_property(owner_b, &owner_a_property.property_id)
            .await,
        OwnerReadResult::NotFound
    );
    assert!(matches!(
        repository.list_properties(owner_b).await,
        OwnerReadResult::Loaded(properties) if properties.is_empty()
    ));
    assert_eq!(
        repository
            .create_property(owner_a, property_request(" 123   OAK street "))
            .await,
        OwnerMutationResult::Duplicate
    );
    assert!(matches!(
        repository
            .create_property(owner_b, property_request("123 Oak Street"))
            .await,
        OwnerMutationResult::Saved(_)
    ));

    let OwnerMutationResult::Saved(first_brief) = repository
        .save_yard_brief(
            owner_a,
            &owner_a_property.property_id,
            yard_brief_request("draft"),
        )
        .await
    else {
        panic!("first yard brief should save");
    };
    assert_eq!(first_brief.version, 1);
    let OwnerMutationResult::Saved(second_brief) = repository
        .save_yard_brief(
            owner_a,
            &owner_a_property.property_id,
            yard_brief_request("ready"),
        )
        .await
    else {
        panic!("ready yard brief should save");
    };
    assert_eq!(second_brief.version, 2);
    assert_eq!(
        repository
            .get_latest_yard_brief(owner_b, &owner_a_property.property_id)
            .await,
        OwnerReadResult::NotFound
    );
    assert!(matches!(
        repository
            .get_latest_yard_brief(owner_a, &owner_a_property.property_id)
            .await,
        OwnerReadResult::Loaded(brief) if brief.version == 2 && brief.status == "ready"
    ));

    let OwnerMutationResult::Saved(upload) = repository
        .create_intake_media_upload(
            owner_a,
            &owner_a_property.property_id,
            CreateOwnerIntakeMediaRequest {
                file_name: "front-yard.jpg".to_string(),
                content_type: "image/jpeg".to_string(),
                shot_type: "front_yard".to_string(),
                replaces_media_id: None,
            },
        )
        .await
    else {
        panic!("private intake media upload should be created");
    };
    assert!(upload.media.persisted);
    assert!(upload.media.object_key.contains("owner-intake"));
    let media_id = upload.media.media_id;
    assert!(matches!(
        repository
            .complete_intake_media_upload(
                owner_a,
                &owner_a_property.property_id,
                &media_id,
                PhotoUploadMetadata {
                    file_size_bytes: Some(2048),
                    image_width_px: Some(1600),
                    image_height_px: Some(900),
                    metadata_source: Some("client_reported".to_string()),
                },
            )
            .await,
        OwnerMutationResult::Saved(media) if media.status == "ready" && media.persisted
    ));
    assert_eq!(
        repository
            .list_intake_media(owner_b, &owner_a_property.property_id)
            .await,
        OwnerReadResult::NotFound
    );
    assert!(matches!(
        repository
            .list_intake_media(owner_a, &owner_a_property.property_id)
            .await,
        OwnerReadResult::Loaded(media) if media.len() == 1 && media[0].media_id == media_id
    ));
    assert!(matches!(
        repository
            .delete_intake_media(owner_a, &owner_a_property.property_id, &media_id)
            .await,
        OwnerMutationResult::Saved(media) if media.status == "deleted"
    ));

    let event_rows = sqlx::query(
        "SELECT event_kind, event_data
         FROM owner_acquisition_events
         WHERE owner_user_id = $1
         ORDER BY occurred_at, event_kind",
    )
    .bind(owner_a)
    .fetch_all(&pool)
    .await
    .expect("owner acquisition audit events should load");
    assert_eq!(event_rows.len(), 7);
    assert!(event_rows
        .iter()
        .any(|row| row.get::<String, _>("event_kind") == "workspace_saved"));
    assert!(event_rows
        .iter()
        .any(|row| row.get::<String, _>("event_kind") == "property_created"));
    assert_eq!(
        event_rows
            .iter()
            .filter(|row| row.get::<String, _>("event_kind") == "yard_brief_saved")
            .count(),
        2
    );
    for event_kind in [
        "intake_media_created",
        "intake_media_completed",
        "intake_media_deleted",
    ] {
        assert!(event_rows
            .iter()
            .any(|row| row.get::<String, _>("event_kind") == event_kind));
    }
    assert!(event_rows.iter().all(|row| {
        !row.get::<serde_json::Value, _>("event_data")
            .to_string()
            .contains("@example.com")
    }));

    sqlx::query("DELETE FROM owner_workspaces WHERE owner_user_id = ANY($1)")
        .bind(vec![owner_a, owner_b])
        .execute(&pool)
        .await
        .expect("test owner data should clean up");
}
