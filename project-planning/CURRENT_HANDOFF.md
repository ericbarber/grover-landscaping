# Current Delivery Handoff

## Restart point

- Branch: `main`
- Resolve the current tip with `git log -1`; this handoff intentionally does not
  pin a commit that will become stale.
- Canonical delivery status: [`../PLAN.md`](../PLAN.md)
- Design-to-production queue: [`PROTOTYPE_ADOPTION.md`](PROTOTYPE_ADOPTION.md)
- Active slice: implement accepted decision D-060 through a customer-safe visit
  reference and immutable question/response persistence, then expose its
  provider queue and hybrid-authorized customer/provider APIs.
  Curated-opportunity
  availability/governance and governed provider credentials remain gated.
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
- Authenticated navigation now uses one reusable outlined SVG icon family,
  retains phone bottom navigation, becomes a fixed left rail at tablet widths,
  and yields to the existing desktop shell at the large breakpoint.
- Shared semantic notice and status-pill primitives now align Home priority and
  sync feedback, job lifecycle badges, persisted-job failures, and route
  storage/availability recovery across neutral, info, success, warning, and
  danger tones.
- Desktop uses a persistent role-filtered forest rail, a compact Home summary,
  and one active destination at a time instead of stacking every authorized
  field, customer, and manager surface. Phone and tablet compositions retain
  their bottom-bar and compact-rail behavior.
- Field Route now follows Crew Route V1 hierarchy with high-contrast progress,
  accessible completion percentage, explicit Current stop and Up next cards,
  two-stop focus before full-route expansion, and route-change/recovery controls
  after the immediate work. Persisted in-progress stops advance correctly.
- Assigned Jobs now uses compact ordered cards with lifecycle, checklist, and
  photo readiness plus customer/address search, status filtering, result count,
  and an explicit filtered empty state.
- Job detail now keeps the current customer/property target and guarded primary
  actions visible while semantic tabs open one Overview, Checklist, Photos,
  Add-ons, or Report panel at a time across phone and desktop layouts. Required
  photo-evidence gaps and the next field action are explicit.
- Authenticated manager Schedule now leads with Today’s operation and selected-
  date crew/work/risk summaries, then opens the existing route builder beside a
  bounded planning inspector on desktop and in task order on smaller screens.
- Manager Recovery now leads with queue health, then pairs a selectable exception
  queue with a bounded detail inspector. Managers can assign, start, resolve,
  reopen, and return directly to linked Job, property, or Schedule context.
- Manager Reports now carries the same command-center treatment into completion
  review. Opening a ready or blocked record selects that exact Job and activates
  its Report workflow on phone and desktop.
- The secure shared completion report now follows the public proof design with
  service identity, evidence, and completed approved-recommendation outcomes.
  The API itself projects only customer-safe service/checklist/photo/outcome
  fields and excludes internal IDs, notes, object keys, pricing, billing, and
  operating context. Explicit retry remains available for storage or safe-
  projection failures.
- The secure shared proposal now uses the same public hierarchy for customer-facing
  scope, pricing, explicit approval/decline confirmation, and recorded outcomes.
  Its API response omits internal bid, line-item, and service identifiers plus
  manager notes and delivery metadata.
- Property Owner now enters a customer-density Yard Owner portal with Home,
  Visits, Proof, and Account. Home/Visits load authorized properties and exactly
  confirmed visits plus explicit customer service-day events from the minimized
  persisted customer API, load proof only
  for those authorized properties, distinguish loading/empty/access/inconsistent/
  unavailable/retry states, and never substitute illustrative visit or portfolio
  data. Recommendations remain withheld pending their own customer contract.
- Organization Owner Team now opens a prototype-aligned Team and access command
  center with live active-member, pending-invitation, active-crew, and unstaffed-
  territory summaries. It links directly to the existing member, invitation,
  crew, hierarchy, and audit workflows. Partial outages preserve independently
  available counts, identify missing sources, and never infer false zeroes;
  staffing alerts open crew-lead or unstaffed-territory recovery directly.
- The member directory labels the signed-in membership, warns before self-role
  and self-suspension confirmation, keeps the last-owner guard, distinguishes
  unavailable persistence from an empty team, and is mapped in the Phase 6
  production handoff.
- Local role review exposes seven fixed personas without AWS and the `/app`
  composition follows the selected persona rather than changing only its title.
- Authenticated entry now keeps protected navigation hidden until active access
  verification succeeds. Access outages fail closed with retry; active membership
  roles drive personas, while Support and first-owner bootstrap remain explicit
  exceptions. Unscoped roles receive a Home-only invitation/restoration state.
- Property-manager portfolio V1 is now adopted in React with Overview,
  Properties, Proof, and Approvals; scoped grouping and property search; labeled
  local-review readiness; protected proof and recommendation history with
  partial-source isolation; customer-safe provider accountability; responsive
  browser coverage; and a production handoff. PropertyOwner retains the Yard
  Owner portal, while provider portfolio administration remains separate.
- Yard Crew public fit/entry routing is adopted at `/providers/start` with
  distinct owner-operator, company-owner, invited-worker, and known-owner paths.
  Only allowlisted owner context opens authenticated Company setup, and the
  selected query never changes claims, memberships, publication, or opportunity
  access.
- Company setup now projects provider identity/readiness from current profile
  and setup-progress reads. Supplied identity/contact/website/service area,
  recorded timezone/capacity, operational crew setup, missing facts, credentials
  not collected, and marketplace eligibility not evaluated remain distinct; no
  broad verified-provider claim is made.
- The first-time known-owner provider path now removes the bearer fragment,
  confirms the invited verified mailbox explicitly, connects an actor-scoped
  existing or duplicate-safe new provider organization, requires withheld-data
  acknowledgement, opens a resumable bounded inbox, and records controlled
  question/interest/decline responses. Owner-approved disclosure, assessment,
  proposal, activation, and first-visit preparation continue from that path.
- A stable responsive navigator keeps Invitation, Organization, Disclosure,
  Assessment, Proposal & setup, and First visit visible with precise current,
  completed, upcoming, and closed states; only available workspaces are linked.

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

## Next authorized slice

The shared shell; core Route, Jobs, Job, Schedule, Recovery, manager review;
public proof and proposal decisions; and the Yard Owner four-destination shell
are delivered. The Team and organization phase now also has its prototype-
aligned overview composition.

1. Service mobilization persistence, provider release/status APIs, minimized
   customer projection, and all six Yard Owner service-day modes are delivered.
   Decision D-060 is accepted; implement its dedicated visit-question
   persistence, provider queue, APIs, and Yard Owner experience in bounded
   slices while retaining the separate concern boundary.
2. Yard Crew service categories and customer communication languages are now
   persisted and surfaced as provider-supplied preparation facts. Do not add
   provider availability/pause until the curated-opportunity projection and
   operating contract are approved; do not add credential checking until its
   evidence/review/correction/appeal ownership is approved.
   Access/Home, completion proof, and Team/organization core adoption return to
   regression when their contracts change.
3. After the service-day extension, continue proof/recommendation, concern, and
   preference adoption in bounded slices.

## Read first

1. [`../docs/owner-provider-initial-service-proposal-design.md`](../docs/owner-provider-initial-service-proposal-design.md)
2. [`../docs/owner-provider-activation-design.md`](../docs/owner-provider-activation-design.md)
3. [`../docs/owner-provider-first-visit-design.md`](../docs/owner-provider-first-visit-design.md)
4. [`../docs/owner-provider-first-visit-api.md`](../docs/owner-provider-first-visit-api.md)
5. [`../design/review/yard-owner-acquisition-handoff.md`](../design/review/yard-owner-acquisition-handoff.md)
6. [`../docs/yard-owner-acquisition-production-plan.md`](../docs/yard-owner-acquisition-production-plan.md)
7. [`PROTOTYPE_ADOPTION.md`](PROTOTYPE_ADOPTION.md)
8. [`../design/review/property-manager-portfolio-handoff.md`](../design/review/property-manager-portfolio-handoff.md)
9. [`../PLAN.md`](../PLAN.md), Yard Owner acquisition and visual-experience sections
10. [`../docs/customer-portal-authorization-model.md`](../docs/customer-portal-authorization-model.md)

## Validation baseline

The current baseline passes all 457 frontend unit tests across 118 files,
TypeScript, and the production build. The persisted Yard Owner adoption adds
client mapping/error checks plus component coverage for loading, valid-empty,
missing-access, inconsistent-access, unavailable, retry, and authorized content
without illustrative fallback. The previously completed 36-test phone/desktop
Chromium local-role workspace matrix remains recorded, but it was not rerun for
this slice because the local Chromium executable cannot load `libnspr4.so`.
That prior matrix covers all seven fixed identities, fail-closed access retry,
unscoped-role Home-only recovery, Team staffing recovery, partial-read isolation,
self-impact, unavailable-versus-empty, keyboard activation, and focus transfer,
plus the direct property-manager portfolio journey.
The D-059 persistence slice passes all 197 backend library tests and compiles the
expanded owner/provider PostgreSQL lifecycle fixture. That fixture contains the
release/event replay, authority, revocation, job-state, immutability, rollback,
and cross-property assertions, but those database-backed branches did not run in
this environment because `DATABASE_URL` is unset and the local Docker daemon is
unavailable.
The completion-proof continuity slice additionally passes 32 targeted backend
tests, 24 API-client tests, the production build, and eight mobile/desktop
Chromium shared-proof/proposal journeys. Re-run the checks
appropriate to each subsequent phase; do not infer that unrelated backend,
PostgreSQL, Firefox, WebKit, hosted, human, or production checks passed from this
baseline.
The property-manager portfolio design additionally passes its 1440px and 390px
browser validator for navigation, state switching, search, dialog focus return,
touch targets, and overflow. Its React adoption is included in the baseline above.
Provider entry additionally passes four focused domain/component tests, the
production build, and six phone/desktop Chromium journeys covering path choice,
company CTA routing, authenticated handoff, authority language, and reflow.
Provider identity/readiness additionally passes seven focused domain/component/
onboarding checks, the production build, and two phone/desktop Chromium journeys
covering precise fact states and no-verification/no-publication boundaries.
Known-owner entry additionally passes nine focused client/component checks,
backend formatting and compilation, the production build, and ten phone/desktop
Chromium journeys including the first-time connection path and downstream
assessment/proposal/first-visit regressions.
Lifecycle orientation additionally passes three focused domain/rendering checks
and the production build. A browser rerun was attempted twice but Chromium could
not launch under exhausted host swap and exited 137; the same ten underlying
phone/desktop journeys passed immediately before this navigator-only slice.

## Stop conditions

Continue automatically through safe repository-owned slices. Pause only for a
material product choice, new authority, unavailable required infrastructure, or
evidence that must come from a real person or live service. Never represent a
simulation, fallback, or local reviewer as production or signed evidence.
