# Yard Owner Acquisition Pilot Hardening Plan

## Outcome

Phase 3E turns the delivered known-provider connection and provider-specific
disclosure flow into a bounded, reviewable pilot candidate. It closes safe
automated reliability, authorization, browser, monitoring, and rehearsal gaps
without treating automation as human, device, privacy/security, or operational
approval.

Phase 3E does not select a delivery vendor, authorize launch, accept a proposal,
create service, assign a crew, schedule a visit, or widen any disclosure grant.

## Evidence classes

Every result must be recorded as one of:

1. **Automated repository evidence:** repeatable tests, builds, static checks,
   browser automation, synthetic monitoring, or runbook validation committed in
   this repository.
2. **External technical evidence:** results from selected delivery, identity,
   hosting, alerting, or device infrastructure that the repository cannot
   truthfully produce alone.
3. **Signed human evidence:** usability, assistive-technology, physical-device,
   privacy/security, Support, Trust & Safety, Engineering on-call, and Product
   Operations decisions with a reviewer, date, evidence link, and disposition.

Only the first class can be completed autonomously in this repository. Prepared
templates and simulations do not change external or signed evidence to passed.

## Delivery slices

| Slice | Status | Outcome |
| --- | --- | --- |
| 3E0 | Delivered | Restart index, hardening order, evidence taxonomy, launch blockers, and verification contract |
| 3E1 | Delivered | Retry-safe owner disclosure approval/revocation keys plus explicit stale-tab and uncertain-outcome recovery |
| 3E2 | Delivered | Concurrent/stale disclosure authorization, replay/isolation/outage/audit, and post-revocation PostgreSQL regression gates |
| 3E3 | Delivered | Production React Chromium/Firefox/WebKit, responsive, refresh, focus, reduced-motion, and forced-colors automation plus CI enforcement |
| 3E4 | Next | Minimized pilot telemetry contract, alert/runbook validation, synthetic launch rehearsal, rollback evidence, and operator-ready evidence manifests |
| 3E5 | External | Delivery integration decision and threat review; human usability, assistive-technology, physical-device, privacy/security, staffing, operational, and go/no-go signatures |

### 3E1 — retry and stale-tab recovery

Delivered on 2026-08-19. Approval and revocation now retain one mutation key for
the life of the reviewed decision, preserve the decision after an uncertain
response, and reload current receipt/connection projections after conflict.
Browser coverage proves successful lost-response approval replay and stale
revocation reconciliation without a false success claim.

- Reuse one idempotency key for every retry of the same reviewed disclosure
  decision or revocation decision.
- Generate a new key only when the owner opens a new authoritative review or
  begins a different revocation decision.
- Preserve the reviewed choices after an uncertain response; never claim access
  was granted or ended until an authoritative response confirms it.
- On conflict, reload the receipt and connection projections before allowing a
  new decision.
- Cover lost-response replay and stale-version recovery in client and browser
  tests.

### 3E2 — server hardening gates

Delivered on 2026-08-19. Disclosure grant creation now recovers an exact
concurrent idempotent replay from the authoritative receipt, rejects changed or
stale decisions without partial writes, and uses valid non-reserved PostgreSQL
aliases across grant reads and revocation. The PostgreSQL lifecycle fixture is
repeatable despite intentionally retained consent and safety records, and the
claim-review actor constraint now admits the checked-recipient appeal actor
defined by the appeal contract.

Automated evidence includes the focused PostgreSQL owner/provider lifecycle,
the complete backend test suite, Rust formatting, and a from-zero replay of all
migrations. Strict repository-wide Clippy remains pending because 19 existing
warnings outside this slice are promoted to errors; no warning points to the
Phase 3E2 changes.

- Prove concurrent grant attempts leave one active grant and one immutable
  receipt for the winning decision.
- Prove exact grant and revocation replays return the original result while
  changed reuse or stale versions conflict without partial writes.
- Recheck owner, property, invitation, mailbox, actor, organization, membership,
  capability, brief, selected media, suppression, expiry, and grant status at
  each protected boundary.
- Verify every revoked, expired, suspended, or otherwise ineffective disclosure
  returns status-only recovery and no formerly approved value or media label.
- Exercise persistence and authorization outages as unavailable, never empty or
  successful, and keep general audit payloads free of private content.

### 3E3 — browser and accessibility automation

Delivered on 2026-08-19. Playwright now runs the production owner/provider
journeys as mobile and desktop Chromium, desktop Firefox, and mobile WebKit
projects, starts the application consistently, retains traces/screenshots on
failure, and gates the production image in CI. The matrix covers secure bearer-
fragment removal and refresh recovery, selective disclosure and post-revocation
closure, owner review/revocation focus movement, 320/768/1366/1440 reflow,
keyboard focus, reduced motion, and forced colors. Global production styles
provide consistent visible focus, motion reduction, and system-color status
borders without substituting for signed assistive-technology/device evidence.

Automated evidence includes 24 passing owner/provider browser journeys and 8
passing responsive/accessibility profile checks across all four projects, all
397 frontend unit tests, TypeScript, and an isolated production build.

- Run the production owner and provider journeys in supported Chromium, Firefox,
  and WebKit profiles where compatible infrastructure is available.
- Retain responsive coverage for small/large mobile, tablet, laptop, and desktop
  layouts without multiplying identical assertions unnecessarily.
- Automate keyboard order, focus restoration, error/status announcements,
  reduced motion, forced colors, reflow, refresh, history, direct link, and
  expired-session mechanics that browsers can verify.
- Record skipped or unavailable engines as pending evidence, not passes.
- Keep real VoiceOver, TalkBack, NVDA, voice control, and physical-device results
  in the signed human protocol.

### 3E4 — operations and rehearsal

- Define minimized counters and alerts for invitation delivery, suppression,
  claim review, authorization denial, disclosure grant/revoke/reconciliation,
  post-revoke reads, response writes, notification backlog, and privacy work.
- Keep exact addresses, photographs, access notes, message content, contact
  values, and restricted security evidence out of general telemetry.
- Validate that runbook scenarios have an observable trigger, fail-closed
  containment, accountable function placeholder, customer-safe update, recovery
  check, and rollback or escalation path.
- Execute a synthetic rehearsal for bounce, expiry, wrong recipient,
  impersonation, unintended-disclosure report, failed revocation, and system
  outage. Synthetic results prove mechanics only, not staffing readiness.
- Produce a final evidence manifest that lists automated passes, unavailable
  external dependencies, unsigned reviews, and launch blockers separately.

### 3E5 — external gates

Phase 3E remains incomplete and launch-blocked until all applicable records are
signed:

- authenticated delivery adapter/callback selection and threat review;
- moderated owner and provider usability/comprehension sessions;
- VoiceOver, TalkBack, NVDA Chrome/Firefox, keyboard, voice-control, and physical
  mobile/tablet/device evidence;
- privacy/security review of tokens, disclosure, revocation, retention,
  telemetry, support access, and incident containment;
- named primary/backup owners, staffed service levels, alert routing, Trust &
  Safety and support access controls, rollback criteria, and pilot cohort;
- cross-functional go/no-go rehearsal and launch decision.

The execution templates remain in
[`../design/review/yard-owner-acquisition-human-validation-protocol.md`](../design/review/yard-owner-acquisition-human-validation-protocol.md)
and
[`yard-owner-acquisition-pilot-operations-runbook.md`](yard-owner-acquisition-pilot-operations-runbook.md).

## Automated verification contract

Each completed automated slice must run the directly affected focused tests plus
formatting, frontend type checks/unit tests/build, backend formatting/lint/tests,
database migration validation, and compatible browser journeys in proportion to
the change. A narrower command is acceptable during iteration; the slice record
must state exactly which full gates passed, failed, or were unavailable before
commit.

No known-broken change is eligible for a completed-slice commit. No automated
result may be used to check an external signoff box.
