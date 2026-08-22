# Prototype Adoption Tracker

This document maps approved design artifacts to production React behavior. It is
the review queue for visual and workflow adoption; [`../PLAN.md`](../PLAN.md)
remains the canonical delivery-status record for all product and platform work.

## Status meanings

| Status | Meaning |
| --- | --- |
| Adopted | The approved behavior is present in production code and has proportionate automated coverage. |
| Partial | A meaningful portion is delivered, but named prototype states or handoffs remain. |
| Design ready | A validated prototype and handoff exist, but production adoption has not started. |
| Product-gated | Implementation depends on an unresolved product, legal, privacy, operational, or financial decision. |
| Future concept | The artifact sets a boundary only and is not a current implementation commitment. |

## Adoption matrix

| Experience | Approved design source | Production status | Remaining production adoption |
| --- | --- | --- | --- |
| Public homepage and persona journeys | [Working homepage](../design/prototypes/public-homepage/README.md) and [V2 handoff](../design/review/v2-working-homepage-handoff.md) | Adopted | Replace illustrative workspace previews only when approved production captures exist; add customer proof only with verified provenance and approval. |
| Landscaping-company “Today’s operation” preview | [Manager schedule V1](../design/high-fidelity/manager/schedule-desktop-v1.png) | Adopted for marketing | The hero and Plan tour use the responsive, interactive, explicitly non-persistent dashboard. Production manager scheduling remains tracked separately below. |
| Shared visual foundation | [Consistency review](../design/review/cross-prototype-visual-consistency-review.md) | Partial | Replace remaining Unicode/emoji-like navigation symbols with one outlined icon set; finish desktop operational density, status primitives, and tablet rail behavior. |
| Access and persona Home | [Access wireframe](../design/wireframes/auth/01-access-and-onboarding.svg) and [application delivery plan](../design/review/application-working-design-delivery-plan.md) | Partial | Finish entry/recovery state convergence and validate each role’s first-task path within the shared shell. |
| Crew field route and execution | [Crew route V1](../design/high-fidelity/field/crew-route-mobile-v1.png) and [field wireframes](../design/wireframes/field/01-home.svg) | Partial | Adopt the field hierarchy across Home → Route → Jobs → Job; keep offline queue, photo, checklist, amendment, and completion recovery behavior intact. |
| Manager daily operations | [Schedule V1](../design/high-fidelity/manager/schedule-desktop-v1.png) and [manager wireframes](../design/wireframes/manager/00-manager-hub.svg) | Partial | Converge the production hub, schedule, dispatch, inspector, publish, capacity-risk, and Recovery compositions across desktop, tablet, and mobile. |
| Completion proof and communication | [Reports wireframe](../design/wireframes/manager/04-reports.svg) and [shared proof wireframe](../design/wireframes/public/04-shared-customer-proof.svg) | Partial | Link crew completion, manager evidence review, customer-safe delivery, recommendation/bid decision, and recovery as one responsive journey. |
| Yard Owner acquisition | [Working acquisition](../design/prototypes/yard-owner-acquisition/README.md) and [handoff](../design/review/yard-owner-acquisition-handoff.md) | Partial | Private intake, invitations, disclosure, assessments, provider/owner proposal interfaces, and the proposal-conversation persistence boundary are delivered. Next: conversation APIs/interfaces, explicit activation, relationship continuity, and only afterward any curated discovery. |
| Yard Owner portal | [Working portal](../design/prototypes/yard-owner-portal/README.md) and [V2 handoff](../design/review/yard-owner-portal-v2-handoff.md) | Design ready / partial foundations | Adopt the customer next-visit read model, service-day states, delivered proof, concern recovery, recommendation collaboration, and preferences. Billing remains product-gated. |
| Yard Crew acquisition | [Working provider journey](../design/prototypes/yard-crew-acquisition/README.md) and [handoff](../design/review/yard-crew-acquisition-handoff.md) | Design ready / reciprocal entry partial | Adopt provider public routing and identity/readiness first, then connect known-owner invitation, assessment, proposal, and first-service preparation. Curated opportunities and alerts remain gated on marketplace operations. |
| Property-manager portfolios | [Portfolio wireframe](../design/wireframes/customer/02-property-manager-portfolio.svg) | Partial foundations | Produce and validate the connected working design, then adopt portfolio readiness, exceptions, property proof, and vendor accountability without exposing provider-private data. |
| Team, organization, and access | [Team wireframe](../design/wireframes/manager/03-team.svg) | Partial | Converge invitation, membership, role, crew, branch, territory, hierarchy, and audit interfaces in the shared manager shell. |
| Revenue operations | [Revenue wireframe](../design/wireframes/revenue/01-revenue-operations.svg) | Product-gated | Keep current bid and billing-readiness foundations visible as delivered; do not imply invoices, payments, taxes, or accounting integration until ownership and compliance contracts are approved. |
| Homeowner assistant | [Future concept](../design/wireframes/future/01-homeowner-assistant.svg) | Future concept | No current adoption commitment. |
| Multi-vendor property management | [Future concept](../design/wireframes/future/02-multi-vendor-portfolio.svg) | Future concept | No current adoption commitment; the current property-manager view must not imply full marketplace governance. |

## Ordered repository delivery queue

The next repository-owned phases are ordered by an existing approved contract,
user value, and dependency safety:

1. Define and deliver proposal questions/change requests, then the explicit
   activation boundary. Curated discovery stays deferred.
2. Finish shared authenticated-shell adoption: outlined icons, desktop density,
   status primitives, and tablet navigation behavior.
3. Converge field execution from Home through completion without weakening
   offline, conflict, evidence, or recovery contracts.
4. Converge manager daily operations and Recovery around the approved schedule
   direction.
5. Connect completion proof from crew handoff through manager review and
   customer-safe delivery.
6. Adopt the Yard Owner portal, then produce and adopt the property-manager
   portfolio working design.
7. Converge team/organization administration and run the cross-application
   critical-journey regression phase.

Phases may be split into smaller implementation commits. A phase is not complete
until its workflow, responsive, state, accessibility, validation, and handoff
gates in the [application delivery plan](../design/review/application-working-design-delivery-plan.md)
are satisfied.

## External and product gates

The following cannot be truthfully completed by repository implementation alone:

- live notification provider selection, authenticated delivery callbacks, and
  production delivery receipts;
- live dashboards, pager routing, calibrated thresholds, named operational
  staffing, and signed go/no-go ownership;
- moderated usability, assistive-technology, physical-device, privacy, and
  security signoff;
- approved customer logos, quotations, performance claims, and production
  workspace captures;
- curated marketplace eligibility, density, ranking, abuse, support, and service
  level decisions;
- billing ownership, payment processor, tax, refund, privacy, and compliance
  decisions;
- production cloud credentials and provisioning authority.

These items remain documented as gates, not silently converted into simulated
passes or placeholder product behavior.
