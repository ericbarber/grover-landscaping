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
- Completion report API endpoint with job, account, readiness, and photo evidence
- Frontend completion report snapshot client and selected-job wiring
- Completion report PostgreSQL table and report-state persistence helper
- Stable share-token generation for persisted completion reports
- Shared completion report endpoint by share token
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
- Job photo metadata endpoint
- Persisted photo evidence display in the completion report
- Crew day-plan endpoint returning the current route
- Stop-progress endpoint contract and route

### Authentication and production runtime foundation

- Cognito authorization-code flow with PKCE in the React application
- Rust access-token verification against Cognito JWKS
- Route-level role gates for manager, crew, and public report access
- Public runtime authentication configuration endpoint
- Database-backed organization and active membership foundation
- Protected current-user access summary endpoint with claim roles and organization memberships
- Development-only disabled authentication mode for local seed workflows
- Recoverable authentication initialization when the local API starts after the frontend
- Terraform definitions for development and production Cognito user pools
- Single-origin production container and Render deployment definition
- Database-backed readiness checks and production smoke-test script

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
- Manager completion report review queue derived from current job report snapshots
- Manager report queue groups submitted, in-review, change-requested, draft, and delivered reports with counts
- Manager report queue supports active, status-specific, readiness, blocked, local-only, and delivered-history filters
- Manager report queue links queue items back to the job report detail panel
- Backend manager completion-report list endpoint for current job report snapshots
- Backend manager completion-report list endpoint accepts status and readiness filters for server-side queue narrowing
- Frontend report queue uses the list endpoint with per-job fallback

### Crew amendment and bid foundation

- Frontend domain types for crew day-plan amendment requests
- Frontend service catalog item contract for standard and extra services
- Frontend project bid contract with bid statuses and line items
- Helper for detecting when an extra-service amendment requires a bid
- Helper for totaling project bid line items
- Helper for determining whether an approved bid can convert to work
- Frontend tests for amendment labels, bid requirements, bid totals, and bid conversion
- Crew-facing amendment controls for add-stop, remove-stop, and add-service requests
- Crew-facing submitted amendment request summary with bid-review labeling
- PostgreSQL persistence for submitted day-plan amendment requests
- Backend create and list amendment endpoints
- Frontend amendment API client with authenticated requests
- Persisted amendment reload and local fallback with visible sync state
- Manager amendment review panel with pending-request counts and refresh control
- Manager approval and rejection actions for standard route amendments
- Persisted bid-review routing and manager notes for priced extra-service requests
- Role policy preventing crew members from calling manager review operations
- Project-bid and line-item PostgreSQL tables linked to source amendments and customer accounts
- Idempotent draft-bid save and day-plan bid list endpoints
- Manager bid editor for adding, removing, pricing, and annotating line items
- Customer-facing bid message editing with draft persistence state
- Server-derived customer account ownership for amendment-sourced bids
- Manager-only project-bid route policy
- Cryptographically random customer bid share tokens
- Manager send action that locks draft editing and creates a customer review link
- Public customer-safe bid review page with proposal totals and line-item detail
- Two-step customer approve/reject confirmation
- One-time persisted customer decision with sent and responded timestamps
- Generic notification outbox with queued delivery metadata and retry-ready fields
- Email and E.164 SMS destination validation for bid approval delivery
- Atomic bid-token issuance and notification enqueueing
- Seven-day customer approval link expiry enforced on reads and decisions
- Manager link revocation and secure token reissue
- Revocation atomically marks queued or failed delivery work as skipped
- Manager delivery status, channel, recipient, and expiry display
- Background notification dispatcher with PostgreSQL-safe concurrent row claiming
- Generic HTTPS webhook adapter for email/SMS delivery gateways
- Exponential retry backoff capped at one hour and five attempts by default
- Recovery of abandoned in-progress claims
- Dead-letter state for exhausted notifications
- Provider HTTP response code and message ID receipts
- Absolute production customer links in provider payloads
- Idempotent approved-bid conversion into source-job add-ons
- Project-bid conversion records linking bids to execution jobs
- One scheduled job add-on per approved bid line item
- Transactional bid, amendment, and conversion status updates
- Crew job add-on API and job-detail display
- Crew controls for starting and completing approved job add-ons
- Guarded add-on lifecycle transitions from scheduled through completion
- Completed add-on work included in completion report responses and UI

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
- GitHub Actions provisions PostgreSQL, applies migrations, and runs database-backed integration tests
- Integration tests fail loudly in CI when `DATABASE_URL` is missing instead of silently skipping

Next implementation work:

- Expand database-backed route coverage as new persistence behavior is added

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
- Frontend has domain contracts for crew amendment requests, service catalog items, and project bids
- Crew-facing day-plan panel submits and reloads amendment requests through the backend
- Backend persists add-stop, remove-stop, and add-service requests with request status, pricing, approval, and bid-review metadata
- Backend exposes create and list routes for day-plan amendments
- Frontend retains a local request and displays sync-pending state when persistence is unavailable
- PostgreSQL integration coverage verifies amendment creation and retrieval
- Manager review UI loads current-route amendments and distinguishes submitted, bid-review, approved, and rejected states
- Manager decisions persist through a dedicated review endpoint with optional manager notes
- Extra-service requests requiring pricing transition to bid review instead of being treated as approved work
- Manager bid workspace builds persisted draft bids directly from bid-review amendments
- Draft saves replace line items atomically and reload through the day-plan bid endpoint
- Bid responses expose draft approval status, customer message, customer account, and computed total
- Sent bids expose a shareable customer review link without manager-only identifiers
- Customer decisions transition sent bids to approved or rejected exactly once
- Bid delivery requests are recorded as queued rather than falsely reported as provider-delivered
- Expired and revoked customer tokens cannot read or answer a bid
- Revoked bids can issue a replacement token and enqueue a new delivery
- Approved bids convert once without duplicating job add-ons
- Converted add-ons are visible to crews as scheduled source-job work
- Converted add-on service duration is included in route workload estimates

Next implementation work:

- Configure and validate an email/SMS provider gateway in the production environment
- Add an authenticated customer-scoped bid history after tenant boundaries are persisted
- Connect manager activity history to persisted notification events

### Authentication, authorization, and access controls

Goal: require managed identity and role-aware API access before production release.

Current state:

- React uses Cognito managed login with OAuth authorization code and PKCE
- The API verifies bearer access-token signature, issuer, audience/client, expiry, and Cognito groups
- Manager, crew, customer, and public report route policies are covered by focused tests
- Runtime authentication configuration is served from `GET /auth/config`
- Local development can explicitly use disabled authentication outside production
- Development and production Cognito infrastructure is declared in Terraform
- Persisted completion report review, change request, resubmit, and delivery transitions record organization-scoped audit events
- Crews carry organization ownership, and day-plan, amendment, stop, and manager bid APIs enforce active organization membership before using persisted or local fallback data
- Job list/detail, job account, job report, add-on, photo, and completion-report action routes enforce active organization membership before returning or mutating job-scoped data
- Property portfolio create/list/link APIs are wired to PostgreSQL and enforce active organization membership before grouping customer yards
- Property crew-assignment APIs are wired to PostgreSQL and enforce active organization membership plus crew organization ownership before changing service assignments
- Organization invitation APIs create pending memberships, queue invitation email delivery, accept invite tokens into active memberships, and audit invite acceptance plus role changes
- Persisted portfolio grouping and crew assignment changes record organization-scoped audit events
- Persisted customer bid approvals, customer bid rejections, and manager bid conversions record organization-scoped audit events
- Persisted notification retry and manual resolution actions record organization-scoped audit events
- Persisted job account-summary reads record organization-scoped `account_viewed` audit events
- Authenticated current-user access summary reads record organization-scoped `login` audit events
- Hosted pilot runbook documents Cognito provisioning, first-owner creation, PostgreSQL membership binding, validation, and rollback notes
- Cognito hosted-pilot validation script checks Terraform outputs and optional deployed `/auth/config` values
- Customer property portfolio reads ignore wrong-account portfolio links so scoped customer yards remain visible as ungrouped properties
- Property completion-report reads return delivered reports and share links within active customer/manager organization scopes
- Customer portal preview loads delivered property report history from the authenticated property completion-report endpoint
- Customer account bid history returns sent, answered, and converted bids within active customer/manager organization scopes
- Customer portal preview loads authenticated customer account bid history with local bid-review fallback
- Production smoke script validates Cognito auth config plus route, report, photo upload-ticket, customer portfolio, bid-history, and report-history reads
- Notification webhook validation script checks production delivery configuration and supports opt-in provider test requests

Next implementation work:

- Provision the Cognito environment and create the first organization-owner account
- Continue tenant-aware resource boundaries for remaining shared customer reads

### Photo evidence flow

Goal: evolve local photo placeholders into production-ready evidence capture.

Current state:

- Frontend can request a local upload ticket
- Backend returns a local placeholder upload response
- Backend stores local photo ticket metadata in PostgreSQL when persistence is available
- Completion report can display photo-ticket evidence
- Backend can list persisted job photo metadata
- Frontend loads persisted photo evidence for the selected job and merges it with browser-local evidence
- Completion report counts photo evidence without double-counting persisted job photo totals
- Completion report endpoint attaches persisted photo evidence
- Configurable S3 presigned upload tickets for production photo evidence storage
- Expiring S3 display URLs for persisted photo evidence when object storage is configured
- Browser-generated thumbnail preview uploads for S3-backed photo evidence
- Persisted thumbnail display URLs for job photo evidence and customer-visible completion reports
- Upload completion records validated client-reported file size and image dimensions on persisted photo evidence
- S3-backed upload completion attempts server-side file-size verification and PNG, GIF, or JPEG dimension extraction before falling back to client-reported metadata
- Photo evidence reads hide pending upload tickets and mark server-extracted uploads as processed
- Photo upload-ticket requests reject blank file names, unsupported photo categories, and non-image content types before storage rows are created

Next implementation work:

- Add server-side thumbnail normalization and rejected-state quarantine for uploaded photo evidence

### Completion reports

Goal: turn the local completion summary into a backend-backed report that can be reviewed, persisted, and eventually sent to customers.

Current state:

- Frontend displays a completion report panel for the selected job
- Backend exposes `GET /jobs/{id}/report`
- Report response includes job detail, checklist progress, account status, readiness state, and photo evidence
- Frontend loads the selected job's report snapshot when the API is available
- Report helper tests cover draft and ready states
- PostgreSQL migration exists for `job_completion_reports`
- Report endpoint materializes current report state when PostgreSQL is available
- Backend persistence test verifies stored report status, readiness, and checklist progress
- Persisted reports receive stable share tokens and return share URLs
- Backend exposes `GET /reports/{share_token}` for shared report reads
- Frontend renders the shareable report link when one is available
- Backend supports submitted, in-review, changes-requested, and delivered lifecycle transitions
- Frontend manager actions can start review, request changes, resubmit, and deliver persisted reports
- Frontend manager report queue summarizes current report review work across loaded jobs
- Backend exposes `GET /completion-reports` for manager report queue loading
- Backend manager report queue loading supports `status`, `readiness`, readiness-blocker, crew, customer, property, and scheduled-date query filters
- Backend manager report queue loading is scoped to the principal's active organization memberships
- Delivered completion reports store an immutable customer-facing JSON snapshot for shared report links
- Delivered completion report snapshots include schema version, capture timestamp, and evidence-count metadata
- Delivered completion reports can queue validated email/SMS notification outbox records for customer share links
- Manager report detail actions can queue delivered completion report email/SMS notifications
- Manager notification history panel lists queued, sending, sent, failed, skipped, and dead-letter notification outbox records
- Backend notification history endpoint supports entity, status, and limit filters
- Backend notification history and notification retry/resolve actions are scoped to active organization memberships
- Manager notification history can retry failed and dead-letter delivery records by returning them to queued status
- Manager notification history can mark failed and dead-letter delivery records manually resolved
- Crews are owned by organizations, and day-plan, amendment, stop, and manager bid routes reject access outside the principal's active organization memberships
- Job-scoped reads and mutations, photo endpoints, add-on status updates, and completion-report actions reject access outside the principal's active organization memberships

### Property ownership, portfolios, and crew assignments

Goal: keep customer/property ownership separate from crew service assignment while supporting many yards per owner, many yards per crew, and many crews per company.

Current state:

- Customer/property ownership is modeled separately from active crew assignment
- A property can switch active crews without changing its customer or organization ownership
- A crew must be enabled and belong to the same service organization before it can serve a property
- PostgreSQL migrations exist for property portfolios, portfolio-property links, and property crew assignment history
- Portfolio boundary indexes prevent duplicate portfolio names per account and restrict a property to one portfolio group per service organization
- Backend API contracts are documented for property portfolio management and property crew assignment workflows
- Backend property portfolio routes can create portfolios, link properties to portfolios, and list account portfolios within active organization memberships
- Backend property crew-assignment routes can assign crews, list property assignment history, and list active crew property workloads within active organization memberships
- Backend customer property portfolio reads return grouped and ungrouped customer yards within active organization memberships
- Backend property onboarding profiles capture validated service address, access notes, billing contact, notification contact, and onboarding status
- Customer portal preview displays grouped yards and keeps customer-owned ungrouped yards visible
- Portfolio coverage summary reports total, grouped, and ungrouped yard counts

Next implementation work:

- Add manager-facing property onboarding forms around the persisted profile APIs
- Expand account onboarding and first-user administration workflows

## Planned

### Phased Development Roadmap

The product is past the first proof-of-completion prototype. The next work should ship in vertical slices that reduce local-only assumptions, harden customer-visible workflows, and prepare the app for a small hosted pilot before broader operations features.

#### Feature Reference and Audience Coverage

The `features/` folder now defines four major user tracks. Treat these as product inputs for roadmap planning and acceptance criteria:

| Feature file | Primary audience | Current plan coverage | Planning decision |
| --- | --- | --- | --- |
| `features/yard-crew.md` | Crew leads, crew members, dispatchers, account managers, billing admins, customers | Strong near-term coverage through crew route, proof-of-completion, amendments, bids, offline sync, quality review, labor/material, and billing-readiness phases | Keep as the first field workflow track because it matches the implemented MVP foundation |
| `features/yard-care-company.md` | Multi-crew yard-care companies: operations managers, dispatchers, branch managers, fleet/equipment, account managers, finance users | Partial coverage through manager command center, route capacity, service catalog, contracts, billing readiness, analytics, and scale phases | Expand Phase 3 and Phase 5 around branch, territory, equipment, inventory, and cross-crew operations |
| `features/self-service.md` | Homeowners maintaining their own yards | Limited coverage in the current customer portal plan | Add a separate homeowner self-service phase because adaptive yard planning is a different product mode from provider-managed service delivery |
| `features/property-managment.md` | Property management organizations coordinating multiple independent yard-care vendors | Partial coverage through portfolios, vendor-safe links, evidence, bids, and invoices, but not enough vendor governance | Add a separate multi-vendor property management phase after core tenant, evidence, service catalog, billing, and portal foundations exist |

Key coverage gaps from the feature review:

- Homeowner self-service needs its own property setup, climate-aware scheduling, guided yard sessions, equipment/supplies, issue management, and educational task explanations.
- Multi-crew service companies need branch/territory hierarchy, master schedule, cross-crew reassignment, fleet/equipment allocation, inventory, labor productivity, and billing-readiness validation.
- Property management organizations need vendor onboarding, compliance tracking, service coverage, standardized work-order distribution, evidence validation, three-way invoice matching, vendor scorecards, and portfolio dashboards.
- Crew users need stronger work-order, contract-scope, safety, equipment, materials, treatment record, labor, and offline synchronization support beyond the existing stop-progress workflow.

#### Phase 1: Pilot Readiness and Data Boundaries

Goal: make the current manager, crew, and customer-safe link workflows usable in a hosted pilot without relying on seed data or browser-only state.

Build scope:

- Provision and validate Cognito for the first organization owner, manager, crew lead, and customer test users.
- Persist organization membership, role assignments, and tenant-aware resource ownership for jobs, crews, day plans, properties, completion reports, bids, photos, and notifications.
- Add organization/customer scoping to manager completion-report list, day-plan, amendment, bid, job, photo, and shared customer queries.
- Wire property portfolio and active crew assignment models into backend API routes after access boundaries are enforced.
- Add audit events for login-sensitive and business-sensitive actions: role changes, schedule changes, report review, bid send/revoke/decision/convert, notification enqueueing, and customer-visible delivery.
- Document hosted pilot setup, seed data expectations, first-user creation, and rollback notes.

Validation and exit criteria:

- API tests prove cross-organization access is rejected for manager, crew, customer, and public-token-adjacent routes.
- A hosted smoke test can authenticate, read jobs, read today route, submit stop status, upload photo metadata, review a completion report, send a bid, and read customer-safe links.
- Local fallback mode still works for frontend demos, but hosted pilot workflows do not depend on browser-only persistence for core state.

#### Phase 2: Field Crew Mobile Reliability

Goal: make the daily route and proof-capture workflow dependable from a mobile browser with weak connectivity.

Build scope:

- Add a PWA manifest, installable app metadata, and service worker strategy for shell assets.
- Move queued field mutations into IndexedDB for stop progress, job lifecycle actions, photo completion, checklist updates, and amendment requests.
- Add sync status and retry controls for each queued mutation type, using consistent pending, persisted, failed, and conflict states.
- Add client-side photo quality checks for required before/after evidence, minimum previewability, duplicate file selection, and missing evidence before report submission.
- Add server-side image processing and metadata extraction for uploaded photo evidence after object storage upload completes.
- Include route, stop, add-on, and photo context in completion report readiness checks.

Validation and exit criteria:

- Browser tests cover offline queue persistence, retry behavior, and conflict messaging for route progress and photo evidence.
- Backend tests cover image metadata persistence and report readiness rules.
- A mobile viewport smoke script can complete a route slice with simulated API interruption and later sync recovery.

#### Phase 3: Manager Command Center

Goal: give managers one operational surface for schedule risk, quality review, communications, and recovery work.

Build scope:

- Finish persisted manager completion-report queue filters by status, organization, crew, customer, property, date, and readiness blocker.
- Connect manager activity history to persisted route, report, bid, notification, photo, and audit events.
- Add notification history endpoints and UI for queued, sent, failed, retried, skipped, dead-letter, and manually resolved states.
- Add route capacity planning with crew capacity defaults, duration estimates, overage warnings, and publish blockers.
- Add dispatch views for moving jobs between crews or service dates and reviewing day-level workload.
- Add manager recovery actions for failed notification delivery, failed photo processing, and report readiness blockers.
- Add branch, territory, and crew hierarchy support so multi-crew companies can separate company, region, branch, crew, route, work order, and task responsibilities.
- Add cross-crew reassignment workflows with route impact, equipment conflicts, overtime risk, customer continuity impact, and audit records.
- Add centralized exception management for route delays, staffing shortages, access failures, weather interruptions, equipment failures, safety concerns, and customer escalations.

Validation and exit criteria:

- Manager workflows can be completed from persisted data after a page refresh and across browser sessions.
- Integration tests cover report queue filters, notification history reads, route capacity guards, branch/territory boundaries, and reassignment audit records.
- The manager can identify and act on every failed customer communication or blocked report without inspecting logs.
- A dispatcher can see at-risk work, compare reassignment options, move work between crews, and preserve a clear customer-notification and audit trail.

#### Phase 4: Customer Portal and Portfolio Experience

Goal: turn public one-off bid/report links into an authenticated customer portal for property owners, management companies, HOAs, and commercial clients.

Build scope:

- Add authenticated customer portal access scoped to customer accounts, properties, portfolios, reports, photos, bids, scheduled work, and service history.
- Build portfolio/group views for individual owners, property management companies, HOAs, and commercial accounts.
- Surface completed service timelines with immutable report snapshots and customer-safe photo evidence.
- Add bid history, current approvals, rejected bids, expired bids, and converted-work status.
- Add customer notification preferences for email/SMS opt-in, quiet hours, recipient validation, and template-specific preferences.
- Add customer support or issue-capture entry points tied to a property, report, or scheduled service.

Validation and exit criteria:

- Customer portal tests prove a customer can only see their own scoped accounts, properties, reports, photos, bids, and notification preferences.
- Delivered completion reports use immutable customer snapshots rather than live mutable job state.
- Customer-visible pages cover empty, loading, error, expired-link, revoked-link, and no-portfolio states.

#### Phase 5: Revenue Operations and Service Administration

Goal: support recurring landscaping operations, service catalog management, account status, and revenue workflows beyond one-off project bids.

Build scope:

- Build a service catalog for standard recurring services and extra services with duration, unit, pricing defaults, approval rules, and active/inactive status.
- Add recurring service contracts, contracted frequency, scheduled service generation, skipped-service tracking, and account service-period summaries.
- Add estimates, change orders, deposits, invoices, payment status, tax/discount fields, account balances, and payment-link placeholders or provider integration.
- Add customer/account onboarding checklists for address, access notes, service preferences, billing state, notification contacts, and required operational data.
- Add organization settings for crews, service areas, default capacity, roles, invitation policies, and data retention settings.
- Add work-order and task templates with contract scope categories: included, conditionally included, customer requested, requires approval, approved additional work, not included, and prohibited.
- Add labor, material, equipment, treatment, and job-cost capture so completed work can be reviewed for billing readiness and profitability.
- Add fleet, equipment, and inventory records for vehicles, trailers, tools, chemicals, supplies, reservations, inspections, failures, and material usage.

Validation and exit criteria:

- Managers can onboard a customer/property and schedule recurring service without editing seed data.
- Service and billing state can explain whether work is schedulable, blocked, completed, billable, paid, or needing manager review.
- Tests cover service catalog rules, contract scheduling boundaries, scope protection, equipment allocation, material usage, treatment record policy, billing readiness, and account/payment status transitions.

#### Phase 6: Scale, Integrations, and Operational Hardening

Goal: prepare the product for broader customer adoption after pilot usage proves the core workflows.

Build scope:

- Add staging and production release gates with migration checks, smoke tests, rollback notes, and environment-specific configuration.
- Add structured logs, metrics, traces, alerting, backups, restore drills, and incident runbooks.
- Add background workers and queues for notification delivery, image processing, report delivery, route optimization, and integration sync.
- Add object lifecycle policies for photo evidence retention, archival, deletion, and customer data export.
- Add rate limits, organization usage limits, feature flags, support impersonation with audit controls, and abuse monitoring.
- Add integration surfaces only when needed: calendar export, map routing provider, accounting export, CSV import/export, webhook events, and public API boundaries.

Validation and exit criteria:

- Production releases require passing smoke checks for health, auth config, migration state, job list, route read, report read, upload ticket, notification queue, and customer portal access.
- Operational dashboards show failed requests, job/route mutation errors, upload failures, notification failures, authentication failures, and worker queue health.
- Backup restore and incident response procedures are documented and tested before expanding beyond early customers.

#### Phase 7: Homeowner Self-Service Yard Assistant

Goal: support individual homeowners who perform their own yard care and need an adaptive maintenance assistant instead of a contractor operations workflow.

Build scope:

- Add homeowner property onboarding for location, yard size, landscaped area, maintenance goals, availability, household constraints, climate profile, and preferred intensity.
- Add yard zones, plant assets, irrigation zones, equipment assets, supplies, inventory, task templates, scheduled tasks, observations, photos, and task completion history.
- Add a climate-aware scheduling engine that uses season, weather, recent completion, watering restrictions, homeowner availability, task dependencies, supplies, and equipment availability.
- Add Today, guided yard session, calendar, property, task detail, issues, history, equipment, supplies, and settings screens.
- Add educational task explanations covering why, when, how, tools, supplies, safety guidance, and postponement conditions.
- Add homeowner notifications for today plans, weather postponements, suitable work windows, irrigation problems, equipment service, low supplies, safety tasks, and monthly summaries.

Validation and exit criteria:

- A homeowner can create a property and yard zone, enter availability, receive a personalized four-week schedule, and complete a guided yard session.
- Weather-sensitive tasks can be postponed with an explanation and rescheduled into a suitable availability window.
- Issues create follow-up tasks, blocked tasks connect to missing supplies or equipment, and zone history shows completed work, photos, notes, products, and time/cost totals.
- This phase can share authentication, photo, notification, and property primitives with the B2B product, but it must not expose provider-only concepts like crews, contracts, invoices, or manager approvals in the homeowner-first experience.

#### Phase 8: Multi-Vendor Property Management Platform

Goal: support property management organizations that coordinate yard care across many properties, regions, owners, and independent vendors.

Build scope:

- Add portfolio hierarchy for property management organization, ownership group, portfolio, region, property, yard zone, vendor, vendor branch, service territory, and assigned properties.
- Add vendor onboarding, compliance tracking, insurance/license/certification expirations, vendor statuses, territory coverage, capabilities, capacity, and assignment eligibility.
- Add standardized service catalog, scope-of-work packages, scope versioning, vendor acknowledgment, service standards, evidence policies, and regional service variations.
- Add property-to-vendor assignment, backup vendor coverage, coverage-gap reporting, work-order distribution, vendor acceptance/rejection, and vendor portal/API submission paths.
- Add evidence packages, required photo standards, automated evidence checks, remote review, sampling rules, validation statuses, quality scorecards, and correction-request workflows.
- Add additional-work governance with approval matrices, competitive estimates, owner/asset-manager escalation, and audit-ready decision records.
- Add standardized invoice submission, normalized invoice lines, three-way invoice matching against contract or purchase order plus validated work order plus vendor invoice, tolerance rules, invoice exceptions, and accounts-payable approval.
- Add portfolio dashboards for coverage, overdue services, evidence review, open issues, vendor compliance, budget variance, invoice validation, service levels, and vendor performance.

Validation and exit criteria:

- A property management organization can create portfolios, add properties in multiple regions, onboard multiple vendors, validate compliance, assign properties, and identify uncovered properties.
- Vendors can accept work orders, submit evidence, report issues, submit estimates, correct rejected records, and see only assigned records.
- Accounts payable can normalize vendor invoices, detect duplicates or mismatches, match valid lines to completed work, and route exceptions back to vendors.
- Portfolio operations can compare vendor performance by on-time service, evidence completeness, quality, rework, complaints, response time, invoice accuracy, and cost.

#### Phase Sequencing Rules

- Tenant boundaries and auditability come before broad customer portal or marketing launch work.
- Offline field reliability should ship before adding heavier manager dispatch workflows.
- Customer-visible report snapshots must be immutable before report history becomes part of the authenticated portal.
- Notification provider integration should be validated for bids first, then reused for reports, route changes, and customer preferences.
- Payment and accounting integrations should wait until service catalog, contracts, and account status rules are stable.
- Homeowner self-service should share core property, photo, notification, and task infrastructure, but it should remain a distinct experience from crew/provider workflows.
- Multi-vendor property management should wait until tenant boundaries, evidence validation, service catalog, work orders, and billing-readiness foundations are stable.
- Scaling infrastructure should follow measured pilot usage instead of speculative load assumptions.

## User Story Map

These stories convert the capability roadmap into deliverable role outcomes. Keep the first acceptance criteria small enough to ship locally, then broaden persistence, tenant boundaries, and provider integrations as those foundations mature.

### Manager command center stories

- As a manager, I need one queue of completion reports needing review so I can approve, request changes, or deliver customer-ready work without opening every job manually.
  - Acceptance criteria: submitted, in-review, change-requested, and delivered reports are grouped with counts; each queue item links back to the job detail and shows checklist/photo readiness.
  - Implementation path: first derive the queue from existing job report snapshots in the frontend, then add a persisted `GET /completion-reports` manager endpoint with organization scoping and filters.
- As a manager, I need delivery failure and notification history visible beside report and bid work so I can retry or resolve customer communication problems.
  - Acceptance criteria: queued, sent, failed, retried, skipped, and dead-letter states are visible with recipient, channel, last attempt, and next retry.
  - Implementation path: reuse the notification outbox and receipts, add manager query endpoints, then connect the activity history panel to persisted notification events.
- As a manager, I need route planning to show capacity risk before publish so I can avoid overloading crews.
  - Acceptance criteria: each route has estimated duration, capacity remaining/overage, risk label, and blockers before publish.
  - Implementation path: extend existing workload helpers, persist crew capacity defaults, then add calendar/day-level dispatch views.

### Crew field workflow stories

- As a crew lead, I need the daily route to work reliably on a mobile browser with weak connectivity so I can keep working from the field.
  - Acceptance criteria: route, stop status, selected job detail, and photo evidence can be captured offline and synced with clear pending/failed states.
  - Implementation path: add a PWA manifest and service worker, store queued mutations in IndexedDB, and reconcile with backend status endpoints.
- As a crew member, I need photo capture quality checks before submitting a report so managers do not have to request avoidable fixes.
  - Acceptance criteria: the app warns when before/after evidence is missing, duplicate, too small, or not previewable before completion report submission.
  - Implementation path: use browser image metadata initially, then add server-side image processing and audit rows for quality checks.
- As a crew member, I need to request extra work from the job screen and track whether it needs manager approval, pricing, or customer approval.
  - Acceptance criteria: standard add-ons can be approved into work, priced add-ons become bids, and crew sees the current review state.
  - Implementation path: continue from amendment and bid foundations, then add crew-visible amendment status updates and accepted-work sync.
- As a crew lead, I need work orders to show contracted scope, property zones, hazards, access instructions, required evidence, materials, and equipment so the crew can complete the visit without guessing.
  - Acceptance criteria: each work order distinguishes included, conditional, approved additional, requires approval, not included, and prohibited tasks; completion cannot be submitted without required evidence or an approved exception.
  - Implementation path: introduce contract service items, work-order tasks, zone requirements, scope categories, and required evidence policies, then connect them to the existing route stop and completion report flow.
- As a crew lead, I need pre-shift equipment, material, safety, and attendance checks so route risk is visible before the crew leaves the shop.
  - Acceptance criteria: missing equipment, missing materials, unavailable crew members, certification gaps, and safety blockers are surfaced before dispatch.
  - Implementation path: add crew check-in, equipment reservations, material loading, skill/certification checks, and route capacity warnings.

### Yard-care company operations stories

- As an operations manager, I need a company, region, branch, crew, route, work-order, and task hierarchy so responsibilities and reports match how a multi-crew company operates.
  - Acceptance criteria: users can filter operational work by company, region, branch, crew, route, customer, contract, and service date with role-appropriate access.
  - Implementation path: extend tenant membership with branch/region scope, add hierarchy tables, then backfill route and work-order reads through those boundaries.
- As a dispatcher, I need service territories, crew capacity, route risk, and cross-crew reassignment tools so I can recover from delays, equipment failures, weather, and staffing gaps.
  - Acceptance criteria: at-risk work can be reassigned with visible travel, overtime, equipment, customer-continuity, and audit impacts.
  - Implementation path: build territory and capacity models first, then add reassignment proposals and persisted route mutations.
- As a billing or finance user, I need completed work to become billing-ready only after required tasks, photos, labor, materials, approvals, and exceptions are complete.
  - Acceptance criteria: billing batches can be grouped by customer, contract, property, branch, service period, billing cycle, and service type.
  - Implementation path: extend completion reports into work-order validation records and add billing-readiness states before invoice generation.

### Customer portal stories

- As a property owner, I need a secure portal listing my properties, completed services, report evidence, bids, and next scheduled work so I can trust what was done without calling the office.
  - Acceptance criteria: customer-visible pages show only the authenticated customer's accounts, properties, reports, photos, and bids.
  - Implementation path: start with the delivered report and bid pages, then add authenticated customer account scoping after tenant membership is persisted.
- As a property manager, I need grouped portfolios across many properties so I can review service status by owner, HOA, commercial site, or management group.
  - Acceptance criteria: grouped and ungrouped properties are visible, each portfolio has service counts, and report/bid history can be filtered by portfolio.
  - Implementation path: wire portfolio models to customer portal queries, then add manager-owned portfolio administration.
- As a customer, I need notification preferences so service updates arrive through the channel I trust.
  - Acceptance criteria: email/SMS opt-in, quiet hours, recipient validation, and template-specific preferences are persisted.
  - Implementation path: add customer contact and preference tables, then gate notification enqueueing through those preferences.

### Homeowner self-service stories

- As a homeowner, I need the app to generate a property-specific yard care schedule so I do not have to decide every recurring task myself.
  - Acceptance criteria: onboarding captures location, availability, yard zones, maintenance goals, equipment, supplies, and climate profile; the app produces a four-week plan with explanations.
  - Implementation path: reuse property and photo primitives, then add homeowner-only yard zones, task templates, schedule rules, and availability preferences.
- As a homeowner, I need a Today view and guided yard session so I can inspect, prepare, complete, clean up, and record work with minimal phone handling.
  - Acceptance criteria: tasks are grouped into a session with tools, supplies, ordered steps, completion controls, notes, photos, elapsed time, and a completion summary.
  - Implementation path: build a homeowner task/session model separate from provider work orders while sharing photo and history components where practical.
- As a homeowner, I need weather, season, supply, equipment, and issue conditions to change the schedule with a clear reason.
  - Acceptance criteria: unsuitable tasks can move to a better window, blocked tasks explain missing supplies or equipment, and observations can create follow-up tasks.
  - Implementation path: add scheduling rules for weather holds, seasonal holds, supply holds, equipment holds, recurrence behavior, and issue-generated tasks.

### Property management and vendor governance stories

- As a portfolio operations manager, I need portfolio, region, property, vendor, territory, and coverage status views so I can see which properties are covered and which need intervention.
  - Acceptance criteria: every property has a coverage status, assigned vendor or gap reason, service requirements, evidence policy, and escalation path.
  - Implementation path: extend portfolio/property models with vendor assignments, vendor territories, service capabilities, coverage statuses, and backup vendor rules.
- As a vendor manager, I need vendor onboarding, compliance, insurance, license, certification, service territory, and performance records so only qualified providers receive work.
  - Acceptance criteria: expiring or missing compliance records prevent or warn on new assignments according to policy.
  - Implementation path: add vendor profiles, compliance documents, expiration monitoring, vendor statuses, and assignment eligibility checks.
- As an accounts payable user, I need invoices matched against contracts and validated work orders so duplicate, unsupported, or incorrect billing is caught before payment.
  - Acceptance criteria: invoice lines produce matched, matched with tolerance, duplicate suspected, rate mismatch, quantity mismatch, missing work order, missing approval, missing evidence, or rejected outcomes.
  - Implementation path: add normalized vendor invoice records, invoice lines, matching rules, tolerance policy, and invoice exception workflow.

### Organization and onboarding stories

- As an organization owner, I need to invite managers, crews, and customers by role so the product can be used by a real company instead of seed users.
  - Acceptance criteria: invitations create pending memberships, accepted users receive role-scoped access, and role changes are audited.
  - Implementation path: persist organization memberships, add invite tokens, then connect Cognito groups or app roles to tenant membership.
- As an office manager, I need customer/property onboarding checklists so new service accounts are not scheduled without required address, access, service, billing, and notification details.
  - Acceptance criteria: incomplete accounts are flagged, required fields are visible, and scheduling can block on missing operational data.
  - Implementation path: add onboarding status fields and validation helpers, then build manager forms around the existing property/account models.

### Operations and scale stories

- As an operator, I need staging smoke tests and deployment checks so releases do not break crew work, report delivery, or authentication.
  - Acceptance criteria: health, auth config, migration status, job list, route read, report read, upload ticket, and notification queue checks are documented and scriptable.
  - Implementation path: extend the production smoke script, add staging environment variables, and require smoke results before production deploys.
- As a support user, I need audit trails for schedule, price, report, access, and communication changes so customer disputes can be investigated.
  - Acceptance criteria: each sensitive action records actor, organization, target, timestamp, old/new state summary, and source request metadata.
  - Implementation path: extend access audit events into domain-specific audit helpers and surface them in manager/admin views.

### Customer portal

- Add a customer-facing portal for property owners to track work completed on their property
- Show scheduled, in-progress, completed, and upcoming services for each property
- Show completion reports with checklist status, crew notes, account status, and photo evidence
- Allow customers to view service history by property and service date
- Allow customers to review and approve project bids or extra-service requests
- Add customer notification preferences and portal links for email and text/SMS delivery
- Add role-scoped portal access so customers only see their own accounts, properties, reports, photos, and bids

### Onboarding and organization management

- Add onboarding flows for new customers, properties, yard crews, managers, and management companies
- Support management companies with multiple crews and multiple managed customer accounts
- Model organization ownership, crew membership, manager roles, and customer/property relationships
- Invite users by role: customer, crew member, crew lead, manager, and organization owner
- Capture property details during onboarding, including address, access notes, service preferences, and contracted services
- Capture crew operating details, including service area, crew capacity, default schedule, and assigned services
- Add onboarding status tracking for invited, active, incomplete, suspended, and archived accounts
- Add tenant-aware data boundaries so each organization only sees its own crews, customers, jobs, reports, bids, and notifications

### Notification strategy

- Add provider-specific delivery receipt webhooks and manually resolved failure handling
- Extend email and SMS templates beyond the implemented project-bid review payload
- Add notification preferences for channel opt-in, quiet hours, and customer contact rules
- Add templates for day-plan publication, crew route changes, completion reports, bid approvals, and extra-service requests
- Connect manager activity history to persisted notification events

### Crew day-plan amendments

- Allow crews to request day-plan changes from the field
- Support adding an unplanned stop to the current day plan
- Support removing or skipping a stop with reason capture
- Support adding an extra service to a stop, such as sprinkler repair or tree-limb removal
- Require manager approval or pricing review for billable day-plan amendments
- Preserve an audit trail showing who requested, approved, rejected, or completed each amendment
- Sync accepted amendments back into the crew-facing route and manager activity history

### Service catalog and project bidding

- Add a service list/catalog for standard yard care and extra services
- Track service attributes such as name, description, unit, default duration, default price, and whether manager approval is required
- Allow crews to attach proposed extra services to a stop from the field
- Add a project bid workspace for managers to review requested work, build line-item bids, and send customer approval requests
- Support bid statuses: draft, sent, approved, rejected, expired, and converted to work
- Convert approved bids into scheduled services, day-plan stops, or job add-ons

### Completion reports

- Add report status transitions beyond draft/ready, including sent
- Include crew route context in report responses
- Add immutable report snapshots for customer delivery
- Add customer delivery by email and text/SMS
- Surface completed reports in the customer portal

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
- Property list and property detail page
- Customer-to-property relationship management
- Organization-to-customer relationship management for management companies

### Marketing and advertising campaign

- Build segmented campaign messaging for individual homeowners, property manager teams, small yard-care companies, and larger yard-care companies
- Position individual homeowner messaging around trust, proof of completion, photo evidence, clear service history, bid approvals, and easier communication with service providers
- Position property manager messaging around multi-property visibility, portfolio grouping, crew accountability, completion evidence, tenant/owner communication, and service issue tracking
- Position small yard-care company messaging around simple mobile crew workflows, daily route clarity, before/after proof, customer confidence, faster completion reporting, and reduced office follow-up
- Position larger yard-care company messaging around multi-crew operations, manager scheduling, route oversight, audit trails, role-based access, reporting consistency, and scalable service operations
- Create landing-page paths for each audience segment with tailored benefits, screenshots, proof points, calls to action, and pilot signup flows
- Plan advertising channels for local search, social media, industry directories, referral partnerships, property-management associations, landscaping trade groups, and targeted email outreach
- Add campaign tracking for source, audience segment, landing page, signup intent, demo requests, pilot conversion, and customer acquisition cost
- Keep campaign claims tied to implemented or planned product capabilities, and avoid promising automations, integrations, or scale features before they are ready

### Early hosting plan

- Keep the first hosted environment simple and operationally boring: hosted static frontend, containerized Rust API, managed PostgreSQL, managed object storage for photo evidence, managed secrets, and HTTPS by default
- Create separate development, staging, and production environment configuration before customer-facing pilots
- Use managed authentication for the hosted release rather than custom password storage
- Store photo evidence in object storage with short-lived upload/download URLs instead of routing large files through the API
- Run database migrations as an explicit release step with rollback notes
- Add basic observability for API health, failed requests, job/route mutation errors, upload failures, notification failures, and authentication failures
- Validate the crew mobile browser workflow, manager scheduling workflow, and customer portal workflow against the hosted environment before inviting external users

### Growth hosting and scale plan

- Scale only after adoption exceeds the initial release assumptions; do not overbuild before pilot usage proves the bottlenecks
- Move from one small API deployment to horizontally scalable API instances behind a load balancer when traffic requires it
- Add background workers for notifications, report delivery, image processing, route optimization, and long-running integrations
- Add queues for retryable work such as SMS/email delivery, photo processing, completion report delivery, and third-party sync jobs
- Add read replicas, connection pooling, and query/index reviews when PostgreSQL load becomes visible
- Add CDN caching for frontend assets, public marketing pages, and safe static content
- Add object lifecycle policies for photo evidence retention, archival, and deletion rules
- Add organization-level usage limits, rate limiting, and abuse monitoring before broad public sign-up
- Add structured logs, metrics, traces, alerting, backups, restore drills, and incident runbooks before scaling beyond early customers
- Consider regional deployment, enterprise SSO, SCIM-style user lifecycle management, and stronger data residency controls only after adoption and customer requirements justify them

### Professional product roadmap

Goal: evolve the MVP into a polished, professional landscaping operations product that can support paying customers, internal office teams, field crews, property managers, and multi-crew service companies.

Priority feature groups:

- Professional onboarding: guided setup for organizations, crews, properties, portfolios, service catalogs, invite roles, sample data, and first-route publishing
- Branded customer experience: service history timeline, delivered report cards, customer-safe evidence detail, bid history, support requests, communication preferences, and company-branded portal surfaces
- Field crew excellence: installable mobile PWA experience, offline-ready daily routes, photo capture quality checks, GPS/time context for evidence, issue capture, safety notes, and crew handoff notes
- Manager command center: dispatch calendar, drag-and-drop route planning, crew capacity heatmaps, work backlog, approval queues, quality review queues, and exception alerts for missed or delayed work
- Revenue operations: recurring service contracts, estimates, bids, change orders, deposits, invoices, payment status, tax/discount fields, account balances, and customer payment links
- Communication center: customer and crew message threads, templated updates, notification preferences, quiet-hour rules, delivery receipts, failed-delivery recovery, and manager-visible communication history
- Quality assurance: completion report review workflow, evidence completeness checks, before/after comparison, manager sign-off, audit trail, and customer-visible approved summary versions
- Analytics and reporting: crew productivity, route efficiency, service profitability, account health, bid conversion, customer retention, missed-service trends, and marketing campaign attribution
- Integrations and exports: calendar export, map routing provider integration, accounting export, CSV import/export, webhook events, public API boundaries, and CRM-style lead capture handoff
- Administration and support: organization settings, role administration, feature flags, support impersonation with audit controls, data retention settings, backup/restore drills, and operational runbooks

Professional release milestones:

- Pilot-ready release: authenticated manager/crew/customer roles, reliable hosted environment, object-storage photo evidence, basic customer portal, completion report delivery, and supportable onboarding
- Professional operations release: persisted route planning, approval queues, recurring contracts, customer bid history, notification provider integration, and manager analytics dashboard
- Scale-ready release: multi-tenant administration, billing and payments, integration hooks, observability, incident runbooks, data retention controls, rate limits, and organization-level usage governance

Product quality bar before paid launch:

- Core crew, manager, and customer workflows work without local-only assumptions
- Every customer-visible report is scoped to the correct customer account and property portfolio
- Every manager action that changes schedule, price, report status, or customer communication is auditable
- Photo evidence and completion reports are persisted as immutable customer delivery snapshots
- Notification, upload, and payment failures are visible to managers with retry or recovery guidance
- The product has a staging environment, smoke-test checklist, rollback notes, and documented support procedures
