# Yard Owner Portal Working-Design Handoff

> This document preserves the V1 production audit. The completed service-lifecycle
> extension is documented in the [Yard Owner V2 handoff](yard-owner-portal-v2-handoff.md).

## Outcome

The Yard Owner portal now has a validated responsive working design that replaces
internal-style counts and disconnected lists with a customer confidence journey:

1. next service and preparation expectation;
2. latest delivered proof;
3. contextual decision, if one is required;
4. chronological visits, proof history, properties, and provider contact.

The design is ready for remote review and a separately planned production React
adoption slice.

## Review package

- [Working prototype](../prototypes/yard-owner-portal/index.html)
- [Prototype behavior and boundaries](../prototypes/yard-owner-portal/README.md)
- [Product audit and phased plan](yard-owner-portal-plan.md)
- [Desktop reference](../high-fidelity/customer/yard-owner-portal-desktop-v1.png)
- [Mobile reference](../high-fidelity/customer/yard-owner-portal-mobile-v1.png)
- [Repeatable browser validator](../tools/validate-yard-owner-portal.mjs)
- [Design decisions](decision-log.md)

The development server exposes the prototype at
`/design/prototypes/yard-owner-portal/` and the complete gallery at `/design/`.

## Approved experience contract

### Stable navigation

- Home, Visits, Proof, and Account are the four Yard Owner destinations.
- Bids are contextual recommendations connected to a property observation; they
  do not compete as a fifth primary destination.
- Changing property updates the whole portal context. Choosing a property from
  Account returns to that property's Home.
- Mobile uses a safe-area-aware bottom navigation. Desktop uses a persistent
  customer rail without inheriting provider command-center density.

### Home hierarchy

- Personalized confidence statement.
- Next confirmed service with date, arrival window, scope, property, and
  preparation expectation.
- One decision-needed recommendation, when applicable, with reason, due date,
  and total.
- Latest delivered proof with outcome, before/after evidence, completed care,
  and a forward-looking recommendation.

Aggregate property, report, and bid counts are not primary Home content.

### Customer-safe language and information

Use visit, care, proof, recommendation, property, and provider. Do not render raw:

- internal customer, organization, job, report, bid, amendment, crew, or audit IDs;
- crew assignment, capacity, route, recovery, sync, or exception details;
- unpublished or under-review proof;
- internal billing, quality, property-access, or operational notes;
- delivery recipients, internal notification status, or provider-only comments.

Every portal read must retain customer and organization scope. Delivered proof
and sent bids are the only customer-visible publication states.

## State contract

| State | Customer response |
| --- | --- |
| Loading | Preserve the intended hierarchy and announce that yard details are loading. |
| No property | Explain that no active property is connected and provide an account/provider next step. |
| No scheduled service | Confirm that nothing is currently scheduled; do not imply an error. |
| No delivered proof | Explain when the first report will appear and that provider delivery is required. |
| Portal unavailable | State that information remains protected, offer retry, and retain provider contact. |
| Expired/revoked proof | Explain that the link is unavailable and return the signed-in customer to Proof. |
| Pending bid | Show reason, scope, total, expiration, and decision consequences before actions. |
| Bid write failure | State that nothing changed, preserve context, and allow retry. |
| Approved/rejected bid | Confirm the response and explain the next provider action. |

Unavailable internal systems, storage providers, queue names, and retry mechanics
must never appear in customer copy.

## Production contract mapping

| Working-design concept | Current production foundation | Adoption requirement |
| --- | --- | --- |
| Yard Owner shell | `workspacePersona.ts`, `MobileWorkspaceShell.tsx`, `WorkspaceHomePanel.tsx` | Give Yard Owner its four approved destinations while preserving role-derived access and desktop behavior. |
| Customer/property scope | `CustomerAccountProfile`, `CustomerPropertyProfile`, `filterPropertiesForCustomerPortal` | Keep customer plus organization filtering; make the selected property a portal-wide state. |
| Next service | `CustomerPortalWorkSummary`, `getCustomerPortalNextActions` | Add a customer-safe visit summary contract with scheduled date, display arrival window, service scope, status, and preparation message. Do not expose the field job object directly. |
| Visit history | filtered customer work plus property completion-report summaries | Join customer-visible scheduled/completed visits by property and sort chronologically; separate unpublished work. |
| Delivered proof list | `fetchPropertyCompletionReports`, `PropertyCompletionReportSummary` | Extend the summary with customer-safe service title and preview counts/thumbnail only if the report is delivered. |
| Proof detail | `CustomerCompletionReportPage`, `fetchSharedCompletionReport` | Recompose around outcome and evidence. Remove raw `account.billingNotes` unless a dedicated customer-visible contract explicitly replaces it. |
| Contextual bid | `fetchAccountProjectBids`, `CustomerBidReviewPage`, `fetchSharedProjectBid`, `decideSharedProjectBid` | Filter/display only sent customer bids; connect a customer-safe recommendation reason and evidence reference; retain confirmation, expiration, answered, converted, unavailable, and write-failure states. |
| Provider contact | No stable Yard Owner portal contract identified | Add an organization-owned customer support display name, phone, email, and hours contract before production rendering. |
| Preparation expectation | Property/service setup contains provider operational context | Add an explicit customer-safe preparation/access summary. Never reuse raw provider access notes. |

### Important data gap

`CustomerPortalWorkSummary` currently contains title, status, report readiness,
and bid-review flags but not the date, arrival window, scope, or preparation
expectation needed for the approved first viewport. Production adoption should
introduce a customer-specific read model instead of assembling this information
from provider job, route, crew, or onboarding objects in the browser.

### Important privacy gap

The current shared completion report renders `account.billingNotes`. The working
design treats raw billing and provider notes as private. Production adoption must
remove that field from customer presentation or replace it with a deliberately
authored customer-visible note whose API contract and ownership are explicit.

## Component adoption slices

### Slice 1 — Customer shell and Home

- Introduce the four-destination Yard Owner navigation.
- Add portal-wide property selection.
- Add the customer-safe next-visit read model and first-viewport hierarchy.
- Preserve current role gating and customer/organization scoping.
- Cover loading, no property, no scheduled service, unavailable, and multiple
  property behavior.

### Slice 2 — Visits and delivered proof

- Build upcoming/completed visit chronology.
- Replace plain report links with a delivered-proof preview and archive.
- Recompose the shared report around customer-visible outcome, evidence,
  completed care, and recommendations.
- Remove raw billing/internal notes and cover missing/expired/revoked report
  behavior.

### Slice 3 — Contextual recommendations

- Move sent bids from a parallel history list into their related property/service
  context while retaining an Account/history return path.
- Preserve line items, total, expiration, confirmation, retry, approved, rejected,
  and converted behavior.
- Add the recommendation/evidence relationship only after its customer-safe
  contract exists.

### Slice 4 — Convergence and regression

- Validate mobile, tablet, desktop, text zoom, target size, focus, and role
  boundaries against the working design.
- Keep shared links useful outside authentication while returning signed-in
  customers to the correct portal context.
- Update production tests and project records only after the React experience
  passes the same state matrix.

## Accessibility acceptance

- One page H1 follows the active destination.
- All navigation exposes the active destination without relying on color.
- Property selection is named and announced.
- Dialog/sheet titles, containment, Escape close, and focus restoration work.
- Bid confirmation moves focus to the confirmation action; recovery is announced;
  success moves focus to the return action.
- Mobile targets are at least 44 × 44 CSS pixels.
- Layout has no horizontal overflow at 320px, reference viewports, or 200% text.
- Reduced-motion preference removes nonessential motion.

## Validation evidence

`validate-yard-owner-portal.mjs --capture` passes with:

- 1440 × 1000 desktop;
- 768 × 1024 tablet;
- 390 × 844 mobile;
- 320 × 720 compact mobile;
- 390px mobile at 200% root text;
- Home/Visits/Proof navigation and keyboard activation;
- portal-wide property switching;
- visit/report dialog focus return;
- proof-to-bid return context;
- bid confirmation, simulated write failure, retry, and success;
- loading, empty schedule, no proof, unavailable/retry, expired proof, and
  answered-decision states;
- minimum mobile target size, overflow, H1 count, and browser-error checks.

## Explicitly not approved as delivered behavior

- Schedule change/cancel controls
- New support tickets or in-app messaging
- Ratings and quality surveys
- Editable notification preferences
- Invoices, payment methods, and payment collection
- DIY yard planning or homeowner-assistant features
- Property-manager portfolio operations

Those concepts require separate product contracts and working-design review.
