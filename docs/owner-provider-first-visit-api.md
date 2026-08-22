# Owner–Provider First-Visit API

These routes expose the separate first-visit lifecycle after relationship
activation. Every operation requires a verified authenticated user. Owner
routes derive scope from the token subject and private property path. Provider
routes recheck the original invitation token, verified recipient, organization
claim, active membership, and current relationship.

## Owner status

```http
GET /owner-properties/{property_id}/provider-relationships/{activation_id}/first-visit
```

Returns `awaiting_provider`, the current proposed window, the owner's current
change request, or the confirmed window. It returns `404` outside the exact
owner/property/activation scope and `503` when persistence is unavailable.

## Provider status

```http
POST /provider-relationships/{activation_id}/first-visit/status
Content-Type: application/json

{ "token": "owner_provider_..." }
```

The POST body keeps the invitation token out of URLs and server logs. The route
returns `200` for an authorized active relationship, `404` for invalid or
foreign authority, `409` for an ended/not-ready relationship, and `503` when
status cannot be loaded.

The existing verified provider invitation-progress response includes
`activation_id` only after that invitation becomes the activated relationship.
The client uses that server-derived identifier for these routes.

## Propose a window

```http
POST /provider-relationships/{activation_id}/first-visit/proposal
Content-Type: application/json

{
  "token": "owner_provider_...",
  "expected_series_version": 0,
  "window_start_epoch_seconds": 1787583600,
  "window_end_epoch_seconds": 1787590800,
  "time_zone": "America/Phoenix",
  "customer_safe_arrival_note": "Please unlock the side gate and keep pets inside.",
  "idempotency_key": "provider-first-visit-8a30bf84"
}
```

Version 1 requires `expected_series_version: 0`. A later version requires the
current version after an owner change request. The future window must be
positive, ordered, and no longer than four hours.

- `201`: immutable window version created
- `200`: exact actor/key replay returned the authoritative lifecycle
- `400`: malformed token, version, time zone, window, note, or retry key
- `404`: relationship is outside the verified provider scope
- `409`: stale/current-state conflict; an authoritative lifecycle may be the
  response body
- `503`: write result is unknown; retain the retry key and reload status

## Owner decision

```http
POST /owner-properties/{property_id}/provider-relationships/{activation_id}/first-visit/decision
Content-Type: application/json

{
  "expected_window_version": 1,
  "action": "confirm",
  "customer_safe_note": null,
  "confirmation_affirmation_text_version": "owner_provider_first_visit_confirmation_v1",
  "idempotency_key": "owner-first-visit-8a30bf84"
}
```

`confirm` requires the exact affirmation version. `request_change` omits the
affirmation and requires a customer-safe note. Status codes and replay recovery
match the proposal route, with `404` scoped to the authenticated owner and
property.

## Response and side-effect boundary

The customer-safe response includes relationship/provider identifiers,
provider display name, current status/version, current window and time zone,
customer-safe arrival/decision notes, and timestamps. It never includes the
token, recipient email, crew identity, route position, labor assumptions,
margins, equipment, internal hazards, or provider-private notes.

A `confirmed` response does not mean a service job, day plan, route stop, work
order, recurring schedule, invoice, payment, crew, or assignment exists. Those
remain separate provider-operational actions.
