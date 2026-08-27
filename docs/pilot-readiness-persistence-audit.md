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

Existing job lifecycle, checklist, completion-report, photo upload/worker,
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
- All 207 backend library tests pass, including middleware coverage that rejects
  the three legacy reads for Property Owners and retains Manager access.
- Ten notification-focused binary/handler tests pass.
- The live PostgreSQL notification dispatcher fixture passes.
- Strict library Clippy remains blocked by 26 pre-existing warnings in unrelated
  authentication, day-plan, organization, acquisition, bid, onboarding, and
  mobilization code. This slice introduces no new Clippy diagnostic.

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
