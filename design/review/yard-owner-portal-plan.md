# Yard Owner Portal Working-Design Plan

## Goal

Turn the current Yard Owner portal foundations into a calm, trustworthy customer
product that answers three questions in order:

1. What happens next at my property?
2. What changed during the last visit?
3. Is there anything I need to decide?

The result is a responsive, dependency-free working design for review. It maps to
current customer, property, completion-report, and bid contracts without exposing
provider-only operations or implying that planned self-service features are
already delivered.

## Delivery status

| Phase | Status | Evidence |
| --- | --- | --- |
| 1. Product and workflow audit | Complete | Current UI, wireframe, roles, data contracts, and customer-safe boundaries reviewed |
| 2. Responsive confidence journey | In progress | `design/prototypes/yard-owner-portal/` |
| 3. Decisions, recovery, and accessibility | Planned | Prototype review controls and browser validator |
| 4. Review package and handoff | Planned | Gallery, viewport images, manifest, handoff, and project records |

## Current product evidence

### Delivered foundations to preserve

- `PropertyOwner` is a distinct role with a customer-scoped workspace.
- Customer properties and work summaries are filtered by both customer and
  organization before they reach the portal.
- A yard owner can inspect their properties, service-work summaries, delivered
  completion-report history, photo-backed shared reports, bid history, and a
  shared bid decision experience.
- Bid review already supports approval, rejection, confirmation, answered and
  converted outcomes, expiration, unavailable data, and recoverable persistence
  failure.
- Completion reports already distinguish loading, unavailable, delivered proof,
  checklist, add-on, notes, and photo evidence.
- The mobile application already separates Home from My yard and preserves a
  role-aware shell.

### Problems in the current composition

- “Customer portal preview” sounds internal and provisional instead of welcoming
  the signed-in customer into a finished product.
- Property, report, and bid counts lead the page even though they do not help a
  homeowner understand the next service or the condition of the yard.
- Properties and bids behave like parallel databases. The customer must assemble
  a story from disconnected lists instead of following the service lifecycle.
- Upcoming service is represented as a generic work status, without a clear date,
  service window, scope, or expectation.
- Delivered proof is link-heavy and does not preview the outcome, evidence, or
  recommendation that makes the report valuable.
- Bid urgency, price, expiration, and relationship to the observed yard need are
  not prominent enough at the decision point.
- Mobile drill-down reduces page length, but it does not establish a stable
  customer information architecture beyond Home versus My yard.
- Error and empty states are technically present in separate components but do
  not form a coherent, reassuring portal-level recovery experience.
- Provider terminology such as work summaries and report history dominates over
  customer language such as visits, completed care, and recommendations.

## Product recommendations

### 1. Lead with confidence, not metrics

Replace dashboard counts with a personalized status line and one prominent next
visit. The first viewport should communicate date, arrival window, service scope,
property, and whether the owner needs to prepare anything.

### 2. Organize the portal around the service lifecycle

Use four durable customer destinations:

- **Home:** next visit, action needed, latest proof, and provider contact.
- **Visits:** upcoming and completed service timeline.
- **Proof:** delivered reports, evidence, completed care, and recommendations.
- **Account:** properties and communication/contact context that is actually
  supported, with unsupported settings clearly marked for later product work.

Bids remain contextual actions on Home and within the related visit/proof story.
They do not become a competing primary destination.

### 3. Turn proof into a visual outcome

Preview the latest delivered report with completion status, before/after evidence,
completed tasks, and the next recommendation. Older reports remain available in a
scannable history.

### 4. Make decisions complete and safe

The bid surface must show why the work was recommended, line items, total,
expiration, decision consequences, explicit approval/rejection confirmation,
recoverable persistence errors, and the completed response. A pending decision is
visible but should not overpower the next scheduled service unless it is urgent.

### 5. Use customer language and progressive disclosure

Prefer visit, care, proof, recommendation, and provider. Reveal detailed service
records only after selection. Internal IDs, crew allocation, recovery queues,
unpublished proof, billing notes, audit data, and staff-only quality decisions are
never shown.

### 6. Be explicit about current versus planned behavior

This working design exercises delivered concepts: property selection, upcoming
and past visits, delivered proof, report history, provider contact context, bid
review, and bid decisions. New support tickets, ratings, editable notification
preferences, invoices, and payments remain planned and are not presented as live
capabilities.

## Intended journey

```text
Sign in
  → Home / service confidence
      → inspect next visit
      → review contextual bid, if action is needed
      → preview latest completed care
  → Visits / chronological service context
      → select completed visit
      → open delivered proof
  → Proof / outcome and evidence
      → inspect newest report
      → browse older delivered reports
  → Account / property and provider context
      → switch property
      → return to property-specific Home
```

Every detail surface has a clear return path. Selecting a property updates the
entire customer context rather than filtering only one card.

## Responsive composition

### Mobile · 390 × 844

- Compact brand, property context, and account control at the top.
- One-column content with the next visit and decision status before history.
- Fixed four-item bottom navigation with safe-area spacing and 44px targets.
- Detail and bid review open as full-height layers with visible close/back actions.
- Evidence pairs stack without cropping away their meaning.

### Tablet · 768 × 1024

- Content remains touch-first; the next visit and action panel may share a row.
- Bottom navigation becomes a top or side navigation only when labels remain
  stable and content does not jump.
- Detail layers use a centered wide sheet.

### Desktop · 1440 × 1000

- Persistent left customer navigation and property selector.
- Main confidence story occupies the wider center column.
- Latest proof or action-needed context forms a quieter supporting rail.
- The desktop layout does not turn into the provider command center or add
  internal operational density.

## State matrix

| Surface | Loading | Valid empty | Unavailable / restricted | Success / recovery |
| --- | --- | --- | --- | --- |
| Portal | Skeleton hierarchy | Account has no active property | Customer context cannot be loaded | Retry preserves the current destination |
| Next visit | Date and scope skeleton | Nothing currently scheduled | Schedule temporarily unavailable | Rescheduled/canceled copy explains the next expectation |
| Visits | Timeline skeleton | No visits yet | Visit history unavailable | Selected visit opens with a reliable return path |
| Proof | Evidence skeleton | No delivered reports yet | Missing, revoked, or expired report | Latest delivered proof is announced and selectable |
| Bid | Line-item skeleton | No decision required | Expired, revoked, or persistence unavailable | Approval/rejection confirmation and returned focus |
| Property | Selector skeleton | No active property | Property outside customer scope | Property change updates all views and is announced |

## Accessibility contract

- One page H1 and semantic header, navigation, main, sections, articles, and
  dialog/sheet landmarks.
- Skip link reaches the current view content.
- Navigation uses `aria-current`; segmented property selection and report filters
  expose names and state without relying on color.
- Dialogs trap focus, close with Escape, restore focus, and identify their title.
- Dynamic view, property, bid, and error changes use concise live announcements.
- All mobile controls are at least 44 × 44 CSS pixels.
- Visible focus remains distinct in light, dark, warning, and image contexts.
- Normal and zoomed text do not require horizontal scrolling at 320 CSS pixels.
- Motion is optional and disabled through `prefers-reduced-motion`.
- Skeletons are hidden from assistive technology and paired with meaningful
  status text.

## Delivery phases

### Phase 1 — Product and workflow audit

Deliverables:

- Review the current wireframe, production portal, shared report and bid pages,
  role model, customer filters, API states, and roadmap boundaries.
- Record the hierarchy, terminology, navigation, bid placement, and privacy
  decisions in this plan and the design decision log.

Exit criteria:

- The customer job, current/planned boundary, information exclusions, state
  requirements, responsive behavior, and acceptance criteria are explicit.

### Phase 2 — Responsive confidence journey

Deliverables:

- Create a dependency-free prototype in
  `design/prototypes/yard-owner-portal/`.
- Implement Home, Visits, Proof, and Account across reference viewports.
- Implement property-wide context switching, next-visit detail, latest proof,
  evidence preview, history selection, and contextual bid entry.

Exit criteria:

- The happy path works without an application server or API.
- Every primary action has an implemented destination and clear return path.
- The page remains coherent at mobile, tablet, desktop, and 200% text zoom.

### Phase 3 — Decisions, recovery, and accessibility

Deliverables:

- Implement bid confirmation, simulated persistence failure, retry, approval,
  rejection, expired decision, and completed decision states.
- Implement portal loading, empty schedule, no proof, unavailable data, and
  revoked/expired report states through review controls.
- Exercise keyboard navigation, focus containment and restoration, live
  announcements, reduced motion, and touch-target requirements.

Exit criteria:

- A reviewer can inspect every required customer-safe state without changing
  source code.
- Keyboard and pointer users can complete and recover the primary journeys.

### Phase 4 — Review package and handoff

Deliverables:

- Add desktop and mobile reference images, gallery entry, manifest records,
  validator, prototype guide, implementation handoff, and project record updates.
- Map every prototype concept to current production components/contracts or a
  clearly labeled future implementation dependency.

Exit criteria:

- The design passes all seven application working-design gates and is remotely
  reviewable from the development server's `/design/` route.

## Acceptance criteria

- The first viewport communicates the next service and preparation expectation
  before showing aggregate history.
- A pending bid is understandable in context and can be approved or rejected
  through a complete, confirmed, recoverable interaction.
- The newest delivered proof communicates outcome, evidence, completed care, and
  recommendation without requiring the owner to infer a story from IDs or links.
- Property selection updates the next visit, history, proof, bid, and account
  context consistently.
- Provider-only notes, internal identifiers, crew-management state, recovery
  details, and unpublished evidence are absent.
- Empty, loading, unavailable, expired/revoked, error, and completed states are
  available and customer-safe.
- The prototype has no production API, authentication, persistence, notification,
  payment, or support-ticket dependency.
- Illustrative property, visit, proof, and pricing data are labeled as design
  review data and are not represented as real customer records.
- Browser validation covers 390px and 1440px viewports, overflow, console errors,
  minimum target sizes, keyboard navigation, focus return, property context,
  bid recovery, and state switching.

## Boundaries

- This phase updates the design-review workspace, not the production React portal.
- The prototype does not schedule, cancel, message, charge, notify, or persist a
  customer decision.
- Homeowner self-service planning, diagnostics, supplies, education, and DIY task
  management remain a separate future product mode.
- Property-manager multi-property operations remain a related but separate
  workflow after this yard-owner design reaches its gates.
