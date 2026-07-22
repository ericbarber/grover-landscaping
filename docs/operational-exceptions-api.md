# Operational Exceptions API

Phase 3 manager operations use `operational_exceptions` as the persisted boundary
for work that needs coordinated attention outside the normal route lifecycle.

## Contract

`POST /operational-exceptions` creates an open exception. Required fields are
`organization_id`, `category`, `priority`, and `title`. Optional fields include a
bounded description, assigned user identity, and an affected resource type/ID
pair. Resource context must provide both fields or neither.

Supported categories are `delay`, `staffing`, `access`, `weather`, `equipment`,
`safety`, and `customer_escalation`. Priorities are `low`, `medium`, `high`, and
`critical`. The persisted lifecycle contract reserves `open`, `in_progress`, and
`resolved`; creation always begins at `open`.

`GET /operational-exceptions` supports optional `organization_id`, `category`,
`priority`, and `status` filters plus a limit from 1 through 100. Results are
newest-first and always constrained to organizations where the principal has an
active schedule-managing membership.

`PUT /operational-exceptions/{id}` applies one lifecycle action and requires the
latest `expected_updated_at` value. `assign` requires `assigned_user_id`; `start`
moves an open item to `in_progress`; `resolve` requires a non-empty
`resolution_note`; and `reopen` returns a resolved item to `open` while clearing
its prior resolution fields.

Lifecycle requests outside the caller's tenant scope return `404`. Invalid or
stale transitions return `409`, and unavailable persistence returns `503`.
Updates and actor-attributed audit events commit in one transaction.

Creation writes the exception and an actor-attributed
`operational_exception_created` audit event in one transaction. The audit
metadata records category, priority, and affected-resource context. Missing
persistence returns explicit unavailable responses; the API never substitutes
seeded exceptions.

The consolidated manager review interface is a follow-on slice built on this
contract.
