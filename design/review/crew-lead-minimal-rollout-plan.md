# Crew Lead Minimal Rollout Plan

## Outcome

Onboard Crew Leads through cumulative field capabilities without making the
first cohort depend on every write, evidence, amendment, and recovery workflow
at once. The minimum crew launch is a trustworthy read-only day plan: the
assigned route, ordered stops, customer-safe service scope, access guidance,
and one unambiguous connectivity/confidence state.

The Crew Lead experience is part of the shared
[functional-unit rollout prototype](../prototypes/yard-owner-minimal-rollout/index.html#crew/c1).
It complements the [Yard Owner rollout](yard-owner-minimal-rollout-plan.md) and
does not claim that production capability control or a hosted cohort exists.

## Rollout rules

- A unit is complete and enabled for an exact crew membership or absent. Do not
  expose disabled buttons or empty destination shells.
- The server derives capability from current organization membership, role,
  crew assignment, cohort, and operational rollout state. Browser flags do not
  grant route, job, evidence, or amendment authority.
- C1 is read only. Every later unit that writes must prove retry identity,
  durable offline behavior, replay, stale/conflict recovery, and authoritative
  reload before customer work depends on it.
- Device storage, shared-device sign-out, lost-device response, and retained
  offline data are rollout concerns, not merely UI details.
- Rollback stops new writes first, preserves queued work and accepted receipts,
  and gives the crew an explicit office fallback. It does not discard local
  progress silently.

## Functional units

| Unit | Crew Lead experience | Repository status | Enablement prerequisites | Rollback behavior |
| --- | --- | --- | --- | --- |
| C0 — Field access | No field destination. Verified identity resolves an active organization role, crew membership, and assignment. | Delivered core | Hosted identity; current membership/crew assignment; tenant isolation; supported device and sign-out procedure. | Revoke membership/capability and clear protected device state through the approved recovery path. |
| C1 — Day plan visibility | Home and Route show today’s assigned route, ordered stops, service scope, access guidance, and current sync/unavailable state. No execution controls. | Delivered read foundation; rollout composition design ready | C0; manager publishes and corrects the day plan; stale/current date contract; route-read smoke; office fallback. | Remove field entry for the affected crew; provide the current route through the named office fallback. |
| C2 — Stop execution | Jobs and Job appear; Crew Lead can start, arrive, pause, and complete with durable offline progress. | Delivered | C1; durable storage check; offline replay; actor/tenant binding; stale/conflict recovery; unknown-write reload; manager visibility. | Stop new mutations, preserve/sync queued work, show exact pending state, and switch to the office fallback. |
| C3 — Field proof | Checklist, offline-safe photos, quality feedback, and completion-report handoff become available inside Job. | Delivered | C2; photo size/type/privacy policy; storage lifecycle; rejected evidence recovery; report readiness; provider reviewer ownership. | Stop new capture/submission, preserve permitted queued evidence, and never claim report delivery. |
| C4 — Changes and recovery | Skip/add-service requests, queued amendments, conflicts, and manager-visible recovery complete the field loop. | Delivered | C3; manager owner for submitted requests; immutable published-route boundary; amendment replay/conflict telemetry; escalation procedure. | Stop new requests, retain submitted receipts, and return unresolved work to named office handling. |

## Minimum launch composition

C1 exposes Home and Route because orientation and the ordered field plan are one
read-only capability. The active destination is Route after sign-in. The first
viewport answers:

1. Is this today’s route and is it current?
2. What stop is first?
3. What work and access context is safe for the crew to see?
4. What does the crew do if the route is unavailable or clearly stale?

Jobs, Job, progress buttons, checklist, photos, completion, and route-change
requests are absent until their units are enabled.

## Capability projection

The existing proposed account capability response should generalize into a
server-derived workspace projection. Illustrative Crew Lead fields are:

```json
{
  "crew_day_plan": true,
  "stop_execution": false,
  "field_evidence": false,
  "route_change_requests": false
}
```

The browser supplies none of the organization, crew, route, job, membership, or
role values used to grant these capabilities. API authorization remains exact
even when a destination is hidden.

## Cohort progression and exit evidence

Start with controlled provider staff, then one named crew on supported devices.
Add crew membership independently of adding capability breadth. Advance only
one unit after observing a full workday—including loss and recovery of network
connectivity—for the current unit.

Every unit requires:

- exact deployed source, migration, identity, membership, crew, and route scope;
- authorized success plus other-organization, other-crew, and unassigned-job
  denials;
- current, empty, stale, unavailable, and permission-loss states;
- 320px/390px phone checks, outdoor-readable hierarchy, 44px targets, keyboard
  access where applicable, and bottom-navigation clearance;
- redacted telemetry, named office/support owner, and a rehearsed rollback.

C2–C4 additionally require offline/reconnect, retry replay, conflict,
unknown-outcome, and read-after-write evidence. C3 requires real object-storage
and privacy lifecycle evidence when photos are enabled.

## Recommended implementation sequence

1. Generalize the Yard Owner capability design into a server-derived workspace
   capability projection for customer and field personas.
2. Add audited crew/membership cohort assignments with every field capability
   default off.
3. Shape navigation and contextual controls from the projection without
   weakening API authorization or deep-link denial.
4. Add protected C1 route-read smoke and C2–C4 per-unit write/offline smoke.
5. Publish an enable, observe, suspend, queued-work recovery, and rollback
   runbook for provider operations.

Protected enablement remains blocked on the R2 hosted environment and real
operator/device inputs. Repository implementation and local validation may
proceed separately but are not deployment evidence.
