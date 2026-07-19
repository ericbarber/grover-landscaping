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

## Owner Profile Administration

`GET /organizations/{organization_id}` returns the active organization profile.
`PUT /organizations/{organization_id}` updates its trimmed `display_name`,
supported `organization_type`, optional contact email and phone, and optional
HTTP(S) website URL. It also stores an operating timezone, optional default
service-area label, and a default daily stop capacity from 1–100.

- Both endpoints require an active organization-owner or support-admin
  membership in the path organization.
- Updates reuse bootstrap validation, update `updated_at`, and record an
  `organization_profile_updated` access-audit event atomically.
- Contact email is normalized to lowercase, phone input permits readable
  punctuation with 7–15 digits, and website URLs require an HTTP(S) origin.
- Timezone choices use supported US IANA identifiers, while capacity is a
  planning default. New draft day plans snapshot these settings, so later
  profile changes do not override an existing draft or published plan.
- The mobile first-owner workspace loads the profile and keeps editing behind an
  explicit owner control.
- Seed-local development returns and updates a non-persisted demo profile.
