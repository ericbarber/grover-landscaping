# Feature Catalog

This catalog includes delivered foundations, design-ready targets, and planned
capability areas. Use [`../PLAN.md`](../PLAN.md) for delivery status and
[`PROTOTYPE_ADOPTION.md`](PROTOTYPE_ADOPTION.md) for the exact design-to-React
boundary; inclusion here alone does not mean a feature shipped.

## Public Product Experience

- Shared working-design foundation across the public homepage, Yard Crew
  acquisition, Yard Owner acquisition, and Yard Owner portal, including
  canonical palette, wordmark, typography roles, banners, controls, surfaces,
  focus treatment, public headers, and application-rail materials
- Documented navigation system separating public discovery,
  acquisition-progress, and authenticated-destination models without changing
  their common brand treatment
- Public outcome-led homepage with direct workspace entry
- Persistent hero invitations for private Yard Owner signup and authenticated
  landscaping-company onboarding
- Complete persona-specific landing narratives for yard owners, property
  managers, landscaping companies, and crew leads, spanning hero actions,
  previews, trust signals, outcomes, proof, capabilities, and final invitations
- Prototype-aligned “Today’s operation” landscaping-company hero overview with
  executive day signals, crew schedule/capacity, interactive dispatch
  assignment, suggested balancing, and an explicit non-persistent boundary
- Plan-Care-Proof product narrative with the interactive “Today’s operation”
  company dashboard embedded in Plan and representative Care and Prove previews
- Responsive product capability and trust sections
- Persona-specific demo, portfolio-discussion, and early-access conversion paths
- Consent-based PostgreSQL lead capture with landing-page and UTM attribution
- Honeypot spam filtering and honest local-preview confirmation
- Shareable persona campaign paths with complete page narratives, calls to
  action, canonical metadata, and crawler controls
- Interactive persona-aware Plan-Care-Proof product tour
- Evidence standard and trust cards grounded in delivered offline, audit, access, evidence, reporting, and bid workflows
- First-party conversion events for visits, personas, tour steps, CTAs, form starts, submissions, and failures
- Anonymous per-tab measurement with UTM attribution, an explicit event allowlist, and no third-party tracking
- Support-admin platform lead inbox with contact, intent, attribution, status filtering, ownership, and follow-up scheduling
- Durable lead workflow history recording operator, status transition, assignment, next action, note, and timestamp
- SupportAdmin 30-day conversion dashboard with unique-session stages, persona and campaign segments, failure counts, and low-volume interpretation
- Overdue lead counts, priority sorting, and visual attention states
- Validated working homepage design with responsive audience continuity,
  interactive workflow proof, accessible request states, and implementation
  handoff
- Production prototype-convergence foundation with canonical theme tokens,
  editorial/interface font roles, reusable leaf wordmark and controls,
  prototype-aligned responsive public hero and persona preview, matching access
  and Yard Owner acquisition surfaces, PWA chrome, and computed-style regression
  coverage
- Validated Yard Crew acquisition marketing with distinct solo provider,
  provider-company, and invited-worker paths, evidence-based capability claims,
  lifecycle explanation, opportunity preview, and contextual support entry
- Production public provider entry with owner-operator, company-owner, invited-
  worker, and known-owner paths; allowlisted authenticated setup context; and
  explicit no-publication/no-opportunity authority boundaries
- Production provider identity/readiness projection using current organization-
  profile and setup-progress reads, with distinct provider-supplied, recorded
  preference, operational setup, missing, not-collected credential, and not-
  evaluated marketplace states instead of a broad verified-provider badge
- Persisted provider operating-profile facts for allowlisted service categories
  and customer communication languages, rendered as provider-supplied readiness
  without implying capability proof, eligibility, ranking, availability, or
  credential verification
- Production first-time known-owner provider connection with verified-recipient
  confirmation, own-membership organization selection, duplicate-safe new-
  organization bootstrap, explicit withheld-data acknowledgement, resumable
  bounded capability/inbox reads, and controlled question/interest/decline
  responses before owner-approved disclosure
- Stable responsive known-owner provider lifecycle navigator spanning
  Invitation, Organization, Disclosure, Assessment, Proposal & setup, and First
  visit with current/complete/upcoming/closed states and available-stage links
- Planned extensions: verified customer proof, production screenshots, and lead notifications

## Persona Workspaces

- Shared authenticated Home with signed-in identity, persona context, work/sync summary, and persona-specific quick actions
- Prototype-aligned authenticated Home shell with canonical desktop/mobile
  wordmark, editorial greeting hierarchy, warm/paper materials, forest manager
  navigation, mobile header and bottom-navigation surfaces, and exact style
  regression coverage
- Prototype-aligned provider invitation and assessment entry shell with shared
  wordmark, type roles, acquisition materials, action/card geometry, and guarded
  privacy-boundary emphasis
- Role-bounded desktop composition for customer care, field execution, company operations, portfolio management, and platform support
- Persona-filtered management categories with a single selected tool rendered on both desktop and mobile
- Yard owner: properties, upcoming service, reports, photos, bids, and service history
- Delivered hybrid customer portal authorization foundation with provider-tenant
  customer-account inheritance for verified owners, explicit property grants
  for delegates, activation-proven backfill, and fail-closed property resolution;
  the minimized persisted confirmed-visit read and fail-closed Yard Owner
  Home/Visits adoption are delivered with loading, valid-empty, missing-access,
  inconsistent-access, unavailable, and retry states and no illustrative fallback
- Delivered immutable provider service-release and customer-status persistence
  linking the exact confirmed first visit, accepted service scope, current
  organization/account/property relationship, authorized provider membership,
  and one atomically created scheduled job; exact replay, state sequencing,
  operational progress gates, revocation, and cross-property isolation fail closed
- Delivered provider-owner/manager mobilization APIs for authoritative release
  reload, exact-version idempotent work release, and versioned customer-safe
  status publication, with explicit recovery responses and customer/account/
  property/organization identifiers omitted from the HTTP projection
- Delivered minimized hybrid customer service-day projection that defaults to
  exact confirmation, advances only from immutable customer events, carries
  bounded weather/update copy and the latest explicit reschedule window, omits
  release/event/job and provider-operational identifiers, and keeps proof false
  until separately authorized
- Adopted all six explicit service-day modes in Yard Owner Home and Visits with
  one accessible progress rail, bounded weather explanation, original and
  replacement reschedule timing, current next-update ownership, recorded
  preparation, and proof-pending privacy without provider-operational context
- Dedicated customer visit-question persistence with one random non-bearer
  reference per exact service release, immutable versioned customer/provider
  messages, hybrid customer authorization, organization-owner/manager provider
  authority, exact reply/replay rules, and cross-property isolation
- Minimized customer visit-thread read/write APIs and unanswered-first provider
  owner/manager queue with exact database authority, explicit recovery states,
  safe visit context, and no actor or operational identifiers
- Yard Owner Home/Visits question experience with released-visit availability,
  exact authoritative history, allowlisted topics, bounded text, retry-key
  retention, conflict/outage reload recovery, and no notification/SLA claim
- Provider owner/manager visit-question workspace with an unanswered-first safe
  context queue, exact-thread review, one-response-per-question targeting,
  retry-key retention, authoritative recovery, and no authority exposed to
  support, billing, or property-manager personas
- D-061 delivered-proof source and authorization boundary using the exact
  visit/release/job/report chain, with Yard Owner legacy property-report reads
  contained until atomic immutable snapshots and hybrid-authorized proof reads
  are delivered
- Atomic completion-report publication that validates the exact persisted
  snapshot before one transaction writes delivery state, share token, snapshot,
  timestamps, history, and audit; database immutability guards and public reads
  reject missing, invalid, or rewritten proof instead of rebuilding live state
- Hybrid-authorized exact-visit delivered-proof projection with safe availability
  derivation, strict stored-snapshot validation, pending/revoked/ended/corrupt/
  outage distinction, and no internal IDs or bearer share token
- Yard Owner protected-proof experience in Home, Visits, and Proof with on-demand
  exact reads, checklist/photo evidence, completed approved-work outcomes,
  explicit retry, and no live-data or share-link fallback
- D-062 active-recommendation source and decision boundary using an immutable
  versioned publication from the exact visit/release/job/stop/amendment/project-
  bid chain, hybrid customer reads and decisions, actor-scoped replay, revision
  supersession, bounded approval meaning, and legacy account-bid containment
- D-062 constrained recommendation persistence with composite exact-chain
  provenance, immutable hash-addressed sequential publications, supersession
  and lifecycle events, version-bound decisions/messages, exact reply linkage,
  and database-enforced transition and rewrite guards
- D-062 exact initial provider-send bridge with active relationship and full
  visit/job/amendment/provider provenance, minimized hash-addressed USD snapshot,
  atomic publication/event/link/notification state, actor retry identity, exact
  replay without duplicates, conflict recovery, and no customer API authority
- D-062 immutable provider revision bridge with expected-version and actor-key
  conflict control, prior-publication supersession, minimized next-version
  snapshots, atomic quiet-hours-aware redelivery, and transitional legacy
  bearer decisions that close the signed-in surface without impersonating an
  authenticated customer decision
- D-062 hybrid-authorized exact-visit recommendation list and immutable-history
  detail reads with strict snapshot allowlisting, recomputed totals, durable
  server expiration, cross-owner isolation, and no mutable-bid fallback
- D-062 actor-scoped exact-version approve, decline, and revision-request API
  with action-specific affirmation/context, immutable decision/event advance,
  exact replay receipts, and authoritative stale/changed conflict recovery
- Navigable four-step Yard Owner acquisition flow with reopenable completed
  steps, editable profile and yard brief state, and separate Property, Yard
  brief, and Connect care screens
- Validated Yard Owner V2 working design with service-day confidence, contextual
  questions, delivered proof comparison and feedback, concern recovery,
  collaborative recommendation decisions, portal-wide property selection,
  notification/access preferences, responsive references, and production handoff
- Backlog Yard Owner appreciation and service feedback tied to an exact completed
  visit, supporting private provider-company or customer-safe service-team
  recognition without exposing or publicly rating individual workers
- Backlog provider-verified external review destinations with a neutral Google
  review link and Yelp business-profile link, no sentiment gating or incentives,
  and no automatic cross-post/import/display without a separate platform-policy,
  consent, attribution, moderation, and retention contract
- Validated property-manager portfolio V1 working design with responsive
  Overview, Properties, Proof, and Approvals destinations; prioritized readiness
  and exceptions; property search; customer-safe provider accountability; and
  all-clear, new, loading, partial, and unavailable states
- Production PropertyManager command center with customer-scoped portfolio and
  property filtering, labeled illustrative next-service readiness, partial
  protected-history isolation, completion proof, recommendations, and explicit
  exclusion of provider-private operating data
- Validated owner-first acquisition working design with independent identity,
  private address, guided yard brief/photos, known-provider invitation, curated
  provider discovery, assessment, versioned initial proposal, consented
  activation, relationship controls, and marketplace trust gates; production
  contracts remain planned
- Professionally reviewed acquisition workflow with explicit email verification,
  affirmative sensitive-data consent, accessible error/progress semantics,
  functional provider filters, assessment continuity, neutral proposal
  comparison, and confirmed access-reducing actions
- Validated Yard Owner acquisition V2 known-provider connection with recipient-
  specific invitation entry, separate email/organization/action authority,
  preliminary provider response, complete invitation lifecycle and support,
  unselected-by-default provider disclosure, approved/withheld access receipts,
  server-derived assessment review, atomic owner-approved grants with exact
  review-version receipts, category-filtered provider reads with grant-bounded
  selected-photo access and status-only closure, immutable owner receipt history
  and versioned future-access revocation, production default-withheld approval
  and access-history controls, provider-only approved detail rendering with an
  explicit withholding/authority boundary and ended-access recovery, and
  reciprocal Yard Crew/gallery entry
- Professional Yard Owner acquisition assurance with remediated workflow and
  consent defects, browser history and session recovery, precise trust language,
  keyboard/group focus, forced-colors and reduced-motion treatment, contrast and
  eight-viewport resilience validation, moderated owner/provider research and
  assistive-technology/device protocols, and pilot operations runbook
- Phase 3E Yard Owner pilot-hardening contract with explicit automated,
  external-technical, and signed-human evidence classes; retry/concurrency,
  browser, monitoring, runbook, rehearsal, and launch-blocker delivery order
- Retry-safe owner provider-disclosure decisions with stable approval/revocation
  keys across uncertain responses, preserved choices, authoritative stale-state
  reload, and no false success claim
- Concurrent disclosure-grant hardening with one authoritative receipt across
  exact simultaneous decisions, changed/stale conflict without partial writes,
  repeatable retained-evidence PostgreSQL fixtures, corrected protected grant
  queries, and clean-chain claim-appeal actor support
- CI-enforced Yard Owner acquisition browser matrix spanning mobile/desktop
  Chromium, desktop Firefox, and mobile WebKit with secure refresh, focus
  movement, responsive reflow, reduced-motion, forced-colors, selective-access,
  and post-revocation assertions
- Machine-checked Yard Owner pilot assurance manifest with minimized metric
  labels, complete signal-family alert/runbook mappings, seven controlled
  synthetic rehearsal scenarios, explicit containment/recovery/rollback, CI
  negative tests, and external/human blockers that automation cannot pass
- Authorized Yard Owner/provider assessment persistence with verified-recipient,
  active-interest, organization-membership, current-brief, and disclosure-grant
  rechecks; distinct remote review and proposed on-site windows; exact
  concurrent replay; owner-isolated history; append-only events; and minimized
  audit data
- Authenticated provider assessment-start and owner property-assessment history
  APIs with verified-email route policy, controlled remote/on-site validation,
  explicit replay/conflict/changed-authority/outage responses, and fail-closed
  no-persistence tests
- Separate assessment communication persistence for customer-safe messages and
  provider-private notes, with controlled author/kind constraints, a shared-only
  owner projection, append-only minimized events, and PostgreSQL proof that
  private production assumptions do not enter owner reads or event payloads
- Authorized owner shared-message and verified-provider shared/private-note
  repository writes with current assessment versions, exact replay, full
  provider authority rechecks, status-only terminal recovery, minimized event
  bodies, cross-actor isolation, and shared-projection-only owner reads
- Authenticated owner assessment-message list/create and verified-provider
  shared-message/private-note create APIs with separate privacy-shaped request
  paths, route authorization, explicit lifecycle/error mapping, and fail-closed
  persistence-outage behavior
- Owner-scoped on-site assessment window confirmation/change requests with
  expected-version locking, exact replay, controlled actions, append-only
  minimized events, authoritative invalid-state recovery, route authorization,
  and cross-owner/concurrency/outage coverage without service activation
- Provider-authorized assessment begin, completion, inability, and cancellation
  transitions with verified token/mailbox identity, full current-authority
  rechecks, row-locked expected versions, exact replay, controlled owner-safe
  reason/summary outcomes, minimized events, and no service activation
- Validated Yard Crew acquisition working design with provider organization
  setup, service territory and readiness, owner-approved opportunity search,
  privacy-preserving previews, provider-specific disclosure, remote/on-site yard
  assessment, versioned proposal and revision, accepted-but-unassigned handoff,
  first-visit confirmation, team invitations, contextual support, responsive
  references, and production contract map
- Yard Crew marketplace trust model separating interest from job claims, owner
  selection from provider crew assignment, supplied facts from checked facts,
  and yard context from provider diagnosis or pricing
- Professionally reviewed Yard Crew terminology spanning landscape-provider
  roles, provider qualification, service opportunities, site assessment,
  estimating, scope of work, proposal approval, service mobilization, work-order
  release, credential evidence, and specialty-service boundaries
- Tone-calibrated Yard Crew copy using a warm account-manager voice for setup,
  opportunity, assessment, proposal, work preparation, invitation, recovery,
  and support actions without weakening formal lifecycle or privacy boundaries
- Professionally reviewed Yard Crew V2 decision workflow with grouped lifecycle
  navigation, support outside completion, capacity and ready-with-limits states,
  richer privacy-safe opportunity facts, owner-response tracking, a structured
  site assessment, and a provider-private production basis beside the owner
  proposal
- Validated Yard Crew V3 extensions with first-service owner-message preview,
  recoverable delivery and receipt, team authority and invitation lifecycle,
  capacity-aware saved opportunity alerts, and explicit known-owner pilot gates
- Delivered private Yard Owner workspace and property persistence keyed to the
  authenticated subject, outside provider tenants, with per-owner duplicate
  protection and lifecycle audit coverage
- Delivered verified-identity Yard Owner self-service APIs for private workspace
  and property creation/readback without requiring a provider organization role
- Delivered responsive `/app/yard-owner` production entry with a public
  Yard Owner call to action, verified-email gating, private profile/property
  forms, stale-address reconfirmation, authority consent, and recovery states
- Delivered append-only private Yard Owner brief versions with owner isolation,
  areas, goals, cadence, considerations, source provenance, draft/ready status,
  accessible React editing, and explicit non-diagnostic boundaries
- Delivered optional private Yard Owner intake media independent of provider jobs,
  including guided views, presigned/local upload modes, server-side inspection,
  processing and rejection recovery, previews, safe replacement, owner-visible
  retention, explicit object deletion, owner isolation, and responsive browser
  coverage
- Property manager: portfolio service, vendor work, reports, and approvals
- Crew lead: route execution, crew progress, field exceptions, and completion evidence
- Crew member: assigned work, job steps, photos, and completion evidence
- Yard-care company owner: company operations, customers, teams, routes, and recovery
- Yard-care company manager: dispatch, schedules, customers, reports, and daily operations
- Dispatcher: route risk, crew workload, assignments, and schedule changes
- Billing administrator: accounts, bids, approvals, and billing readiness
- Support administrator: tenant access, recovery, diagnostics, and audited support

This catalog connects each major product track to its detailed specification and
roadmap phases. A feature specification describes the desired product; inclusion
here does not mean every capability has been delivered.

| Product track | Primary audiences | Specification | Main roadmap phases |
| --- | --- | --- | --- |
| Field crew operations | Crew leads, crew members, dispatchers, account managers, billing administrators | [`../features/yard-crew.md`](../features/yard-crew.md) | 1, 2, 3, 5 |
| Yard-care company operations | Owners, operations managers, branch managers, dispatchers, fleet, finance | [`../features/yard-care-company.md`](../features/yard-care-company.md) | 3, 5, 6 |
| Homeowner self-service | Homeowners maintaining their own yards | [`../features/self-service.md`](../features/self-service.md) | 7 |
| Multi-vendor property management | Property managers, vendor managers, accounts payable, independent vendors | [`../features/property-managment.md`](../features/property-managment.md) | 4, 8 |

## Capability Areas

### Identity, organizations, and onboarding

- Cognito authentication and role-aware access
- Development-only local reviewer identities with fixed role assignments,
  virtual demo-organization memberships, and per-tab switching
- Organization memberships and invitations
- Tenant-aware resource boundaries
- Customer, property, crew, manager, and organization onboarding
- Owner-managed organization profile identity
- Owner-managed member display names with immutable identity references
- Role administration and audited access changes
- Branch, territory, region, and service-area hierarchy
- Prototype-aligned Team and access command center with live active-member,
  pending-invitation, active-crew, unstaffed-territory, and lead-coverage signals
  plus partial-read isolation and direct administration, staffing-recovery,
  hierarchy, and audit handoffs

### Crew field workflow

- Daily routes and ordered stops
- Job and stop lifecycle tracking
- Offline mutation queues and synchronization
- Checklists, contracted scope, exceptions, and amendments
- Before/after/issue photo evidence
- Add-on work, labor, materials, equipment, and treatment records
- Safety, attendance, readiness, and crew handoff notes

### Manager operations

- Draft route creation, editing, capacity review, and publishing
- Dispatch calendar and cross-crew reassignment
- Completion-report and quality-review queues
- Bid, amendment, notification, and photo-processing recovery
- Operational exception management
- Persisted activity and audit history

### Customer experience

- Authenticated account, property, and portfolio portal
- Connected property-manager portfolio design and production handoff for
  readiness, exceptions, property coverage, completion proof, and approvals,
  with provider-private operating data explicitly excluded
- Validated working design for owner-created private property and pre-service Home
- Validated working design for guided yard intake, optional photographs, and shareable care brief
- Validated working design for existing-provider invitations and curated provider discovery
- Validated working design for assessment, initial proposal, consented activation, and relationship controls
- Production Yard Owner assessment workspace with proposed-window decisions, customer-safe conversation, terminal outcomes, and explicit no-service boundaries
- Production verified-provider assessment workspace with disclosure-scoped reload, lifecycle controls, customer-safe conversation, organization-private notes, and no-service boundaries
- Replay-safe provider replacement windows after owner change requests, returning to explicit owner confirmation without service scheduling
- Designed initial-service proposal contract with immutable versions, neutral owner decisions, accepted-but-unactivated snapshots, and strict separation from existing-customer project bids
- Acquisition proposal schema with immutable published content, constrained scope/terms/price, one open/accepted version per assessment, owner decisions, accepted snapshots, and minimized events
- Acquisition proposal repositories with completed-assessment provider
  authorization, immutable revisions, server-derived expiration, owner-scoped
  history and exact-version decisions, hashed unactivated acceptance snapshots,
  replay/concurrency/isolation coverage, and no operational side effects
- Authenticated acquisition-proposal lifecycle APIs for verified-provider
  publication/revision and owner-scoped list, detail, and exact-version
  decisions with explicit route authorization and fail-closed error mapping
- Production provider proposal authoring/revision with authoritative latest-
  version reload, customer-safe/private-data separation, and immutable history
- Production neutral owner proposal comparison and exact-version accept/decline
  with explicit affirmation, expiration handling, and accepted-but-unactivated
  guidance
- Append-only proposal questions/change requests and provider responses with
  exact proposal-version context, revised-version linkage, owner isolation,
  replay safety, and separation from decisions and lifecycle audit
- Authenticated owner proposal-message list/create and verified-provider
  response APIs with authoritative disclosure reload, explicit route policy,
  and fail-closed error mapping
- Responsive owner proposal question/change-request and provider exact-message
  response interfaces with version labels, current-revision linkage, retry
  recovery, and explicit no-decision/no-activation meaning
- Planned explicit accepted-proposal activation
- Scheduled-work and service-history timelines
- Immutable completion reports with a narrowed customer-safe service, checklist,
  photo, and completed approved-recommendation projection
- Bid review and bid history
- Notification preferences and communication history
- Support and service-issue requests
- Deferred visit-bound appreciation, private service feedback, and compliant
  external provider-review destinations

### Revenue and administration

- Service catalog and recurring contracts
- Estimates, bids, change orders, deposits, and invoices
- Payment and account status
- Billing readiness and job costing
- Fleet, equipment, inventory, and material usage
- Organization settings and data-retention controls

### Platform operations

- Hosted development, staging, and production environments
- Database migrations, smoke tests, and rollback procedures
- Notification and image-processing workers
- Logs, metrics, traces, alerts, backups, and restore drills
- Rate limits, usage governance, feature flags, and abuse monitoring
- Calendar, maps, accounting, CSV, webhook, and public API integrations

### Future product modes

- Adaptive homeowner yard-care planning and guided work sessions
- Vendor onboarding, compliance, coverage, and work distribution
- Evidence validation and vendor quality scorecards
- Three-way vendor invoice matching
- Multi-region property-management portfolio dashboards
