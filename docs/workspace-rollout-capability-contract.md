# Workspace Rollout Capability Contract

## Status

The read contract and cohort persistence foundation are delivered through
`GET /me/access` and migration 123. Accounts remain default off unless an exact
active enrollment exists. No public/operator mutation endpoint exists yet, so
this does not constitute a live production cohort, change navigation, or grant
API authority. Guarded enrollment operations and capability-shaped React
composition are later slices.

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
- No enablement write endpoint exists in this slice.
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

## Current role-model gap

The React workspace catalog includes `dispatcher` and `billing-admin` persona
keys, but the authoritative Rust `AccessRole`, API `AccessRole`, and membership
editor do not currently include Dispatcher or BillingAdmin roles. The server
therefore cannot emit those two projections yet. Their rollout designs remain
valid future contracts, but production enablement requires a separate role,
authorization, migration, and least-privilege decision. The capability
foundation does not synthesize either role from Manager.

## Next implementation slices

1. Add owner/support operator reads and guarded mutations for exact cohort
   subjects; do not accept client-selected authority scope.
2. Shape React destinations and contextual controls from the projection while
   retaining deep-link and API denial.
3. Add protected success and cross-resource denial smoke per enabled unit.
4. Resolve Dispatcher and BillingAdmin as explicit roles or remove the
   unsupported persona keys before either can enter a cohort.
