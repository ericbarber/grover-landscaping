# Completion Report Customer Evidence

This note describes how delivered report evidence should appear in the customer portal.

## Purpose

Customer evidence gives property owners and property managers confidence that yard work was completed without exposing manager review internals.

Evidence shown to customers should come from the delivered report snapshot rather than live job state.

## Evidence groups

A delivered report can show these customer-facing evidence groups:

- before photos,
- after photos,
- issue photos when present,
- completed service steps,
- completed approved recommendations (the customer-facing projection of
  completed bid-derived add-ons).

Each group should use persisted rows tied to the completion report.

## Display rules

Before and after photos should be easy to compare.

Issue photos should appear only when issue evidence exists for the delivered report.

Completed service steps and approved-recommendation outcomes should show
customer-friendly labels and counts. Pricing, internal notes, source bid IDs,
and add-on IDs are not part of the public evidence response.

## Hidden review data

Customer evidence views should not show:

- manager review notes,
- failed quality-check details,
- internal lifecycle history,
- manager queue labels,
- manager queue priority,
- draft, submitted, in-review, or change-requested report content.
- report/job/account/add-on identifiers, photo object keys, pricing, billing,
  route, crew, or organization context from the internal snapshot.

## Guardrails

Viewing customer evidence must not change report lifecycle status, evidence snapshots, summary versions, property ownership, portfolio grouping, customer ownership, or crew service history.
