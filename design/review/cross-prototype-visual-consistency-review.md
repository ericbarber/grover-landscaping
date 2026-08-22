# Cross-Prototype Visual Consistency Review

Date: 2026-08-15
Status: Review complete; shared foundation implemented and validated

## Objective

Review the public homepage, Yard Crew acquisition, Yard Owner acquisition, and
Yard Owner portal as one product family. Resolve visual drift in color,
typography, branding, navigation, controls, focus treatment, and surface
material without flattening meaningful differences between marketing,
acquisition, and authenticated work.

## Executive assessment

The prototypes shared a recognizable natural-material direction but implemented
it independently. Color values varied by small but visible amounts; the brand
alternated between uppercase interface lettering and a title-case serif; display
type appeared in operational headings; prototype disclosures changed color and
shape; and the Yard Crew application used a light progress rail while the Yard
Owner experiences used dark rails.

The correction is a shared prototype foundation loaded by every working design.
It owns brand tokens and shell primitives while each prototype retains its
workflow layout.

## Findings and dispositions

| Priority | Finding | Product effect | Disposition |
| --- | --- | --- | --- |
| P0 | Four near-duplicate palettes used different greens, bone, paper, sand, clay, and line values | Screens looked related but not like one application | One canonical token set now matches the approved visual foundation |
| P0 | Brand wordmark switched between uppercase sans serif and title-case serif | Product identity changed by destination | Uppercase interface wordmark and 32px leaf mark now apply everywhere |
| P0 | Yard Crew application navigation was light while customer application rails were Forest | Provider setup appeared to belong to another product | All desktop application rails now use Forest with Sand selection |
| P0 | Operational page titles frequently used editorial display type | Dense application states felt more like campaign pages | Application page and card headings use the interface family; editorial type remains in human and marketing moments |
| P1 | Primary actions alternated between Sand and Evergreen on light surfaces | Action hierarchy changed by prototype | Evergreen is the light-surface primary action; Sand remains the dark-hero action |
| P1 | Prototype disclosures used unrelated dark and Sand treatments | Review artifacts lacked a consistent non-production boundary | One Forest working-design banner now appears across all prototypes |
| P1 | Focus rings alternated between Gold and blue | Keyboard feedback changed between journeys | One high-contrast blue focus treatment now applies everywhere |
| P1 | Button, input, card, and header geometry varied | Repeated components felt independently designed | Shared control, surface, and header primitives now provide consistent geometry |

## Canonical foundation

The runtime source is
[`../prototypes/shared/grover-foundation.css`](../prototypes/shared/grover-foundation.css).
It implements the approved values already documented in
[`../foundations/color.md`](../foundations/color.md),
[`../foundations/typography.md`](../foundations/typography.md), and
[`../foundations/spacing.md`](../foundations/spacing.md).

Navigation follows the three-model contract in
[`../foundations/navigation.md`](../foundations/navigation.md):

1. public horizontal navigation for anonymous product discovery;
2. progress navigation for bounded acquisition;
3. destination navigation for authenticated, returnable workspaces.

These models intentionally differ in information architecture while sharing the
same brand, palette, active treatment, geometry, and responsive standards.

## Implementation phases

| Phase | Outcome | Status |
| --- | --- | --- |
| 0 — Inventory | Compare computed tokens and shell patterns across four prototypes | Complete |
| 1 — Foundation | Establish canonical tokens, type roles, controls, surfaces, brand, and focus | Complete |
| 2 — Navigation | Align public headers and application rails while preserving three navigation models | Complete |
| 3 — Adoption | Load the shared foundation in every working prototype and add the homepage review boundary | Complete |
| 4 — Validation | Re-run all journey validators and add computed-style foundation checks | Complete |

## Acceptance criteria

- Every working prototype loads the same foundation as its final stylesheet.
- Canonical palette values compute identically in every prototype.
- Brand family, case, spacing, and mark size are identical.
- Working-design banners use the same material and accessible action size.
- Public headers use Paper; desktop application rails use Forest; active rail
  items use Sand.
- Editorial type appears in marketing and selected human moments; operational
  page titles and controls use the interface family.
- Primary, secondary, input, card, and focus treatments remain consistent.
- Existing desktop, tablet, mobile, 200% text, interaction, recovery, privacy,
  and browser-error validation remains green.

## Next design-system work

- Extend the delivered production outlined SVG icon family only when new
  authenticated workflows require additional approved meanings.
- Extend the delivered shared status primitives into legacy workflow panels as
  their owning phases are adopted. The delivered single-destination desktop
  rail and compact Home grid remain distinct from phone and tablet compositions.
- Extract shared HTML/React shell components during production adoption; the
  current static prototype foundation intentionally shares CSS without coupling
  prototype JavaScript.
- Add dark-mode tokens only after product requirements and customer evidence
  justify a supported theme.
