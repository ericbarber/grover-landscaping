# Grover Landscaping

Grover Landscaping is a mobile-first proof-of-completion application for yard care and landscaping crews. Crews can view assigned jobs, follow a daily route, track stop progress, capture service photo placeholders, complete checklists, and prepare completion reports for customer or manager review.

The project is built as a Rust + React application with local-first and remote-first development support. The frontend can run with seeded browser data when the backend is unavailable, and the backend exposes the first set of job, account, photo-ticket, stop-progress, and manager day-plan APIs.

## Features

- Crew completion dashboard
- Daily crew route / day-plan panel
- Ordered route stops with drive and service estimates
- Local stop progress tracking with browser persistence
- Assigned job list and job detail view
- Start-job and complete-job actions
- Before / after / issue photo placeholder flow
- Persisted photo evidence metadata display with server-extracted file size and image dimensions when object storage is available
- Server-defined thumbnail normalization policy for S3-backed photo uploads
- Server-side thumbnail generation attempt for S3-backed uploaded photo evidence
- Durable photo-processing retry queue for thumbnail work that cannot finish during upload completion
- Rejected photo evidence quarantine for invalid uploaded image objects
- Completion checklist and completion report panel
- Backend completion report endpoint with account and photo evidence
- PostgreSQL-backed completion report state
- Audited manager start-review transition for submitted completion reports
- Stable shareable completion report links
- Organization-scoped manager completion-report queue and notification recovery controls
- Customer portal preview with scoped delivered report history
- Customer portal preview with authenticated bid history
- Customer account status display
- Manager draft day-plan creation and publishing
- Manager route stop assignment, removal, and ordering
- Browser fallback mode for demos and frontend-only development
- Rust API endpoints for jobs, accounts, photo tickets, stop progress, and manager scheduling
- PostgreSQL migrations for job, account, crew, stop, and day-plan foundations
- Docker Compose local stack
- GitHub Actions CI configuration

## Tech Stack

| Area | Technology |
| --- | --- |
| Backend | Rust, Axum, Tokio, SQLx |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Database | PostgreSQL |
| Local runtime | Docker Compose |
| Remote validation | GitHub Actions and hosted development services |
| Initial hosting | Render Docker web service and managed PostgreSQL |
| Growth path | AWS Cognito, S3, RDS, and App Runner/ECS when required |
| CI | GitHub Actions |

## Repository Layout

```text
.github/workflows/  GitHub Actions workflows
backend/            Rust API service
frontend/           React/Tailwind crew application
infra/              Infrastructure notes and AWS growth plan
docs/               Architecture, data model, and development notes
scripts/            Local developer utility scripts
```

## Remote Development

This project can be developed without direct access to a local Docker container. When working remotely:

- Prefer small commits that GitHub Actions can validate independently.
- Treat database and migration work as code-reviewed until CI or a hosted PostgreSQL environment confirms it.
- Use frontend fallback behavior for UI development when the backend is unavailable.
- Use hosted development services for end-to-end validation once they are available.
- Document any change that requires hosted secrets, external providers, or database migrations before enabling it in production paths.

Recommended remote validation order:

```text
1. Inspect changed files and keep changes narrowly scoped.
2. Rely on GitHub Actions for backend format/lint/test and frontend typecheck/test/build.
3. Use hosted development services for API/database verification when local Docker is unavailable.
4. Keep browser fallback behavior intact for demos and UI iteration.
```

## Local Development

Copy the example environment file:

```bash
cp .env.example .env
```

Start the local stack when Docker is available:

```bash
docker compose up --build
```

The app containers run as `HOST_UID:HOST_GID` from `.env` so generated files in the bind-mounted repo stay writable by your host user. The defaults are `1000:1000`; adjust them with `id -u` and `id -g` if your local account uses different IDs.

`DATABASE_URL` is for backend and database commands run on the host, where PostgreSQL is available at `localhost:5432`. The Compose backend uses `COMPOSE_DATABASE_URL`, where PostgreSQL is available through the service hostname `postgres`. Keep these hostnames distinct when overriding either value.

Apply database migrations after PostgreSQL is healthy:

```bash
bash scripts/apply-local-migrations.sh
```

Local services:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8080
Health:   http://localhost:8080/health
Ready:    http://localhost:8080/health/ready
Database: localhost:5432
```

If the frontend opens before the API is ready, the authentication error screen can retry runtime configuration without a full page refresh.

The frontend can also run without the backend. In that mode it uses seed data, local photo placeholders, and browser storage for route progress.

```bash
cd frontend
npm install
npm run dev
```

## Backend Commands

```bash
cd backend
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all
```

## Frontend Commands

```bash
cd frontend
npm install
npm run typecheck
npm test
npm run build
```

## API Endpoints

Current backend endpoints include:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API health check |
| GET | `/me/access` | Read the signed-in user's claim roles and active organization memberships |
| GET | `/jobs` | List assigned jobs |
| GET | `/jobs/{id}` | Read job detail |
| GET | `/jobs/{id}/account` | Read account status for a job |
| POST | `/organizations/{organization_id}/invitations` | Create a pending organization membership invitation and queue email delivery |
| POST | `/organization-invitations/{token}/accept` | Accept an invitation into an active organization membership |
| PUT | `/organizations/{organization_id}/memberships/{membership_id}/role` | Update an organization membership role with audit history |
| GET | `/accounts/{account_id}/property-portfolios` | List organization-scoped property portfolios for a customer account |
| GET | `/accounts/{account_id}/customer-property-portfolio` | Read customer-scoped portfolio groups, grouped properties, and ungrouped yards |
| GET | `/accounts/{account_id}/bids` | List sent, answered, and converted project bids for a scoped customer account |
| POST | `/property-portfolios` | Create a property portfolio for a customer account |
| POST | `/property-portfolios/{portfolio_id}/properties` | Add a yard/property to a portfolio without changing ownership or crew assignment |
| GET | `/properties/{property_id}/crew-assignments` | List organization-scoped crew assignment history for a property |
| POST | `/properties/{property_id}/crew-assignments` | Assign a crew to service a property without changing ownership or portfolio grouping |
| GET | `/properties/{property_id}/onboarding` | Read property onboarding details for service address, access, billing, and notification readiness |
| PUT | `/properties/{property_id}/onboarding` | Save validated property onboarding details without changing portfolio grouping or crew assignment |
| GET | `/crews/{crew_id}/property-assignments/active` | List active property assignments for a crew |
| GET | `/jobs/{id}/report` | Read completion report readiness, account state, and photo evidence |
| GET | `/completion-reports` | List organization-scoped completion report snapshots for manager review; accepts optional `status`, `readiness`, `readiness_blocker`, `crew_id`, `customer`, `property`, `scheduled_from`, and `scheduled_to` filters |
| POST | `/completion-reports/{report_id}/review` | Move a submitted completion report into manager review |
| POST | `/completion-reports/{report_id}/request-changes` | Record manager feedback and move an in-review report to changes requested |
| POST | `/completion-reports/{report_id}/resubmit` | Return a change-requested report to submitted after crew follow-up |
| POST | `/completion-reports/{report_id}/deliver` | Approve a ready in-review report for customer delivery and issue a share link |
| POST | `/completion-reports/{report_id}/delivery-notifications` | Queue an email or SMS notification for a delivered completion report share link |
| GET | `/notifications` | List recent organization-scoped notification outbox history with optional `entity_type`, `status`, and `limit` filters |
| POST | `/notifications/{id}/retry` | Reset an in-organization failed or dead-letter notification back to queued delivery |
| POST | `/notifications/{id}/resolve` | Mark an in-organization failed or dead-letter notification as manually resolved |
| GET | `/jobs/{id}/add-ons` | List approved add-on work scheduled for a job |
| PUT | `/jobs/{id}/add-ons/{add_on_id}/status` | Start or complete approved add-on work |
| GET | `/reports/{share_token}` | Read a shared completion report by token |
| GET | `/report-view/{share_token}` | Open the customer-facing delivered report page |
| GET | `/properties/{property_id}/completion-reports` | List delivered completion reports for a scoped property |
| POST | `/jobs/{id}/start` | Mark a job started |
| POST | `/jobs/{id}/complete` | Mark a job complete |
| GET | `/jobs/{id}/photos` | List persisted photo evidence metadata with display, thumbnail, file size, and image dimension details |
| POST | `/jobs/{id}/photos/presign` | Create a validated local or S3 presigned image upload ticket, including thumbnail upload details when configured |
| POST | `/jobs/{id}/photos/complete` | Mark a photo upload ticket complete and accept optional validated upload metadata |
| GET | `/crews/{crew_id}/day-plan/today` | Read the current crew day plan route |
| POST | `/day-plans` | Create a manager draft day plan |
| POST | `/day-plans/{day_plan_id}/publish` | Publish a manager draft day plan |
| POST | `/day-plans/{day_plan_id}/stops` | Assign a job to a manager day plan |
| PUT | `/day-plans/{day_plan_id}/stops/order` | Replace manager day-plan stop order |
| DELETE | `/day-plans/{day_plan_id}/stops/{stop_id}` | Remove a stop from a manager day plan |
| POST | `/day-plans/{day_plan_id}/stops/{stop_id}/status` | Update crew stop progress |
| GET | `/day-plans/{day_plan_id}/amendments` | List submitted crew amendment requests |
| POST | `/day-plans/{day_plan_id}/amendments` | Submit a crew add-stop, remove-stop, or add-service request |
| PUT | `/day-plans/{day_plan_id}/amendments/{amendment_id}/review` | Approve, reject, or send an amendment to bid review |
| POST | `/day-plans/{day_plan_id}/amendments/{amendment_id}/bid` | Create or update a draft project bid for an amendment |
| GET | `/day-plans/{day_plan_id}/bids` | List project bids associated with a day plan |
| POST | `/day-plans/{day_plan_id}/bids/{bid_id}/send` | Issue a review link and queue email/SMS delivery |
| POST | `/day-plans/{day_plan_id}/bids/{bid_id}/revoke` | Revoke an unanswered customer review link |
| POST | `/day-plans/{day_plan_id}/bids/{bid_id}/convert` | Convert an approved bid into scheduled job add-ons |
| GET | `/shared-bids/{share_token}` | Read a customer-safe shared bid |
| POST | `/shared-bids/{share_token}/decision` | Approve or reject a shared bid once |

The day-plan route reads from PostgreSQL when a persisted route is available and falls back to seeded API data when persistence is unavailable. Job, photo, completion-report action, organization invitation, role administration, portfolio, customer property portfolio, property onboarding, property crew-assignment, crew, and day-plan endpoints resolve the owning service organization and require an active membership in that organization before returning or mutating scoped operational data.

## Data and Persistence

The project currently includes migrations for:

- Service jobs
- Job checklist items
- Job photos
- Job completion reports
- Customer accounts
- Account status and service tracking foundations
- Organization invitations, queued invite delivery, and role administration
- Crews, day plans, and day-plan stops
- Day-plan amendment requests and bid-review metadata
- Project bids and ordered bid line items
- Project-bid conversions and scheduled job add-ons
- Property portfolios and portfolio-to-property membership
- Customer-scoped portfolio/property read model with grouped and ungrouped yards
- Property-to-crew service assignment history
- Property onboarding profiles for address, access, billing, and notification readiness
- Access audit records for login access summaries, account views, report approval and delivery, bid decisions and conversions, notification recovery, role administration, invitations, portfolio grouping, and crew assignment changes
- Organization-scoped notification outbox records for queued project-bid and completion-report delivery
- Route-planning seed data

The API can fall back to seeded local data where persistence is not fully wired yet. This keeps the product usable for frontend development and demos before a hosted environment exists.

## Frontend Behavior

The crew dashboard is designed to work on mobile devices. It currently supports:

- Viewing today’s route
- Opening jobs from route stops
- Tracking each stop as pending, in progress, or finished
- Persisting stop progress in browser storage
- Viewing account status in the completion report
- Creating local photo upload tickets
- Loading persisted photo evidence metadata when the backend is available
- Preparing a customer-facing completion summary
- Creating manager draft day plans
- Assigning, removing, and ordering draft route stops with persisted/local fallback behavior
- Submitting day-plan amendment requests with persisted/local fallback behavior
- Reviewing crew amendments and routing priced extra services into bid preparation
- Building draft project bids with editable line items and customer messaging
- Sending tokenized bid review links and recording customer approval or rejection
- Expiring, revoking, and securely reissuing customer review links
- Converting approved bid line items into crew-visible scheduled add-on work

## Production Deployment

The first production target is a protected Render pilot:

- A multi-stage Docker image builds the React frontend and Rust API
- The Rust service serves both from one TLS origin
- Managed PostgreSQL is reachable only over Render's private network
- SQLx migrations run before the service starts accepting traffic
- Database-backed readiness gates deploys
- Cognito managed login authenticates individual users with OAuth authorization code and PKCE
- The Rust API verifies access-token signatures and enforces Cognito role groups
- Deploys begin only after GitHub checks pass

The infrastructure is declared in `render.yaml`. Provisioning, smoke testing, operating notes, current limitations, and the AWS growth path are documented in [docs/production-deployment.md](docs/production-deployment.md).

## Development Notes

This repository is currently in active MVP development. Prefer small vertical slices that GitHub Actions or hosted development services can validate. The frontend should continue to degrade gracefully when the backend or database is unavailable.
