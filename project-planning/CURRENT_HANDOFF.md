# Current Delivery Handoff

## Restart point

- Branch: `main`
- Resolve the current tip with `git log -1`; this handoff intentionally does not
  pin a commit that will become stale.
- Canonical delivery status: [`../PLAN.md`](../PLAN.md)
- Design-to-production queue: [`PROTOTYPE_ADOPTION.md`](PROTOTYPE_ADOPTION.md)
- Active product boundary: Yard Owner acquisition Phase 4B proposal adoption
- Preserve unrelated local changes in `.gitignore`,
  `frontend/e2e/mobile-offline-recovery.spec.ts`, `localdev/`, and `prompts/`.

## What is currently delivered

### Public and shared visual experience

- All four public personas carry a tailored story from hero through invitation.
- Yard and company signup remain directly available.
- The landscaping-company hero and the Plan product-tour step use the approved
  interactive “Today’s operation” schedule concept.
- The canonical palette, typography roles, wordmark, controls, focus treatment,
  public/acquisition materials, and authenticated Home shell are in production.
- Local role review exposes seven fixed personas without AWS and the `/app`
  composition follows the selected persona rather than changing only its title.

### Yard Owner production adoption

- Private owner workspace, property, versioned brief, and optional guided media
  are owner-scoped and independent of provider tenants.
- Known-provider invitation, delivery-state, recipient verification, organization
  claim/review/appeal, bounded response, owner/provider progress, and abuse/opt-
  out/revocation contracts are implemented.
- Provider-specific disclosure review, immutable receipts, category-filtered
  access, owner history, and future-access revocation are implemented in the API
  and responsive owner/provider interfaces.
- Assessment persistence, remote/on-site lifecycle, replacement windows,
  customer-safe conversation, provider-private notes, owner interface, and
  provider interface are implemented.
- Versioned initial-service proposal persistence and authenticated provider
  publish/revise plus owner list/detail/decision APIs are implemented. Acceptance
  creates an immutable accepted-but-unactivated snapshot and does not create a
  customer, job, route, schedule, or crew assignment.

### Repository assurance

- The pilot assurance manifest, alerts/runbook mapping, synthetic scenarios, and
  browser/accessibility matrix provide repository-owned evidence.
- Live provider delivery, monitoring, staffing, human usability/assistive-
  technology/device sessions, Privacy/Security approval, and go/no-go remain
  explicitly unsigned external gates.

## Next implementable slice

Build the owner and provider initial-service proposal interfaces against the
delivered Phase 4B2a APIs and the validated acquisition prototype:

1. Add typed client mapping for provider publication/revision and owner
   list/detail/exact-version decisions.
2. Let a provider publish only after an authorized completed assessment and keep
   provider-private production basis separate from owner-visible scope.
3. Let an owner compare immutable versions, inspect scope, exclusions, cadence,
   price, terms, expiry, and decide with explicit confirmation.
4. Preserve loading, empty, unavailable, expired, stale/conflict, retry, replay,
   and accepted-but-not-activated states.
5. Integrate the owner view into `/app/yard-owner` and the provider view into the
   recipient assessment workspace without implying scheduling, payment, service
   activation, or crew assignment.
6. Add unit, TypeScript, production-build, and responsive owner/provider browser
   coverage, then update `PLAN.md` and this handoff.

Proposal questions and change requests remain a separate persistence contract;
do not store them as decisions, assessment messages, or generic audit notes.

## Read first

1. [`../docs/owner-provider-initial-service-proposal-design.md`](../docs/owner-provider-initial-service-proposal-design.md)
2. [`../design/review/yard-owner-acquisition-handoff.md`](../design/review/yard-owner-acquisition-handoff.md)
3. [`../docs/yard-owner-acquisition-production-plan.md`](../docs/yard-owner-acquisition-production-plan.md)
4. [`PROTOTYPE_ADOPTION.md`](PROTOTYPE_ADOPTION.md)
5. [`../PLAN.md`](../PLAN.md), Yard Owner acquisition and visual-experience sections

## Validation baseline

The latest public-product slice passes all 408 frontend unit tests, TypeScript,
the production build, and 16 Chromium mobile/desktop landing checks. Re-run the
checks appropriate to each subsequent phase; do not infer that unrelated backend,
PostgreSQL, Firefox, WebKit, hosted, human, or production checks passed from this
baseline.

## Stop conditions

Continue automatically through safe repository-owned slices. Pause only for a
material product choice, new authority, unavailable required infrastructure, or
evidence that must come from a real person or live service. Never represent a
simulation, fallback, or local reviewer as production or signed evidence.
