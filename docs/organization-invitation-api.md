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
- Queue an `organization_invitation` email record in `notification_outbox` when PostgreSQL persistence is available.
- Return the invitation token so local fallback and manual pilot workflows can still proceed if delivery is not configured.

### List invitations

`GET /organizations/{organization_id}/invitations`

- The caller must be an organization owner or support admin with an active
  membership in the requested organization.
- Results are ordered newest first and include pending, accepted, revoked, and
  expired invitations.
- Invitation tokens and actor identifiers are omitted from list responses.
- Local fallback returns an empty history because local invitations are not
  persisted between requests.

### Accept invitation

`POST /organization-invitations/{token}/accept`

Expected behavior:

- The caller must be authenticated, but does not need an existing application role.
- The invitation must be pending and not expired.
- The linked membership is changed from `invited` to `active`.
- The linked membership user id is changed to the signed-in principal subject.
- The invitation is marked `accepted`.
- An `invite_accepted` audit event is recorded.
- Invitation notifications include an acceptance path in the form
  `/organization-invitations/{token}`.

### Revoke invitation

`DELETE /organizations/{organization_id}/invitations/{invitation_id}`

- The caller must be an organization owner or support admin with active access
  to the requested organization.
- Only pending invitations can be revoked.
- Revocation atomically marks the invitation `revoked`, archives its still-invited
  membership, and records an `invitation_revoked` audit event.
- Accepted, expired, previously revoked, missing, and cross-organization
  invitations are not changed.

### Update membership role

`PUT /organizations/{organization_id}/memberships/{membership_id}/role`

Required fields:

- `role`

Expected behavior:

- The caller must be an organization owner or support admin.
- The caller must have an active membership in the requested organization.
- The membership role is changed inside the requested organization.
- A `role_changed` audit event is recorded.
- The last active organization owner cannot be changed to another role.

### List organization memberships

`GET /organizations/{organization_id}/memberships`

- The caller must be an organization owner or support admin with active access
  to the requested organization.
- The response includes active and suspended memberships, with organization,
  role, status, and scope details.
- Invited memberships stay represented by invitation history until accepted.

### Suspend or reactivate membership

`PUT /organizations/{organization_id}/memberships/{membership_id}/status`

Required field:

- `status`: `active` or `suspended`

Only active and suspended memberships can use this operation. Suspending the
last active organization owner is rejected. Successful transitions record
`membership_suspended` or `membership_reactivated`; repeating the current status
is idempotent and does not add another audit event.

### List team administration activity

`GET /organizations/{organization_id}/team-activity`

The owner-only response returns the 25 most recent invitation acceptance,
invitation revocation, role change, suspension, and reactivation audit events
for the requested organization. Results include the actor, target, event kind,
and timestamp and never cross the active tenant boundary.

## Guardrails

- Invite acceptance must not grant access outside the invited organization and scope.
- Role updates must not create new memberships.
- Invitations queue email delivery work, but the configured notification dispatcher/provider is still responsible for sending it.
- Cognito groups remain coarse application roles. PostgreSQL memberships are the tenant boundary.

## Manager browser workflow

The mobile manager tools expose an organization-scoped invitation form for
organization owners and support administrators. It submits an email destination,
supported role, and organization scope to the create endpoint. Persisted
invitations report that delivery was queued; local fallback invitations expose
their manual pilot token so local acceptance can be tested without a configured
email provider. The browser does not treat invitation creation as accepted access.
Owners can also refresh a token-free invitation history and see pending access
separately from accepted memberships. Pending rows use a two-step mobile
confirmation before revocation. Active membership role changes also use a
two-step confirmation, and both the browser and repository guard the final
active organization owner. Suspension and reactivation use the same confirmation
and last-owner safeguards. Recent access activity refreshes after browser role,
revocation, and membership lifecycle actions.

Authenticated recipients can open the invitation path, sign in, review the
activation effect, and accept explicitly. The authentication redirect preserves
the local invitation path and rejects external return destinations. Successful
acceptance shows the activated organization, role, and scope before entering the
workspace. Local fallback creation links directly to the same acceptance page.
