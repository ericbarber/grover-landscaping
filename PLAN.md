# Delivery Plan

This file tracks what has been delivered, what is actively being built, what is planned next, and what is intentionally backlogged. Keep this file focused on product delivery status, not detailed design notes.

## Status Legend

| Status | Meaning |
| --- | --- |
| Delivered | Implemented in the repository and usable in local development |
| In Progress | Started, partially wired, or available with local/browser fallback |
| Planned | Prioritized upcoming work |
| Backlog | Valuable but not part of the next delivery slice |

## Delivered

### Crew dashboard foundation

- React/Tailwind crew dashboard
- Assigned job list
- Job detail panel
- Start-job action
- Complete-job action
- Completion checklist display
- Completion report panel
- Browser fallback mode when backend is unavailable

### Backend API foundation

- Rust Axum API service
- Health endpoint
- Job list endpoint
- Job detail endpoint
- Account status endpoint for a job
- Job start endpoint
- Job completion endpoint
- Local photo upload-ticket endpoint
- Photo completion endpoint
- Crew day-plan endpoint returning the current route
- Stop-progress endpoint contract and route

### Crew route and stop progress

- Daily crew day-plan panel
- Ordered route stops
- Drive and service time estimates
- Open job from a route stop
- Tightened route-stop fallback job selection
- Local stop progress states: pending, in progress, finished
- Browser persistence for stop progress
- Route progress reset action
- Route progress sync status display
- Frontend client sync attempts for stop progress
- Stop progress domain helpers
- Stop progress helper tests
- Day-plan domain tests

### Account and service tracking foundation

- Customer account summary model
- Account status card in completion report
- Seed account states for demo jobs
- PostgreSQL migration foundation for customer accounts

### Local development and project setup

- Docker Compose local stack
- PostgreSQL migrations
- Day-plan, crew, and stop table migration
- Local migration script
- Backend test structure
- Frontend test/build commands
- GitHub Actions CI workflow
- Project README rewritten as practical project documentation

## In Progress

### Day-plan backend persistence

Goal: move crew route and stop progress from local/browser state to database-backed state.

Current state:

- Frontend has a day-plan API client for `GET /crews/{crew_id}/day-plan/today`
- Frontend has stop-progress API client for `POST /day-plans/{day_plan_id}/stops/{stop_id}/status`
- Backend has `GET /crews/{crew_id}/day-plan/today` returning seeded repository data
- Backend has stop-progress route returning a local response
- Day-plan, crew, and stop tables exist in migrations
- Frontend syncs route progress to the backend when the endpoint is available
- Frontend falls back to browser persistence when backend sync is unavailable
- Backend does not yet read day plans or persist stop status from PostgreSQL

Next implementation work:

- Add PostgreSQL-backed read query for `GET /crews/{crew_id}/day-plan/today`
- Add PostgreSQL-backed write query for `POST /day-plans/{day_plan_id}/stops/{stop_id}/status`
- Replace browser-only persistence as the source of truth

### Photo evidence flow

Goal: evolve local photo placeholders into production-ready evidence capture.

Current state:

- Frontend can request a local upload ticket
- Backend returns a local placeholder upload response
- Completion report can display photo-ticket evidence

Next implementation work:

- Add S3 presigned upload support
- Store photo metadata in PostgreSQL
- Add photo thumbnail/display flow
- Attach photo evidence to completion reports

## Planned

### Completion reports

- Persist completion reports
- Add report status: draft, ready, sent
- Add report endpoint: `GET /jobs/{id}/report`
- Include crew, checklist, account, and photo evidence
- Add shareable report link
- Add customer delivery by email or SMS later

### Manager scheduling workflow

- Create and publish day plans
- Assign jobs to crews
- Manually order route stops
- View crew workload and estimated duration
- Move jobs between crews or service dates

### Customer/account management

- Customer account list
- Account detail page
- Payment/account status update flow
- Services contracted per period
- Services completed this period
- Manager review flag

### Hosted development environment

- Deploy frontend to hosted static environment
- Deploy backend container
- Provision PostgreSQL database
- Configure environment variables/secrets
- Add S3 bucket for photo evidence
- Validate mobile browser workflow against hosted environment

### Authentication and roles

- Crew role
- Manager role
- Admin role
- Customer/report viewer role
- Login flow
- Basic authorization around jobs, crews, and reports

## Backlog

### Route optimization

- Property latitude/longitude fields
- Route optimization provider integration
- Drive time estimates from maps provider
- Manager override for optimized order
- Crew navigation handoff

### Payments and invoicing

- Payment provider integration
- Invoice generation
- Payment reminders
- Customer balance tracking
- Subscription/package billing workflows

### Notifications

- SMS notifications
- Email notifications
- Crew reminders
- Customer report delivery notifications
- Manager exception alerts

### Mobile/PWA polish

- Offline-first queue for photo and stop updates
- Installable PWA configuration
- Camera-first capture flow
- Better touch targets and field crew ergonomics
- Background sync when online

### Operations and observability

- Structured request logging
- Error reporting
- Metrics dashboard
- Audit trail for manager changes
- Backup and restore documentation

## Recently Delivered

| Date | Delivery |
| --- | --- |
| 2026-06-15 | PLAN.md refreshed to match delivered route-progress work |
| 2026-06-15 | Route-stop fallback job-selection tightened |
| 2026-06-15 | Stop-progress domain helpers and tests added |
| 2026-06-15 | Route progress sync status display added |
| 2026-06-15 | Route reset syncs stops back to pending |
| 2026-06-15 | Route progress reset action added |
| 2026-06-15 | Day-plan domain tests added |
| 2026-06-15 | Crew day-plan API endpoint added |
| 2026-06-15 | Day-plan, crew, and stop table migration added |
| 2026-06-15 | README rewritten as practical project documentation |
| 2026-06-15 | Stop-progress backend route added |
| 2026-06-15 | Frontend stop-progress client added |
| 2026-06-15 | Browser-persisted route stop progress added |
| 2026-06-15 | Crew day-plan panel added |
| 2026-06-15 | Account status display added to completion report |

## Maintenance Notes

- Move items from Planned to In Progress when implementation begins.
- Move items from In Progress to Delivered when they are usable in local development.
- Keep Backlog items high level until they become prioritized delivery work.
- Keep detailed architecture decisions in `docs/`, not in this file.
