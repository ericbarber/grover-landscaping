# Yard Owner Portal Minimal Rollout Plan

## Outcome

Launch the Yard Owner portal as a sequence of complete, supportable customer
capabilities rather than exposing the entire implemented surface at once. The
minimum customer launch is a read-only care view for one authorized property:
who the provider is, what visit is next, what the owner should expect, and what
happens when there is no visit or the protected read fails.

The [rollout prototype](../prototypes/yard-owner-minimal-rollout/index.html)
shows the customer experience after each unit is enabled. It is a rollout
design, not a claim that production capability flags or a hosted cohort exist.
The same prototype now includes a separately scoped
[Crew Lead rollout](crew-lead-minimal-rollout-plan.md); its field capabilities
do not inherit customer-account authorization or enablement.

## Guiding rules

- A unit is either complete for the enabled account or absent. Do not expose
  disabled navigation, empty placeholder pages, or “coming soon” controls.
- Entitlement is server-owned, account-scoped, default-off, and auditable. A
  client-only feature flag is not an authorization boundary.
- Reads remain fail closed. Disabling a unit never causes fallback to example,
  cached, provider-private, or sibling-property data.
- Write units require a named provider-side owner and recovery path before
  customer enablement.
- Rollback hides entry points and rejects new writes without deleting accepted
  receipts, immutable proof, questions, or decisions.
- Billing, concern handling, preferences, appreciation, and external review
  destinations do not enter the minimum rollout through implication.

## Functional units

| Unit | Customer experience | Repository status | Enablement prerequisites | Rollback behavior |
| --- | --- | --- | --- | --- |
| U0 — Access foundation | No customer-facing destination. Verified identity resolves one exact active account/property grant. | Delivered core | Cognito-hosted identity; hybrid grant resolution; tenant/property isolation; unavailable telemetry; named cohort and support owner. | Revoke the account capability/grant; all protected reads fail closed. |
| U1 — Care visibility | Home, property context, next confirmed visit, preparation, valid-empty, access-ended, inconsistent, and unavailable recovery. | Delivered core; proposed recovery continuity is design ready | U0; authoritative confirmed-visit read; customer-safe copy; provider knows how to create/correct the first visit; protected smoke for a real pilot account. | Remove portal entry for the affected account; retain provider operational records. |
| U2 — Visit tracking | Visits destination plus confirmed, on-the-way, care, weather-delay, rescheduled, and complete/proof-pending states. | Delivered | U1; provider release/status workflow in use; stale/date rules; event monitoring; staff correction path. | Hide Visits and stop new customer-status publication; retain prior customer-visible events. |
| U3 — Delivered proof | Proof destination and exact-visit immutable delivered report. Missing, pending, corrupt, and unavailable remain distinct. | Delivered | U2; atomic immutable delivery; authorized proof smoke; evidence availability policy; provider review responsibility. | Hide Proof entry and reject new customer proof reads if the boundary is unsafe; never rewrite delivered snapshots. |
| U4 — Questions and recommendations | Contextual questions, provider replies, current recommendation/history, and version-bound owner decisions. No new top-level destination. | Delivered repository behavior; operational gate remains | U3; provider response owner; retention/privacy rules; write/replay/conflict telemetry; recommendation correction and escalation procedure. | Disable new questions/decisions; preserve threads and decision receipts read-only. |
| U5 — Preferences, concerns, appreciation | Customer preferences, service concern recovery, thanks/private feedback, and neutral verified external destinations. | Product-gated/backlog | P2 support, retention, privacy, response, safety, billing-dispute, moderation, and external-destination decisions. | Defined only after the owning contracts exist. |

## Minimum launch composition

U1 is the smallest owner-visible release. It has one primary destination,
**Home**, and one account control. Property choice stays in the content header
when multiple authorized properties exist. The page contains:

1. provider/property context;
2. the next confirmed visit or a truthful valid-empty state;
3. service scope, arrival window, preparation, and next-update ownership;
4. a safe recovery destination in every failure state.

Visits, Proof, and interactive question/recommendation controls are omitted
until their units are enabled. The UI does not advertise them as disabled.

## Capability contract

The proposed client bootstrap needs a minimized capability projection such as:

```json
{
  "customer_portal": true,
  "visit_tracking": false,
  "delivered_proof": false,
  "visit_questions": false,
  "recommendation_decisions": false
}
```

Names are illustrative until the API contract is implemented. The server must
derive them from the current account, organization, property scope, cohort,
and operational rollout state. The browser must not submit an organization,
account, property, or role to grant itself a capability.

U4 may split questions and recommendation decisions operationally, but both
remain contextual additions rather than new navigation destinations.

## Cohort progression

Use the same progression for each participating provider organization:

1. **Internal verification:** provider staff and controlled customer identities
   prove U0/U1 against protected hosted data.
2. **Named owner cohort:** enable U1 for a small, explicitly recorded set of
   customer accounts. Do not use an email-domain or frontend-only heuristic.
3. **Unit observation:** record authorization denials, unavailable reads,
   retries, stale data, provider correction time, and customer support contacts.
4. **Advance one unit:** enable only the next unit after its prerequisites and
   rollback rehearsal pass for the same provider workflow.
5. **Broaden deliberately:** add accounts or providers independently of adding
   capability. Cohort size and feature breadth are separate risk controls.

No numeric success threshold is invented in this design. Named product and
operations owners must approve calibrated thresholds from protected pilot data.

## Unit exit evidence

Every unit requires:

- an exact deployed source/deploy reference and current migrations;
- authorized success plus other-account and other-property denial evidence;
- loading, valid-empty, access-ended, inconsistent, and unavailable behavior;
- phone and desktop keyboard/assistive semantics with no hidden destination;
- production telemetry that omits customer content and secrets;
- a named support owner and tested rollback action;
- no known P0/P1 defect in that unit’s critical customer journey.

Write units additionally require exact replay, stale/conflict, unknown-outcome,
and read-after-write evidence. External notification or object-storage claims
require their real provider evidence; local review is not a substitute.

## Recommended implementation slices

1. Add an account-scoped, server-derived portal capability projection and
   audit trail; default every customer account off.
2. Make navigation and contextual controls derive from capabilities while
   preserving route authorization on the server.
3. Adopt the U1 recovery design and add a direct account-safe Home return.
4. Add protected rollout smoke for each enabled unit and another-account/
   property denial.
5. Build an operator runbook for enable, observe, advance, suspend, and rollback.

These slices should not begin protected enablement until AWS/Render/Cognito R2
exists. Repository implementation and local validation can proceed separately,
but cannot be represented as a live rollout.
