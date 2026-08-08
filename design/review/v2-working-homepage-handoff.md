# V2 Working Homepage Handoff

## Outcome

The public homepage design is now a complete, responsive, dependency-free
prototype rather than a static first-viewport concept. It preserves the V1 split
hero and visual system while connecting the full visitor journey:

```text
Promise → audience relevance → Plan–Care–Proof inspection
        → capability-backed credibility → appropriate request → recovery/success
```

Launch the [working design](../prototypes/public-homepage/index.html), or review
the [desktop](../high-fidelity/public/homepage-desktop-v2.png) and
[mobile](../high-fidelity/public/homepage-mobile-v2.png) viewport references.

## Applied recommendations

- Keep the split hero; it separates the emotional promise from concrete product
  evidence more clearly than a full-bleed image.
- Carry one audience choice through headline, preview, outcomes, workflow value,
  and request language instead of building four disconnected stories.
- Keep one primary conversion action in each major viewport. Secondary actions
  advance the product story.
- Use Plan–Care–Proof as an interactive handoff narrative with one detailed stage
  at a time, not as three equal feature cards.
- Replace repeated marketing-card grids with an outcome ledger and capability
  ledger that are easier to scan and less visually interchangeable.
- Label operating counts as illustrative. Keep customer claims out until the
  quote, logo, metric, and usage permission are verified.
- Demonstrate validation, preserved-entry recovery, and success in the design so
  production states are not left to implementation guesswork.

## Responsive contract

| Surface | Composition |
| --- | --- |
| Mobile | Message, primary action, audience choice, then product preview; one workflow stage at a time; compact navigation menu |
| Tablet | Stacked hero with larger product preview; horizontal workflow stage selector; single-column dialog when needed |
| Desktop | Split hero, persistent navigation, side-by-side workflow explanation and preview, two-column request dialog |

The validated reference widths are 390px and 1440px. Content remains in logical
source order when the layout stacks.

## Interaction and state coverage

| Area | Covered behavior |
| --- | --- |
| Audience | Pointer selection, arrow keys, Home/End, selected state, page-wide content continuity |
| Workflow | Pointer selection, arrow keys, Home/End, selected stage, concrete preview, persona-specific handoff value |
| Mobile navigation | Open, close, destination selection, state announcement through `aria-expanded` |
| Request dialog | Audience context, native modal behavior, Escape, close actions, focus restoration |
| Validation | Missing name, invalid or missing email, missing consent, first-invalid-field focus |
| Recovery | Simulated delivery failure, explicit persistence outcome, entries preserved, retry path |
| Success | Named confirmation, next expectation, explicit no-transmission prototype boundary |

## Validation result

`design/tools/validate-working-homepage.mjs` passes with:

- one H1 and no horizontal overflow at 390px and 1440px;
- no browser console or page errors;
- audience and workflow pointer/keyboard behavior;
- dialog focus restoration after Escape;
- validation, recoverable failure, preserved entries, and success;
- mobile navigation open/close behavior; and
- visible mobile interactive targets of at least 44 by 44 CSS pixels.

The working design also includes a skip link, visible focus, semantic landmarks,
text labels for state, reduced-motion behavior, and forced-colors boundaries.

## Production adoption recommendation

Adopt this design in the React homepage as one reviewable public-experience slice
because the persona, workflow, and request language share state. Preserve the
existing production contracts for campaign paths, metadata, analytics, lead
persistence, spam protection, and backend-aware success. Reuse the prototype's
visual and interaction decisions; do not copy its simulated submission behavior
into production.

Before production handoff is considered complete:

1. Map the prototype audience IDs to the existing marketing persona domain.
2. Keep URL, canonical metadata, UTM attribution, and analytics behavior intact.
3. Connect request states to the real lead API and distinguish persisted success
   from local preview exactly as the current application does.
4. Run the frontend unit, type, build, and public-route browser suites.
5. Compare production screenshots at the two validated reference widths.
