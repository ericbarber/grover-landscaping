# Owner–Provider First-Visit Contract

## Purpose

The first-visit lifecycle is the explicit bridge from an activated owner–provider
relationship to an owner-confirmed arrival window. The provider proposes a
bounded window; the owner either confirms that exact version or requests a
change. Relationship activation, proposal acceptance, and first-visit
confirmation remain three separate decisions.

A confirmed window is a customer-facing appointment commitment. It does not
create or release an operational service job, day plan, route stop, work order,
invoice, payment, recurring schedule, or crew assignment. Provider operations
must perform those later steps through their existing governed workflows.

## Entry authority

### Provider proposal

The provider actor must present the original invitation token and a verified
email identity. The server must confirm, in one transaction, that:

- the invitation is the `activated` invitation for the relationship;
- its recipient check is verified for the actor and email fingerprint;
- its accepted organization claim still identifies the active provider
  organization;
- the actor still has an active membership in that organization;
- the activation and current relationship are active and identify the same
  owner, property, invitation, organization, account, and service property; and
- no current first-visit version has already been confirmed or cancelled.

Assessment-only response capability and disclosure grants are not reused. They
end at activation and do not confer post-activation service authority.

### Owner decision

Only the authenticated owner subject for the private acquisition property can
confirm or request a change. The server derives the activation, provider,
customer-account, and service-property scope. The owner submits only the exact
window version, a decision, customer-safe note when needed, affirmation version
for confirmation, and an actor-scoped idempotency key.

## Window proposal

Each immutable provider proposal version contains:

- the active relationship activation identifier;
- a monotonically increasing version;
- a future `window_start` and `window_end` with a maximum four-hour span;
- an IANA time-zone name used to render the local date and time;
- an optional customer-safe arrival/preparation note;
- provider actor, verified-recipient, invitation, organization, owner property,
  customer account, and service property provenance; and
- creation time and actor-scoped idempotency key.

The provider may create version 1 while no current proposal exists. A new
version is allowed only after the owner requests a change to the current
version. Prior versions and their decisions stay immutable.

## Owner decisions

The owner may perform exactly one decision on the current proposal version:

- `confirm`: requires the displayed first-visit affirmation version and records
  the exact window as confirmed; or
- `request_change`: requires a customer-safe note explaining what needs to
  change and returns the lifecycle to the provider for a new version.

Confirming an older version, deciding twice, or changing an idempotent replay
conflicts. A change request does not cancel the active relationship or alter the
accepted service proposal.

## State and history

The current projection uses these states:

- `awaiting_provider`: active relationship with no window yet;
- `proposed`: current immutable window awaits the owner;
- `change_requested`: the owner declined that window without declining care;
- `confirmed`: the owner affirmed the exact current window; and
- `cancelled`: reserved for a later explicit relationship or appointment
  cancellation contract, not an implicit result of change requests.

Every proposal version, owner decision, and minimized event is append-only.
Customer-safe reads may expose the provider organization name, window, time
zone, arrival note, current status, owner decision note, and version history.
They must not expose crew identity, route position, labor assumptions, margin,
internal hazards, equipment, or provider-private notes.

## Replay, conflict, and recovery

- Exact same-actor retries return the original proposal or decision.
- Reusing an idempotency key with different window, version, note, decision, or
  affirmation content conflicts.
- Provider proposals lock the activation and current series before selecting
  the next version; concurrent creates yield one version and one conflict or
  exact replay.
- Owner decisions lock the current version and require an exact expected
  version; concurrent decisions yield one decision and an authoritative
  conflict.
- Different owner, property, invitation, organization, recipient, or inactive
  relationship fails closed without revealing which authority check failed.
- An unavailable response does not prove that a write failed. Clients retain
  the idempotency key and reload the authoritative lifecycle before retrying.

## Operational boundary

Confirmation may be consumed later as an input to provider mobilization. It is
not itself a work release. In particular, the first-visit transaction must not:

- insert or update a service job, day plan, route stop, work order, crew,
  assignment, invoice, payment, billing period, or recurring schedule;
- activate the projected operational property; or
- copy provider-private preparation or staffing data into owner-visible state.

The Yard Owner portal may show the confirmed appointment and relationship
context. Service-day progress and proof appear only after the separate
operational workflows create and execute authorized work.

## Delivery slices

1. **4C4a — Contract:** authority, versioning, decisions, replay, privacy, and
   operational side-effect boundaries.
2. **4C4b — Persistence (delivered):** constrained immutable versions,
   decisions, minimized events, repository transitions, isolation, concurrency,
   outage distinction, and no-operational-side-effect proof.
3. **4C4c — Authenticated API:** provider propose/status and owner
   status/decision routes with explicit invalid, missing, stale, conflict, and
   unavailable recovery.
4. **4C4d — Production interfaces:** responsive provider proposal and owner
   confirmation/change-request controls, authoritative reload, and the connected
   transition toward the Yard Owner portal.

## Acceptance criteria

- Activation creates no first-visit proposal or confirmation.
- A provider proposal requires the still-authorized actor behind the activated
  invitation and active relationship.
- An owner decision is property-scoped, exact-version, explicit, and
  idempotent.
- A change request permits a new immutable provider version without changing
  the accepted scope or relationship.
- Confirmed owner-visible data excludes provider-private operations.
- No first-visit write creates a job, route, work order, schedule, payment, or
  crew assignment.
- Cross-owner, cross-property, cross-provider, stale-version, changed-replay,
  concurrent, and unavailable cases remain distinct and fail closed.
