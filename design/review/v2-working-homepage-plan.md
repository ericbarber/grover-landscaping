# V2 Working Homepage Plan

## Goal

Turn the approved-direction public homepage concept into a complete, responsive,
and accessible working design that demonstrates the intended visitor journey
without depending on the production application or a hosted design tool.

The design should help a visitor answer, in order:

1. What is Grover and why is it relevant to me?
2. How does the product connect planning, field care, and customer proof?
3. Which parts of the promise are supported by real product capabilities?
4. What is the right next step for my role?
5. What will happen after I request a conversation?

## Professional review findings

### Keep

- The balanced Southwestern editorial and operational-console direction.
- The split hero: it gives the promise and the product proof distinct jobs.
- Evergreen, bone, paper, sand, clay, and restrained semantic color.
- Plan–Care–Proof as the durable product narrative.
- Honest capability proof in place of invented customer quotes or metrics.

### Improve

- Replace the static first-viewport concept with a full journey from message to
  audience relevance, workflow inspection, credibility, and conversion.
- Make the hero proof card respond to the selected audience so the page feels
  relevant without creating four disconnected landing pages.
- Use one primary conversion action per viewport and make secondary actions move
  visitors deeper into the story instead of competing with conversion.
- Make Plan–Care–Proof an interactive workflow with concrete operational previews,
  keyboard behavior, visible selection, and persona-specific outcomes.
- Separate live product capabilities from illustrative operating data. Example
  counts must be explicitly labeled as a product preview, not customer evidence.
- Reduce repeated card grids. Use editorial sections, an audience switcher, one
  workflow stage, a capability ledger, and a focused final conversion band.
- Add a compact mobile navigation model, touch-safe controls, visible focus,
  reduced-motion behavior, and a dialog that returns focus when closed.
- Show form validation, submitting, recoverable error, and success patterns in the
  working design rather than describing them only in documentation.

## Delivery phases

### Phase 1 — Review and journey definition

Deliverables:

- Record this review, the intended visitor journey, content hierarchy, and design
  recommendations.
- Resolve the V1 questions that can be answered through professional review:
  retain the split hero, crew-lane schedule direction, current-stop field
  hierarchy, and clay as a restrained risk color.
- Define prototype scope and acceptance criteria without changing production UI.

Exit criteria:

- The visitor journey and design decisions are explicit and reviewable.
- `PLAN.md` accurately identifies the working homepage as the active design slice.

### Phase 2 — Responsive working design

Deliverables:

- Create a dependency-free prototype under `design/prototypes/public-homepage/`.
- Implement the responsive header, hero, audience switcher, product workflow,
  capability proof, final conversion band, and footer.
- Reuse the approved project-local landscape image and V1 design tokens.
- Keep the page usable at mobile, tablet, desktop, and 200% text zoom.

Exit criteria:

- The prototype opens from a local static server and has no application or API
  dependency.
- Layout remains coherent at 390px and 1440px viewport widths.
- Every primary link and button has a working destination or interaction.

### Phase 3 — Interaction, accessibility, and states

Deliverables:

- Add working persona selection, Plan–Care–Proof selection, mobile navigation,
  conversion dialog, inline validation, error simulation, and success state.
- Preserve selected audience context through the page and request form.
- Add skip navigation, semantic landmarks, labeled tabs, focus management,
  keyboard interaction, live status announcements, and reduced-motion support.
- Define illustrative-data labeling and state copy in the interface itself.

Exit criteria:

- Audience and workflow tabs work with pointer and arrow keys.
- The dialog traps focus, closes with Escape, restores focus, and prevents
  background scroll while open.
- Required fields expose useful validation and the request can demonstrate both
  recovery and successful completion without a backend.

### Phase 4 — Review package and validation

Deliverables:

- Link the working prototype from the design gallery and design documentation.
- Capture desktop and mobile review images from the working page.
- Add a concise implementation handoff describing behavior and state coverage.
- Validate HTML structure, local asset resolution, responsive screenshots,
  keyboard flows, and console output.

Exit criteria:

- A reviewer can open the gallery, launch the prototype, inspect both reference
  images, and understand what is approved versus illustrative.
- Design records accurately distinguish the completed working design from future
  production implementation.

## Acceptance criteria

- One clear H1 and one primary hero action.
- Selected audience changes the headline, supporting copy, proof preview, outcome
  copy, and conversion action consistently.
- Plan, Care, and Proof each show a concrete workflow preview and next-team value.
- Claims map to delivered capabilities listed in `PLAN.md`; no invented customer
  endorsement, production metric, or pricing claim appears.
- Normal text and interactive controls target WCAG 2.2 AA contrast.
- All interactive targets are at least 44 by 44 CSS pixels.
- Focus is visible and logical; color is never the only indicator of state.
- The page supports `prefers-reduced-motion` and does not require animation.
- The request design explains what happens next and demonstrates validation,
  recoverable failure, submission, and success.
- The prototype makes clear that its operating counts and form delivery are
  illustrative design-review behavior.

## Boundaries

- This phase updates `design/` only; it does not replace the production React
  homepage.
- The prototype does not send leads, record analytics, authenticate users, or
  claim that preview data belongs to a real customer.
- Production adoption should occur in a separate implementation slice after this
  working design is reviewed against the current React workflow.
