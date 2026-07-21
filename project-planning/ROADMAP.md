# Application Continuation Roadmap

This is the consolidated review version of the Grover Landscaping development
plan. Detailed delivery status remains in [`../PLAN.md`](../PLAN.md).

## Active UX Priority

The public root homepage now introduces Grover through an outcome-led hero,
persona-selectable benefits for yard owners, property managers, landscaping
companies, and crew leads, the Plan-Care-Proof workflow, a product preview,
capability proof points, and clear workspace calls to action. `/app` remains the
direct workspace entry.
Persona-specific conversion actions now open a consent-based request flow for
demos, portfolio discussions, or early access. Production requests persist with
audience, intent, landing path, and UTM attribution; local preview mode reports
that it does not retain the submission.
Dedicated audience paths now tailor the hero, metadata, and conversion action for
yard owners, property managers, landscaping companies, and crew leads while
preserving campaign attribution. Public crawler rules exclude operational and
customer-share routes from indexing.
The static workflow explanation has been replaced with a compact interactive
Plan-Care-Proof tour. Persona-specific outcomes connect the same working product
capabilities to each audience, while a capability-backed credibility section
avoids unverified testimonials, logos, and performance claims.
Privacy-limited first-party conversion measurement now records the marketing
funnel from page view through lead submission. It uses a random per-tab session,
bounded campaign and placement context, no third-party tracker, and no personal
form data. Manager funnel reporting remains the next delivery slice.
The first platform marketing-operations slice adds a SupportAdmin-only lead inbox
with status filtering, assignment, next-action scheduling, notes, and durable
workflow history. Public lead submission remains anonymous while all lead reads
and mutations are protected; organization managers cannot access platform leads.
SupportAdmin reporting now summarizes the 30-day visit-to-request funnel with
persona and campaign segments, operational failure counts, and explicit
low-volume guidance. Overdue next actions are counted, prioritized, and visibly
distinguished in the lead inbox.

The current delivery priority is a mobile-first navigation redesign before the
remaining pilot-readiness hardening. The first slice separates Route, Jobs, Job,
and Manager into explicit mobile workspace views with stable bottom navigation
and a contextual header. Follow-up slices will group manager capabilities into a
manager home, make route and job summaries more compact, preserve per-view scroll
position, and validate the complete interaction model on iPhone. Persona-aware
navigation now separates yard owners, property managers, field crews, yard-care
company operators, dispatch, billing, and support. Mobile managers now enter a
compact task-category home and load only one category at a time; the next slices
now use a second-level task picker so only one manager tool renders at a time.
The next slices will shorten customer service-work history content.
Crew routes now focus on the current and next stop by default while retaining an
explicit full-route view.
Mobile job detail now keeps primary actions visible and opens checklist, photo,
add-on, and completion-report workflows one at a time.
Yard-owner history now begins with compact property selection and renders one
property timeline at a time on mobile.
Customer mobile history now separates property/service history from bid history
instead of stacking both areas on one screen.
Selected properties preview the two newest reports on mobile and expand older
completion-report history only when requested.
The authenticated application now opens on a persona-aware Home with signed-in
identity, work and sync summaries, and role-relevant shortcuts.
Home now provides a branded, time-aware first impression with persona messaging,
daily progress, sync health, and a prominent recommended next action.
Its original Southwestern landscape hero adds persona-specific product promises
and compact plan-care-proof brand cues without extending the workflow.
Progress language now adapts to service visits, portfolio work, route stops,
revenue readiness, or field delivery for the active persona.
Desktop now shares the mobile Home's premium landscape imagery, persona promise,
brand cues, and contextual progress instead of a generic field-work banner.
Authentication and session-loading screens now carry the same premium brand,
outcome-led value proposition, trust cues, and workspace call to action.
Home also explains the highest-priority current state: unsynced changes, a clear
schedule, remaining work, or a completed day.

## Immediate Continuation Work

0. **Local mobile runtime readiness**
   - Keep Docker health checks and watchdog restart behavior validated for Tailscale phone access.
   - Keep backend and frontend unit readiness suites green as persistence contracts evolve.
   - Keep PostgreSQL integration fixtures isolated from durable recovery history created by earlier runs.
   - Include photo-erasure retry and resolution outcomes in auditable manager operations.
1. **Production identity and tenant security**
   - Provision Cognito and create the first organization-owner identity.
   - Finish tenant-aware boundaries for remaining customer reads.
   - Distinguish unavailable membership verification from genuine resource-access denial.
   - Expand account onboarding and first-user administration.
   - Keep access-summary reads fail-closed when required login auditing is unavailable.
   - Keep sensitive customer account reads fail-closed when view auditing is unavailable.
2. **Notifications and persisted activity**
   - Configure and validate the production email/SMS gateway.
   - Process provider delivery receipts and manual resolutions.
   - Connect manager activity history to persisted notification and audit events.
   - Add templates, preferences, quiet hours, and customer contact rules.
   - Audit provider delivery and recovery outcomes for lossy fallbacks before pilot use.
3. **Customer account onboarding**
   - Complete customer-account setup and administration workflows.
   - Capture service-ready contact and communication details during initial account creation.
   - Keep property operational profiles fail-closed when persisted onboarding storage is unavailable.
   - Keep customer photo-erasure redaction and external-object recovery atomic.
4. **Route persistence**
   - Continue replacing seeded/browser-only behavior with database-backed routes.
   - Expand persistence and integration-test coverage.
   - Audit remaining persisted repositories for lossy outcomes, then harden the next affected path.
   - Preserve distinct missing, changed, and unavailable outcomes throughout manager route review.
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
- Campaign-specific marketing paths, production screenshots, customer proof,
  pilot signup, attribution, and acquisition-cost tracking beyond the delivered
  persona-selectable public homepage.

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
