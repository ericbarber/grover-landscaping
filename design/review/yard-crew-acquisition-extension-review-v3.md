# Yard Crew Acquisition Extension Review V3

Date: 2026-08-16
Status: Phases 1–4 complete and validated in the working prototype

## Objective

Complete the next Yard Crew acquisition design slice without weakening the
existing provider/owner boundary. This review extends the V2 journey in four
places that become consequential after a provider finds suitable work:

1. communicate the first confirmed service to the owner;
2. establish who inside a provider company may make each decision;
3. let providers opt into useful opportunity alerts without implying priority;
4. show what can enter a limited pilot and what remains product-gated.

Review the [interactive prototype](../prototypes/yard-crew-acquisition/index.html)
or use **Review journey** to open extension and recovery states directly.

## Phase delivery

| Phase | Delivered outcome | Acceptance evidence | Status |
| --- | --- | --- | --- |
| 1 — First-service communication | A work-order review now produces an owner-message preview before confirmation and a durable-looking delivery receipt afterward | Recipient, channel, window, preparation, weather/delay expectation, reply path, excluded provider-private facts, one-shot failure, preserved retry, and sent receipt are reviewable | Complete |
| 2 — Team authority | Team administration now compares decision authority and separates preparation, owner approval, delivery, acceptance, correction, expiry, and revocation | Roles cover opportunities, disclosure, assessment, price/proposal, release, and field work; no access exists before acceptance; each terminal state has a next action | Complete |
| 3 — Saved opportunity alerts | Empty and suitable opportunity views now support opt-in alert preferences and a visible saved state | Frequency, channel, quiet hours, capacity suppression, pause/resume, failure recovery, and no-rank/no-reservation/no-guarantee wording are reviewable | Complete |
| 4 — Pilot governance | A dedicated review stage distinguishes a known-owner connection pilot from a curated opportunity marketplace | Six release gates, explicit operating owners, prohibited unsupported claims, limited-pilot state, and marketplace-gated scope are visible | Complete |

## Workflow decisions

### Confirm once, communicate once

The provider reviews the responsible crew, work-order window, and owner-visible
message together. Nothing is sent from the preview action. The final action
confirms the work order and sends the exact owner update; a delivery failure
keeps the assignment, window, and message available for retry.

The owner sees the approved service scope, arrival window, preparation request,
delay expectation, and provider contact path. Crew identity, route position,
labor assumptions, margins, internal hazards, and team notes stay provider-only.

### Authority is a capability, not a title

The matrix uses roles as understandable starting points but records meaningful
authority separately. “If granted” permissions must become explicit,
auditable, and revocable production capabilities. Invitation approval is not
delivery, delivery is not acceptance, and invitation revocation is not the same
operation as removing already-active access.

### Alerts are preferences, not marketplace advantage

An alert is derived from the provider's current filters and eligibility. It may
be automatically suppressed by intake pause, zero capacity, or changed service
eligibility. It cannot reserve an opportunity, change rank, widen disclosure,
or guarantee available work.

### Pilot the operating loop before marketplace allocation

The recommended first boundary is a known-owner connection. It exercises
provider identity, disclosure, assessment, proposal, support, work preparation,
and owner communication without asserting regional density, allocation
fairness, ranking, response advantage, lead volume, earnings, or demand health.

## Accessibility and recovery review

- Native dialogs contain saved-alert preferences and return focus to the opener.
- Owner-message and alert failures use visible alert semantics and preserve
  entered choices.
- Invitation status is expressed in text and does not rely on color.
- Role comparison is a keyboard-scrollable table on narrow screens.
- Mobile controls retain 44px targets; layouts pass at 390px, 320px, and 200%
  text without document-level horizontal scrolling.
- Each new stage retains one visible H1, accessible control names, responsive
  reflow, and the persistent prototype boundary.

## Production contract additions

| Design capability | Required production contract |
| --- | --- |
| Owner service update | Versioned owner-visible payload, triggering work-order version, recipient/channel, send result, retry/idempotency, sender, timestamps, and exact receipt |
| Team authority | Capability grants by organization/branch, approval authority, invitation lifecycle, active-access lifecycle, audit history, correction, expiry, and recovery |
| Saved alert | Owner-scoped filter snapshot, frequency/channel/quiet hours, eligibility and capacity suppression reasons, delivery history, pause/resume, and deletion |
| Pilot governance | Named gate owners, approved supported region/service, launch checklist, measurement definitions, incident/support readiness, rollback, and claims review |

## Remaining product gates

The prototype does not approve a curated opportunity launch. Product,
operations, trust/safety, support, security, legal/compliance, and analytics must
still resolve:

- provider eligibility and credential evidence by region and service;
- exact pre-consent opportunity fields and route-impact derivation;
- safety stop, incident, harassment, abuse, blocking, and emergency ownership;
- allocation fairness, response windows, rate limits, provider density, and
  supported launch area;
- support hours, response targets, escalation, appeal, and rollback;
- measurement definitions for supply, demand, delivery, conversion, and harm;
- any ranking, sponsorship, lead-fee, earnings, exclusivity, or marketplace-
  health claim.

## Validation

Run:

```bash
node design/tools/validate-yard-crew-acquisition.mjs --capture
node design/tools/validate-prototype-foundation.mjs
```

The first command covers the connected desktop journey and all four extensions,
including failure/retry and terminal states, then checks tablet, mobile, compact
mobile, 200% text, accessible names, target sizes, overflow, and browser errors.
It also refreshes the V3 gallery references.
