# Completion Report Delivery Readiness

This note describes when a persisted completion report is ready for customer delivery.

## Delivery inputs

A report is ready for delivery when it has:

- a base completion report record,
- persisted evidence snapshots,
- a current manager-approved summary version,
- passing quality checks,
- a status history path through manager review,
- delivery actor and delivery timestamp fields ready to be set.

In the current legacy `job_completion_reports` implementation, the deliver endpoint enforces the available readiness fields: `in_review` status, review timestamp, 100% checklist progress, at least one before photo, at least one after photo, and `ready_for_customer = true`.

The resubmit endpoint applies the same readiness snapshot checks before moving a `changes_requested` report back to `submitted`.

## Delivery behavior

Delivery should happen only after manager approval. The delivery action should set delivery metadata, create or reuse the share token, move the report to `delivered`, and record the lifecycle change.

Delivery attempts should be recorded separately so retry and failure review do not rewrite report evidence or summary history.

After delivery, managers can queue an email or SMS notification for the delivered share link. Notification queueing requires a delivered report with delivery metadata and a share token, validates the recipient, and writes a `completion_report_delivery` row to `notification_outbox` for the dispatcher.

## Customer portal behavior

Customer portal reads should return only delivered reports for properties the customer owns or manages. Share links should be exposed only after the report reaches `delivered`.

Delivery must not change property ownership, portfolio grouping, crew service history, or job evidence snapshots.
