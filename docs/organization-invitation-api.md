# Organization Invitation API Contract

This document defines the implemented API contract for invite-based onboarding and role administration.

## Purpose

Organization invitations let an organization owner or support admin invite managers, crew users, and customer-facing users without editing seed data. Invitations create pending organization memberships. Accepting an invitation activates that membership for the signed-in user. Role changes are audited.

## Storage

`organization_invitations` stores invite metadata and links each invitation to a pending `organization_memberships` row.

Implemented invitation fields:

- `id`
- `organization_id`
- `invitee_email`
- `role`
- `status`
- `scope_type`
- `scope_id`
- `token`
- `membership_id`
- `invited_by_user_id`
- `accepted_by_user_id`
- `expires_at`
- `accepted_at`

Invitation statuses are `pending`, `accepted`, `revoked`, and `expired`.

## Endpoints

### Create invitation

`POST /organizations/{organization_id}/invitations`

Required fields:

- `invitee_email`
- `role`

Optional fields:

- `scope_type`
- `scope_id`
- `expires_at`

Validation rules:

- The caller must be an organization owner or support admin.
- The caller must have an active membership in the requested organization.
- `invitee_email` must be an email-shaped destination and cannot exceed 320 characters.
- `role` must be one of the supported membership roles: `organization_owner`, `manager`, `crew_lead`, `crew_member`, `property_owner`, `property_manager`, or `support_admin`.
- `scope_type`, when present, must be one of `organization`, `region`, `branch`, `crew`, `portfolio`, or `property`.

Expected behavior:

- Create a pending `organization_memberships` row using the invitee email as the placeholder user id.
- Create a pending invitation token linked to that membership.
- Return the invitation token for delivery by a future email/SMS onboarding flow.

### Accept invitation

`POST /organization-invitations/{token}/accept`

Expected behavior:

- The caller must be authenticated, but does not need an existing application role.
- The invitation must be pending and not expired.
- The linked membership is changed from `invited` to `active`.
- The linked membership user id is changed to the signed-in principal subject.
- The invitation is marked `accepted`.
- An `invite_accepted` audit event is recorded.

### Update membership role

`PUT /organizations/{organization_id}/memberships/{membership_id}/role`

Required fields:

- `role`

Expected behavior:

- The caller must be an organization owner or support admin.
- The caller must have an active membership in the requested organization.
- The membership role is changed inside the requested organization.
- A `role_changed` audit event is recorded.

## Guardrails

- Invite acceptance must not grant access outside the invited organization and scope.
- Role updates must not create new memberships.
- Invitations do not send email or SMS yet; they only create auditable onboarding records and return a token.
- Cognito groups remain coarse application roles. PostgreSQL memberships are the tenant boundary.
