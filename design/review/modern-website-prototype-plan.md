# Modern Grover website and application prototype plan

Status: planning and first-wave design direction, 2026-09-16

## Intent

Use the existing Grover application as the baseline for a modern, coherent
public website and application UI. This is a design-review track, not a rebuild
commitment or a change to production authorization. It complements the active
service-thread redesign and its planned comparative user study.

## Starting evidence and constraints

- The current React app already delivers public entry, customer, manager,
  field, proof, and access flows. The dated current-frontend mirror and artifact
  inventory distinguish current composition from later design directions.
- The service-thread proposal joins decisions, exact plan, field work, reviewed
  proof, and recovery. The website should explain that same outcome in customer
  language and give providers a separate path.
- Ten persona hypotheses live in `design/personas/`. Wave one previews Yard
  Owner, Property Manager, Company Owner, Company Manager, and Crew Lead. It
  should not imply that Dispatcher or Billing Administrator are production roles.
- The existing Evergreen/Bone/Paper palette, display/interface type roles, and
  accessible focus treatment remain the design foundation.

## First-wave pages and moments

| Surface | First question | Primary action | Review boundary |
| --- | --- | --- | --- |
| Public home | How does Grover make yard care clear? | Choose customer or provider path | No live availability, verified provider, price, or outcome claim |
| Customer path | What will I know before and after care? | Preview the Yard Owner workspace | Exact service example is illustrative |
| Provider path | How does the team stay coordinated? | Preview the Company Manager workspace | No lead marketplace or dispatch promise |
| Workspace preview | What is my next service action? | Switch among five role views and inspect a task | No authentication, writes, or new authority |

The visual concept uses a concise editorial headline, a realistic product
composition, one clear action per section, warm materials, restrained motion,
responsive cards, and plain-language status. Avoid dashboard decoration that
cannot answer an actual persona question.

## Planned slices and exit evidence

1. **Persona and page contract — delivered.** Record all ten role profiles,
   first answers, tasks, authority boundaries, and open research prompts in a
   separate directory. Record the page map and prototype constraints here.
2. **Working website and preview — delivered as design direction.** A
   dependency-free, responsive public concept now connects customer/provider
   paths to five role-filtered workspace previews. Attention, on-track, and
   unavailable states and an explicit sample-only review control are validated.
3. **Review and refinement — guide ready, sessions next.** The
   [comparison guide](modern-website-comparison-guide.md) defines matched
   public-path and role-comprehension tasks against the current frontend and
   existing service-thread design. Run the sessions with the SX4 evidence
   protocol; record observed problems and revise the prototype before proposing
   React adoption. No participant result has been collected yet.
4. **Production adoption — later.** Only after review, split approved public
   composition and authenticated workspace changes into bounded React/API
   slices with authorization, state, accessibility, and browser regression.

## Prototype acceptance

- Direct links open the public home and each of five role previews.
- Phone widths 320px and 390px and desktop 1440px have no horizontal overflow;
  a visible heading and action remain readable and keyboard reachable.
- Each role view names the next action, its owner, and the scope kept out of
  that view. Customer and field content respect their privacy boundary.
- Action preview is visibly non-persistent; no form suggests a production
  confirmation. Preview dialogs return focus to the triggering control.
- The gallery, artifact inventory, persona directory, and delivery tracker
  all label this as design direction rather than shipped UI.

## Decisions for human review

- Does the public promise describe the existing product accurately for both a
  household customer and a known provider relationship?
- Should the public site route primarily through customer and provider paths,
  or should property managers get their own first-level entry?
- Which five role-preview tasks most closely resemble real operating work?
- Which composition wins in comparative sessions: the existing app, the
  simplified service thread, or this website-to-workspace framing?
