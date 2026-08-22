# Grover Backend

The backend is a Rust 2021 Axum service using Tokio, SQLx, and PostgreSQL. It
serves the API in development and, in the production image, also serves the
compiled React application from the same origin.

## Current structure

This is one Rust crate rather than the earlier proposed multi-crate layout:

```text
backend/
├── Cargo.toml
├── migrations/                 # Ordered embedded SQLx migrations
├── src/
│   ├── main.rs                 # Router, HTTP mapping, workers, runtime startup
│   ├── auth.rs                 # Cognito/local-review authentication and policy
│   ├── owner_acquisition.rs    # Private owner, invitation, disclosure,
│   │                            # assessment, and acquisition-proposal domain
│   ├── day_plans.rs            # Route/day-plan persistence
│   ├── completion_reports.rs   # Completion and customer-safe delivery domain
│   ├── organizations.rs        # Organization, membership, and hierarchy domain
│   └── postgres_*.rs           # Tenant-scoped persistence implementations
└── tests/                      # Integration and PostgreSQL lifecycle coverage
```

[`../docs/architecture.md`](../docs/architecture.md) describes the runtime
boundary, and [`../docs/data-model.md`](../docs/data-model.md) indexes the
persistent model. Focused API contracts and runbooks live in [`../docs/`](../docs/).

## Delivered API areas

- Health, readiness, and public authentication configuration
- Cognito JWT verification and production-rejected local role review
- Organization bootstrap, invitations, memberships, roles, branches, territories,
  crews, team activity, and access auditing
- Jobs, checklists, photos, processing recovery, day plans, amendments, dispatch,
  operational exceptions, and activity history
- Completion-report review, immutable delivery snapshots, customer-safe share
  links, notification recovery, project bids, and approved add-ons
- Customer accounts, properties, onboarding, portfolios, crew assignments,
  privacy export, and photo-erasure recovery
- Private Yard Owner identity/property intake, yard briefs, guided media, known-
  provider invitations, provider claims, bounded responses, disclosure receipts,
  assessments, separate shared/private communication, and versioned initial-
  service proposals
- Marketing leads, first-party conversion events, and support-admin review

The definitive route registration is in [`src/main.rs`](src/main.rs). The root
[`README`](../README.md) lists representative public contracts; each detailed
contract document remains authoritative for validation and privacy boundaries.

## Local development

The repository Compose stack supplies PostgreSQL and the required environment:

```bash
docker compose up --build
bash scripts/apply-local-migrations.sh
```

Run backend checks inside Compose when Rust is not installed on the host:

```bash
docker compose exec -T backend cargo fmt --all -- --check
docker compose exec -T backend cargo test --all
```

For host development:

```bash
cd backend
cargo fmt --all -- --check
cargo test --all
```

PostgreSQL-backed tests require `DATABASE_URL`. See
[`../docs/postgres-persistence.md`](../docs/postgres-persistence.md) and
[`../docs/local-validation-sequence.md`](../docs/local-validation-sequence.md).

## Authentication modes

| Mode | Intended use | Production allowed |
| --- | --- | --- |
| `local_review` | Fixed role-specific reviewers and virtual demo memberships | No |
| `disabled` | Tests and legacy single-principal local fallback | No |
| `cognito` | Hosted identity with verified access tokens | Yes |

`AUTH_MODE=local_review` is the default Compose mode. Unknown reviewer IDs are
rejected and the mode cannot start with `APP_ENV=production`. The API exposes
runtime configuration at `GET /auth/config`. See
[`../docs/authentication.md`](../docs/authentication.md).

## Production runtime

The production binary:

- requires `DATABASE_URL` and Cognito configuration;
- applies embedded migrations before binding the listener;
- verifies access-token signature, issuer, client ID, expiry, and token use;
- enforces coarse roles plus active PostgreSQL organization membership;
- exposes `/health/live` and database-backed `/health/ready`;
- serves the SPA from `FRONTEND_DIST_DIR`;
- runs bounded notification and photo-processing workers when configured; and
- handles `SIGTERM` for graceful shutdown.

The repository-root [`Dockerfile`](../Dockerfile) builds a non-root combined
image. [`../docs/production-deployment.md`](../docs/production-deployment.md)
documents the current protected-pilot deployment contract.

## Notification delivery

Delivery is disabled by default. Webhook mode claims PostgreSQL outbox rows
safely across service instances, uses bounded retries and backoff, recovers
abandoned claims, and records provider receipts:

```text
NOTIFICATION_DISPATCH_MODE=webhook
PUBLIC_APP_URL=https://grover-landscaping.example.com
NOTIFICATION_WEBHOOK_URL=https://notification-gateway.example.com/deliver
NOTIFICATION_WEBHOOK_BEARER_TOKEN=<optional-bearer-token>
NOTIFICATION_POLL_SECONDS=5
NOTIFICATION_BATCH_SIZE=10
NOTIFICATION_MAX_ATTEMPTS=5
```

Production URLs must use HTTPS. Selecting and operating the live provider,
authenticated callback, dashboards, pager routing, and staffing remain external
pilot gates rather than repository-complete behavior.
