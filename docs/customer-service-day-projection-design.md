# Customer Service-Day Projection Source

Status: Recommended mobilization/work-release model accepted as decision D-059
on 2026-08-26; persistence implementation is next.

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

This dedicated release preserves the distinction
between owner confirmation and provider work authority, gives later customer
reads exact property provenance, and avoids turning mutable job or route fields
into implicit authorization records.

Adding only nullable property/visit columns to `service_jobs` is simpler, but it
does not by itself record who released the work, which accepted/confirmed
version was consumed, whether a retry is the same release, or why the customer
may see the lifecycle. Inferring a link from existing account, address, date, or
route data is rejected.

## Minimum work-release contract

The implementation contract defines:

1. which provider capability may mobilize and release initial service;
2. whether release atomically creates a job or links one provider-created job;
3. exact-version, active-relationship, accepted-scope, tenant, property, and
   duplicate-release checks;
4. replay, conflict, cancellation, relationship-revocation, and partial-failure
   behavior;
5. whether the confirmed arrival window is copied, referenced immutably, or
   replaced through a new customer-visible reschedule version;
6. who may publish each customer-safe transition and its next-update copy; and
7. how later delivered proof links back without exposing internal job, route,
   crew, report, actor, or release identifiers.

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
   customer-status events.
2. Prove exact replay, cross-property isolation, relationship revocation, and
   no-release-on-failure with PostgreSQL coverage.
3. Extend the existing hybrid-resolver visit projection without accepting
   organization, account, property, job, route, or release IDs from the browser.
4. Adopt service-day states and recovery in Yard Owner Home and Visits.

Until these persistence and projection gates pass, the delivered confirmed-
visit response and UI remain authoritative and intentionally bounded.
