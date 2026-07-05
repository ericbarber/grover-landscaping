# Completion Report Customer Detail View

This note describes the customer-facing detail view for a delivered completion report.

## Entry points

A customer can open the detail view from:

- the customer portal timeline,
- a delivered report card,
- a stable share link when a delivered report has a share token.

Each entry point should resolve to one delivered report and must still enforce customer/property access rules.

## Detail source

The detail view should read from persisted completion report snapshots:

- base report record,
- approved summary version,
- photo evidence snapshots,
- service-step snapshots,
- completed add-on snapshots,
- delivery metadata,
- share token metadata when present.

The detail view should not rebuild content from live job state.

## Customer-visible sections

The delivered report detail can show:

- property and service context,
- delivered timestamp,
- approved customer-facing summary,
- before and after photo groups,
- issue photos when present,
- completed service-step list,
- completed add-on list,
- stable share link when available.

## Access rules

Customer-account access should come from the signed-in account, its portfolios, and available properties.

A share token can open only delivered report content and should not grant access to manager-only review data.

## Hidden manager fields

The detail view should not expose:

- manager review notes,
- failed quality-check details,
- internal status history,
- manager queue labels,
- manager queue priority,
- draft, submitted, in-review, or change-requested report records.

## Guardrails

Opening or refreshing the detail view must not mutate lifecycle status, status history, delivery metadata, evidence snapshots, summary versions, property ownership, portfolio grouping, or crew service history.
