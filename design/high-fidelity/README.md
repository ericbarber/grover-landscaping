# High-Fidelity Concepts

These concepts apply the first Grover visual direction to representative product
surfaces. They remain design-review artifacts rather than production screenshots,
but several of their approved decisions have now been adopted in React. Track
that distinction in the
[`prototype adoption matrix`](../../project-planning/PROTOTYPE_ADOPTION.md).

## V2 working public design

| Artifact | Review image | Purpose |
| --- | --- | --- |
| [`../prototypes/public-homepage/index.html`](../prototypes/public-homepage/index.html) | [Desktop](public/homepage-desktop-v2.png) · [Mobile](public/homepage-mobile-v2.png) | Responsive, persona-aware public journey with workflow and conversion states |

The V2 public artifact is interactive and browser-validated. Its theme, split
hero, persona continuity, Plan–Care–Proof tour, direct signup paths, and
conversion-state contracts are adopted in the production React page; the static
prototype remains the review reference. See the
[`V2 handoff`](../review/v2-working-homepage-handoff.md) for behavior, validation,
and adoption guidance.

## Production adoption status

| Direction | Status |
| --- | --- |
| Public homepage V2 | Adopted, with illustrative previews retained until approved production captures exist |
| Visual foundation V1 | Partial; shared tokens, typography, wordmark, controls, and shell materials are adopted |
| Crew route mobile V1 | Partial; workflow foundations exist, but connected field composition adoption remains |
| Manager schedule desktop V1 | Partial; marketing dashboard adopted, authenticated schedule/inspector convergence remains |

## V1 review set

| Artifact | Review image | Purpose |
| --- | --- | --- |
| [`../foundations/visual-system-v1.svg`](../foundations/visual-system-v1.svg) | [PNG](../foundations/visual-system-v1.png) | Palette, type roles, actions, records, status, and voice |
| [`public/homepage-desktop-v1.svg`](public/homepage-desktop-v1.svg) | [PNG](public/homepage-desktop-v1.png) | Editorial marketing, proof, product rhythm, and conversion |
| [`field/crew-route-mobile-v1.svg`](field/crew-route-mobile-v1.svg) | [PNG](field/crew-route-mobile-v1.png) | Field hierarchy, progress, sync confidence, and current-stop action |
| [`manager/schedule-desktop-v1.svg`](manager/schedule-desktop-v1.svg) | [PNG](manager/schedule-desktop-v1.png) | Operational density, schedule lanes, capacity risk, and inspector workflow |

## What this set is testing

- Can one brand feel warm to customers and precise to operators?
- Is the editorial display type confined to appropriate moments?
- Does evergreen retain enough emphasis when semantic state colors appear?
- Does field mobile keep the current stop and safe action unmistakable?
- Can desktop management increase density without returning to a wall of cards?
- Do risk and recovery states feel serious without making the entire product feel
  alarming?

## Next design expansion

1. Continue the adopted authenticated Schedule command center through capacity,
   publish-conflict, and stale-state convergence, then connect Recovery.
2. Continue state-by-state field regression as shared primitives evolve; Route,
   compact Jobs, and one-panel Job execution are in production.
3. Migrate remaining manager-local feedback to shared primitives without
   weakening operational recovery.
4. Link each implementation slice back to the adoption matrix and validated
   artifact rather than treating the image itself as shipped behavior.

The SVG files are editable source artifacts. PNG files are validated browser
renders for review, sharing, and comparison.
