# Completion Report Workflow Map

This map connects the current completion report persistence and documentation slices into one implementation path.

## 1. Generate report snapshot

The generation step creates or refreshes the base completion report and snapshots the current proof-of-completion evidence.

Expected persisted records:

- base completion report record,
- photo evidence snapshots,
- service-step snapshots,
- completed add-on snapshots,
- generation run record,
- initial summary version.

## 2. Prepare manager review

The review-readiness step evaluates the persisted snapshot rather than live job state.

Expected persisted records:

- quality-check rows for photos, service steps, and add-ons,
- quality-check run record with passed and failed counts,
- review notes when a manager adds feedback.

## 3. Review and revise

Manager review can approve the report, request follow-up, or refine customer-facing wording.

Expected persisted records:

- status history for lifecycle changes,
- summary version records for wording changes,
- review notes for feedback that should not change lifecycle status.

## 4. Deliver to customer

Delivery happens after manager approval and exposes the report to the customer portal.

Expected persisted records:

- delivery actor and timestamp on the base report,
- share token fields when a stable report link is created,
- delivery attempt records for portal or email delivery.

## 5. Read from customer portal

Customer portal reads start from the signed-in customer account and property access scope.

Expected behavior:

- return only delivered reports,
- include current approved summary and persisted snapshots,
- expose share links only after delivery,
- never alter property ownership, portfolio grouping, crew service history, report status, or evidence snapshots.
