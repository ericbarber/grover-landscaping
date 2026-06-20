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
- Route summary finished count resolves server status plus local browser status

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
- Manager route planner shows workload summary for estimated drive and service duration
- Manager route planner shows recovery notices when route changes fall back to local state
- Manager route planner shows retry controls for failed route mutation sync attempts
- Manager route planner shows next-step workflow guidance while drafting
- Manager route planner explains publish blockers from the publish guard
- Manager publish success refreshes the crew-facing day plan route
- Manager activity history panel for route review, completion evidence, and sync fallback events
- Manager activity domain model and history helpers for future persisted activity wiring
- Manager activity history records runtime route, job, photo, and sync events in local state
- Manager activity history supports source filters, tone filters, filtered empty states, active filter summaries, and accessible filter controls
- Manager activity filters persist in browser storage with storage-availability detection and reset behavior
- Manager activity label helper tests

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
- Frontend route summary finished count resolves backend stop status plus local browser status
- Backend repository fallback tests cover day-plan reads and stop mutations without a database pool

Next implementation work:

- Add hosted database-backed route tests once CI has a test PostgreSQL service available

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
- Frontend manager route planner shows estimated workload summary
- Frontend manager route planner explains local fallback recovery when mutation persistence fails
- Frontend manager route planner shows retry controls for failed route mutation sync attempts
- Frontend manager route planner shows next-step guidance while drafting
- Frontend manager route planner explains publish blockers from the publish guard
- Frontend manager activity history panel surfaces route review, completion evidence, and sync fallback events
- Frontend manager activity history records runtime manager events for route publishes, job lifecycle changes, photo evidence, and sync fallback
- Frontend manager activity history can filter by source and tone, summarize active filters, show filtered empty states, persist filter preferences, and reset saved filters
- Frontend manager activity label helpers have focused tests for source labels, tone labels, and filter summaries
- Crew-facing day-plan panel refreshes after a persisted manager publish
- Crew-facing day-plan reads ignore draft routes until they are published

Next implementation work:

- Connect manager activity history to persisted events after the notification outbox exists

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
