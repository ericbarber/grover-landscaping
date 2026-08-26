# Customer Service Mobilization API

These provider routes turn one exact, owner-confirmed first visit into one
scheduled service job and publish explicit customer-safe service-day status.
They implement decision D-059 without treating customer approval, job state,
route state, or crew activity as implicit publication authority.

Every route requires an authenticated `OrganizationOwner` or `Manager`. The
repository additionally rechecks that the actor has an active organization-
scoped `organization_owner` or `manager` membership in the release's current
active organization, account, property, and owner-provider relationship.
Missing, ended, foreign, and unauthorized records are indistinguishable `404`
responses.

## Load release status

```http
GET /provider-relationships/{activation_id}/service-release
```

`200` returns the immutable release identity, linked job identity and status,
current customer status/event version, effective service window and time zone,
and the latest explicit customer event when one exists. The initial customer
status is `confirmed` at version `0`; later versions come only from published
events. The effective window is the confirmed first-visit window until an
explicit `rescheduled` event replaces it.

The response omits organization, customer-account, and customer-property IDs,
even though persistence retains them for authority and provenance checks.

- `404`: no release exists in the actor's exact current scope
- `503`: status cannot be confirmed; existing work and publication are unchanged

## Release initial service

```http
POST /provider-relationships/{activation_id}/service-release
Content-Type: application/json

{
  "expected_first_visit_version": 1,
  "idempotency_key": "service-release-8a30bf84"
}
```

The write succeeds only for the current owner-confirmed first-visit version and
the accepted initial-service proposal on an active relationship. It atomically
creates one scheduled service job with the default evidence checklist and one
immutable release. It creates no day plan, route, crew assignment, recurring
schedule, payment, invoice, proof publication, or customer-status event.

- `201`: release and scheduled job created
- `200`: exact actor/key replay returned the original release
- `400`: malformed version or retry key
- `404`: relationship or provider authority is unavailable in this scope
- `409`: stale/not-ready state, a second release, or changed retry-key reuse
- `503`: result is unknown; retain the same key and reload before retrying

## Publish customer status

```http
POST /provider-service-releases/{release_id}/customer-status
Content-Type: application/json

{
  "expected_event_version": 0,
  "status": "en_route",
  "customer_safe_reason": null,
  "next_update_message": "Your provider is on the way.",
  "window_start_epoch_seconds": null,
  "window_end_epoch_seconds": null,
  "time_zone": null,
  "idempotency_key": "service-status-8a30bf84"
}
```

Allowed statuses are `en_route`, `care_in_progress`, `weather_delay`,
`rescheduled`, and `complete_proof_pending`. Transitions are allowlisted from
the authoritative current event version. `care_in_progress` additionally
requires the linked job to be `in_progress`; `complete_proof_pending` requires
it to be `completed`. Raw job, route, stop, GPS, or crew state never publishes
an event automatically.

`weather_delay` requires a bounded customer-safe reason. `rescheduled` requires
a future window no longer than four hours and a valid PostgreSQL time zone; it
updates only the linked job's scheduled date in the same transaction. Other
statuses omit reason and window fields. Every request requires a bounded
customer-safe next-update message.

- `201`: immutable next event created
- `200`: exact actor/key replay returned the original event
- `400`: malformed or non-allowlisted request
- `404`: release or provider authority is unavailable in this scope
- `409`: stale version, disallowed transition, unmet job gate, or changed key
- `503`: result is unknown; retain the key and reload release status

## Recovery and privacy boundary

Clients generate one retry key per user intent and keep it until an
authoritative reload resolves an unknown write. They never invent organization,
customer-account, customer-property, job, or release provenance. Provider
responses expose only the operational identifiers needed for release/status
recovery; the later customer projection must omit job and release identifiers
as well as provider-private, crew, route, billing, and unpublished proof data.
