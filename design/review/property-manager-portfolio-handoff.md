# Property-manager portfolio production handoff

## Approved composition

The property-manager customer workspace uses four stable destinations:

| Destination | Primary question | Production input |
| --- | --- | --- |
| Overview | What needs attention across the portfolio? | Connected properties, customer-safe readiness summaries, exceptions, reports, and bids |
| Properties | Is each location ready for its next service? | Portfolio links, property profiles, provider display name, cadence, and next-service projection |
| Proof | What completed work is ready to review? | Customer-safe completion-report summaries and delivered evidence |
| Approvals | Which recommendations need a decision? | Customer-safe project-bid projection and current decision status |

## First production adoption

The first safe slice should replace the generic grouping-only view for the
PropertyManager persona with a portfolio command center. It may derive an
illustrative readiness summary from the current local-review visit fixture, but
must label that source in the UI. Existing persisted completion reports and bids
remain authoritative when available.

PropertyOwner keeps the Yard Owner portal. Provider managers may retain the
grouping summary inside customer-management tools until an editing contract is
approved; the customer-facing portfolio command center must not become a
provider-side grouping editor by accident.

## Required states

- Ready with prioritized access or schedule exceptions.
- All clear with zero actions, not an empty or failed state.
- New portfolio with no connected properties.
- Loading and unavailable at the affected source boundary.
- Partial availability that retains usable records and names delayed sources.
- No matching properties after a search.

## Authorization and privacy

- Render only properties already scoped to the active customer account and
  service organization.
- Keep the current owner/delegate authorization decision explicit before adding
  persisted visit reads.
- Never infer access from a selected persona title.
- Never expose crew identity, route ordering, provider-private notes, cost basis,
  margins, object keys, or internal identifiers.
- Reuse the narrowed completion-report and shared-proposal projections for any
  public or customer-safe detail.

## Validation contract

- Unit-test portfolio derivation and empty/partial distinctions.
- Cover direct PropertyManager entry on phone and desktop.
- Verify stable destination navigation, property context, search, and no
  horizontal overflow.
- Regress loading, unavailable, partial, all-clear, and new-portfolio states.
- Verify proof and approval links retain customer-safe projections.

## Deferred boundaries

Persisted customer next-visit reads wait for the customer-account versus per-
property authorization decision. Multi-vendor governance, compliance,
scorecards, invoice matching, and marketplace allocation remain future concepts.
