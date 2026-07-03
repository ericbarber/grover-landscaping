# Report Persistence Validation Notes

Use these notes when validating completion report persistence locally.

## Areas to compare

- The report builder currently returns `draft` or `ready` for the API response.
- The database table stores lifecycle values such as `draft`, `submitted`, `in_review`, `changes_requested`, and `delivered`.
- The first persisted value should keep a draft report as `draft`.
- A report that is ready for manager review should enter persistence as `submitted`.

## Local validation steps

1. Build a report with partial checklist or photo evidence and confirm it remains a draft.
2. Build a report with complete checklist and required photos and confirm it is ready.
3. Persist the draft report and confirm the database status is `draft`.
4. Persist the ready report and confirm the database status is `submitted`.
5. Keep later review and delivery states controlled by manager-side actions.
