# Owner–Provider Assessment Contract

## Purpose

Phase 4 turns an owner-approved assessment disclosure into an explicit remote
review or proposed on-site assessment. Starting an assessment does not accept a
proposal, authorize pricing, schedule service, assign a crew, create a work
order, or activate a provider relationship.

This contract begins only after the known-provider connection flow has recorded
provider interest and the owner has approved an active, provider-specific
`yard_assessment` disclosure grant.

## Authorization boundary

An assessment start is authorized only when one transaction can recheck all of
the following:

- the bearer token resolves to the delivered invitation;
- the verified mailbox remains bound to the same provider actor;
- the invitation is open and unexpired;
- the recipient is not suppressed;
- the provider response capability is active and unexpired;
- the same capability recorded explicit assessment interest;
- the organization claim remains checked or claimed;
- the yard-care organization and actor membership remain active;
- the owner workspace, property, and disclosed yard-brief version remain
  current;
- the named disclosure grant belongs to the same invitation, owner, property,
  provider organization, and actor, and remains active and unexpired.

Missing identity returns a not-found outcome. Changed or ended authority returns
an invalid-state outcome. Persistence outages remain distinct and fail closed.

## Initial lifecycle

| Method | Initial status | Scheduling meaning |
| --- | --- | --- |
| `remote` | `remote_review` | The provider may review only the currently granted information; no visit exists. |
| `on_site` | `window_proposed` | The provider proposes a bounded window and time zone; the owner has not confirmed it. |

An on-site proposal requires a start, an end after the start, a maximum eight-
hour span, and a controlled time-zone identifier. A remote assessment carries
no visit window.

The persistence model reserves later states for owner confirmation, work in
progress, completion, inability to assess, and cancellation. Those transitions
are not delivered by the foundation slice and must add optimistic concurrency,
actor-specific authority, controlled reasons, and append-only events.

## Replay and concurrency

- The provider supplies an actor-scoped idempotency key.
- Exact retry returns the original assessment.
- Reusing the key with different method, grant, or window data conflicts.
- A second assessment for the same invitation conflicts, even with another key.
- Concurrent exact starts produce one assessment and one authoritative replay.

## Visibility and minimization

The owner may list assessments only for their own property. The returned
foundation record contains provider organization, method, status, proposed
window, time zone, grant reference, and version. It contains no bearer token,
mailbox, owner address, yard brief, photos, or access considerations.

The general owner-acquisition event records only identifiers, method, and
status. The assessment event records whether a window exists but does not copy
the window, time zone, private property data, or recipient identity.

Provider-private notes and customer-safe conversation require separate stores
and read paths. Private notes must never be selected into an owner response or
general acquisition audit. Conversation must preserve authorship and remain
independent of proposal acceptance.

## Delivered foundation

Phase 4A1 delivers:

- constrained `owner_provider_assessments` persistence;
- append-only assessment lifecycle events;
- provider-authorized, replay-safe remote/on-site assessment creation;
- owner/property-isolated assessment history;
- explicit not-found, invalid-state, conflict, and unavailable outcomes;
- PostgreSQL coverage for wrong actor, wrong grant, concurrent replay,
  conflicting reuse, owner isolation, and minimized audit.

Phase 4A2a exposes that foundation through authenticated APIs:

- `POST /provider-assessments` starts a verified provider's authorized remote
  review or proposed on-site window;
- `GET /owner-properties/{property_id}/provider-assessments` lists the verified
  owner's property-scoped assessment history;
- invalid requests, missing identity, changed authority, conflicts, exact
  replay, and persistence outages retain distinct HTTP outcomes.

## Next slices

1. Add optimistic window confirmation/change requests, provider lifecycle
   transitions, and status-only ended-authority recovery.
2. Add customer-safe questions/answers and separately stored provider-private
   notes with serialization isolation tests.
3. Adopt the assessment workspace in the production owner/provider interfaces
   with responsive, accessible, stale-state, and outage coverage.
4. Begin versioned initial-service proposals only after the assessment boundary
   is complete.
