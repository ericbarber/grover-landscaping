# Workspace Rollout Capability Contract

## Status

The read contract, cohort persistence, and guarded organization-operator API
are delivered through `GET /me/access`, migrations 123–124, and the endpoints
below. Accounts remain default off unless an exact active enrollment exists.
No production cohort is enabled by these migrations, navigation is not yet
shaped, and rollout state never grants API authority. Capability-shaped React
composition is the next slice.

## Response

`workspace_rollout` is a versioned, server-derived addition to the existing
principal access summary:

```json
{
  "contract_version": 1,
  "rollout_mode": "cohort",
  "personas": [
    {
      "persona_id": "crew-member",
      "scope": {
        "scope_type": "crew",
        "scope_id": "opaque-crew-id",
        "organization_id": "opaque-organization-id"
      },
      "enabled_unit": "cm2",
      "capabilities": {
        "assigned_work": true,
        "job_execution": true,
        "field_evidence": false,
        "personal_recovery": false
      }
    }
  ]
}
```

The projection is derived from active persisted memberships plus the existing
bounded SupportAdmin and first-owner claim behavior. Duplicate role/scope
assignments collapse to one entry. Without an exact active enrollment,
product-data capabilities are all false. An enrollment must match the current
user, persona, organization, scope type, and scope ID; a mismatched or stale
scope cannot enable a projection. Units are cumulative, so CM2 enables only
CM1–CM2.

An authenticated identity with no active mapped role receives only the
`general` persona, G1 `access_resolution`, and no product-resource scope. That
single non-data recovery capability is true so the UI can explain how to accept
an invitation, contact an administrator, or sign out safely.

## Security boundary

- The request supplies no role, persona, organization, account, property, crew,
  unit, cohort, or capability selector.
- Scope identifiers come from current server-side membership records.
- A projection shapes future interface composition only. Every protected API
  repeats its existing role and exact-resource authorization.
- A false or missing capability must fail closed in future client composition.
- Enrollment reads and writes require an active OrganizationOwner or
  organization-scoped SupportAdmin membership in the exact target
  organization; a claim without that membership is insufficient.
- `rollout_mode: "cohort"` reports an exact persisted match; it does not weaken
  resource authorization or prove that protected hosted validation passed.

## Persistence and rollback

`workspace_rollout_enrollments` stores one versioned unit for an exact
user/persona/scope tuple. Database constraints accept only defined persona/unit
pairs. Updates require the next exact version, cannot change enrollment identity
or scope, and cannot downgrade a cumulative unit. Rollback uses suspension.

Every insert, advance, suspend, and resume creates a
`workspace_rollout_events` record. Event updates and deletes are rejected, and
enrollment deletion is restricted by its history. Suspension removes the row
from effective reads, returning that projection to default off without deleting
accepted application records.

## Guarded operator API

`GET /organizations/{organization_id}/workspace-rollout-enrollments` lists the
organization's retained enrollments, including stale records whose originating
membership has since changed. `membership_id` is null for such a stale record,
so it remains auditable but cannot be mutated through a different identity or
scope.

`PUT /organizations/{organization_id}/memberships/{membership_id}/workspace-rollout`
accepts one lifecycle action:

```json
{
  "action": "advance",
  "enabled_unit": "cm2",
  "expected_version": 1,
  "mutation_id": "operator-generated-stable-retry-key",
  "reason": "Field pilot passed CM1 exit checks"
}
```

The client never supplies subject user, persona, organization, or resource
scope. The server locks and re-reads the exact membership and derives those
values. `enable` requires a valid first or later unit and no expected version;
`advance` requires a strictly higher unit and the current version; `suspend`
and `resume` omit `enabled_unit` and require the current version. A unit cannot
be downgraded. The same actor may retry an identical `mutation_id` and receive
`idempotent_replay: true`; changed payload reuse, stale versions, and invalid
lifecycle transitions return conflict without changing state. Mutation IDs are
serialized per actor and recorded on the immutable event.

## Current role-model gap

The React workspace catalog includes `dispatcher` and `billing-admin` persona
keys, but the authoritative Rust `AccessRole`, API `AccessRole`, and membership
editor do not currently include Dispatcher or BillingAdmin roles. The server
therefore cannot emit those two projections yet. Their rollout designs remain
valid future contracts, but production enablement requires a separate role,
authorization, migration, and least-privilege decision. The capability
foundation does not synthesize either role from Manager.

## Next implementation slices

1. Shape React destinations and contextual controls from the projection while
   retaining deep-link and API denial.
2. Add protected success and cross-resource denial smoke per enabled unit.
3. Resolve Dispatcher and BillingAdmin as explicit roles or remove the
   unsupported persona keys before either can enter a cohort.
