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

## Delivery behavior

Delivery should happen only after manager approval. The delivery action should set delivery metadata, create or reuse the share token, move the report to `delivered`, and record the lifecycle change.

Delivery attempts should be recorded separately so retry and failure review do not rewrite report evidence or summary history.

## Customer portal behavior

Customer portal reads should return only delivered reports for properties the customer owns or manages. Share links should be exposed only after the report reaches `delivered`.

Delivery must not change property ownership, portfolio grouping, crew service history, or job evidence snapshots.
