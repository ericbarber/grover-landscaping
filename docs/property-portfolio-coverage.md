# Property Portfolio Coverage Workflow

This note defines the implemented portfolio-grouping foundation and the next
property-manager command-center adoption for yards that may or may not be placed
into a portfolio group.

## Goal

Every customer-owned yard should remain visible in the customer portal, even before it is placed into a property group.

## Current domain support

- `PropertyPortfolio` represents a named group such as an individual owner portfolio, property management company, HOA, or commercial client.
- `PortfolioPropertyLink` connects a yard to a portfolio group without changing yard ownership.
- `PropertyPortfolioDetail` exposes grouped yards for display.
- `filterCustomerPropertiesWithoutPortfolio` finds yards that belong to the current customer and service organization but do not yet have a portfolio link.
- `getCustomerPortfolioCoverageCounts` reports total yards, grouped yards, and yards still needing a group.

## Customer portal behavior

The customer portal should show three sections:

1. Portfolio groups with their grouped yards.
2. A visible notice when no groups exist yet.
3. A separate list of customer yards that still need a group.

## Acceptance rules

- A yard can appear in the ungrouped list only when it belongs to the current customer account.
- A yard can appear in the ungrouped list only when it belongs to the current service organization.
- A yard that already has a portfolio link for the current service organization should not appear in the ungrouped list.
- Portfolio grouping must not change crew assignment.
- Portfolio grouping must not change customer or yard ownership.

## Delivered grouping behavior

- Fixture data includes grouped and ungrouped customer yards.
- `CustomerPortfolioSummaryPanel` receives portfolio links and customer-owned yards.
- Portfolio groups render before the separate ungrouped-yard list.
- The empty state is distinct from unavailable portfolio persistence.
- Portfolio grouping and crew assignment remain separate operations.
- Tenant-scoped portfolio list/create/link APIs and customer grouping reads are implemented.

## Connected command-center adoption

The validated [property-manager portfolio working design](../design/prototypes/property-manager-portfolio/README.md)
and [production handoff](../design/review/property-manager-portfolio-handoff.md)
extend grouping into Overview, Properties, Proof, and Approvals. The next React
slice replaces the PropertyManager persona's generic customer/grouping stack with
that hierarchy while reusing current authorized grouping, completion-report, and
bid data. Any illustrative visit readiness remains labeled until the customer
owner/delegate authorization choice permits a persisted customer visit read.
