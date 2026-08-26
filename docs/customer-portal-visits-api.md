# Customer Portal Visits API

Status: Hybrid authorization, confirmed-visit read, explicit service-day event
projection, and Yard Owner Home/Visits consumption delivered on 2026-08-26.

## Read authorized properties and customer visits

```http
GET /customer-portal/visits
Authorization: Bearer <verified-user-token>
```

The server derives the customer subject from the verified token. It accepts no
organization, account, property, activation, proposal, provider, crew, route,
or grant identifier from the browser.

Every read begins with active portal grants and requires a matching active
organization membership with the same provider organization, role, scope type,
and scope identifier. It then revalidates the active provider/account relation,
the current property relation, and either customer-account inheritance or the
exact property grant. One stale or inconsistent active grant fails the entire
read closed.

## Success response

`200 OK` returns an authorized property collection and zero or more exactly
confirmed first visits. A visit remains `confirmed` until an explicit customer-
safe service-day event exists for its immutable provider work release:

```json
{
  "properties": [
    {
      "organization_id": "org_1001",
      "account_id": "account_1001",
      "property_id": "property_1001",
      "property_display_name": "Home"
    }
  ],
  "visits": [
    {
      "organization_id": "org_1001",
      "account_id": "account_1001",
      "property_id": "property_1001",
      "service_date": "2026-08-29",
      "window_start_epoch_seconds": 1788019200,
      "window_end_epoch_seconds": 1788026400,
      "time_zone": "America/Phoenix",
      "service_title": "Initial yard care",
      "service_scope": ["Mow and edge turf"],
      "status": "weather_delay",
      "preparation_message": "Please unlock the side gate.",
      "customer_safe_reason": "Lightning is nearby.",
      "next_update_message": "We will share another update in 30 minutes.",
      "delivered_proof_available": false
    }
  ]
}
```

A valid grant with no non-archived properties returns empty `properties` and
`visits`. An authorized property with no confirmed first visit appears in
`properties` while `visits` remains empty. Proposed, change-requested,
cancelled, or relationally inconsistent first visits are not projected as
confirmed service.

Allowed projected statuses are `confirmed`, `en_route`, `care_in_progress`,
`weather_delay`, `rescheduled`, and `complete_proof_pending`. Status and next-
update copy come only from the latest explicit immutable customer event.
`customer_safe_reason` appears only when the current event supplies one. The
effective window remains the owner-confirmed first-visit window until an
explicit `rescheduled` event replaces it; later events retain that latest
rescheduled window. A rescheduled response also includes optional
`original_service_date`, `original_window_start_epoch_seconds`,
`original_window_end_epoch_seconds`, and `original_time_zone` fields derived
from the exact confirmed first visit.

## Failure states

- `401 authentication_required`: the request has no valid sign-in session.
- `403 customer_portal_access_required`: no active portal grant matches the
  authenticated subject.
- `409 customer_portal_access_inconsistent`: at least one active grant does not
  match its current organization, account, property, role, membership, or scope.
- `503 customer_portal_visits_unavailable`: authorization or visit persistence
  could not be read. No partial collection is returned.

## Privacy boundary

The response is assembled from immutable customer-safe proposal scope, the
exact confirmed first-visit window, its exact work release, and explicit
customer events. It omits activation/proposal/decision/release/event/job IDs,
owner and provider actor IDs, invitation tokens and recipient data, affirmation
versions, live location, route position, crew assignment, provider notes,
internal risk/recovery state, pricing, billing, and unpublished proof.

`delivered_proof_available` remains `false` until a separately authoritative
visit-to-delivered-report relation exists. The API does not infer publication
from job completion or report presence.

## Yard Owner interface consumption

The authenticated Yard Owner surface calls this endpoint before rendering any
property or visit. Loading, valid-empty, missing-access, inconsistent-access,
and unavailable states remain distinct and offer retry where applicable. A
failed read clears prior portal properties and visits; the interface never
substitutes seeded or illustrative visit data. Proof and recommendations keep
their separately authorized boundaries and are not inferred from this response.

Home and Visits render all six statuses on one customer-facing progress rail.
Weather delay shows only the bounded customer-safe reason and next update;
rescheduled shows the original and replacement windows; complete/proof-pending
states explicitly withhold unpublished evidence until delivery.

States beyond `confirmed` use the explicit persisted
[mobilization/work-release source contract](customer-service-day-projection-design.md).
The endpoint never infers publication from mutable job status, account,
address, date, route, crew, stop progress, GPS, or completion-report proximity.
`complete_proof_pending` still does not make proof visible.
