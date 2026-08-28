# Pilot Readiness Persistence Audit

## Scope

This audit starts Phase 1 pilot-readiness hardening with repository-owned failure
semantics. It reviews persisted customer reads plus notification, report, job,
route, photo, organization, and account repositories for database errors or
zero-row writes that could be reported as valid empty, missing, or successful
outcomes.

## First selected slice

Notification delivery finalization was the highest-risk locally executable gap.
The dispatcher previously issued a provider request and then treated the SQL
completion of `mark_sent` or `mark_failed` as success without checking whether
the row was still in its claimed `sending` state. A missing or stale claim could
therefore lose a provider receipt or failure result while the worker cycle
appeared successful.

The delivered contract now distinguishes:

- `Applied`: exactly one current `sending` claim stored the provider outcome;
- `NotClaimed`: the notification is missing or no longer has a current sending
  claim, so the provider outcome is logged as stale and never described as
  persisted; and
- `Unavailable`: storage is absent or the database write failed, so the worker
  stops the cycle before contacting additional recipients.

The PostgreSQL fixture also clears its notification rows before and after the
run so queued recovery history from an earlier run cannot be claimed as current
test work.

## Audit disposition

Existing job lifecycle, checklist, completion-report, photo upload,
day-plan, amendment, bid, membership, principal-access, property onboarding,
portfolio, and dispatch hierarchy paths already expose explicit unavailable or
conflict outcomes at their current repository boundaries. Parsing helpers and
intentional no-database demo seeds are not persistence-success claims and remain
unchanged.

The next audit slices should continue with remaining authenticated customer
reads, then any repository mutation that still ignores affected-row counts.
Production Cognito identities, a live notification provider, hosted callbacks,
and human-device assurance remain external gates and are not simulated here.

## Validation

- Rust formatting check passes.
- All 209 backend library tests pass, including middleware coverage that rejects
  the three legacy reads for Property Owners and retains Manager access.
- Ten notification-focused binary/handler tests pass.
- The live PostgreSQL notification dispatcher fixture passes.
- All ten live PostgreSQL photo-persistence tests pass, including stale privacy-
  deletion reclaim, exhausted-claim dead lettering, and duplicate-finalization
  checks.
- The exact CI lint command, `cargo clippy --all-targets --all-features -- -D
  warnings`, passes.
- The exact backend test command, `cargo test --all`, passes all 502 library,
  binary, integration, and documentation tests.

## Authenticated customer-read containment

The next audit found three legacy operational reads still accepted the
`PropertyOwner` role even though their repositories scope caller-supplied account
or property IDs only to an active service organization:

- `GET /accounts/{account_id}/customer-property-portfolio`;
- `GET /properties/{property_id}/completion-reports`; and
- `GET /properties/{property_id}/onboarding`.

The Yard Owner application no longer consumes these routes. Current visits,
proof, questions, and recommendations use hybrid grant/account/property checks
and exact customer visit references, while acquisition uses the owner-scoped
property contract. The three legacy routes are therefore contained to provider
owners/managers, property managers, and support administrators until a minimized
customer projection with equivalent hybrid authorization is explicitly needed.

## Photo-worker finalization and abandoned privacy cleanup

The affected-row follow-up found that photo repositories already returned
`Loaded(false)` when a completion or failure write no longer matched a current
`processing` claim, but the worker treated every loaded Boolean as success and
reported the original claim count as processed. Worker cycle results now expose
claimed, finalized, and stale counts separately, warn for each stale/missing
claim, and return unavailable when any finalization cannot reach persistence.

The same audit found thumbnail processing could reclaim a claim abandoned for
ten minutes, while `photo_erasure_deletion_jobs` could remain in `processing`
forever after a worker or database interruption. Privacy-deletion claiming now
reclaims those stale leases below the attempt limit and moves exhausted stale
leases to `dead_letter`. The PostgreSQL fixture creates both cases, confirms the
recovered claim is finalized exactly once, and removes its durable rows.

## Backend quality-gate restoration

The Pilot Readiness audit initially carried 26 strict library diagnostics plus
six binary-target and integration-test diagnostics. Mechanical findings were
fixed directly: verified-email filtering is explicit, conditional projections
use ordinary branches, redundant whitespace normalization and returns were
removed, and the assertion no longer clones a media ID.

Large by-value repository result enums and SQL boundary functions intentionally
retain their established call contracts for this phase. Narrow item-level lint
exceptions document those shapes without weakening the repository-wide gate or
hiding future diagnostics. Library-only photo-storage helpers are similarly
marked on the duplicated binary module surface. The exact formatting, all-
target/all-feature Clippy, and full backend test commands now pass.

## Backend compilation convergence

The full CI-equivalent test run also showed the binary was redeclaring feature
modules already compiled and tested by the library. The first convergence slice
routes marketing events, marketing leads, notifications, project bids, and stop
progress through the library crate. Binary unit-test duplication falls from 233
to 215 tests, removing 18 repeated executions. The remaining six coupled module
declarations are tracked in `docs/backend-build-performance.md` for dependency-
ordered convergence rather than a broad type rewrite in this slice.

Account validation and persistence now follow the same boundary as the next
self-contained slice. The binary target falls again from 215 to 210 tests, for
23 cumulatively removed duplicate executions, while the strict lint gate and
all 479 backend tests remain green. Five coupled core/report/photo declarations
remain.

Day-plan validation and persistence now also come from the library boundary.
The binary target falls from 210 to 185 tests, making 48 cumulatively removed
duplicate executions. Strict Clippy and all 454 backend tests pass; four coupled
job/report/photo module declarations remain.

The final coupled convergence moves completion reports, the core job
repository, photo processing, photo storage, and their shared job/photo types to
the library boundary together. The binary has no remaining source-module
redeclarations and runs only 145 route/handler tests. All 88 duplicate module-
test executions from the 233-test baseline are removed; strict Clippy and all
414 backend tests pass.
