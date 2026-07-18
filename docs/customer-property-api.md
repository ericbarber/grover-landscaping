# Customer Property API

Customer properties are persisted independently from service jobs, portfolio
grouping, crew assignments, and onboarding profiles. A property belongs to one
customer account inside one service organization.

## Endpoints

### `GET /customer-accounts/{account_id}/properties`

Lists properties for the account within the caller's active manager-capable
organization memberships. Cross-organization properties are omitted.

### `GET /customer-accounts/{account_id}/onboarding-progress`

Summarizes account-wide onboarding with customer-detail readiness, non-archived
property count, service-ready property count, active property count, and a
combined completion flag. Account completion requires approved service details,
at least one current property, and every current property to be active.

### `POST /customer-accounts/{account_id}/properties`

Creates an onboarding property for an existing active organization/account
relationship.

Request fields:

- `organization_id`
- `display_name`
- `service_address`

The caller must be an organization owner, manager, support administrator, or
property manager in the requested organization. The account relationship must be
active. Creation does not assign a crew, create a portfolio membership, schedule
work, or send a notification.

### `PUT /customer-accounts/{account_id}/properties/{property_id}`

Archives or reactivates a property inside the caller's active manager-capable
organization memberships. The request accepts `onboarding`, `active`, or
`archived`; `onboarding` is reserved for reactivating an archived property.

Archiving atomically ends the property's active crew assignment and records a
`property_archived` audit event. Reactivation moves the property back to
`onboarding`; it does not restore the previous crew, so the manager must
explicitly assign one again. Reactivation records a `property_reactivated` audit
event.

Moving an onboarding or blocked property to `active` requires both an active
operational onboarding profile and an active crew assignment. A failed readiness
check returns `409 customer_property_not_ready`. Successful first activation
records a `property_activated` audit event.

### `GET /customer-accounts/{account_id}/properties/{property_id}/activation-readiness`

Returns tenant-scoped `profile_ready`, `crew_ready`, and combined `ready`
booleans without exposing onboarding contact details or crew-assignment history.
This allows property managers to review activation prerequisites even when their
role cannot manage crews.

### `PUT /customer-accounts/{account_id}/properties/{property_id}/identity`

Updates the display name and service address within the caller's active
manager-capable organization memberships. The operation records a
`property_identity_updated` audit event.

The database rejects case-insensitive duplicates of the combined property name
and service address within one customer account and service organization.
Different named service areas may intentionally share one street address.

Portfolio reads consume these explicit records rather than inferring property
ownership from service jobs. Matching service jobs may contribute the most recent
service date.

## Property Status

New properties begin in `onboarding`. Supported persisted states are
`onboarding`, `active`, `blocked`, and `archived`.
