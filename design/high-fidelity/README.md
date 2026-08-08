# High-Fidelity Concepts

These concepts apply the first Grover visual direction to representative product
surfaces. They are design-review artifacts, not screenshots of implemented code.

## V2 working public design

| Artifact | Review image | Purpose |
| --- | --- | --- |
| [`../prototypes/public-homepage/index.html`](../prototypes/public-homepage/index.html) | [Desktop](public/homepage-desktop-v2.png) · [Mobile](public/homepage-mobile-v2.png) | Responsive, persona-aware public journey with workflow and conversion states |

The V2 public artifact is interactive and browser-validated. It remains a design
prototype rather than the production React page. See the
[`V2 handoff`](../review/v2-working-homepage-handoff.md) for behavior, validation,
and adoption guidance.

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

1. Decide whether to adopt the working public design in the production React
   homepage as one slice or as smaller foundation, hero, workflow, and conversion
   slices.
2. Add a responsive manager schedule interaction model.
3. Design Job Detail, Recovery, and customer report states.
4. Link validated artifacts from each matching implementation slice.

The SVG files are editable source artifacts. PNG files are validated browser
renders for review, sharing, and comparison.
