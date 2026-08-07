# Grover Product Design

This directory is the design-review source for Grover's public website and
application experiences. It intentionally mirrors the product architecture so a
reviewer can discuss page hierarchy, content, actions, and responsive behavior
before implementation changes begin.

Open [`index.html`](index.html) in a browser to review the complete visual set.
The individual SVG files can also be opened directly in a browser, Figma, or an
SVG-capable editor.

## Directory structure

```text
design/
├── index.html                         # Browsable visual gallery
├── information-architecture.md        # Page model and navigation boundaries
├── README.md                          # Workflow and ownership
├── review/
│   ├── checklist.md                   # Questions for each design review
│   └── decision-log.md                # Accepted decisions and open questions
├── tools/
│   └── render-wireframes.mjs          # Deterministic SVG renderer
└── wireframes/
    ├── public/                         # Homepage, campaigns, conversion, shares
    ├── auth/                           # Sign-in and first-owner onboarding
    ├── field/                          # Crew Home, Route, Jobs, and Job detail
    ├── manager/                        # Hub plus six manager categories
    ├── customer/                       # Yard-owner and portfolio experiences
    ├── revenue/                        # Revenue administration
    ├── future/                         # Homeowner and multi-vendor product modes
    └── manifest.json                   # Machine-readable artifact inventory
```

## Fidelity stages

1. **Architecture:** confirm audiences, destinations, navigation, ownership, and
   boundaries between public, customer, field, and office experiences.
2. **Low-fidelity wireframes:** review content priority and workflow composition.
   The current SVG set is at this stage. Color is used only to establish hierarchy,
   not to approve the final visual system.
3. **Interaction states:** add loading, empty, unavailable, conflict, offline,
   permission, success, and destructive-confirmation variants for approved pages.
4. **High-fidelity design:** approve typography, spacing, color, iconography,
   photography, components, and desktop/mobile adaptations.
5. **Implementation handoff:** link the approved screen, states, acceptance
   criteria, and responsive behavior from the corresponding feature slice.

New UI work should not skip directly from a roadmap bullet to implementation.
Back-end or infrastructure work that has no visual consequence can proceed while
the relevant UI is under review.

## Artifact status labels

- **Current target:** represents an existing product area whose eventual visual
  organization is being reviewed.
- **Current + planned:** combines shipped foundations with clearly identified
  roadmap additions.
- **Active design target:** the next delivery slice currently being designed.
- **Planned target:** an approved roadmap area that is not yet fully delivered.
- **Future concept:** establishes boundaries and navigation only; it is not an
  implementation commitment.

## Review and change process

1. Review the gallery by audience and workflow, not by individual component.
2. Record decisions and unresolved questions in
   [`review/decision-log.md`](review/decision-log.md).
3. Revise the relevant source definition in
   [`tools/render-wireframes.mjs`](tools/render-wireframes.mjs).
4. Regenerate the image set from the repository root:

   ```bash
   docker run --rm -u "$(id -u):$(id -g)" \
     -v "$PWD:/workspace" -w /workspace node:22 \
     node design/tools/render-wireframes.mjs
   ```

5. Validate the changed images and update the decision status.
6. Create high-fidelity screens only after the page composition is accepted.

Generated SVG files are committed intentionally: reviewers should not need the
renderer or a design-tool account to see a proposed screen.

## Current review order

1. Confirm the global information architecture and persona navigation.
2. Approve the field mobile sequence: Home → Route → Jobs → Job.
3. Approve the manager hierarchy: hub → category → tool → record/action.
4. Review customer-safe pages and the separation from internal operations.
5. Review revenue administration as a later manager extension.
6. Confirm that homeowner self-service and multi-vendor management remain
   distinct product modes rather than being mixed into the core provider UI.
