# Grover Product Design

This directory is the design-review source for Grover's public website and
application experiences. It intentionally mirrors the product architecture so a
reviewer can discuss page hierarchy, content, actions, and responsive behavior
before implementation changes begin.

Open [`index.html`](index.html) in a browser to review the complete visual set.
The individual SVG files can also be opened directly in a browser, Figma, or an
SVG-capable editor.

## VPN review URL

When the local Vite development server is running, the complete gallery is
available at:

```text
http://<vpn-ip>:5173/design/
```

The route reads directly from this directory, disables browser caching, and is
available only from the development server. Design documents are deliberately
not copied into the production frontend build.

## Directory structure

```text
design/
├── assets/                            # Original imagery and generation briefs
├── components/                        # Reusable UI catalog and state coverage
├── foundations/                       # Color, type, spacing, icons, and imagery
├── high-fidelity/                     # Approved-direction visual concepts
├── index.html                         # Browsable visual gallery
├── information-architecture.md        # Page model and navigation boundaries
├── README.md                          # Workflow and ownership
├── prototypes/
│   ├── public-homepage/                # Responsive working V2 design
│   └── yard-owner-portal/              # Validated customer confidence journey
├── review/
│   ├── checklist.md                   # Questions for each design review
│   ├── decision-log.md                # Accepted decisions and open questions
│   ├── application-working-design-delivery-plan.md # Remaining application phases
│   ├── yard-owner-portal-plan.md       # Yard Owner audit and phased acceptance
│   ├── yard-owner-portal-handoff.md    # Production contract mapping
│   ├── yard-owner-portal-v2-enhancement-plan.md # Service-lifecycle phases
│   ├── yard-owner-portal-v2-handoff.md # V2 states and adoption contracts
│   ├── yard-owner-entry-provider-connection-plan.md # Owner acquisition and provider matching
│   └── v1-professional-direction.md   # Current visual review findings
├── tools/
│   ├── render-high-fidelity.mjs        # Professional visual concept renderer
│   ├── render-wireframes.mjs           # Deterministic SVG renderer
│   └── validate-yard-owner-portal.mjs  # Responsive customer-flow checks
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
5. **Working design:** validate responsive composition, interaction, content,
   keyboard behavior, recovery, and success as one connected journey.
6. **Implementation handoff:** link the approved screen, states, acceptance
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
   [`tools/render-wireframes.mjs`](tools/render-wireframes.mjs) or
   [`tools/render-high-fidelity.mjs`](tools/render-high-fidelity.mjs).
4. Regenerate the image set from the repository root:

   ```bash
   docker run --rm -u "$(id -u):$(id -g)" \
     -v "$PWD:/workspace" -w /workspace node:22 \
     node design/tools/render-wireframes.mjs
   ```

   Render the professional visual concepts with:

   ```bash
   docker run --rm -u "$(id -u):$(id -g)" \
     -v "$PWD:/workspace" -w /workspace node:22 \
     node design/tools/render-high-fidelity.mjs
   ```

5. Validate the changed images and update the decision status.
6. Create high-fidelity screens only after the page composition is accepted.

The public homepage working design has an additional browser validator:

```bash
node design/tools/validate-working-homepage.mjs
```

Pass `--capture` to refresh its desktop and mobile review images. The script uses
the Playwright dependency already installed for frontend validation.

Validate and capture the Yard Owner working design with:

```bash
node design/tools/validate-yard-owner-portal.mjs --capture
```

Generated SVG files are committed intentionally: reviewers should not need the
renderer or a design-tool account to see a proposed screen.

## Current review order

1. Launch the [working V2 public homepage](prototypes/public-homepage/index.html)
   and review audience, workflow, responsive, recovery, and success behavior.
2. Launch the [working Yard Owner V2 portal](prototypes/yard-owner-portal/index.html)
   and review service-day confidence, contextual questions, proof feedback,
   concern recovery, recommendation collaboration, customer-controlled
   preferences, and customer-safe boundaries.
3. Review the [V2 phased plan](review/yard-owner-portal-v2-enhancement-plan.md)
   and [V2 production handoff](review/yard-owner-portal-v2-handoff.md).
4. Review the
   [Yard Owner entry and provider-connection plan](review/yard-owner-entry-provider-connection-plan.md)
   for private property setup, guided photos, known-provider invitations,
   assessment, proposal, activation, and curated provider discovery.
5. Review the
   [application working-design delivery plan](review/application-working-design-delivery-plan.md)
   and its seven completion gates.
6. Review the [V1 visual foundation](foundations/visual-system-v1.svg).
7. Compare the [homepage](high-fidelity/public/homepage-desktop-v1.svg),
   [crew route](high-fidelity/field/crew-route-mobile-v1.svg), and
   [manager schedule](high-fidelity/manager/schedule-desktop-v1.svg) as one brand.
8. Review the field mobile sequence: Home → Route → Jobs → Job.
9. Review the manager hierarchy: hub → category → tool → record/action.
10. Review customer-safe pages and the separation from internal operations.
11. Confirm that homeowner self-service and multi-vendor management remain
   distinct product modes rather than being mixed into the core provider UI.
