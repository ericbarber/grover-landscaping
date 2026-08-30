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

## Recovery-history availability

The next outcome audit found that the photo-processing recovery list and the
privacy-erasure object-deletion list returned `Ok([])` when the repository had
no PostgreSQL pool. Their retry, resolution, claiming, and finalization paths
already reported unavailable persistence explicitly, but a manager could still
mistake an unavailable recovery queue for a valid empty queue.

Both repository reads now return `ResourceReadResult`:

- `Loaded([])` means PostgreSQL was reached and no tenant-scoped rows matched;
- `Loaded(items)` means the tenant-scoped recovery history was read; and
- `Unavailable` means no pool exists or the query failed.

The two HTTP list routes map unavailable history to `503` with their existing
stable error codes. Focused handler tests prove the no-persistence boundary, the
repository outage test covers both list methods, and the existing PostgreSQL
fixture continues to cover loaded processing/deletion history, retry,
resolution, tenant isolation, and cleanup. Formatting, strict all-target/all-
feature Clippy, and all 414 backend tests pass.

The matching notification audit is now complete. `list_history` returns an
explicit `NotificationHistoryListResult`: `Loaded(items)` represents a valid
tenant-scoped result (including an empty access scope or query result), while a
missing pool or failed query produces `Unavailable`. The HTTP route maps
unavailable history to `503 notification_history_unavailable`. Retry and
manual-resolution flows also keep a failed authoritative post-commit reload as
unavailable rather than converting it to not found.

The manager workspace now carries that availability state through the API
boundary and displays an explicit persisted-history warning instead of its
empty-history message. Focused repository, handler, and component cases cover
the no-persistence behavior; strict Clippy, all 414 backend tests, all 483
frontend tests, and the production frontend build pass.

## Marketing-operations availability

The SupportAdmin marketing-lead inbox had the same false-empty no-pool
fallback, while its workflow update translated unavailable persistence into a
missing lead. The repository now returns explicit list outcomes: `Loaded`
represents a completed inbox query and `Unavailable` represents a missing pool
or failed query. The existing `marketing_leads_unavailable` `503` is therefore
used for both absent and failed persistence rather than returning `200 []`.

Workflow updates likewise distinguish `Updated`, `NotFound`, and `Unavailable`.
The history query is private and accepts the pool already used for the committed
workflow update, removing its independent no-pool empty fallback. In the
SupportAdmin UI, an inbox load error suppresses both zero lead totals and the
“No leads match” state.

Focused handler cases prove list and update outages return their stable `503`
codes, and a component unit case proves unavailable and empty presentation stay
distinct. Formatting, strict all-target/all-feature Clippy, all 416 backend
tests, all 484 frontend tests, and the production frontend build pass.

## Dispatch-hierarchy availability

Organization branch and service-territory repository reads already returned
`PersistedReadResult::Unavailable` for a failed PostgreSQL query, but returned
`Loaded([])` when no pool existed. Both reads now reserve `Loaded([])` for a
valid empty organization scope or completed empty query and return `Unavailable`
when persistence is absent.

The list handlers map those outcomes to the existing
`organization_branches_unavailable` and `service_territories_unavailable` `503`
responses. The manager hierarchy loader already recognizes both codes, clears
the incomplete combined hierarchy, and presents its explicit unavailable
notice. Focused no-pool repository and route cases now cover both resources;
formatting, strict all-target/all-feature Clippy, and all 416 backend tests pass.

## Archived-account lifecycle availability

Archived customer-account reads formerly returned `Loaded([])` without a
database pool. Account archive substituted a demo conflict or not-found result,
while reactivation and relationship changes substituted not found. These paths
now all preserve persistence failure explicitly: archived reads return
`CustomerAccountListResult::Unavailable`, and the three lifecycle mutations
return `CustomerAccountArchiveError::Persistence`. Existing handlers map those
outcomes to their stable `503` errors.

The archive handler had also been unreachable through normal authorization
because the customer-account policy omitted `DELETE`. Portfolio managers can
now invoke the delivered archive route, while crew members remain denied. The
manager onboarding panel already marks an unavailable archived collection and
suppresses its valid-empty message.

Focused repository and handler cases cover the no-pool outcomes, and the auth
unit case covers permitted and denied archive access. Formatting, strict all-
target/all-feature Clippy, and all 417 backend tests pass.

## Organization-collection availability

Three persisted organization collections still returned loaded-empty without a
database pool: team administration activity, cross-workflow operational
activity, and organization invitation history. Each repository read now returns
`OrganizationCollectionResult::Unavailable` when the pool is absent, matching
its existing failed-query behavior. A completed empty query remains `Loaded([])`.

Their handlers expose the existing `team_activity_unavailable`,
`operational_activity_unavailable`, and `organization_invitations_unavailable`
`503` responses. The manager team-activity, activity-review, and invitation
interfaces already recognize these failures and suppress valid-empty claims.
Focused default-repository and route cases cover all three boundaries;
formatting, strict all-target/all-feature Clippy, and all 417 backend tests pass.

## Invitation recovery and login-audit availability

Organization invitation revoke and reissue operations previously returned
`Conflict` when no database pool existed, which their handlers translated into
not-found recovery responses. Both mutations now return
`OrganizationMutationResult::Unavailable` and reach their existing stable `503`
errors. A completed persisted mutation can still return conflict when the target
is genuinely missing or no longer eligible.

Principal access summaries write one login audit row for each active
membership. The no-pool path formerly returned a successful zero-row write,
allowing membership-backed access to appear fully loaded without its required
audit. It now reports unavailable when memberships require audit rows; a valid
zero-membership summary still requires no audit and may complete. Explicit
local invitation creation continues to disclose `persisted: false` and is not
treated as silent persisted success.

Focused repository and handler cases cover revoke, reissue, and membership-
backed access-summary outages. Formatting, strict all-target/all-feature Clippy,
and all 417 backend tests pass.

## Membership-administration mutation availability

Membership role, profile, and status mutations previously substituted local
seed data when no database pool existed. A role or status change for the seeded
owner could therefore report a last-owner conflict without consulting durable
state, while a profile update could return an updated membership even though
nothing was saved.

All three repository mutations now return their existing `Unavailable` variants
when PostgreSQL is absent. Their handlers expose the stable
`membership_role_update_unavailable`, `membership_profile_update_unavailable`,
and `membership_status_update_unavailable` `503` responses. Request validation
still runs before storage access, and persisted mutations retain their genuine
not-found, lifecycle, and last-active-owner outcomes.

Focused default-repository and route cases cover all three boundaries.
Formatting, strict all-target/all-feature Clippy, and all 417 backend tests pass.
