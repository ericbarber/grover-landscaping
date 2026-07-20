# Application Continuation Roadmap

This is the consolidated review version of the Grover Landscaping development
plan. Detailed delivery status remains in [`../PLAN.md`](../PLAN.md).

## Immediate Continuation Work

1. **Production identity and tenant security**
   - Provision Cognito and create the first organization-owner identity.
   - Finish tenant-aware boundaries for remaining customer reads.
   - Expand account onboarding and first-user administration.
2. **Notifications and persisted activity**
   - Configure and validate the production email/SMS gateway.
   - Process provider delivery receipts and manual resolutions.
   - Connect manager activity history to persisted notification and audit events.
   - Add templates, preferences, quiet hours, and customer contact rules.
3. **Customer account onboarding**
   - Complete customer-account setup and administration workflows.
   - Capture service-ready contact and communication details during initial account creation.
4. **Route persistence**
   - Continue replacing seeded/browser-only behavior with database-backed routes.
   - Expand persistence and integration-test coverage.
   - Make remaining persisted customer-account collection reads fail explicitly when storage is unavailable.
5. **Customer bid history**
   - Complete authenticated, tenant-scoped customer bid history.

## Phase 1 — Pilot Readiness and Data Boundaries

- Validate owner, manager, crew-lead, and customer identities.
- Finish organization membership and ownership boundaries for every resource.
- Prove cross-organization access is rejected.
- Audit role, schedule, report, bid, notification, and delivery changes.
- Eliminate browser-only dependencies from hosted core workflows.
- Finalize pilot setup, smoke tests, seed expectations, and rollback notes.

Exit condition: a hosted authenticated user can complete the core crew, manager,
photo, report, bid, and customer-safe-link workflows using persisted state.

## Phase 2 — Field Crew Mobile Reliability

- Add an installable PWA, application-shell caching, and mobile metadata.
- Store offline field mutations in IndexedDB.
- Store offline photo metadata and blobs atomically without retaining upload credentials.
- Synchronize stop progress, job lifecycle, checklists, photos, and amendments.
- Standardize pending, persisted, failed, conflict, and retry states.
- Add before/after evidence, quality, previewability, and duplicate-photo checks.
- Expand server image processing and report-readiness rules.
- Test interruption and later synchronization recovery on a mobile viewport.

## Phase 3 — Manager Command Center

- Complete persisted report filters and unified activity history.
- Expand notification, photo, erasure, and report recovery workflows.
- Add route capacity, duration, overage risk, and publish guards.
- Add dispatch views and movement between crews or dates.
- Model company, region, branch, territory, crew, route, work order, and task.
- Support audited cross-crew reassignment with travel, overtime, equipment, and
  customer-continuity impacts.
- Centralize delays, staffing, access, weather, equipment, safety, and customer
  exceptions.

## Phase 4 — Customer Portal and Portfolio Experience

- Provide authenticated access to scoped accounts, properties, portfolios,
  schedules, reports, photos, bids, and service history.
- Support homeowners, property managers, HOAs, and commercial portfolio groups.
- Show immutable report history and customer-safe evidence.
- Show active, rejected, expired, and converted bids.
- Add notification preferences, quiet hours, and recipient validation.
- Add property/report/service-linked support and issue requests.
- Cover loading, empty, error, expired, revoked, and no-portfolio states.

## Phase 5 — Revenue Operations and Service Administration

- Build a service catalog with units, duration, pricing, approval, and status rules.
- Add recurring contracts, frequency, generated schedules, skipped services, and
  period summaries.
- Add estimates, change orders, deposits, invoices, taxes, discounts, balances,
  payment status, and payment links.
- Complete customer/account onboarding and organization settings.
- Add contract-aware work orders and protected scope categories.
- Capture labor, materials, equipment, treatments, cost, billing readiness, and
  profitability.
- Track fleet, tools, chemicals, supplies, reservations, inspections, and failures.

## Phase 6 — Scale, Integrations, and Operational Hardening

- Establish development, staging, and production release gates.
- Require migration checks, smoke tests, rollback notes, and environment-specific
  configuration.
- Add logs, metrics, traces, alerts, backups, restore drills, and incident runbooks.
- Expand worker queues for notifications, images, reports, route optimization, and
  integrations.
- Add retention, archival, deletion, and customer-data export policies.
- Add rate limits, usage governance, feature flags, audited support access, and
  abuse monitoring.
- Add calendar, maps, accounting, CSV, webhook, and public API integrations when
  product demand justifies them.

## Phase 7 — Homeowner Self-Service Yard Assistant

- Onboard yard goals, size, climate, availability, and household constraints.
- Model zones, plants, irrigation, equipment, supplies, observations, and history.
- Generate adaptive four-week schedules based on weather, season, restrictions,
  dependencies, availability, supplies, and equipment.
- Build Today, calendar, tasks, issues, history, equipment, supplies, and settings.
- Provide guided sessions and educational task instructions.
- Create follow-up tasks from issues and record time, costs, products, notes, and
  photos.
- Send task, weather, irrigation, equipment, supply, safety, and summary notices.

## Phase 8 — Multi-Vendor Property Management

- Model property-management organizations, ownership groups, portfolios, regions,
  properties, vendors, branches, and territories.
- Onboard vendors and validate insurance, licenses, certifications, capabilities,
  capacity, and compliance.
- Manage coverage, backup vendors, standardized work orders, and vendor responses.
- Define versioned scopes, regional requirements, and evidence standards.
- Add automated evidence checks, sampling, review, corrections, and scorecards.
- Govern additional work through approval matrices and competitive estimates.
- Normalize and three-way-match vendor invoices.
- Build dashboards for coverage, compliance, evidence, budgets, invoices, service
  levels, and vendor performance.

## Cross-Cutting Plans

- Drag-and-drop scheduling and capacity heatmaps.
- Crew attendance, certification, safety, equipment, and material readiness.
- GPS/time evidence context and crew handoff notes.
- Customer and crew communication threads.
- Quality review, before/after comparison, sign-off, and approved summary versions.
- Productivity, route efficiency, profitability, account health, bid conversion,
  retention, missed-service, and campaign analytics.
- Role, retention, support, and usage administration.
- Audience-specific marketing pages, pilot signup, attribution, and acquisition-cost
  tracking.

## Sequencing Rules

- Tenant boundaries and auditability precede broad portal or marketing work.
- Offline field reliability precedes heavier dispatch features.
- Customer report history requires immutable delivery snapshots.
- Validate notification delivery with bids before reusing it elsewhere.
- Stabilize catalogs, contracts, and account rules before payment integrations.
- Keep homeowner self-service distinct from provider operations.
- Delay multi-vendor management until tenant, evidence, catalog, work-order, and
  billing foundations are stable.
- Scale infrastructure in response to measured pilot usage.
