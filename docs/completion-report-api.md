# Completion Report API Contract

This document defines the planned API surface for persisted proof-of-completion reports.

## Existing foundation

The backend now has persistence support for:

- completion report records and lifecycle status,
- photo evidence snapshots,
- service-step snapshots,
- completed add-on snapshots,
- status history,
- share tokens for customer-facing report links.

## Planned endpoints

### POST `/jobs/{job_id}/completion-report`

Creates or refreshes the base report record for a job and snapshots the evidence available at generation time.

Expected behavior:

- create the base report record,
- snapshot photo evidence,
- snapshot service steps,
- snapshot completed add-ons,
- start the report as `draft` or `submitted`, depending on readiness,
- write an initial status history event.

### POST `/completion-reports/{report_id}/review`

Moves a submitted report into manager review.

Expected behavior:

- require manager, organization owner, or support admin access,
- move status from `submitted` to `in_review`,
- write a status history event.

### POST `/completion-reports/{report_id}/request-changes`

Records a manager request for crew follow-up before customer delivery.

Expected behavior:

- require manager, organization owner, or support admin access,
- move status to `changes_requested`,
- retain report evidence snapshots for comparison,
- write a status history event with the reason.

### POST `/completion-reports/{report_id}/deliver`

Approves the report for customer portal delivery.

Expected behavior:

- require manager, organization owner, or support admin access,
- set delivery actor and timestamp,
- create or reuse a share token,
- move status to `delivered`,
- write a status history event.

### GET `/properties/{property_id}/completion-reports`

Returns delivered reports for a property when the requester has customer portal or manager access.

Expected behavior:

- keep customer reads scoped to properties they own or manage,
- allow service-company managers to review reports for their organization,
- return only delivered reports for customer portal views,
- include stable share links only when delivery is complete.

## Guardrails

- Crew submission does not grant manager review access.
- Manager review does not change property ownership, portfolio grouping, or crew assignment.
- Customer portal reads must be property scoped.
- Share links should only expose delivered reports.
- Every lifecycle transition should write status history.
