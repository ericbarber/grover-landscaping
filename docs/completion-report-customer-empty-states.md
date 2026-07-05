# Completion Report Customer Empty States

This note describes customer portal empty states for completion report views.

## Purpose

Empty states should help property owners and property managers understand why no delivered completion reports are visible yet.

Empty states should never reveal manager review internals or non-delivered report records.

## Timeline empty state

Show a timeline empty state when the signed-in customer account has access to properties, but no delivered completion reports are available for those properties.

Recommended message theme:

- completed service reports will appear after manager delivery,
- recent service activity may still be under review,
- customers can contact the service company with questions.

## Property empty state

Show a property empty state when one selected property has no delivered completion reports.

The empty state should stay scoped to that property and should not mention other customer properties unless the customer intentionally changes the selected property.

## Evidence empty groups

Delivered reports can omit individual evidence groups when no delivered snapshot rows exist for that group.

Examples:

- issue photos can be hidden when no issue photos were captured,
- completed add-ons can be hidden when no add-ons were performed,
- service steps should show only delivered customer-facing labels.

## Hidden data

Empty states should not expose:

- draft reports,
- submitted reports,
- in-review reports,
- change-requested reports,
- manager review notes,
- failed quality-check details,
- internal lifecycle history.

## Guardrails

Rendering an empty state must not change lifecycle status, evidence snapshots, summary versions, property ownership, portfolio grouping, customer ownership, or crew service history.
