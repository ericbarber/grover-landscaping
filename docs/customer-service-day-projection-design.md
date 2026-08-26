# Customer Service-Day Projection Source

Status: Decision D-059, constrained persistence, provider APIs, minimized hybrid
customer projection, and Yard Owner lifecycle presentation delivered on
2026-08-26.

## Outcome of the source audit

The delivered customer portal can safely show an exactly confirmed first visit,
but the repository does not yet contain an authoritative relationship from that
visit to operational service execution:

- first-visit confirmation intentionally creates no service job, day plan, route
  stop, work order, crew assignment, payment, or recurring schedule;
- `service_jobs` records provider organization and customer account, but not the
  exact customer property, activation, or confirmed first-visit version;
- `day_plan_stops` links jobs to internal route execution, but route position,
  crew identity, and internal progress are not customer publication authority;
- completion reports identify a property only after later report work and cannot
  establish the earlier service-day lifecycle; and
- matching by account, address, display name, service date, or arrival-window
  proximity would be ambiguous and would bypass the hybrid authorization model.

Therefore the portal must remain at `confirmed` until a separate provider-
authorized mobilization and work-release contract creates an exact relationship.

## Accepted decision

Service mobilization creates a dedicated immutable release record that links:

- the current active owner/provider relationship and activation;
- the exact confirmed first-visit proposal and version;
- the provider organization, customer account, and customer property;
- the accepted service proposal snapshot;
- the resulting provider service job or work order; and
- the provider actor, explicit release authority, idempotency key, and release
  timestamp.

This dedicated release preserves the distinction between owner confirmation and
provider work authority, gives later customer
reads exact property provenance, and avoids turning mutable job or route fields
into implicit authorization records.

Adding only nullable property/visit columns to `service_jobs` is simpler, but it
does not by itself record who released the work, which accepted/confirmed
version was consumed, whether a retry is the same release, or why the customer
may see the lifecycle. Inferring a link from existing account, address, date, or
route data is rejected.

## Delivered work-release contract

The first persistence slice fixes these choices:

1. an active organization-scoped `organization_owner` or `manager` membership
   may release initial service or publish a customer status;
2. release atomically creates one scheduled service job and its bounded default
   checklist, but no day plan, route stop, crew assignment, payment, recurring
   schedule, or proof publication;
3. release rechecks the active relationship, organization, account/property
   relation, accepted proposal, exact current confirmed visit and confirmation
   decision, valid time zone, actor membership, and one-release constraint;
4. the actor-scoped idempotency key exactly replays the same release/event and
   conflicts when reused with changed content; a second release is invalid;
5. the initial confirmed window remains immutably referenced. A reschedule is a
   new immutable customer event that atomically updates only the job service date;
6. customer events recheck the current relationship and property on every write,
   allow only the recorded state graph, and require `in_progress`/`completed`
   operational job state before the matching customer publication; and
7. release and event rows retain internal provenance for later server-side joins,
   while the customer API remains responsible for excluding those identifiers.

## Customer-safe lifecycle after release

The first implementation should project only explicitly published states:

| Customer state | Required authoritative fact | Never derive from |
| --- | --- | --- |
| `confirmed` | Exact owner-confirmed first-visit version | A draft job or route plan |
| `en_route` | Provider-published customer update for the released visit | GPS, route order, or crew app presence |
| `care_in_progress` | Provider-published arrival/start update | Crew identity or raw stop status alone |
| `weather_delay` | Customer-safe reason, next update, and current window/version | Internal exception or risk notes |
| `rescheduled` | Immutable old/new customer-visible window versions | Mutating a job date without a customer event |
| `complete_proof_pending` | Released visit completed while proof is not delivered | Unpublished report content or job completion alone |

Customer status publication may reference operational facts, but it must be a
separate allowlisted customer event with bounded copy and tenant/property
provenance. Route order, live location, crew identity, internal schedule risk,
provider notes, and unpublished evidence remain excluded.

## Delivery sequence after acceptance

1. Persist the immutable mobilization/work-release relation and constrained
   customer-status events. **Delivered.**
2. Prove exact replay, cross-property isolation, relationship revocation, and
   no-release-on-failure with PostgreSQL coverage. **Implemented; live execution
   still requires a local PostgreSQL connection.**
3. Extend the existing hybrid-resolver visit projection without accepting
   organization, account, property, job, route, or release IDs from the browser.
   **Delivered.** The join uses the exact immutable release and events, carries
   the latest explicit customer status/reason/update, retains the latest
   explicit reschedule window, and serializes no release, event, or job IDs.
4. Adopt the complete service-day presentation and recovery in Yard Owner Home
   and Visits. **Delivered.** The interface uses one four-step progress rail,
   explicit weather/reschedule branches, original/replacement window context,
   bounded next-update copy, and a proof-pending privacy explanation.

The delivered projection remains authoritative and intentionally bounded: raw
operational state cannot advance customer status, and delivered proof stays
false until its own exact authorization relation exists.

## Validation note

Rust formatting and library tests, the compiled mobilization persistence
fixture, all frontend unit tests, TypeScript checking, and the production build
pass for this delivery. The existing phone/desktop Yard Owner Playwright journey
was invoked but could not start Chromium in the current host because
`libnspr4.so` is unavailable; no browser assertion executed. The live migration-
backed branch also still requires `DATABASE_URL`.
