# Workspace Rollout Capability Contract

## Status

The read contract is delivered through `GET /me/access`. It is intentionally
default off and does not yet enable a production cohort, change navigation, or
grant API authority. Cohort persistence, audited enable/suspend operations, and
capability-shaped React composition are later slices.

## Response

`workspace_rollout` is a versioned, server-derived addition to the existing
principal access summary:

```json
{
  "contract_version": 1,
  "rollout_mode": "default_off",
  "personas": [
    {
      "persona_id": "crew-member",
      "scope": {
        "scope_type": "crew",
        "scope_id": "opaque-crew-id",
        "organization_id": "opaque-organization-id"
      },
      "enabled_unit": null,
      "capabilities": {
        "assigned_work": false,
        "job_execution": false,
        "field_evidence": false,
        "personal_recovery": false
      }
    }
  ]
}
```

The projection is derived from active persisted memberships plus the existing
bounded SupportAdmin and first-owner claim behavior. Duplicate role/scope
assignments collapse to one entry. Product-data capabilities are all false in
this foundation.

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
- No cohort, operator approval, or live rollout may be inferred from
  `rollout_mode: "default_off"`.

## Current role-model gap

The React workspace catalog includes `dispatcher` and `billing-admin` persona
keys, but the authoritative Rust `AccessRole`, API `AccessRole`, and membership
editor do not currently include Dispatcher or BillingAdmin roles. The server
therefore cannot emit those two projections yet. Their rollout designs remain
valid future contracts, but production enablement requires a separate role,
authorization, migration, and least-privilege decision. The capability
foundation does not synthesize either role from Manager.

## Next implementation slices

1. Persist account/membership/scope capability cohorts with every product unit
   default off and immutable enable/suspend audit events.
2. Add owner/support operator reads and guarded mutations for exact cohort
   subjects; do not accept client-selected authority scope.
3. Shape React destinations and contextual controls from the projection while
   retaining deep-link and API denial.
4. Add protected success and cross-resource denial smoke per enabled unit.
5. Resolve Dispatcher and BillingAdmin as explicit roles or remove the
   unsupported persona keys before either can enter a cohort.
