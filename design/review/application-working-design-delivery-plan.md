# Application Working Design Delivery Plan

## Goal

Bring the current Grover application to the same review standard as the V2 public
homepage through connected, responsive working designs—not a larger collection of
isolated high-fidelity screens.

The plan covers the current public, access, field, manager, customer, and revenue
application targets. The homeowner assistant and multi-vendor portfolio remain
separate future product modes and are not promoted into current-product design by
this plan.

## Delivery strategy

### Design workflows, not directories

A phase follows a real task across screens, roles, and states. For example, field
execution is designed as Home → Route → Jobs → Job → completion handoff rather
than as four unrelated mobile pages. This reveals broken navigation, missing
state, unclear ownership, and inconsistent content earlier.

### Establish shared application primitives first

The homepage validated the public visual language. Authenticated work additionally
needs a stable application shell, navigation model, organization/persona context,
operational density rules, and reusable state components. Those primitives are
the first phase so later prototypes share real code and interaction behavior.

### Finish current and risky workflows before planned breadth

Priority is based on:

1. Safety and recovery risk
2. Frequency of use
3. Dependency leverage across later workflows
4. Current delivery status in `PLAN.md`
5. Number of roles receiving or handing off the work

This places field execution, schedule/recovery, and completion proof ahead of
revenue concepts. It also prevents planned revenue surfaces from looking shipped.

## The homepage standard for application design

Every workflow phase is complete only when all seven gates pass.

| Gate | Required evidence |
| --- | --- |
| 1. Workflow truth | Audience, primary outcome, upstream/downstream handoff, permissions, and shipped/planned boundaries are documented. |
| 2. Responsive composition | Mobile and desktop behavior is explicit; tablet is included where density or navigation materially changes. |
| 3. Working prototype | Primary navigation, selection, drill-down, actions, confirmations, and return paths operate without a production API. |
| 4. State coverage | Loading, empty, unavailable, offline/local-only, conflict, permission, destructive, and success states are included where relevant. |
| 5. Accessibility contract | Semantic structure, keyboard behavior, focus movement, announcements, text zoom, reduced motion, and 44px mobile targets are defined and exercised. |
| 6. Validation | Repeatable browser checks cover reference viewports, overflow, browser errors, keyboard paths, focus, state transitions, and local assets. |
| 7. Handoff | Gallery entry, manifest, viewport references, decision record, production-contract mapping, and `PLAN.md` status are current. |

Static SVGs remain valuable composition inputs, but they do not satisfy gates 3–7.

## Artifact convention

Each workflow uses the same review package:

```text
design/
├── prototypes/
│   ├── shared/                         # Application shell and reusable UI
│   └── <workflow>/                     # Dependency-free working design
├── high-fidelity/<area>/
│   ├── <workflow>-desktop-vN.png
│   └── <workflow>-mobile-vN.png
├── review/
│   ├── <workflow>-plan.md
│   └── <workflow>-handoff.md
└── tools/
    └── validate-<workflow>.mjs
```

Shared prototype files must not become a second production component library.
They are design-review code whose decisions are mapped deliberately into React
during a later implementation slice.

## Phase summary

| Phase | Workflow | Priority | Starting evidence | Working-design target |
| --- | --- | --- | --- | --- |
| 0 | Application foundation and shell | P0 | Visual system, manager schedule, crew route | Shared shell and state laboratory |
| 1 | Access, setup, and persona Home | P0 | Access wireframe, existing production flows | Entry-to-ready workspace prototype |
| 2 | Field execution | P0 | Four field wireframes, crew route V1 | Complete mobile field-day prototype |
| 3 | Manager daily operations | P0 | Hub, schedule V1, Recovery wireframe | Hub-to-dispatch-to-recovery prototype |
| 4 | Completion proof and communication | P0 | Reports and shared-proof wireframes | Field-to-manager-to-customer proof prototype |
| 5 | Customers and portfolios | P1 | Manager customer and two customer wireframes | Provider onboarding plus customer confidence prototype |
| 6 | Team, organization, and access administration | P1 | Team and access wireframes | Invitation-to-hierarchy-to-audit prototype |
| 7 | Revenue operations | P2 / planned | Revenue wireframe and delivered bid foundations | Scope-to-billing-readiness prototype |
| 8 | Cross-application convergence | P0 gate | Outputs of phases 0–7 | Linked critical journeys and regression package |

## Phase 0 — Application foundation and shell

### Purpose

Prevent every later workflow from independently solving navigation, page
identity, density, forms, status, and recovery.

### Deliverables

- Responsive authenticated shell:
  - desktop application rail;
  - mobile bottom navigation;
  - manager category and tool context;
  - organization, persona, and signed-in identity context;
  - breadcrumb or context-return behavior;
  - global sync, offline, API readiness, and update placement.
- Working component/state laboratory for:
  - buttons, fields, search, filters, segmented controls, and dialogs;
  - route/job records, metric tiles, schedule blocks, tables, timelines, and
    before/after evidence;
  - loading, empty, unavailable, offline, conflict, permission, destructive, and
    success feedback.
- Density rules for mobile field, mobile manager, desktop manager, and customer
  views.
- Shared browser validation helpers and reference viewport matrix.

### Key decisions

- Whether desktop Home returns to the last tool or always opens the persona Home.
- Exact manager rail/category relationship at tablet widths.
- One outlined SVG icon family for production handoff.
- Placement and priority of simultaneous offline, sync, update, and API states.

### Exit condition

Later prototypes can assemble their shell, controls, records, and state feedback
without redefining interaction or accessibility behavior.

## Phase 1 — Access, setup, and persona Home

### Connected journey

Sign in or invitation → recoverable authentication → first-owner organization
setup or invitation acceptance → persona-aware Home → primary workspace.

### Representative roles

- First organization owner
- Invited crew lead/member
- Operations manager
- Yard owner/property manager

### Required states

- Session loading and slow startup
- Authentication unavailable and retry
- Invalid, expired, used, or revoked invitation
- Existing account versus first-owner setup
- Incomplete company readiness
- Missing membership, unauthorized persona, and no assigned work
- Pending sync, work remaining, clear day, and completed day Home variants
- Successful setup with the next useful action

### Exit condition

Each representative role can enter, understand its context and most important
state, and reach the correct first task without seeing unauthorized destinations.

## Phase 2 — Field execution

### Connected journey

Field Home → Route → Jobs → Job overview → Checklist / Photos / Add-ons / Report
→ complete or recover queued work → next stop.

### Responsive focus

- Primary: 390px mobile with safe-area behavior and outdoor readability
- Secondary: tablet and desktop adaptation without turning the field workflow
  into the manager dashboard

### Required states

- No route or no assigned jobs
- Current and next stop, full-route expansion, and route amendment
- Job not started, in progress, completion blocked, and complete
- Checklist progress and idempotent conflict
- Photo capture, quality rejection, processing, queued upload, and erasure state
- Offline queue health, durable-storage unavailable, replay, retry, and conflict
- Report readiness, recommendation/add-on context, and clean completion handoff

### Exit condition

A crew member can complete a representative field day through weak connectivity,
understand what is local versus persisted, recover conflicts, and leave a
manager-reviewable completion record.

## Phase 3 — Manager daily operations

### Connected journey

Manager Home → operations hub → Schedule → crew lane / selected route → draft,
assign, reorder, publish, or reassign → Recovery → inspect, own, resolve, or reopen
an operational exception → return to affected work.

### Responsive focus

- 1440px crew-lane command center
- Tablet composition where inspector and board cannot coexist unchanged
- 390px category → tool → record progression

### Required states

- No plan, draft, published, changed, and stale schedule
- Capacity warning, over-capacity blocker, missing lead, and unassigned work
- Persistence unavailable, changed-record conflict, and rejected publication
- Reassignment impact and destructive confirmation
- Recovery queue empty, filtered, assigned, in progress, resolved, and reopened
- Immutable activity context and return to the affected record

### Exit condition

A manager can prepare and publish a safe day, identify risk, recover a failed or
conflicting operation, and return to the original context on desktop or mobile.

## Phase 4 — Completion proof and communication

### Connected journey

Crew completion → manager report review → evidence approval/rejection → customer
delivery → customer-safe report → recommendation or bid decision → delivery and
decision history.

### Required states

- Report assembling, blocked, ready, under review, approved, and delivered
- Photo evidence pending, rejected, replaced, or erased
- Review notes and quality-check outcome
- Delivery preference blocked, provider failure, retry, and resolution
- Shared link valid, expired, revoked, missing, or unavailable
- Bid pending, approved, rejected, expired, revoked, or converted
- Customer success with the next expected service or decision

### Exit condition

The same completed work remains understandable and safe as it passes from crew to
manager to customer, without exposing internal provider notes or identifiers.

## Phase 5 — Customers and portfolios

### Connected journey

Manager Customers → account → property onboarding/readiness → service and crew
coverage → yard-owner property view or property-manager portfolio → service
history, proof, bid, preference, or support action.

### Required states

- No customers, no properties, archived account, and reactivation
- Duplicate customer/property and changed-record conflict
- Contact, access, service-area, portfolio, or crew-readiness blocker
- Empty portfolio, partial coverage, overdue need, and unavailable property data
- Customer property selection, newest proof, older history, and bid separation
- Provider-only information exclusion and permission boundary

### Exit condition

Providers can make an account service-ready, while yard owners and property
managers receive simpler, role-appropriate confidence views of the same work.

## Phase 6 — Team, organization, and access administration

### Connected journey

Organization setup → invite → accept / reissue / revoke → membership and profile
administration → crew creation and leadership → branch/territory hierarchy →
activity review and recovery.

### Required states

- Empty team, pending/expired invitation, duplicate member, and unavailable send
- Role/status change, self-impact warning, and permission denial
- Crew without lead, capacity issue, inactive crew, and duplicate crew name
- Unstaffed territory, cross-branch move impact, lifecycle status, and audit trail
- Search/filter/pagination restoration and immutable-ID support handoff
- Destructive change confirmation and completed recovery

### Exit condition

An owner can build and safely change the operating organization, understand the
impact of access and hierarchy decisions, and trace every material outcome.

## Phase 7 — Revenue operations

### Gate

This phase begins only after the service catalog, contract, estimate, billing,
invoice, and cost boundaries are confirmed as product decisions. Until then the
existing artifact remains a planned target, not a delivery claim.

### Connected journey

Service catalog → customer contract → estimate/change approval → field completion
evidence → billing readiness → invoice/payment → cost and profitability review.

### Required states

- Draft, approved, inactive, and conflicting scope
- Change awaiting customer approval, rejected, expired, or converted
- Completion evidence missing or billing blocked
- Partial invoice, failed payment, outstanding balance, credit, and refund
- Cost unavailable, incomplete labor/material capture, and margin risk
- Customer-safe money views versus internal cost views

### Exit condition

Approved scope and verified work can move toward payment with every blocker,
decision, and audience boundary visible. Planned behavior remains labeled until
its production contract exists.

## Phase 8 — Cross-application convergence

### Critical journeys

1. Public interest → request → sign in or invitation → persona Home
2. Manager publishes route → crew completes work offline → manager resolves
   conflict → customer receives proof
3. Customer recommendation → bid decision → converted work → billing readiness
4. Owner invites member → assigns crew/hierarchy → manager schedules that crew

### Deliverables

- One gallery route through every completed working prototype
- Cross-phase content, status, icon, navigation, and component consistency audit
- Keyboard-only and mobile critical-path validation
- Text zoom, reduced motion, forced colors, and screenshot regression pass
- Final current/planned/future labeling audit
- Application-wide handoff index mapping designs to production routes,
  components, APIs, state contracts, and tests

### Exit condition

The application can be reviewed as a coherent product rather than a set of pages,
and every current UI implementation slice has an approved responsive workflow,
state matrix, validation record, and production handoff.

## Phase execution cadence

Each phase should be delivered in four reviewable slices:

1. **Workflow contract:** review current implementation and data contracts, settle
   composition and state decisions, update the decision log.
2. **Working composition:** implement the responsive happy path and shared
   navigation using the Phase 0 primitives.
3. **States and accessibility:** add failure, offline, conflict, permission,
   destructive, success, focus, keyboard, and announcement behavior.
4. **Validation and handoff:** capture references, run browser checks, update the
   gallery/manifests/project records, and document production adoption.

Normal local commits should follow those slices. A phase proceeds to the next
safe slice automatically when its gates pass; it pauses only for a materially
different product decision, missing authority, or unavailable required contract.

## Progress tracker

| Phase | Status | Next action |
| --- | --- | --- |
| 0. Foundation and shell | Next | Audit production shell and define shared state/component inventory |
| 1. Access, setup, and Home | Planned | Begin after shell composition is validated |
| 2. Field execution | Planned | Reuse crew Route V1 direction in connected prototype |
| 3. Manager daily operations | Planned | Reuse schedule V1 and Recovery wireframe |
| 4. Completion proof | Planned | Map current report, evidence, delivery, and bid contracts |
| 5. Customers and portfolios | In progress · Yard Owner complete | Review production adoption, then continue provider onboarding and property-manager scope |
| 6. Team and organization | Planned | Map invitation, membership, crew, and hierarchy decisions |
| 7. Revenue operations | Product-gated | Confirm planned product contracts before high fidelity |
| 8. Convergence | Planned | Begin after phases 0–7 reach their applicable gates |
