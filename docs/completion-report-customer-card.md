# Completion Report Customer Card

This note describes the customer-facing card for a delivered completion report.

## Purpose

The customer card gives property owners and property managers a quick summary of completed yard work without exposing manager review internals.

The card should use the delivered report snapshot, not live job state.

## Header content

Each card should show:

- property name or address,
- service date,
- delivered timestamp,
- crew or service-company label when available,
- report status shown as customer-friendly delivered wording.

## Evidence summary

The evidence area should show safe counts and links into delivered evidence:

- before photos,
- after photos,
- issue photos when present,
- completed service steps,
- completed add-ons.

Photo and service-step details should come from persisted report snapshots so later job edits do not silently change the delivered card.

## Summary and link

The main body should show the latest approved customer-facing summary version for the report.

A stable share link can appear only when the report is delivered, delivery metadata is present, and a share token exists.

## Hidden fields

Customer cards should not show:

- manager review notes,
- failed quality-check details,
- internal lifecycle history,
- manager queue labels or priority,
- draft, submitted, in-review, or change-requested reports.

## Guardrails

Rendering the card must not change report lifecycle status, evidence snapshots, summary versions, property ownership, portfolio grouping, customer ownership, or crew service history.
