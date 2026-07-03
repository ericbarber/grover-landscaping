# Completion Report Review Readiness

This note describes how manager review readiness should use the current completion report persistence tables.

## Review inputs

A report is ready for manager review when the persisted snapshot has:

- the base completion report record,
- photo evidence snapshots,
- service-step snapshots,
- completed add-on snapshots when add-ons were performed,
- a generated summary version,
- quality-check rows for photos, service steps, and add-ons.

## Quality checks

Quality checks should evaluate the persisted snapshot rather than the live job state.

The initial check set is:

- `photos_present`
- `steps_complete`
- `add_ons_reviewed`

Each check stores whether it passed or failed. A quality-check run stores the count of passed and failed checks for manager queue review.

## Manager review behavior

Manager review should not change property ownership, portfolio grouping, or crew service history.

When a manager edits report wording, store a new summary version instead of rewriting the earlier summary text. When a manager requests follow-up work, keep the evidence snapshots stable and record the lifecycle change through report status history.
