# First-Owner Organization Bootstrap API

`POST /organizations/bootstrap` creates the first persisted organization and owner
membership for an authenticated Cognito identity.

## Request

```json
{
  "display_name": "Grover Landscaping",
  "organization_type": "yard_care_company"
}
```

Supported organization types are `yard_care_company` and
`property_management_company`. The display name must contain 2–120 characters
after trimming.

## Authorization and Safety

- The access token must contain `OrganizationOwner` or `SupportAdmin`.
- The authenticated Cognito `sub` must not already have an active organization
  membership.
- The Cognito email is never used as the membership identity.
- A PostgreSQL advisory transaction lock prevents concurrent requests for the
  same identity from creating multiple organizations.
- PostgreSQL persistence is required; bootstrap has no browser or seeded fallback.

## Atomic Result

One transaction:

1. Creates an active organization.
2. Creates an active organization-scoped `organization_owner` membership whose
   `user_id` is the authenticated Cognito `sub`.
3. Records an `organization_bootstrapped` access-audit event.

The endpoint returns `201 Created` with the organization and membership. It
returns `409 Conflict` when the identity already belongs to an active organization
and `503 Service Unavailable` when persistence is unavailable.
