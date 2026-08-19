# Owner–Provider Invitation API

## Scope

This contract covers the delivered production foundation for a Yard Owner to
invite a known yard-care provider. It does not create a provider organization,
customer, service agreement, proposal, crew assignment, schedule, or data-access
grant.

All owner routes derive the owner subject from authentication. Recipient safety
routes require a verified email matching the invited business mailbox. Bearer
tokens are carried in request bodies for recipient mutations and are never
returned by owner APIs or placed in recipient mutation URLs.

## Owner routes

| Method and route | Outcome |
| --- | --- |
| `POST /owner-properties/{property_id}/provider-invitations` | Creates a pending-delivery invitation from the latest ready brief, or safely replays the same idempotency key |
| `GET /owner-properties/{property_id}/provider-invitations` | Lists owner-scoped invitation and latest-delivery state |
| `GET /owner-properties/{property_id}/provider-invitations/{invitation_id}` | Loads one owner-scoped invitation receipt |
| `POST /owner-properties/{property_id}/provider-invitations/{invitation_id}/revoke` | Idempotently closes an active invitation and suppresses a pending delivery attempt |

The server derives the limited invitation snapshot. Request JSON cannot add the
exact address, photographs, owner contact details, or access considerations.

## Verified-recipient safety routes

### Limited invitation preview

`POST /provider-invitations/preview` is a public body-token operation. The
browser should retain the token in a URL fragment or other approved transient
location and send it in JSON rather than placing it in an API path.

```json
{
  "token": "recipient token from the invitation"
}
```

Only a delivered or previously opened invitation returns its limited snapshot:
provider name, owner name, coarse area, care goals, cadence, and a masked
recipient hint. Exact address, photos, owner contact details, and access
considerations remain explicitly listed as private. Preview records one
application-open event and never establishes recipient email control, an
organization relationship, or opportunity-response capability.

Pending delivery returns no preview. Failed, expired, declined, opted-out, and
revoked tokens return status-only with HTTP `410 Gone`; closed links cannot
reopen the limited request.

### Verify the invitation recipient

`POST /provider-invitations/verify-recipient` is authenticated and accepts the
token in the request body. The authenticated account must have a verified email
matching the invited business mailbox, and the limited invitation must already
be open.

The first matching account creates the invitation’s recipient check. Repeating
the request from that account is idempotent. A different account cannot replace
the binding even if it presents the token; the result is an identity conflict
for Provider Operations review. The response sets only
`recipient_email_checked` to true. Organization relationship and opportunity-
response capability remain false.

### Opt out

`POST /provider-invitations/opt-out`

```json
{
  "token": "recipient token from the invitation"
}
```

The verified mailbox must match the invitation recipient. Success closes the
invitation, suppresses future invitations to that address, closes a pending
delivery attempt, and records a minimized audit event.

### Block and report

`POST /provider-invitations/report`

```json
{
  "token": "recipient token from the invitation",
  "category": "impersonation",
  "customer_safe_description": "The sender claimed to represent a company I do not recognize.",
  "block_future_invitations": true,
  "idempotency_key": "client-generated-request-key"
}
```

Allowed categories are `spam`, `harassment`, `impersonation`,
`suspicious_contact`, `unsafe_contact`, and `wrong_recipient`. Reporting always
requires explicit block confirmation. Harassment, impersonation, and unsafe
contact enter the proposed S1 queue; other categories enter S2.

One report is accepted per authenticated reporter and invitation. The
customer-safe description is limited to 500 characters and is stored only in
the restricted case record—not in general acquisition audit data. Evidence is
represented by a separate restricted reference and is not accepted by this
public endpoint.

## Delivery and token boundaries

- Tokens use high-entropy random material and only SHA-256 hashes are persisted.
- Retry rotates the token and creates a new idempotent delivery attempt.
- Delivered, failed, expired, opted-out, and revoked outcomes remain distinct.
- Stale delivery outcomes cannot reopen or overwrite a newer attempt.
- Expiry and revocation close pending delivery atomically.
- `pending_delivery` does not mean a message was delivered.

The repository includes internal delivered/failed mapping, retry, and expiry
operations. An authenticated messaging adapter/callback is not yet selected or
exposed; production must not claim delivery until that integration records it.

## Checked-recipient organization assessment

After recipient binding, both organization routes require an authenticated
account whose verified email matches the invitation, the active opened
body-token invitation, and its persisted recipient check.

- `POST /provider-invitations/organization-options` accepts `{ "token": "…" }`
  and returns only the actor's own active memberships in active
  `yard_care_company` organizations. It is not a provider directory.
- `POST /provider-invitations/organization-claims` accepts the token, an
  actor-scoped idempotency key, and either `existing_relationship` with an
  eligible organization identifier or `new_organization` with a display name
  and authority affirmation.
- Existing relationships are rechecked server-side and return
  `relationship_checked`. Unique new names return `bootstrap_ready`; a
  normalized possible match returns `duplicate_review` assigned to Provider
  Operations without a candidate identifier.
- Every outcome keeps `opportunity_response_capability` false. Final atomic
  organization bootstrap and response authorization are separate operations.
- `POST /provider-invitation-organization-claims/{claim_id}/bootstrap` accepts
  the body token, expected claim version, and a separate idempotency key. It
  locks the normalized provider name and repeats duplicate detection before any
  organization write. A clear result atomically creates the active
  `yard_care_company`, active `organization_owner` membership, claim provenance,
  and access audit; a late match returns `duplicate_review` without a candidate
  identifier or partial organization.

## Error semantics

- `400` — invalid fields, category, token format, or missing block affirmation;
- `403` — a verified email is required;
- `404` — invitation/token and verified mailbox do not match;
- `409` — active duplicate, suppression, closed-state conflict, or an existing
  safety report;
- `422` — an organization claim/bootstrap payload is incomplete or invalid;
- `503` — persistence was unavailable and the requested mutation is not
  confirmed.

## Provider Operations claim review

- `GET /provider-organization-claim-reviews` is restricted to
  `support_admin`. Its optional `status` filter accepts `duplicate_review`,
  `under_review`, or `disputed`. Results contain only the proposed provider
  name, claim kind/status/reason, assigned function, version, update time, and
  SLA age band.
- `POST /provider-organization-claim-reviews/{claim_id}/decisions` is restricted
  to `support_admin` and accepts a current version, actor-scoped idempotency key,
  controlled action/reason, and opaque restricted evidence reference where
  required.
- Supported transitions are review start, clear for bootstrap, reject, and
  pause for dispute. Clearing does not create an organization; the recipient
  must invoke atomic bootstrap again.
- Evidence references remain in append-only review history. General acquisition
  audit receives claim/action/status only and never evidence, recipient email,
  owner-private facts, or a duplicate candidate identifier.

## Remaining adoption work

1. Select and threat-review an authenticated delivery adapter and callback.
2. Complete Provider Operations duplicate/dispute review; claim assessment and
   fingerprint-locked atomic bootstrap are delivered.
3. Connect the checked recipient to the separately evaluated relationship.
4. Add explicit opportunity-response capabilities before provider responses.
5. Add Trust & Safety queue authorization, assignment, disposition, evidence,
   retention, and monitoring before pilot launch.
