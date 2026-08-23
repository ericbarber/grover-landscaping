# Property-manager portfolio design plan

## Purpose

Turn the existing portfolio wireframe into a connected, responsive customer
workspace before production React adoption. This phase serves property managers
who oversee multiple locations but must not silently expand Grover into a full
multi-vendor marketplace or expose provider-private operations.

## Audited baseline

- The wireframe defines portfolio metrics, coverage, exceptions, evidence, and
  approvals.
- Production currently groups properties and identifies ungrouped yards, but it
  does not provide portfolio-wide service readiness or action hierarchy.
- Completion reports and project bids already have customer-safe application
  projections.
- Persisted customer visit reads remain blocked on the owner/delegate access-
  scope decision, so the design must identify illustrative visit state honestly.

## Design phases

1. Establish stable Overview, Properties, Proof, and Approvals destinations.
2. Put service readiness, exceptions, and customer decisions before reporting.
3. Connect each exception and delivered record to a property and named provider.
4. Cover ready, all-clear, new, loading, partial, and unavailable states.
5. Validate 1440px and 390px composition, keyboard interaction, dialog recovery,
   target sizing, and horizontal overflow.
6. Adopt the hierarchy into the PropertyManager production persona using only
   current authorized data and explicit local-review fixtures where necessary.

## Boundary decisions

- Show customer-safe provider identity, cadence, service window, delivered work,
  evidence counts, recommendations, and totals.
- Exclude crew identity, routes, internal notes, production assumptions, costs,
  margins, and unrelated customer records.
- Keep multi-vendor compliance, scorecards, work distribution, and invoice
  matching in the separate future concept.
- Do not label illustrative readiness or exception events as persisted.

## Exit criteria

- The connected working design passes its automated responsive validator.
- A production handoff maps every design region to current or required contracts.
- The gallery and adoption tracker point reviewers to the new design.
- The first React slice has persona-specific navigation, responsive coverage,
  explicit data provenance, and no provider-private leakage.
