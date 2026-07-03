# Completion Report Persistence Model

This document summarizes the current persistence model for proof-of-completion reports.

## Tables

- `completion_reports` stores the current report record, lifecycle status, job, property, crew, organization, summary, actor fields, and lifecycle timestamps.
- `completion_report_photo_evidence` stores photo evidence snapshots for before, after, and issue photos.
- `completion_report_service_steps` stores service-step snapshots used for manager review.
- `completion_report_add_ons` stores completed add-on service snapshots included with a report.
- `completion_report_status_history` stores lifecycle transitions for report audit review.

## Lifecycle

The report lifecycle is:

1. `draft`
2. `submitted`
3. `in_review`
4. `changes_requested`
5. `delivered`

The base report table keeps the current status. Status history keeps each transition for review and audit workflows.

## Customer delivery

Delivered reports can use a share token to produce stable customer-facing report links. Share tokens are unique when present and are indexed for delivery lookup.

## Route implementation notes

Future route handlers should:

- create a base report record before writing evidence snapshots,
- snapshot photos, service steps, and completed add-ons at the time the report is generated,
- update status history whenever the report lifecycle changes,
- set delivery fields and share token data only after manager approval,
- keep customer portal reads scoped to the customer's own properties and delivered reports.
