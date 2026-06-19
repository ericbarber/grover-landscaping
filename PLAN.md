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
- Backend stop-progress validation
- Backend stop-progress persistence helper for PostgreSQL
- Stop-progress route attempts database persistence and reports whether it persisted
- Day-plan API response includes stop status
- Backend day-plan read helper for PostgreSQL-backed crew routes
- Day-plan repository attempts PostgreSQL reads with seeded fallback

### Manager scheduling foundation

- Frontend draft day-plan API client
- Frontend create-draft fallback helper
- Manager create day-plan panel on the dashboard
- Manager draft day-plan card
- Manager publish day-plan API client
- Manager publish fallback helper
- Manager publish button component
- Manager draft action wrapper for card plus publish action
- Manager day-plan helper tests for draft IDs, local draft fallback, local publish fallback, and persistence labels
- Backend draft day-plan request and mutation response contract
- Backend draft day-plan repository helper
- PostgreSQL draft day-plan creation helper
- PostgreSQL publish day-plan helper
- Backend manager route for creating draft day plans
- Backend manager route for publishing day plans
- Backend manager routes for assigning, removing, and reordering day-plan stops
- Frontend API clients for manager day-plan stop assignment, removal, and ordering
- Manager draft route planner is mounted under created draft day plans
- Manager add/remove/reorder actions call persisted stop mutation endpoints with local fallback
- Manager route planner shows sync status for persisted and local changes
- Manager publish success refreshes the crew-facing day plan route

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
- Backend has `GET /crews/{crew_id}/day-plan/today` returning seeded repository data when no persisted route is available
- Backend has stop-progress route returning `persisted: true` when the PostgreSQL update succeeds and local fallback when it does not
- Backend has a PostgreSQL day-plan read helper that joins day plans, crews, stops, and jobs
- Day-plan, crew, and stop tables exist in migrations
- Frontend syncs route progress to the backend when the endpoint is available
- Frontend falls back to browser persistence when backend sync is unavailable
- Frontend can consume backend `stop_status` values for each route stop

Next implementation work:

- Wire the route summary finished-count to resolved server-or-local stop status
- Add database-backed route tests around persisted stop progress and day-plan reads

### Manager scheduling workflow

Goal: let managers create, review, and publish day plans before crews start routes.

Current state:

- Frontend manager panel can create draft day plans through the API client with local fallback
- Frontend manager panel is visible below the crew day-plan panel
- Frontend can display draft day-plan mutation results
- Frontend has a publish client and local publish fallback
- Frontend has a publish button and action wrapper ready for manager panel actions
- Backend repository and PostgreSQL helpers exist for draft creation
- PostgreSQL helper exists for publishing a day plan
- Backend create and publish routes are exposed through Axum
- Backend stop assignment, removal, and ordering routes are exposed through Axum
- Frontend API clients can call manager stop assignment, removal, and ordering routes
- Frontend manager panel creates a draft plan and renders the editable route planner for that draft
- Frontend manager route add/remove/reorder actions attempt backend persistence and degrade to local state
- Crew-facing day-plan panel refreshes after a persisted manager publish
- Crew-facing day-plan reads ignore draft routes until they are published

Next implementation work:

- Add workload summary for estimated drive and service duration
- Add clearer error recovery for failed manager route mutations

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
| 2026-06-17 | Backend manager stop assignment, removal, and ordering routes added |
| 2026-06-17 | Manager route planner connected to draft day-plan stop mutation endpoints |
| 2026-06-17 | Crew route refresh wired after persisted manager day-plan publish |
| 2026-06-17 | Manager local route planner remove action wired into component state |
| 2026-06-17 | Backend manager create/publish day-plan routes exposed through Axum |
| 2026-06-17 | Frontend typecheck restored after account and manager route helper type fixes |
| 2026-06-16 | Manager draft action wrapper added for draft card plus publish action |
| 2026-06-16 | Manager publish day-plan client, fallback helper, and publish button added |
| 2026-06-16 | Manager create day-plan panel added to the dashboard |
| 2026-06-16 | Frontend draft day-plan creation client and local fallback helpers added |
| 2026-06-16 | Backend draft day-plan repository and PostgreSQL creation helpers added |
| 2026-06-15 | PostgreSQL-backed day-plan read helper added |
| 2026-06-15 | Stop-progress route wired to attempt PostgreSQL persistence |
| 2026-06-15 | Day-plan API response now includes stop status |
| 2026-06-15 | PLAN.md refreshed to match delivered route-progress work |
| 2026-06-15 | Route-stop fallback job-selection tightened |
| 2026-06-15 | Stop-progress domain helpers and tests added |
| 2026-06-15 | Route progress sync status display added |

## Notifications Strategy

Goal: add reliable, opt-in notifications without blocking core field workflows.

Recommended sequence:

1. Build an internal notification event model first: day plan published, stop delayed, job completed, completion report ready, account/payment exception, and failed sync needing manager attention.
2. Store notification preferences per customer, crew member, and manager before sending external messages.
3. Add an outbox table so route, job, report, and account workflows can enqueue notifications transactionally without coupling request handlers to providers.
4. Add a worker that sends email through SES first, then add SMS through SNS or Twilio after message templates and opt-out behavior are defined.
5. Add manager-facing notification history and delivery status before enabling customer-facing SMS.
6. Keep push notifications as a later PWA/mobile enhancement after authentication and device registration exist.

Initial channels:

- Email for completion reports, manager alerts, and account/payment messages.
- SMS for time-sensitive customer arrival windows and crew reminders.
- In-app notifications for managers reviewing route exceptions, failed persistence, and overdue work.

Next implementation slice:

- Add notification event types and preference models to the backend domain.
- Add PostgreSQL migrations for notification preferences and notification outbox.
- Add seed notification preferences for demo accounts and crews.
- Add local-only notification history UI for managers before provider integration.
