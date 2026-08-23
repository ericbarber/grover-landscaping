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
| Shared visual foundation | [Consistency review](../design/review/cross-prototype-visual-consistency-review.md) | Adopted core / incremental migration | The production authenticated shell uses one outlined SVG icon family, phone bottom bar, tablet rail, persistent desktop rail, single-destination desktop composition, and shared semantic notices/status pills. Migrate legacy panel feedback only during its owning workflow phase. |
| Access and persona Home | [Access wireframe](../design/wireframes/auth/01-access-and-onboarding.svg) and [application delivery plan](../design/review/application-working-design-delivery-plan.md) | Partial | Finish entry/recovery state convergence and validate each role’s first-task path within the shared shell. |
| Crew field route and execution | [Crew route V1](../design/high-fidelity/field/crew-route-mobile-v1.png), [Jobs](../design/wireframes/field/03-jobs.svg), and [Job detail](../design/wireframes/field/04-job-detail.svg) | Adopted | Route uses progress → Current stop → Up next; Jobs uses compact ordered cards, readiness, search, and status filters; Job preserves context and primary actions while opening one semantic workflow panel at a time. Existing offline, evidence, conflict, and recovery contracts remain intact. |
| Manager daily operations | [Schedule V1](../design/high-fidelity/manager/schedule-desktop-v1.png), [manager hub](../design/wireframes/manager/00-manager-hub.svg), and [Recovery](../design/wireframes/manager/05-recovery.svg) | Adopted core | Schedule adopts Today’s operation, compact target controls, route board + inspector, and responsive stacking. Recovery adopts overview metrics, filtered queue + detail, lifecycle actions, and return-to-affected-work routing. Existing capacity, publish, persistence, and conflict contracts remain authoritative. |
| Completion proof and communication | [Reports wireframe](../design/wireframes/manager/04-reports.svg) and [shared proof wireframe](../design/wireframes/public/04-shared-customer-proof.svg) | Partial | Manager Reports opens the exact Job Report workflow. Shared proof adopts service identity, immutable evidence, completed add-ons, and retry recovery. Shared proposals adopt customer-safe scope/pricing, explicit approve/decline confirmation, recorded outcomes, and closed-link recovery. Next complete recommendation/add-on continuity. |
| Yard Owner acquisition | [Working acquisition](../design/prototypes/yard-owner-acquisition/README.md) and [handoff](../design/review/yard-owner-acquisition-handoff.md) | Partial | Private intake, invitations, disclosure, assessments, proposals, collaboration, activation, and separate first-visit confirmation are delivered. Next: relationship continuity; curated discovery remains later and governed. |
| Yard Owner portal | [Working portal](../design/prototypes/yard-owner-portal/README.md) and [V2 handoff](../design/review/yard-owner-portal-v2-handoff.md) | Partial · shell/Home locally adopted | Home, Visits, Proof, and Account plus property context, local-review visit summaries, delivered proof, and recommendation history are adopted. Next persist customer visit reads, then service-day states, concern recovery, recommendation collaboration, and preferences. Billing remains product-gated. |
| Yard Crew acquisition | [Working provider journey](../design/prototypes/yard-crew-acquisition/README.md) and [handoff](../design/review/yard-crew-acquisition-handoff.md) | Design ready / reciprocal entry partial | Adopt provider public routing and identity/readiness first, then connect known-owner invitation, assessment, proposal, and first-service preparation. Curated opportunities and alerts remain gated on marketplace operations. |
| Property-manager portfolios | [Portfolio wireframe](../design/wireframes/customer/02-property-manager-portfolio.svg) | Partial foundations | Produce and validate the connected working design, then adopt portfolio readiness, exceptions, property proof, and vendor accountability without exposing provider-private data. |
| Team, organization, and access | [Team wireframe](../design/wireframes/manager/03-team.svg) | Partial · overview adopted | The Organization Owner now enters a live Team and access command center with active-member, pending-invitation, active-crew, and unstaffed-territory summaries plus direct member, invitation, crew, and audit paths. Next converge staffing recovery, hierarchy handoffs, permission/self-impact states, and final phase regression. |
| Revenue operations | [Revenue wireframe](../design/wireframes/revenue/01-revenue-operations.svg) | Product-gated | Keep current bid and billing-readiness foundations visible as delivered; do not imply invoices, payments, taxes, or accounting integration until ownership and compliance contracts are approved. |
| Homeowner assistant | [Future concept](../design/wireframes/future/01-homeowner-assistant.svg) | Future concept | No current adoption commitment. |
| Multi-vendor property management | [Future concept](../design/wireframes/future/02-multi-vendor-portfolio.svg) | Future concept | No current adoption commitment; the current property-manager view must not imply full marketplace governance. |

## Ordered repository delivery queue

The next repository-owned phases are ordered by an existing approved contract,
user value, and dependency safety:

1. Shared authenticated-shell core is delivered; migrate legacy feedback only
   inside the owning workflow phases.
2. Field execution core convergence is adopted; keep its offline, conflict,
   evidence, and recovery regression intact.
3. Manager Schedule, Recovery, and completion-review core convergence is adopted.
4. Shared completion proof and proposal decisions are adopted; recommendation/
   add-on continuity remains.
5. **Active:** continue Yard Owner portal adoption after the customer-account
   versus per-property authorization decision; property-manager design follows.
6. **Active independent stream:** continue Team/organization convergence from
   the delivered overview through staffing recovery and final state/accessibility
   regression, then run cross-application critical journeys.

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
