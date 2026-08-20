# Yard Owner Acquisition Pilot Monitoring Contract

## Boundary

This contract defines the repository-owned metric, alert, runbook, and
synthetic-rehearsal mechanics for the known-provider pilot. The machine-readable
source is
[`yard-owner-acquisition-pilot-assurance.json`](yard-owner-acquisition-pilot-assurance.json).

Passing validation proves that the minimized signals, alert responses, and seven
required scenarios form a complete internal contract. It does not prove that a
hosting vendor exports the signals, a live dashboard or pager is connected, an
operator is staffed, or any external/human review is signed.

## Minimized signal rules

- Metrics use only controlled outcome, operation, state, age-band, boundary,
  action, workflow, component, channel, and reason-class labels.
- Identifiers, addresses, photographs, media identifiers, access notes,
  messages, contact values, tokens, and restricted evidence references are
  forbidden as metric labels.
- The proposed aggregate retention is 30 days and remains subject to signed
  Privacy/Security approval and the selected monitoring platform.
- `unavailable` is a first-class result. It must never be converted to zero,
  empty, allowed, delivered, granted, revoked, or completed.
- Any allowed provider read after revocation is an S0 signal; expected denied
  reads remain a separate aggregate outcome.

## Alert response contract

Every alert declares a severity, accountable function, runbook section,
fail-closed containment, customer-safe update, recovery check, and rollback or
escalation path. Function names are routing placeholders, not proof of named
primary/backup staffing.

Live thresholds must be calibrated against the approved pilot cohort. The
manifest intentionally uses invariant conditions for critical single events and
descriptive baseline conditions where a real traffic baseline does not yet
exist; it does not invent production volumes.

## Synthetic rehearsal

Run:

```bash
node scripts/validate-yard-owner-pilot-assurance.mjs --rehearse
node --test scripts/validate-yard-owner-pilot-assurance.test.mjs
```

The rehearsal injects only controlled metric names and label values into the
contract validator. It confirms routing to the expected alert and validates the
linked containment, safe update, recovery, and rollback/escalation instructions
for bounce, expiry, wrong recipient, impersonation, unintended disclosure,
failed revocation, and system outage.

It sends no invitation, notification, page, customer message, or external
incident. Live delivery, monitoring, alert routing, and staffed-response
evidence remains external and launch-blocking.

## Evidence interpretation

The manifest separates passed automated repository evidence from
`external_pending` and `unsigned` blockers. Validators reject any external gate
that is marked passed. A real reviewer may replace a blocker only through the
signed evidence process defined by the human-validation protocol and operations
runbook; this repository rehearsal cannot do so.
