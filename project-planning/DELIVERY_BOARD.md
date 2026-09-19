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
| Repository | Waiting on input | R3 production-smoke safety and persistence contract is complete | R2 external access or P2 concern/preference product boundary |
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
- Final HTTPS application URL and approved first-owner email.

Deliver:

- Apply production Cognito infrastructure.
- Configure Render with Cognito outputs and PostgreSQL.
- Create the first organization-owner identity and retain rollback information.

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
- A deterministic fake-transport suite covers success, transport configuration,
  unsafe inputs, redaction, and missing persistence and runs in repository CI.

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
