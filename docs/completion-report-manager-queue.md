# Completion Report Manager Queue

This note describes how managers should triage completion reports before customer delivery.

## Queue buckets

Manager views should group reports by lifecycle status:

- `draft`: crew evidence is not ready for review yet.
- `submitted`: crew evidence is ready for manager review.
- `in_review`: a manager is actively reviewing the report.
- `changes_requested`: manager feedback requires crew follow-up before delivery.
- `delivered`: the report has been approved and exposed to the customer portal.

## Queue signals

Useful queue signals include:

- property and customer context,
- assigned crew context,
- latest summary version timestamp,
- latest quality-check run timestamp,
- passed and failed quality-check counts,
- latest review note timestamp,
- delivery timestamp when delivered.

## Manager actions

Managers should be able to:

- open the persisted evidence snapshot,
- review before and after photos,
- review service-step snapshots,
- review completed add-ons,
- add review notes,
- create a new summary version,
- request changes,
- approve delivery.

## Guardrails

Manager queue actions must not change property ownership, portfolio grouping, or crew service history.

Manager review should work from persisted report snapshots so late job edits do not silently alter a report already under review.

The manager queue endpoint returns only reports for jobs owned by organizations where the signed-in principal has an active membership. Notification history and notification recovery actions use the same active-membership boundary.

`GET /completion-reports` supports server-side queue narrowing by lifecycle status, readiness, readiness blocker, assigned crew ID, customer-name text, property-address text, and inclusive scheduled-date range. Current blocker values are `any`, `checklist`, `before_photos`, and `after_photos`.
