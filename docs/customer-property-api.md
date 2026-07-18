# Customer Property API

Customer properties are persisted independently from service jobs, portfolio
grouping, crew assignments, and onboarding profiles. A property belongs to one
customer account inside one service organization.

## Endpoints

### `GET /customer-accounts/{account_id}/properties`

Lists properties for the account within the caller's active manager-capable
organization memberships. Cross-organization properties are omitted.

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

Portfolio reads consume these explicit records rather than inferring property
ownership from service jobs. Matching service jobs may contribute the most recent
service date.

## Property Status

New properties begin in `onboarding`. Supported persisted states are
`onboarding`, `active`, `blocked`, and `archived`.
