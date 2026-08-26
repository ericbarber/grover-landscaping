# Completion Report API Contract

This document defines the implemented lifecycle and public-read contracts for
persisted proof-of-completion reports, plus the remaining planned generation
endpoint.

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
- store an immutable delivered snapshot with version and evidence metadata,
- move status to `delivered`,
- write a status history event.

### POST `/completion-reports/{report_id}/delivery-notifications`

Implemented.

Queues an email or SMS notification for a delivered report share link.

Expected behavior:

- require manager, organization owner, or support admin access,
- validate email or E.164 SMS recipients,
- require delivered status, delivery metadata, and a share token,
- insert a `completion_report_delivery` notification outbox row,
- leave report evidence, snapshots, and lifecycle state unchanged.

### GET `/reports/{share_token}`

Implemented.

Returns the delivered completion report JSON for a valid share token.

Expected behavior:

- allow public token reads,
- require the report to be delivered with delivery metadata,
- project the immutable internal snapshot into a purpose-built customer response,
- return only report status, evidence counts, customer/service identity,
  checklist labels and state, displayable photo evidence, completed approved-
  recommendation names/descriptions/quantity, and the optional capture timestamp,
- omit report, job, account, organization, crew, photo, add-on, bid, line-item,
  and service identifiers,
- omit internal notes, object keys, upload metadata, prices, billing state,
  delivery recipients, route state, readiness internals, and unrelated account data,
- return `shared_report_snapshot_invalid` rather than exposing a stored snapshot
  that cannot be safely projected,
- reject draft, submitted, in-review, and change-requested reports.

Current response shape:

```json
{
  "report_status": "delivered",
  "checklist_progress": 100,
  "before_photos": 1,
  "after_photos": 1,
  "issue_photos": 0,
  "service": {
    "customer_name": "Oak Street Residence",
    "property_address": "123 Oak Street",
    "scheduled_date": "2026-08-22",
    "checklist": [{ "label": "Mowed and edged lawn", "completed": true }]
  },
  "photo_evidence": [{
    "photo_type": "after",
    "file_name": "front-yard-after.jpg",
    "image_url": "/customer-safe/photo-url"
  }],
  "completed_recommendations": [{
    "service_name": "Hedge trim",
    "service_description": "Shaped the front hedge and removed clippings.",
    "quantity": 1
  }],
  "captured_at_epoch_seconds": 1787392800
}
```

### GET `/report-view/{share_token}`

Implemented.

Serves the customer-facing browser view for a delivered completion report. The browser view calls `GET /reports/{share_token}` for customer-safe report data.

### GET `/properties/{property_id}/completion-reports`

Implemented.

Returns delivered reports for existing provider/property-manager workflows. It
is not an authorized Yard Owner source under D-061.

Expected behavior:

- do not use this organization-membership route for signed-in Yard Owner proof,
- allow service-company managers to review reports for their organization,
- return only delivered reports for customer portal views,
- include stable share links only when delivery is complete.

## Guardrails

- Crew submission does not grant manager review access.
- Manager review does not change property ownership, portfolio grouping, or crew assignment.
- Customer portal reads must be property scoped.
- Share links should only expose delivered reports.
- Public report safety is enforced by server-side response projection; clients
  must not receive internal snapshot fields and merely hide them visually.
- Completed recommendations in the public response are completed job add-ons
  created by the approved-bid conversion contract; active proposal tokens are
  not embedded in completion proof.
- Every lifecycle transition should write status history.
