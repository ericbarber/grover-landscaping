# Completion Report Customer Timeline

This note describes how delivered completion reports should appear in the customer portal timeline.

## Timeline source

The customer timeline should start from the signed-in customer account and the properties available to that account.

Completion report timeline items should be loaded only for those properties and only after manager delivery.

## Timeline item fields

Each delivered report card should show:

- property name or address,
- service date,
- delivered timestamp,
- approved customer-facing summary,
- before-photo count,
- after-photo count,
- issue-photo count when present,
- completed service-step count,
- completed add-on count,
- stable share link when a share token is available.

## Ordering

Customer timelines should sort delivered completion reports by delivered timestamp, newest first.

When two reports have the same delivered timestamp, sort by service date newest first, then report ID for stable ordering.

## Hidden manager data

Customer timeline cards should not expose:

- manager review notes,
- failed quality-check details,
- internal status history,
- manager queue priority,
- draft, submitted, in-review, or change-requested reports.

## Guardrails

Reading the customer timeline must not change report lifecycle status, evidence snapshots, summary versions, property ownership, portfolio grouping, or crew service history.

Share links should appear only for delivered reports with delivery metadata and a share token.
