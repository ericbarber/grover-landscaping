# Current Delivery Handoff

## Restart point

- Branch: `main`
- Resolve the current tip with `git log -1`; this handoff intentionally does not
  pin a commit that will become stale.
- Canonical delivery status: [`../PLAN.md`](../PLAN.md)
- Design-to-production queue: [`PROTOTYPE_ADOPTION.md`](PROTOTYPE_ADOPTION.md)
- Active product boundary: Yard Owner acquisition Phase 4C activation
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

Phase 4B3 owner/provider initial-service proposal interfaces and all Phase 4B2b
proposal-collaboration slices are delivered. Phase 4C0 now defines activation
authority, atomic projection, property-scoped portal access, immutable
provenance, competing-request closure, and the first-visit boundary. Phase 4C1
now delivers the constrained schema, atomic repository transaction, safe
activated progress, PostgreSQL concurrency/side-effect proof, and authenticated
owner activation/status routes and responsive owner/provider setup interfaces.
Phase 4C4a defines the separate first-visit contract, including
post-activation provider authority, immutable windows, exact-version owner
confirmation/change requests, privacy, replay, concurrency, recovery, and the
no-operational-side-effect boundary. Phase 4C4b now delivers the constrained
schema, repository transitions, exact replay, concurrent confirmation,
owner/provider isolation, immutable history, and PostgreSQL side-effect proof.
Phase 4C4c now exposes authenticated provider status/propose and property-owner
status/decision routes with explicit validation, missing/not-ready/conflict,
replay, and unavailable mappings. The next slice is Phase 4C4d interface
adoption:

1. Add provider window authoring after activated progress, including stable
   retry keys and authoritative reload.
2. Add owner window review, exact-version confirmation, and customer-safe change
   requests after activation.
3. Prove responsive owner/provider journeys and preserve the no-operational-work
   boundary in both interfaces.

## Read first

1. [`../docs/owner-provider-initial-service-proposal-design.md`](../docs/owner-provider-initial-service-proposal-design.md)
2. [`../docs/owner-provider-activation-design.md`](../docs/owner-provider-activation-design.md)
3. [`../docs/owner-provider-first-visit-design.md`](../docs/owner-provider-first-visit-design.md)
4. [`../docs/owner-provider-first-visit-api.md`](../docs/owner-provider-first-visit-api.md)
5. [`../design/review/yard-owner-acquisition-handoff.md`](../design/review/yard-owner-acquisition-handoff.md)
6. [`../docs/yard-owner-acquisition-production-plan.md`](../docs/yard-owner-acquisition-production-plan.md)
7. [`PROTOTYPE_ADOPTION.md`](PROTOTYPE_ADOPTION.md)
6. [`../PLAN.md`](../PLAN.md), Yard Owner acquisition and visual-experience sections

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
