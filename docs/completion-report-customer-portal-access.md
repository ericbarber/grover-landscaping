# Completion Report Customer Portal Access

This note describes how delivered completion reports should appear in the customer portal.

## Access source

Customer portal access should start from the signed-in customer account and the properties attached to that account. A customer should see completion reports only for properties they own or manage.

Service-company managers can review completion reports for their own organization, but manager access should not expand a customer's portal view.

## Report visibility

Customer portal report lists should include only reports with lifecycle status `delivered`.

Draft, submitted, in-review, and change-requested reports should remain manager-side records until delivery is approved.

## Report content

A delivered report can show:

- summary text from the current approved summary version,
- before and after photo evidence,
- issue photos when present,
- service-step completion snapshots,
- completed add-on snapshots,
- the delivered timestamp,
- the stable share link when one exists.

## Guardrails

Customer portal reads must not change report status, property ownership, portfolio grouping, crew service history, or evidence snapshots.

Share links should expose only delivered report content and should remain scoped to the delivered report record.
