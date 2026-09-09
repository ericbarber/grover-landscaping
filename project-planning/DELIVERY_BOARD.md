# Delivery Board

This is the authoritative execution queue for Grover Landscaping. It answers
three questions: what is active, what can start next, and what evidence closes
each phase. [`../PLAN.md`](../PLAN.md) remains the detailed delivery-status
record; [`ROADMAP.md`](ROADMAP.md) remains the long-range product strategy.

## Delivery objective

Reach a protected, observable pilot without slowing routine development. Keep
one repository-owned phase moving while the separate hosted-release lane waits
for account access or live-service evidence.

## Current position

| Lane | State | Current outcome | Next gate |
| --- | --- | --- | --- |
| Repository | Repository-owned rollout UX complete | All audited continuity slices are adopted | R2 hosted cohort evidence or Dispatcher/Billing role decision |
| Design review | SX4 comparison package ready | Matched, counterbalanced tasks and adoption gates cover five core perspectives plus contextual exceptions | Conduct participant sessions and synthesize evidence |
| Private review | Available | Tailscale review serves the React app and PostgreSQL-backed API in explicit `local_review` mode | Keep it healthy for remote product validation |
| Protected hosting | External prerequisite | Render readiness returns `404`; no protected deployment is available | Owning-account access, deployed Render Blueprint, Cognito state, and test identity/token |
| Product expansion | Decision required | Core workflows plus exact activity-to-Recovery exception handoff are delivered | Decide P2 support ownership, response, retention, privacy, and escalation boundaries |

## Execution queue

### F1 — Planning and handoff reset

State: delivered.

Deliver:

- Make this board the single source for execution order.
- Reduce `CURRENT_HANDOFF.md` to current state, commands, and blockers.
- Mark roadmap narrative as strategy or historical context instead of an active
  queue.
- Adopt the hybrid validation model in the working agreements.

Exit evidence:

- Planning links resolve, current validation counts agree, and no delivered
  item is described as the next implementation slice.

### F2 — Fast feedback orchestration

State: delivered.

Deliver:

- Cancel superseded CI runs for the same branch automatically.
- Provide one documented change-aware local command that selects frontend,
  backend, database, infrastructure, or documentation checks.
- Preserve the complete main/release gate: repository checks, security audit,
  frontend tests/build, Rust formatting/strict Clippy/tests, migrations,
  Terraform validation, all browser journeys, and the production image.
- Record comparable timing markers and optimize only the slowest measured
  bottleneck.

Exit evidence:

- A focused edit receives a useful local result without running unrelated
  suites, superseded hosted work is canceled, and `main` still passes the full
  gate.

Delivery evidence:

- `scripts/validate-changes.sh` classifies working-tree, branch-diff, explicit
  path, and explicit scope inputs while preserving full affected-package gates.
- `scripts/validate-changes.test.sh` verifies representative scope mappings.
- Branch-scoped GitHub Actions concurrency cancels superseded runs without
  changing the surviving run's job matrix.
- Existing CI timing markers remain the comparison source for measured
  bottleneck work.

### R1 — Release preflight contract

State: delivered.

Deliver:

- Add a single non-secret preflight that validates required files, production
  environment names, Terraform formatting/validation, Render blueprint shape,
  production auth guards, and smoke-script inputs.
- Produce explicit `ready`, `external prerequisite`, or `failed` results.
- Keep credentials out of command output and repository files.

Exit evidence:

- The preflight passes all repository-owned checks and names only the missing
  external values needed by the hosted operator.

Delivery evidence:

- `scripts/release-preflight.sh --repository-only` validates required artifacts,
  Render shape, production fail-closed guards, hosted-smoke inputs, Terraform
  formatting, and both Terraform environments without contacting cloud APIs.
- The full preflight reports `READY`, `EXTERNAL PREREQUISITE`, or `FAILED` with
  distinct exit statuses and redacts operator values.
- Contract tests cover repository readiness, external classification, invalid
  supplied input, and secret/PII non-disclosure.

### R2 — Protected environment provisioning

State: waiting on external access.

External prerequisites:

- Render account access to create or reconcile the Blueprint and private
  PostgreSQL database.
- AWS account credentials and the production Terraform backend/state decision.
- Completion of the
  [`AWS account setup`](../docs/aws-account-setup.md) acceptance checklist,
  including temporary operator access, cost/audit controls, and the state
  bucket's non-secret handoff values.
- Final HTTPS application URL and approved first-owner email.
- A controlled second pilot identity and tenant with a persisted job for the
  isolation smoke fixture.

Deliver:

- Apply production Cognito infrastructure.
- Configure Render with Cognito outputs and PostgreSQL.
- Create the first organization-owner identity and retain rollback information.
- Create the controlled second-tenant fixture without granting the primary
  smoke identity membership.

Exit evidence:

- `/health/ready` reports PostgreSQL readiness and `/auth/config` reports
  Cognito mode on the protected HTTPS deployment.

### R3 — Authenticated hosted smoke

State: follows R2.

Repository preparation delivered:

- The runner accepts only an exact HTTPS origin and explicit safe persisted
  pilot IDs, and every request has bounded connection and total timeouts.
- Failure messages identify the violated contract without printing response
  bodies, tokens, signed URLs, object keys, or customer data.
- Photo completion must pass an exact read-after-write persistence check.
- A known persisted job in another tenant must return exactly `403` to the
  primary identity; a missing job or reused primary-tenant ID is not accepted.
- A deterministic fake-transport suite covers success, transport configuration,
  unsafe inputs, tenant fail-open behavior, redaction, and missing persistence
  and runs in repository CI.
- A machine-validated, intentionally incomplete evidence template requires
  deploy, migration, protected-check, exact isolation, and distinct rollback
  references while rejecting credential material; completed evidence remains a
  restricted hosted-run artifact.

Deliver:

- Validate login, first-owner bootstrap, active membership, tenant isolation,
  core authenticated reads, persistence, logout, and unauthenticated rejection.
- Exercise the existing production smoke script with current hosted IDs and an
  expiring access token.
- Record deploy, migration, and rollback evidence without storing credentials.

Exit evidence:

- The hosted smoke script passes, cross-tenant checks fail closed, and a rollback
  target is identified.

### R4 — Pilot operations hardening

State: evidence-driven after R3.

Deliver:

- Configure logs, metrics, alerts, named response ownership, backups, and a
  restore rehearsal.
- Enable S3 photo evidence and notification delivery only with their existing
  security and provider-validation gates.
- Resolve failures observed in the protected environment before adding broad
  product scope.

Exit evidence:

- Operational owners can detect, triage, recover, and roll back a pilot failure
  using recorded evidence.

### P1 — Operational exception activity integration

State: delivered.

Deliver:

- Include exception creation and lifecycle audits in manager activity.
- Map readable actor, state, assignment, and resolution context.
- Link activity records back to the exact Recovery item.
- Cover tenant scoping, unknown-event fallback, and mobile handoff.

Exit evidence:

- A manager can understand who changed an exception and return to the affected
  Recovery workflow from persisted history.

Delivery evidence:

- The tenant-scoped activity query includes all five persisted exception audit
  kinds and returns their readable lifecycle metadata.
- The manager feed exposes a dedicated Recovery source, actor/state/assignment/
  resolution context, unknown-event fallback, and exact-item navigation.
- PostgreSQL isolation tests, 417 backend tests, strict Clippy, 485 frontend
  tests, production build, and the focused mobile handoff pass.

### P2 — Yard Owner concern and preference boundary

State: product decision required before implementation.

Decide support ownership, response expectations, retention, privacy, escalation,
and the boundary between service concerns, safety events, billing disputes, and
general communication. Appreciation and external review links remain backlog
until this boundary and verified provider destinations exist.

### UX1 — All-persona manager continuity

State: delivered.

Deliver:

- Add concise status and urgency to each authorized Manage category.
- Withhold later-unit customer, report, delivery, activity, and recovery reads.
- Mount only the exact selected authorized destination panel.
- Keep older access responses in legacy composition during rolling deployment.

Exit evidence:

- Suspended, unknown, and earlier managed units cannot activate or preload later
  tools; manager schedule, Recovery, and completion-report handoffs remain intact.

### UX2 — Authenticated shell compression

State: delivered.

Deliver:

- Remove repeated hosted identity/persona chrome without losing sign-out.
- Keep local-review identity controls visibly isolated as diagnostic chrome.
- Measure fixed mobile navigation height and reserve exact content clearance.
- Reuse one browser assertion at narrow widths and 200% zoom.

Exit evidence:

- Chromium and WebKit keep the final Home action above fixed navigation at 320,
  390, and 430px and at simulated 200% zoom.

### UX3 — Prototype reconciliation

State: delivered.

Deliver:

- Classify each prototype, high-fidelity set, and wireframe family by its current
  review purpose.
- Distinguish dated production mirrors from adopted behavior and historical
  visual input.
- Preserve explicit product gates and illustrative-data boundaries.

Exit evidence:

- The gallery, design README, adoption tracker, and dated mirror point to one
  artifact-family inventory with no claim that prototype polish proves shipping.

### UX4 — Frontend truth and recovery

State: delivered.

Delivered:

- Classify crew routes against the active local service day as Past, Today’s,
  Upcoming, or date unavailable and show a complete human-readable date.
- Make non-current routes read only in both the interface and mutation handlers.
- Replace transport/source descriptions with the bounded Syncing, Saved on
  device, Synced, Needs attention, and Read only confidence vocabulary.

- Reconcile Yard Owner loading, valid-empty, ended-access, inconsistent, and
  unavailable reads with explicit retry/access review and Home recovery while
  preserving the existing fail-closed authorization contract.

Exit evidence:

- Date classification has timezone-safe domain coverage, a phone route journey
  proves current mutation and historical read-only behavior, and protected Yard
  Owner outcomes never reveal stale or illustrative property facts.

### UX5 — Authenticated typography roles

State: delivered.

Deliver:

- Reserve editorial type for audience promise, place, service identity,
  customer dates, and delivered-care moments.
- Use explicit interface type for task destinations, loading/failure states,
  operational headings, queues, decisions, and monetary values.
- Record the rule in the shared foundation and apply it across the representative
  Yard Owner, Property Manager, field, manager, and proposal surfaces.

Exit evidence:

- Focused component assertions distinguish editorial promises from operational
  task headings; the full frontend suite and production build remain green.

### UX6 — Minimalist persona experience direction

State: delivered as design direction; production adoption not started.

Deliver:

- Separate task-first experience design from functional-unit rollout control.
- Give all ten personas one first answer, one primary action, no more than four
  destinations, a short supporting queue, progressive detail, and explicit
  omitted scope.
- Provide distinct customer, field, operations, administrative, and no-role
  compositions with attention, on-track, and no-current-work scenarios.

Exit evidence:

- All persona, scenario, and destination combinations pass browser validation
  at 1440px, 390px, and 320px with stable URLs, one page heading, keyboard focus
  return, 44px phone targets, no horizontal overflow, and final-content
  clearance above fixed navigation.

Next design gate:

- Conduct human workflow and content review, beginning with Yard Owner and
  Property Manager, before any family-by-family React adoption.

### UX7 — Minimalist customer journey depth

State: delivered as design direction; production adoption not started.

Deliver:

- Replace generic Yard Owner Visits/Proof and Property Manager Properties/
  Proof/Approvals content with destination-specific task hierarchy.
- Connect preparation, visit chronology, delivered evidence, portfolio
  exceptions, and version-bound decisions through explicit next destinations.
- Require illustrative preparation or decision choices before confirmation and
  repeat that no production data changes.

Exit evidence:

- Browser validation covers exact customer destination content, disabled
  confirmation, keyboard focus, connected hashes, recovery scenarios, mobile
  clearance, and customer/provider scope boundaries at all reference viewports.

Following slice: completed by UX8.

### UX8 — Minimalist field journey depth

State: delivered as design direction; production adoption not started.

Deliver:

- Replace generic Crew Lead Jobs/Recovery and Crew Member Route/Saved content
  with exact field-task hierarchy for every scenario.
- Connect Crew Lead route readiness to ordered Jobs and office-reviewed route
  requests without silently mutating the published plan.
- Connect Crew Member assigned work to read-only route context and personal
  device recovery without publish, reassignment, or crew authority.

Exit evidence:

- Browser validation covers readiness-gated start, exact field destination
  content, route-request choices, device-held evidence language, connected
  hashes, phone action clearance, and Crew Lead/Crew Member authority separation.

Following slice: completed by UX9.

### UX9 — Minimalist provider operations depth

State: delivered as design direction; production adoption not started.

Deliver:

- Connect Company Owner business readiness to Team, Operations, and Customers.
- Connect Company Manager service risk to an exact Schedule version, customer
  impact, and Recovery.
- Connect Dispatcher publishability to crew fit and a new-plan response without
  adding field execution authority or an implemented backend role.

Exit evidence:

- Browser validation covers exact operations destination content, required
  choices, connected hashes, focus return, responsive clearance, plan-version
  language, and owner/manager/dispatcher authority separation.

Following slice: completed by UX10.

### UX10 — Minimalist administration and access depth

State: delivered as design direction; production adoption not started.

Deliver:

- Connect Billing Administrator completion readiness to exact Account gaps and
  traceable Handoffs without invoice, payment, tax, or ledger controls.
- Require Support incident ownership and exact tenant/purpose checks before
  minimized Activity and a purpose-bound, expiring Access request.
- Keep the no-role Team Member in one protected-data-free Home destination with
  explicit invitation and account-recovery choices.

Exit evidence:

- Browser validation covers required choices, connected hashes, exact
  administrative content, Billing product gates, Support scope checks, no-role
  protected-data boundaries, and responsive action clearance.

Next design gate:

- Continue through the narrower minimal-product workflow track in UX11.

### UX11 — Workflow research preparation

State: retained as research input; MVP product-stage framing superseded by UX12.

Deliver:

- Maintain a separate workflow source of truth rather than treating all ten
  persona prototypes as minimum-product requirements.
- Defer Dispatcher and Crew Member while Company Manager owns planning and Crew
  Lead owns field delivery.
- Map the primary customer-to-service-to-proof lifecycle, critical handoffs,
  failure states, and alternate/exception paths.
- Replace hypotheses with observed evidence before revising screen paths.

Exit evidence:

- Every MVP step has an actor, entry condition, required information, outcome,
  safe failure path, and evidence label.
- No minimum-product step silently depends on Dispatcher or Crew Member.
- Revised prototypes and React adoption begin only after workflow review.

Following design phase: UX12.

### UX12 — Simplified post-MVP product experience

State: SX0 experience reset plus SX1 core, SX2 owner/portfolio, SX3 contextual
exceptions, and the SX4 comparison package delivered; participant evidence
next.

Deliver:

- Preserve mature capability while replacing feature-silo navigation with one
  role-filtered service-thread model.
- Let queues find work and keep decisions, plan versions, field activity,
  reviewed proof, and recovery inside the affected thread.
- Build the first clean-slate prototype for Yard Owner, Company Manager, and
  Crew Lead without using Dispatcher or Crew Member in the initial slice.
- Retain the workflow-research kit for evidence-led comparison rather than MVP
  scope selection.

Exit evidence:

- One illustrative service can move from customer decision through manager
  release, Crew Lead execution/recovery, reviewed proof, and customer outcome
  without separate approval, schedule, report, proof, and recovery products.
- Responsive validation protects role filtering, stable URLs, focus, overflow,
  required decisions, and action clearance.

Next design phase:

- Conduct the prepared SX4 current-product versus service-thread sessions,
  synthesize anonymous evidence, and revise the information architecture before
  production adoption planning.

## Later, not active

- Curated provider opportunities and availability controls.
- Provider credential verification and appeals.
- Payments, accounting integration, and full revenue operations.
- Homeowner self-service yard assistant.
- Multi-vendor property-management platform.
- Yard Owner appreciation and external review destinations.

These remain in `PLAN.md`, `ROADMAP.md`, and `features/`; they do not compete
with R1 or the protected-release gates for current capacity.

## Hybrid validation model

| Gate | When | Required evidence |
| --- | --- | --- |
| Inner loop | During implementation | Formatting/type analysis plus focused tests for changed behavior |
| Slice gate | Before a feature commit | Full affected-package suite, production build, and any relevant PostgreSQL or migration checks |
| Integration gate | For auth, persistence, queues, privacy, or cross-workflow changes | Live PostgreSQL fixtures and explicit unavailable/conflict/authorization cases |
| Main gate | On publication to `main` | Complete hosted CI, all browser projects, Terraform validation, and production image |
| Release gate | Before/after protected deployment | Preflight, readiness, authenticated smoke, rollback evidence, and required human/service approvals |

A failed hosted check may be rerun once unchanged to classify runner variance.
If the same condition repeats, fix or explicitly quarantine the cause; do not
weaken a product invariant merely to obtain a green run.

## Work-in-progress rules

- Keep at most one implementation slice active per lane.
- A slice should normally fit one reviewable commit and include its tests and
  delivery-status update.
- Do not reopen delivered phases without observed failure evidence.
- Do not begin product-gated work by guessing the missing decision.
- External prerequisites do not stop safe repository work in the other lane.
- Update this board whenever the active phase, next phase, or blocking condition
  changes.
