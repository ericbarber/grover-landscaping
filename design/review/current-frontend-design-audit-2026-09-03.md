# Current Frontend Design Audit — September 3, 2026

## Decision summary

The current frontend has a credible visual foundation and a clear persona-aware
shell, but its experience quality is uneven after navigation. The strongest
surfaces—public landing, persona Home, crew Route, and property-manager
Portfolio—have clear hierarchy and purposeful next actions. The weakest
surfaces—manager Manage and the unavailable Yard Owner My yard path—lose that
momentum through sparse navigation or a dead-end recovery state.

The highest-value next design slice is not a broad visual refresh. It is a
focused continuity pass that makes route dates and state language truthful,
turns Manage into a useful operational overview, gives Yard Owner recovery a
safe destination, and reduces repeated identity/context on small screens.

The [current frontend review mirror](../prototypes/current-frontend-review/index.html)
captures the observed baseline. It is a parity artifact, not approval to retain
every behavior it reproduces.

## Review method and boundary

The review compared rendered frontend routes at 1440 × 1000 and 390 × 844 with
the source-controlled prototype gallery, shared design foundation, route/persona
configuration, and prototype-adoption tracker. Authenticated screens used the
local PostgreSQL-backed review environment and representative local identities.

The local-review identity selector was considered separately from hosted
product chrome. It materially increases mobile header height but does not appear
in the production Cognito experience. Fixture counts, the dated crew plan, and
unavailable states are evidence of the reviewed environment, not claims about a
hosted deployment.

No production UI behavior changed in this slice.

## Surface parity

| Surface | Current frontend observation | Prior design evidence | Parity assessment |
| --- | --- | --- | --- |
| Public landing | Compact, persona-aware hero fits above the desktop fold; downstream tour changes with the selected audience. | Working Public Homepage V2 has the older tall split hero, request flow, and earlier content hierarchy. | Material drift. Preserve the older prototype as historical design input; use the current mirror for production parity. |
| Company owner Home | Strong photographic/editorial hero, explicit next action, progress, and workspace links inside the persistent rail. | Access/Home wireframe and shared foundation describe the intent, but not the rendered current composition. | Current mirror added. |
| Company owner Manage | Six clear categories, but little operational status or urgency and large unused desktop space. | Manager hub wireframe predicts the category model; Schedule/Recovery artifacts are richer after selection. | Structurally aligned, experientially incomplete. |
| Crew lead Home | Clear daily orientation and recommended Route action; long on a phone because hero, progress, notice, next action, and identity repeat context. | Field Home wireframe and Route high-fidelity concept. | Core intent adopted; current mirror added. |
| Crew lead Route | Current stop is unmistakable and mobile actions are direct. Reviewed fixture shows a June 18 plan beneath a September 3 shell date and both “saved locally” and globally “Synced” language. | Crew Route high-fidelity concept. | Composition aligned; temporal and persistence vocabulary need correction. |
| Yard owner Home | Calm, persona-specific hero and clear My yard recommendation, with no company-operation leakage. | Yard Owner Portal V2 is substantially richer, with Home, Visits, Proof, and Account. | Current production is narrower than the conceptual portal. |
| Yard owner My yard | Current reviewed state is an unavailable notice and retry action followed by an otherwise empty canvas. | Yard Owner Portal V2 provides deeper service-lifecycle destinations and recovery concepts. | Meaningful gap and dead end. |
| Property manager Portfolio | Clear promise, stable four-section navigation, readiness/priority hierarchy, and customer-safe boundary. | Connected Portfolio V1 working design. | Closest current/design match; keep as the reference pattern. |

## Findings

### DFR-01 — Artifact status no longer communicates parity

**Severity:** High · **Observed**

The gallery labels several older wireframes and working prototypes “Current
target” or “Adopted” even when their rendered composition differs materially
from the application. The public homepage and Yard Owner portal are the clearest
examples. “Adopted” accurately describes behavior, but a reviewer can easily
misread it as pixel or route parity.

**Design response:** Keep two explicit concepts: _production mirror_ for a dated
rendered baseline and _design direction_ for an approved future composition.
Every handoff should name which it is. This audit and mirror establish that
separation without deleting useful historical design work.

### DFR-02 — Yard Owner recovery ends the journey

**Severity:** High · **Observed**

When My yard is unavailable, the customer receives a truthful message and a
safe retry, but no second path. There is no return to Home, support/contact
context, explanation of what remains available, or bounded last-known content.
The large empty canvas amplifies the failure and makes the product feel absent.

**Recommended slice:** Design loading, valid-empty, access-ended, inconsistent,
and temporarily unavailable compositions together. Keep “Try again,” add “Back
to Home,” and expose provider contact only after the existing product boundary
is approved. Do not invent cached property or visit facts when the protected
read fails.

### DFR-03 — Manage is a directory, not a manager home

**Severity:** High · **Observed**

The category names are understandable, but every tile carries equal weight and
none exposes readiness, exception count, scheduling pressure, or the next safe
action. On a 1440px screen, the useful content occupies a small strip above a
large empty canvas. Managers must navigate rail → Manage → category → tool
before learning whether something needs attention.

**Recommended slice:** Retain the six stable categories, then add a bounded
“Today’s attention” layer using already-authorized counts and status. Do not
duplicate the full Schedule or Recovery workspaces. Each summary must link to
one exact tool and distinguish zero, unknown, and unavailable.

### DFR-04 — Identity and persona context repeat too often

**Severity:** Medium · **Observed**

The same identity or persona can appear in the auth strip, local-review selector,
mobile context chip, hero chip, rail footer, and signed-in card. On phones, the
local-review strip plus context header consumed roughly 170px before primary
content in the reviewed environment. Some repetition is useful across auth,
navigation, and orientation, but the current aggregate weakens hierarchy.

**Recommended slice:** Treat auth identity, workspace persona, and page title as
three distinct facts. In hosted mode, keep identity in one account control,
persona in the shell, and page title in the content header. Keep local-review
controls visually outside the product shell and exclude them from production
spacing judgments.

### DFR-05 — Date and persistence language can contradict the shell

**Severity:** High · **Observed**

The reviewed Crew Route shows `2026-06-18` while the surrounding workspace says
Thursday, September 3. It also says `saved locally` and `Source: local API`
while the shell reports `Synced`. Each phrase may be technically defensible,
but together they do not answer the crew member’s real questions: Is this
today’s plan? Is my work safe? Can I continue offline?

**Recommended slice:** Introduce one date-context contract and one shared state
vocabulary. A stale plan should be visibly “Past route · Jun 18,” never silently
framed as today. Separate transport source from persistence confidence and use
one of: syncing, saved on device, synced, changes need attention, or unavailable.

### DFR-06 — Information density varies without a clear task reason

**Severity:** Medium · **Observed**

Portfolio and Route use dense, actionable hierarchy; Manage and unavailable My
yard are extremely sparse; Home repeats similar progress and identity facts.
This is not merely a desktop-versus-mobile difference. The density changes at
workflow boundaries, so the application can feel like different products.

**Recommended slice:** Use the Portfolio composition as the reference for
summary surfaces: promise, scope/status, priority, then exact destination. Use
Route as the reference for execution: context, one current item, next action,
then secondary history.

### DFR-07 — Fixed mobile navigation needs viewport evidence, not full-page inference

**Severity:** Medium · **Validation risk**

Full-page captures visually place the fixed bottom navigation across content,
which is expected screenshot behavior and does not by itself prove inaccessible
content. The shell includes bottom padding, but the last actionable control must
still be tested in the actual viewport with browser chrome, zoom, keyboard, and
safe-area insets.

**Recommended slice:** Add one reusable browser assertion that scrolls the final
interactive control above the bottom bar at 320, 390, and 430px widths and at
200% zoom. Confirm on iOS Safari and Android Chrome before release signoff.

### DFR-08 — Editorial and operational typography lacks an explicit boundary

**Severity:** Low · **Observed**

Persona Home, Route, and Portfolio use editorial serif headings to add warmth;
Manage uses a compact sans-serif hierarchy. Both treatments work independently,
but the transition appears incidental because no content rule explains it.

**Recommended slice:** Reserve the serif face for audience promise, place, and
human-service moments. Use the sans face for task choice, data state, and
operational controls. Record that rule in the shared foundation before broader
visual tuning.

## What is working well

- Persona-specific public and authenticated content now avoids cross-audience
  leakage.
- The desktop rail and mobile bottom navigation preserve stable destinations.
- Current-stop hierarchy on Route is direct and field-friendly.
- Portfolio demonstrates a strong customer-safe command-center pattern.
- Status and unavailable copy generally avoid fabricated success or fallback
  data.
- Brand colors, surface materials, focus treatment, and action geometry are
  consistent across the working prototype foundation.

## Phased design delivery recommendation

1. **Baseline and parity — delivered by this review.** Maintain the dated
   current-state mirror, gallery entry, responsive captures, and browser checks.
2. **Truth and recovery.** Design and implement shared date/state vocabulary,
   stale-route treatment, and complete Yard Owner recovery destinations.
3. **Manager continuity — delivered September 5, 2026.** The status-bearing
   Manage overview uses only authorized current sources or exact enabled-tool
   counts, and selected destinations mount on demand across Schedule, Customers,
   Team, Reports, and Recovery.
4. **Shell compression.** Remove redundant hosted identity/persona treatments,
   isolate local-review chrome, and validate bottom-navigation clearance and
   zoom across phone widths.
5. **Prototype reconciliation.** Reclassify older public/customer artifacts as
   design direction or historical input, and refresh only the prototypes needed
   by the next production slice.

Phases 2, 4, and 5 remain recommendations rather than delivered behavior.
Product-gated concern,
provider-contact, notification/preference, external-review, marketplace, and
billing work remains governed by the existing delivery plan.

## Acceptance evidence for this review slice

- Eight representative surfaces switch through one keyboard-accessible control
  and share stable URL hashes.
- Desktop and phone layouts have no horizontal overflow and exactly one visible
  page heading per surface.
- Desktop rail and mobile bottom navigation switch at the defined breakpoint;
  mobile destinations meet the 44px touch-target floor.
- The Yard Owner unavailable state and reviewed Crew Route date/persistence
  labels are retained as explicit audit evidence.
- Browser console/page errors are absent; current desktop/mobile captures are
  generated by the validator.
