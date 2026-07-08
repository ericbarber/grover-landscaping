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

## Endpoint status

The manager lifecycle endpoints are implemented with manager-role authorization,
atomic transitions, lifecycle metadata, and status-history persistence:

- `POST /completion-reports/{report_id}/review`
- `POST /completion-reports/{report_id}/request-changes`
- `POST /completion-reports/{report_id}/resubmit`
- `POST /completion-reports/{report_id}/deliver`
- `GET /reports/{share_token}`
- `GET /report-view/{share_token}`

The remaining endpoints below are planned unless noted otherwise.

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

Implemented.

Moves a submitted report into manager review.

Expected behavior:

- require manager, organization owner, or support admin access,
- move status from `submitted` to `in_review`,
- write a status history event.

### POST `/completion-reports/{report_id}/request-changes`

Implemented.

Records a manager request for crew follow-up before customer delivery.

Expected behavior:

- require manager, organization owner, or support admin access,
- move status to `changes_requested`,
- retain report evidence snapshots for comparison,
- write a status history event with the reason.

### POST `/completion-reports/{report_id}/resubmit`

Implemented.

Returns a change-requested report to manager review intake after crew follow-up.

Expected behavior:

- require crew, manager, organization owner, or support admin access,
- require current status `changes_requested`,
- require delivery-ready snapshot fields,
- move status back to `submitted`,
- clear stale review metadata,
- write a status history event.

### POST `/completion-reports/{report_id}/deliver`

Implemented.

Approves the report for customer portal delivery.

Expected behavior:

- require manager, organization owner, or support admin access,
- set delivery actor and timestamp,
- create or reuse a share token,
- move status to `delivered`,
- write a status history event.

### GET `/reports/{share_token}`

Implemented.

Returns the delivered completion report JSON for a valid share token.

Expected behavior:

- allow public token reads,
- require the report to be delivered with delivery metadata,
- return the persisted delivered snapshot fields,
- reject draft, submitted, in-review, and change-requested reports.

### GET `/report-view/{share_token}`

Implemented.

Serves the customer-facing browser view for a delivered completion report. The browser view calls `GET /reports/{share_token}` for customer-safe report data.

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
