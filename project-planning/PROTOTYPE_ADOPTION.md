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
| Access and persona Home | [Access wireframe](../design/wireframes/auth/01-access-and-onboarding.svg) and [application delivery plan](../design/review/application-working-design-delivery-plan.md) | Adopted core | Authentication and active-access loading are distinct; access failure retries without exposing the app; membership roles govern personas with Support/first-owner exceptions; no-role accounts receive Home only; and all seven local identities have phone/desktop first-path coverage. |
| Crew field route and execution | [Crew route V1](../design/high-fidelity/field/crew-route-mobile-v1.png), [Jobs](../design/wireframes/field/03-jobs.svg), and [Job detail](../design/wireframes/field/04-job-detail.svg) | Adopted | Route uses progress → Current stop → Up next; Jobs uses compact ordered cards, readiness, search, and status filters; Job preserves context and primary actions while opening one semantic workflow panel at a time. Existing offline, evidence, conflict, and recovery contracts remain intact. |
| Manager daily operations | [Schedule V1](../design/high-fidelity/manager/schedule-desktop-v1.png), [manager hub](../design/wireframes/manager/00-manager-hub.svg), and [Recovery](../design/wireframes/manager/05-recovery.svg) | Adopted core | Schedule adopts Today’s operation, compact target controls, route board + inspector, and responsive stacking. Recovery adopts overview metrics, filtered queue + detail, lifecycle actions, and return-to-affected-work routing. Existing capacity, publish, persistence, and conflict contracts remain authoritative. |
| Completion proof and communication | [Reports wireframe](../design/wireframes/manager/04-reports.svg) and [shared proof wireframe](../design/wireframes/public/04-shared-customer-proof.svg) | Adopted core | Manager Reports opens the exact Job Report workflow. Shared proof uses a narrowed customer-safe API projection for immutable evidence and completed approved-recommendation outcomes. Shared proposals retain customer-safe scope/pricing, explicit decisions, recorded outcomes, and closed-link recovery. Regress as proof, delivery, and recommendation contracts evolve. |
| Yard Owner acquisition | [Working acquisition](../design/prototypes/yard-owner-acquisition/README.md) and [handoff](../design/review/yard-owner-acquisition-handoff.md) | Partial | Private intake, invitations, disclosure, assessments, proposals, collaboration, activation, and separate first-visit confirmation are delivered. Next: relationship continuity; curated discovery remains later and governed. |
| Yard Owner portal | [Working portal](../design/prototypes/yard-owner-portal/README.md) and [V2 handoff](../design/review/yard-owner-portal-v2-handoff.md) | Partial · shell/Home locally adopted | Home, Visits, Proof, and Account plus property context, local-review visit summaries, delivered proof, and recommendation history are adopted. Next persist customer visit reads, then service-day states, concern recovery, recommendation collaboration, and preferences. Billing remains product-gated. |
| Yard Crew acquisition | [Working provider journey](../design/prototypes/yard-crew-acquisition/README.md), [handoff](../design/review/yard-crew-acquisition-handoff.md), [entry/readiness contract](../docs/provider-entry-routing.md), and [operating-profile contract](../docs/provider-operating-profile.md) | Known-owner and safe preparation core adopted | Public routing, precise readiness, service/language operating facts, and first-time recipient confirmation through first-visit preparation are connected under a stable six-stage lifecycle. Provider availability/pause, credential checking, curated opportunities, and alerts remain gated. |
| Property-manager portfolios | [Connected working design](../design/prototypes/property-manager-portfolio/README.md) and [production handoff](../design/review/property-manager-portfolio-handoff.md) | Adopted core | PropertyManager receives Overview, Properties, Proof, and Approvals with scoped grouping/search, local-review readiness, protected proof and bids, partial-source isolation, and customer-safe provider accountability. Replace illustrative readiness only after authorized persisted customer visit reads exist. |
| Team, organization, and access | [Team wireframe](../design/wireframes/manager/03-team.svg) and [production handoff](../docs/team-organization-production-handoff.md) | Adopted core | The Organization Owner enters a live Team and access command center with partial-read isolation; direct member, invitation, crew, hierarchy-recovery, and audit paths; self-impact and last-owner safety; unavailable-versus-empty distinction; keyboard focus transfer; responsive regression; and a production map. Continue regression as authorization and hierarchy contracts evolve. |
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
4. Shared completion proof, proposal decisions, and completed recommendation/
   add-on continuity are adopted at the core production boundary.
5. **Active:** property-manager command-center core is adopted. Implement the
   accepted hybrid Yard Owner authorization model—account scope for verified
   owners, explicit property scope for delegates—then add persisted visit reads.
6. Yard Crew safe operating preparation is adopted through service categories
   and customer communication languages. Provider availability/pause,
   credential checking, curated discovery, and alerts await their explicit
   product/operations contracts.
7. Team/organization core convergence is adopted. Run the cross-application
   critical journeys after the remaining customer and completion boundaries close.

The hybrid customer-authorization decision reopens the repository-owned queue.
Grant/membership migration and a fail-closed resolver precede the minimized
visit read; repository maintenance and regression remain ongoing.

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
