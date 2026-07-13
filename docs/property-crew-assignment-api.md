# Property Crew Assignment API Contract

This document defines the implemented backend API contract for assigning service crews to properties.

## Purpose

Crew assignment controls which crew services a property. It does not transfer customer ownership, property ownership, account ownership, or portfolio membership.

## Existing backend foundation

- `property_crew_assignments` stores crew-to-property service assignment history.
- Each assignment includes `property_id`, `crew_id`, `organization_id`, `active`, `assigned_at`, and optional `ended_at` fields.
- The database allows only one active crew assignment per property and service organization.
- Portfolio membership remains stored separately in `portfolio_property_links`.

## Endpoints

### Assign crew to property

`POST /properties/{property_id}/crew-assignments`

Required fields:

- `crew_id`
- `organization_id`
- `assigned_at`

Expected behavior:

- Require manager, organization owner, or support admin authorization.
- Require active membership in the requested service organization.
- The requested crew must belong to the requested service organization.
- End the current active assignment for the property, if one exists.
- Create a new active assignment for the requested crew.
- Keep the property attached to the same customer account.
- Keep portfolio membership unchanged.
- Write a `crew_assignment_changed` audit event when the assignment is persisted.

### List assignment history for property

`GET /properties/{property_id}/crew-assignments`

Expected behavior:

- Require manager, organization owner, or support admin authorization.
- Return assignment history for the requested property.
- Scope results to the signed-in principal's active organization memberships.
- Sort newest assignments first.

### List active crew workload

`GET /crews/{crew_id}/property-assignments/active`

Expected behavior:

- Require manager, organization owner, or support admin authorization.
- Return active property assignments for the requested crew.
- Scope results to the signed-in principal's active organization memberships.
- Exclude ended or inactive assignments.

## Guardrails

- Crews service yards; they do not own yards.
- Customers or property-management accounts own customer-facing account access.
- Portfolio grouping does not imply crew assignment.
- Crew assignment history remains separate from job completion history.
- A property should have at most one active crew assignment per service organization.
- Persisted crew assignment changes are auditable by actor, organization, event kind, target id, and timestamp.
