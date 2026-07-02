# Property Portfolio Coverage Workflow

This note defines the next customer-portal workflow for yards that are not yet placed into a portfolio group.

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

## Implementation checklist

- Add fixture data for at least one grouped yard and one ungrouped yard in the customer portal preview.
- Pass portfolio links and customer-owned yards into `CustomerPortfolioSummaryPanel`.
- Render portfolio groups first, using existing `PropertyPortfolioDetail` data.
- Render ungrouped yards in a separate customer-visible section below grouped portfolios.
- Show the empty-state message only when the account has no portfolio groups.
- Keep crew assignment controls out of the portfolio grouping UI.
- Add focused tests for ungrouped-yard display behavior when component testing is available.

## Next implementation slice

Wire portfolio and crew-assignment API routes after organization membership and tenant-aware access boundaries are persisted.
