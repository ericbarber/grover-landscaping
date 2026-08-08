# Public Homepage Working Design

This prototype turns the V1 public homepage direction into a complete working
design. It is intentionally dependency-free so reviewers can inspect the page
without starting the React application or connecting to an API.

## Review locally

From the repository root, serve the workspace with any static server, for example:

```bash
python3 -m http.server 4179 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4179/design/prototypes/public-homepage/
```

Opening `index.html` directly also works. The Sign in destination represents the
production handoff and is not part of the design prototype.

## Intended journey

1. The split hero explains the product promise and shows an explicitly
   illustrative operational preview.
2. The audience control carries one perspective through hero content, preview
   context, outcomes, workflow value, and conversion language.
3. Plan–Care–Proof lets a visitor inspect one connected stage at a time instead
   of scanning a feature grid.
4. The capability ledger maps credibility language to delivered foundations and
   deliberately excludes unverified customer claims.
5. The request dialog sets expectations, validates required information,
   demonstrates recoverable failure, and confirms success without transmitting
   prototype data.

## Interaction contract

- Audience and workflow tabs respond to click, tap, Left/Right, Up/Down, Home,
  and End.
- The mobile menu exposes the same destinations and closes after a selection.
- Request actions retain the selected audience in the dialog.
- Escape and the close controls dismiss the dialog; focus returns to the action
  that opened it.
- Empty submission identifies the specific missing fields and moves focus to the
  first invalid field.
- Prototype review controls can simulate a delivery error. Entries remain in
  place so the visitor can recover and resubmit.
- Successful submission explicitly states that no information was transmitted.

## Accessibility coverage

- Semantic header, navigation, main, sections, footer, native dialog, form labels,
  and one H1.
- Skip link, visible focus, logical source order, tab semantics, live status, and
  focus restoration.
- Minimum 44 by 44 CSS-pixel interactive targets at the mobile review breakpoint.
- Text labels accompany semantic color; illustrative data is labeled in context.
- Layout has no horizontal overflow at 390px or 1440px.
- Reduced-motion and forced-colors adaptations are included.

## Prototype boundaries

- No leads, analytics, authentication, or application mutations are sent.
- All operating counts are fictional preview data and are labeled as illustrative.
- The existing image is a project-local design asset, not customer evidence.
- Production React adoption belongs to a separate implementation slice.

## Validation

The browser validator exercises responsive layout, keyboard tabs, persona
continuity, dialog focus return, validation, recoverable failure, success, mobile
navigation, target sizes, overflow, and browser errors:

```bash
node design/tools/validate-working-homepage.mjs
```

The script uses the Playwright package already installed for the frontend. Pass
`--capture` to refresh the committed desktop and mobile review images.
