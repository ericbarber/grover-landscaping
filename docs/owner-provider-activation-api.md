# Owner–Provider Relationship Activation API

This API exposes the explicit owner-confirmed transition from an accepted
acquisition proposal into provider customer/property setup. Both operations
require a verified authenticated user. Owner scope always comes from the token
subject and the property path; no provider tenant or operational record ID is
accepted from the browser.

## Read activation status

```http
GET /owner-properties/{property_id}/initial-service-proposals/{proposal_id}/activation
```

Returns the persisted activation only when the token subject owns the private
property and the proposal. The response includes the immutable activation,
proposal, accepted-snapshot, provider organization, projected account/property,
property-scoped membership, portal-access identifiers, provider-setup status,
same-property competing-closure count, and activation time.

- `200`: activation found
- `404`: no activation exists in this owner/property/proposal scope
- `503`: persisted activation status is unavailable

The read does not infer success from a proposal's accepted status.

## Activate an accepted proposal

```http
POST /owner-properties/{property_id}/initial-service-proposals/{proposal_id}/activation
Content-Type: application/json

{
  "expected_proposal_version": 2,
  "activation_affirmation_text_version": "owner_provider_relationship_activation_v1",
  "owner_confirmed": true,
  "idempotency_key": "owner-activation-8a30bf84"
}
```

The server locks the owner property, evaluates exact replay before current-state
validation, verifies the accepted snapshot digest and relational provenance,
and performs the complete projection atomically.

- `201`: activation created
- `200`: exact replay returned the original activation
- `400`: invalid version, affirmation, confirmation, or idempotency input
- `404`: the proposal is not in this owner/property scope
- `409 owner_provider_relationship_activation_not_ready`: the proposal,
  snapshot, provider, invitation, owner workspace, or property is not eligible
- `409 owner_provider_relationship_activation_conflict`: changed key reuse,
  stale version, or an existing/in-progress activation
- `503`: persistence is unavailable; the client must reload status before retry

The client must retain its idempotency key across an unknown response. A `503`
does not assert that no database commit occurred.

## Side-effect boundary

A successful response means provider customer setup exists in `onboarding` and
the owner has an exact account/property portal grant. It does not mean a first
visit is confirmed or that a job, day plan, route stop, work order, invoice,
payment, recurring schedule, or crew assignment exists.
