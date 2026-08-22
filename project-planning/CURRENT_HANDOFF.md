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

Phase 4B3 owner/provider initial-service proposal interfaces are delivered
against the Phase 4B2a APIs. Phase 4B2b1 now provides the proposal-collaboration
schema, repositories, and PostgreSQL coverage. The active remainder is:

1. Expose the contract through authenticated routes and both acquisition
   workspaces with conflict, expiry, revocation, unavailable, and retry recovery.
2. Preserve the delivered exact subject/current-version display and explicit
   revised-proposal linkage in both interfaces.
3. Validate API policy, client mapping, responsive browser behavior,
   and non-activation side effects before beginning Phase 4C.

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
