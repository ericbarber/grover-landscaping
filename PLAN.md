# Delivery Plan

This file tracks what has been delivered, what is actively being built, what is planned next, and what is intentionally backlogged. Keep this file focused on product delivery status, not detailed design notes.

## Status Legend

| Status | Meaning |
| --- | --- |
| Delivered | Implemented in the repository and usable in local development |
| In Progress | Started, partially wired, or available with local/browser fallback |
| Planned | Prioritized upcoming work |
| Backlog | Valuable but not part of the next delivery slice |

## In Progress

### Prototype adoption and documentation convergence

Goal: keep repository guidance aligned with delivered behavior and move approved
working designs into production through explicit, validated phases.

Current state:

- Every tracked README now describes the implemented Rust/React system rather
  than the repository’s original proposed skeleton.
- [`project-planning/PROTOTYPE_ADOPTION.md`](project-planning/PROTOTYPE_ADOPTION.md)
  maps each approved artifact to Adopted, Partial, Design ready, Product-gated,
  or Future concept status and records the ordered production queue.
- The current handoff, design index, high-fidelity index, prototype READMEs,
  application design delivery tracker, roadmap, feature catalog, and version
  history use the same adoption boundary.
- Phase 4B3 now adopts the immutable initial-service proposal lifecycle into
  both production acquisition workspaces. A provider can publish or revise a
  customer-safe offer after a completed assessment and recover the latest
  version on reload; an owner can review immutable history and make a deliberate
  exact-version accept/decline decision. Acceptance remains unactivated.
- Phase 4B2b1 now delivers the proposal-conversation persistence boundary:
  append-only owner questions/change requests and provider responses retain the
  exact subject and current-series proposal versions, preserve actor-scoped
  replay, link revised proposals explicitly, and stay outside decisions and
  minimized lifecycle events.
- Phase 4B2b2 now exposes owner list/create and verified-provider response APIs
  behind explicit authorization and fail-closed recovery mappings. Provider
  disclosure reload includes the complete proposal conversation.
- Phase 4B2b3 now adopts that contract into both responsive acquisition
  workspaces. Owners can ask or request a change without deciding; providers
  can reload and answer the exact message, with an explicit newer-revision link
  when terms changed.
- Phase 4C0 now fixes the explicit activation contract: a separate owner
  affirmation atomically projects an accepted snapshot into provider customer
  and onboarding-property records, property-scoped membership and portal
  access, immutable provenance, and same-property competing-request closure.
  It creates no job, route, work order, payment, recurring schedule, crew
  assignment, or first visit.
- Phase 4C1a now delivers the constrained persistence foundation: immutable
  accepted-snapshot activation provenance, an explicit current-relationship
  projection, account/property-scoped portal grants, minimized activation
  events, and an `activated` invitation terminal state.
- Phase 4C1b now delivers the owner-confirmed atomic repository transaction. It
  verifies the accepted snapshot digest and exact version, projects the
  provider customer/account relationship and onboarding property, creates a
  property-scoped owner membership and portal grant, closes only same-property
  competitors, reports activated progress safely, and proves concurrent exact
  replay without jobs, plans, routes, crews, or assignments.
- Phase 4C2 now exposes verified-owner activation and activation-status routes
  in the exact property/proposal scope. Validation, route authorization,
  created-versus-replayed responses, missing/not-ready/conflict distinctions,
  and persistence-outage recovery are explicit; the browser supplies no
  provider or operational record identifier.
- Phase 4C3 now adopts the boundary into both responsive workspaces. After
  acceptance, the owner must separately review and affirm provider setup using
  a retry-stable request and authoritative status reload. Both owner and
  provider see an activated setup state that repeats that no first visit,
  payment, schedule, route, or crew assignment exists.

- Phase 4C4a now defines the first-visit contract: an authorized provider actor
proposes an immutable, bounded arrival window only after activation; the owner
confirms that exact version or requests a change. The customer-facing lifecycle
does not create a job, day plan, route stop, work order, payment, recurring
schedule, or crew assignment and excludes provider-private operational data.
- Phase 4C4b now delivers immutable provider window versions, exact-version
  owner decisions, minimized lifecycle events, an authoritative current-state
  projection, post-activation provider and property-owner isolation, exact
  replay and concurrency handling, and PostgreSQL proof that confirmation does
  not create operational work.

Next slice:

- Deliver Phase 4C4c authenticated first-visit APIs, followed by responsive
  owner/provider adoption.
- Continue through the ordered repository-owned adoption queue, leaving the
  external and product gates in the tracker explicitly unresolved.

### Persona-specific public landing experiences

Goal: give each public audience a complete landing-page narrative that reflects
its work, decisions, evidence needs, and most relevant next step.

Current state:

- Yard Owner, property-manager, landscaping-company, and crew-lead campaign
  routes now personalize the hero, action hierarchy, product preview, trust
  signals, outcome story, proof cards, capability set, and final invitation.
- The landscaping-company hero now adapts the approved “Today’s operation”
  prototype into a responsive, non-persistent owner overview with crews active,
  route progress, unassigned and at-risk signals, crew schedule/capacity, and an
  interactive dispatch decision. Visitors can expose capacity risk and apply a
  suggested balance without changing a real schedule.
- The Plan step in the public product tour now embeds that same interactive
  “Today’s operation” dashboard for every persona, replacing its abbreviated
  route card while preserving persona-specific outcomes and the Care and Prove
  previews.
- The audience selector switches the complete page story and canonical route
  without a reload while retaining campaign query parameters and first-party
  measurement.
- Yard and company signup remain visible from every persona view; the primary
  action instead follows the active audience through private yard setup,
  company onboarding, a portfolio discussion, or a field-workflow demo.
- Responsive browser coverage verifies all four direct routes, page-level
  persona continuity, canonical metadata, live audience switching, the embedded
  operations tour, and mobile reflow.

Next slices:

- Replace illustrative previews with approved production captures as the
  corresponding workspaces reach review readiness.
- Add verified customer proof only after approval and evidence provenance are
  available; do not introduce placeholder logos, quotes, or performance claims.
- Review persona conversion behavior and campaign segments before changing the
  request, signup, or onboarding hierarchy.

### Visual experience blueprint and design review

Goal: review the eventual product structure and visual hierarchy before adding
new user-interface implementation.

Current state:

- `design/` mirrors the public, access, field, manager, customer, revenue, and
  future product areas.
- Twenty deterministic SVG wireframes provide a reviewable first pass across the
  current application and phased roadmap.
- A browser gallery, information architecture, review checklist, decision log,
  artifact manifest, and reproducible renderer keep the review independent of a
  specific design-tool account.
- Artifact labels distinguish current targets, mixed current/planned screens,
  planned targets, and future concepts.
- A professional V1 visual foundation defines color, typography, spacing,
  iconography, imagery, component patterns, and experience principles.
- High-fidelity public homepage, crew route, and manager schedule concepts test
  one brand across marketing, mobile field work, and dense office operations.
- The cross-prototype consistency review is complete. The public homepage, Yard
  Crew acquisition, Yard Owner acquisition, Yard Owner portal, and design
  gallery now share one runtime foundation for palette, brand, type roles,
  banners, headers, application rails, actions, inputs, surfaces, and focus.
  Public, acquisition-progress, and authenticated-destination navigation remain
  intentionally distinct information architectures within that shared shell.
- Computed-style validation now prevents token, wordmark, banner, navigation
  material, and focus-ring drift in addition to each journey's existing
  responsive, interaction, accessibility, and recovery checks.
- Production visual convergence phase 1 is delivered. The React runtime now
  owns the validated evergreen, bone, paper, ink, sand, state, and focus tokens;
  the editorial and interface font roles; shared leaf wordmark and control
  primitives; and matching browser/PWA chrome. The public homepage adopts the
  split editorial hero, responsive persona control, role-specific illustrative
  preview, trust strip, and prototype-aligned section typography without losing
  its metadata, analytics, lead, or direct Yard Owner/company entry contracts.
  Access and Yard Owner acquisition surfaces consume the same foundation, and a
  computed-style browser check guards the production token contract.
- Production visual convergence phase 2 is delivered for the authenticated Home
  shell. Desktop and mobile Home now use the shared leaf lockup, editorial
  greeting hierarchy, warm canvas and paper surfaces, restrained prototype
  shadows, forest manager navigation, and canonical mobile header/bottom-nav
  materials. Exact browser assertions cover the canvas, display stack, sand
  wordmark, and deep-navigation surface without changing role or tool access.
- Production visual convergence phase 3 aligns the reciprocal provider
  invitation entry with the acquisition family: canonical brand lockup,
  editorial page title, bone/paper/forest composition, shared action and card
  geometry, and matching data-boundary emphasis. The bearer-fragment removal,
  verified-mailbox checks, disclosure limits, and assessment workflow remain
  unchanged and the provider browser journey now asserts its shared theme.
- Original Southwestern hero photography is stored with its generation brief and
  project-local usage guidance.
- Professional V2 review retains the split hero and Plan–Care–Proof narrative,
  while identifying audience continuity, interactive workflow proof, responsive
  behavior, accessibility, and conversion recovery as the active design gaps.
- A dependency-free V2 public-homepage prototype now closes those gaps with
  persona-aware content, a concrete interactive workflow, capability-backed
  credibility, responsive composition, and a complete request state model.
- Repeatable browser validation covers 390px and 1440px layout, keyboard tabs,
  mobile navigation, dialog focus return, validation, recoverable failure,
  success, target sizes, overflow, and browser errors.
- The remaining application now has a dependency-ordered working-design delivery
  plan covering shared foundations, access/Home, field execution, manager daily
  operations, completion proof, customers, team/organization, revenue, and final
  convergence.
- Each application phase must pass the same seven gates: workflow truth,
  responsive composition, working interaction, state coverage, accessibility,
  browser validation, and implementation handoff.
- Phase 5 has been intentionally advanced for a focused Yard Owner review. Its
  product audit now replaces internal-style counts and disconnected lists with a
  customer confidence hierarchy: next service, latest proof, and action needed.
- The Yard Owner plan defines responsive Home, Visits, Proof, and Account
  navigation, contextual bid decisions, customer-safe state coverage, and strict
  provider-information exclusions for prototype construction and handoff.
- The validated Yard Owner V2 working design now completes that focused review
  with portal-wide property context, six service-day modes, contextual questions,
  proof comparison and feedback, concern recovery, recommendation collaboration,
  notification/access preferences, customer-safe states, V2 references, and a
  production-contract handoff.
- Repeatable Yard Owner validation covers desktop, tablet, 390px and 320px mobile,
  all four destinations at 200% text, service lifecycle branches, target sizes,
  property switching, modal focus, question/bid/preference failure recovery,
  concern states, decision independence, overflow, and browser errors.
- The Yard Owner V2 phased plan records phases 0–4 and 6 complete. Phase 5 billing
  remains product-gated pending financial ownership, lifecycle, processor,
  support, privacy, and compliance decisions.
- A new Yard Owner entry and provider-connection audit confirms that current
  customer properties are provider-tenant records, current photo intake requires
  a provider job, and current invitations cannot represent an independent owner
  connecting a provider organization.
- The phased owner-entry plan now defines a private personal yard, guided yard
  brief and photos, a known-provider invitation pilot, provider assessment and
  versioned proposal, relationship activation into the existing portal, curated
  discovery, durable relationship management, and marketplace governance.
- The plan explicitly keeps exact addresses and photographs owner-controlled,
  treats owner input as a draft brief rather than an operational contract, and
  lets owners select providers while providers retain internal crew assignment.
- The Yard Owner acquisition working design is complete across phases 0–7: an
  owner can create a private property and yard brief, add or skip guided photos,
  invite a known provider or compare curated providers, approve disclosure,
  schedule assessment, compare and decide a proposal, enter provider setup, and
  transition into the connected portal after the first visit is confirmed.
- Its review controller exposes owner and provider states plus recoverable
  invitation and proposal failures. Repeatable browser validation covers the
  connected desktop journey, directory branch, tablet, 390px and 320px mobile,
  200% text, touch targets, consent, focus, overflow, and browser errors.
- The acquisition production handoff maps the validated experience to the new
  identity, private-property, intake-media, provider-profile, invitation,
  assessment, proposal, activation, and relationship contracts still required.
- The professional acquisition UX review is complete. It adds explicit email
  verification, affirmative consent, stale-address reconfirmation, functional
  provider filters and no-result guidance, directory-to-assessment continuity,
  neutral proposals with annualized comparison costs, confirmed access-reducing
  actions, semantic progress, programmatic errors, and customer-centered wording.
- Expanded validation covers accessible control names and errors, unselected
  sensitive-data defaults, email-code recovery, address mutation, filtering,
  no-result recovery, destructive confirmation, and the revised known-provider
  and directory journeys across responsive and 200% text layouts.
- Yard Owner acquisition V2 now completes the known-provider design contract:
  recipient-specific entry, separate email/organization/authority checks,
  authorized provider questions and responses, all invitation lifecycle states,
  connection support, fully affirmative disclosure categories, immutable access
  receipts, and confirmed future-access revocation. The reciprocal entry is
  linked from Yard Crew acquisition and the design gallery.
- The professional product-assurance cycle is complete at repository/design
  level. Ten P1/P2 findings were remediated across provider questions and
  decline, browser history, deep-linked receipts, affirmative directory
  disclosure, zero-photo prevention, trust wording, session recovery, keyboard
  focus, forced colors, and expanded resilience validation. No design P0/P1
  findings remain open.
- Executable human evidence protocols now cover owner/provider moderated
  usability, comprehension, VoiceOver, TalkBack, NVDA, keyboard, physical
  devices, 400% zoom-equivalent reflow, and session/device evidence. These real-
  person and physical-device signoffs remain explicitly unsigned rather than
  being simulated.
- The known-provider pilot operations runbook defines proposed responsibility,
  severity, recovery, minimized evidence, monitoring, incident, opt-out,
  identity-dispute, revocation, and go/no-go contracts. Operational staffing,
  service levels, privacy/security approval, and launch rehearsal remain future
  production gates.
- The Yard Crew acquisition design is complete as a connected, validated journey
  for solo owner-operators, multi-crew provider companies, and invited workers.
  "Yard Crew" remains the audience language while provider organizations remain
  the account, eligibility, opportunity, proposal, and customer-relationship
  boundary.
- Its working prototype covers credible public acquisition, path selection,
  provider profile and readiness, owner-approved opportunity previews, empty,
  paused, and unavailable states, provider-specific disclosure, remote or
  on-site yard review, proposal and revision, accepted-but-unassigned handoff,
  first-visit confirmation, invitations, and contextual support.
- Repeatable Yard Crew validation covers the connected desktop journey, tablet,
  390px and 320px mobile, 200% text, target sizes, accessible names, validation,
  interest failure and retry, disclosure boundaries, overflow, and browser
  errors. The handoff preserves owner choice and provider crew assignment as
  separate decisions and records the marketplace gates still required.
- The Yard Crew industry-language review is complete. Public and workflow copy
  now uses landscape-service terms for provider qualification, service
  opportunities, preliminary briefs, site assessment, scope of work, service
  proposals, mobilization, crew assignment, and work-order release. Specialized
  language is paired with plain-language consequences, and license, insurance,
  certification, irrigation, and tree-work claims retain explicit scope and
  verification boundaries.
- The Yard Crew tone calibration is complete. Customer-facing headings and
  actions now use a warmer, direct account-manager voice—get the business ready,
  ask to assess the property, send a clear proposal, and prepare the first
  service—while service opportunity, site assessment, scope of work, service
  cadence, proposal, crew assignment, and work order remain visible where they
  help providers operate confidently.
- The Yard Crew professional V2 review is complete. The working design now
  groups progress into Get started, Find the right work, and Start service;
  keeps Support outside completion; exposes capacity and ready-with-limits
  states; adds privacy-safe property, timing, and route-fit facts; tracks owner
  response and disclosure; structures site assessment; and separates the
  provider-private production basis from the owner proposal.
- The Yard Crew V3 extension phases are complete. First-service preparation now
  previews the exact owner update before confirmation, retains provider-private
  exclusions, recovers a failed delivery, and records a sent receipt. Team
  administration compares authority, requires owner approval, and covers
  correction, delivery, acceptance, expiry, and revocation. Saved opportunity
  alerts define frequency, channel, quiet hours, capacity suppression, failure
  recovery, pause/resume, and no-priority boundaries. Pilot governance limits
  the recommended first release to known-owner connections while curated
  marketplace claims remain gated.
- Yard Crew validation now covers those V3 states in the connected desktop
  journey and rechecks tablet, 390px, 320px, 200% text, target sizing,
  accessible naming, focus/recovery, overflow, and browser errors. Three V3
  review references and an extension handoff are available in the gallery.

Next design work:

- Adopt the Yard Owner proposal interfaces, separate proposal conversation, and
  explicit activation boundary before widening the provider-discovery surface.
- Continue production visual convergence through the authenticated application
  shell, field execution, manager daily operations, and completion-proof
  handoff in the order recorded by
  [`project-planning/PROTOTYPE_ADOPTION.md`](project-planning/PROTOTYPE_ADOPTION.md).
- Adopt the Yard Owner V2 portal after its customer-specific next-visit read
  model is delivered, then return to the property-manager portfolio working
  design; keep billing product-gated.
- Execute the prepared owner/provider usability, assistive-technology, physical-
  device, privacy/security, and support/operations signoff sessions against the
  committed assurance build; treat any critical disclosure misunderstanding as
  a release-blocking P1.
- Adopt Yard Crew public routing and identity/readiness, then resolve provider eligibility,
  pre-consent opportunity fields, provider roles, and safety/support service
  levels before curated opportunities. Use the completed V3 owner-notification,
  team-authority, saved-alert, and pilot-governance contracts during adoption.

Exit condition: each next UI implementation slice links to an approved page,
responsive behavior, required states, and design decision record.

### Yard Owner acquisition production adoption

Goal: adopt the professionally reviewed acquisition journey without storing a
private pre-provider yard inside a landscaping company tenant.

Active slice:

- Phase 1A is delivered: authenticated-subject workspaces, private properties,
  per-owner duplicate protection, minimized lifecycle audit events, fail-closed
  repository outcomes, and PostgreSQL owner-isolation coverage.
- Phase 1B is delivered: verified identities can use self-scoped workspace and
  property APIs without provider roles; authentication supplies identity,
  validation is explicit, and missing, duplicate, and unavailable outcomes stay
  distinct.
- Phase 1C is delivered: `/app/yard-owner` connects the approved private-entry
  experience to the production API, the public Yard Owner journey links directly
  to it, and responsive browser coverage proves profile/property recovery,
  address reconfirmation, authority attestation, and privacy wording.
- Phase 1D is delivered: the four-step acquisition header is now the workflow
  navigation, completed steps can be reopened for review or editing, and
  Property, Yard brief, and Connect care render as independent screens with
  explicit back/continue actions and browser regression coverage.
- Phase 2A is delivered: owners can create, revise, and reload append-only private
  yard-brief versions with areas, goals, cadence, considerations, draft/ready
  state, owner/source provenance, minimized audit events, and fail-closed owner
  isolation. The production React journey includes accessible draft and ready
  recovery without presenting the brief as measurement, diagnosis, price, a
  work order, or provider instruction.
- Phase 2B is delivered: owners can add, reload, replace, and delete optional
  guided photographs through owner-scoped upload and processing states. Media
  remains independent of jobs and provider organizations, replaced originals
  stay visible for explicit deletion, and provider access is not created.
- Phase 3 is in progress. Slice 3A1 delivers recipient-specific invitation
  persistence with a server-derived limited snapshot, hashed bearer tokens,
  replay-safe idempotency, live-recipient duplicate protection, suppression,
  pending delivery attempts, expiry projection, minimized audit events, and
  owner-isolation coverage. No delivery is represented as successful yet.
- Slice 3A2 is delivered: verified owners can create, list, inspect, and revoke
  self-scoped invitations through validated APIs. Responses distinguish new,
  replayed, conflicting, suppressed, missing, closed, and unavailable outcomes;
  neither bearer tokens nor hashes enter API JSON, and revoke atomically closes
  pending delivery.
- Slice 3A3 is delivered: internal service operations map delivered and failed
  attempts, reject stale outcomes, rotate and hash retry tokens, enforce
  per-attempt idempotency, and materialize expiry with atomic delivery closure
  and lifecycle audit. No public callback is exposed without an authentication
  contract.
- Slice 3A4 is delivered. Verified recipients can opt out through a protected
  body-token endpoint that matches the invited mailbox, closes the invitation,
  suppresses future invitations, and audits the transition idempotently without
  placing the bearer token in the URL. They can also explicitly block and report
  spam, harassment, impersonation, suspicious contact, unsafe contact, or a
  wrong recipient through minimized, severity-routed Trust & Safety case intake.
- Slice 3A5 requires a selected, authenticated delivery adapter/callback and
  remains an integration dependency. No pending message is represented as
  delivered.
- Phase 3B1a is delivered: a public body-token preview opens only delivered
  invitations, exposes the approved limited snapshot with a masked recipient
  hint, records application-open once, keeps recipient/organization/capability
  checks false, denies pending delivery, and returns status-only for closed
  links.
- Phase 3B1b is delivered: the invited verified mailbox may bind one
  authenticated account after limited review. Replay is idempotent, a second
  account fails closed into an identity conflict, audit excludes email/account
  identifiers, and organization relationship plus response capability remain
  false.
- Phase 3B2a is delivered. A checked invitation recipient can list only their
  own active yard-care memberships, select a server-rechecked existing
  relationship, or submit an authority-attested new-provider name. Normalized
  possible duplicates enter non-disclosing Provider Operations review; unique
  names become bootstrap-ready. Replay, wrong-mailbox, cross-account, closed,
  outage, and active-claim boundaries fail closed, and response capability
  remains false.
- Phase 3B2b is delivered. Final bootstrap version-checks and locks the
  normalized name, repeats duplicate detection inside the transaction, and
  atomically creates one active yard-care organization, organization-owner
  membership, claim provenance, and access audit. Concurrent same-name claims
  create at most one organization; the other returns to non-disclosing Provider
  Operations review. Slice 3B2c dispute operations is next.
- Phase 3B2c now has a legal-transition and data-minimization contract for the
  support-only review queue, append-only restricted-evidence references,
  controlled dispositions, recipient appeals, separation of duties, SLA aging,
  and identifier-free monitoring.
- Phase 3B2c1 is delivered. Support administrators can load a minimized
  duplicate/under-review/disputed queue and apply versioned, replay-safe legal
  transitions backed by append-only review events and opaque restricted
  evidence references. General audit excludes evidence and candidate data.
- Phase 3B2c2a is delivered. The original checked recipient can appeal only a
  rejected claim through the active body-token invitation, one of three
  controlled categories, a restricted evidence reference, current version, and
  actor-scoped idempotency key. Appeals reopen `under_review`, retain response
  capability as false, link append-only to the rejection, and keep evidence,
  recipient email, and private owner data out of general audit. Independent
  appeal decisions are next.
- Phase 3B2c2b is delivered. An active appeal can be decided only through the
  dedicated approved/rejected actions, the original rejecting reviewer is
  excluded, ordinary dispositions cannot bypass the appeal, replay is
  idempotent, and the decision links append-only to the appeal. Approval returns
  to `bootstrap_ready` for the mandatory final duplicate rescan and still grants
  no response capability.
- Phase 3B2c2c is delivered. Support administrators have identifier-free
  aggregate counts for duplicate, under-review, disputed, due, overdue,
  priority, and oldest-age states; unavailable remains distinct from zero. The
  operations runbook defines access, SLA response, escalation, outage, replay,
  correction, rollback, and live-signoff evidence. Phase 3B2 is complete; Phase
  3B3 bounded opportunity-response capability is next.
- Phase 3B3 now has a production capability contract covering transactional
  issuance prerequisites, immutable invitation/brief/organization scope, four
  allowed pre-disclosure actions, withheld categories, expiry and revocation,
  server-side enforcement, audit minimization, and separate inbox/action slices.
  Slice 3B3a capability issuance is the next implementation unit.
- Phase 3B3a is delivered. A checked recipient may request one persisted
  response capability only after an atomic recheck of active invitation,
  mailbox binding, eligible claim, active yard-care organization, and active
  actor membership plus explicit withheld-data acknowledgement. The capability
  is brief-version and invitation-expiry scoped, fixes the four allowed actions,
  fails closed on conflict/outage, and is revoked or expired atomically with the
  invitation.
- Phase 3B3b is delivered. The protected body-token inbox rechecks recipient,
  capability, invitation, claim, organization, membership, and expiry on every
  read. Effective access returns only the approved limited snapshot, own
  organization context, four actions, and withheld categories. Changed or
  closed authority is reconciled and returns status-only recovery with no owner,
  organization, or action data.
- Phase 3B3c is delivered. The verified provider may submit only one controlled
  preliminary question, express assessment interest, decline this invitation,
  or route a safety report under the active capability. Every write rechecks
  mailbox, invitation, capability version/expiry, claim, organization, active
  membership, and allowed action in one transaction. Questions and interest
  preserve the bounded capability; decline closes only this invitation; report
  revokes authority, opts out and suppresses the recipient, and creates a
  minimized Trust & Safety case. Replay, stale version, duplicate action,
  changed authority, wrong mailbox, and outage remain distinct. Phase 3B3 is
  complete; Phase 3C owner/provider progress read models are next.
- Phase 3C0 is delivered as a production read-model contract. Owner and provider
  progress are separate projections with explicit state precedence,
  customer-safe response mapping, status-only closure, controlled recovery,
  accessibility wording, outage distinction, and visibility tests. Phase 3C1
  owner/property-scoped connection progress is the next implementation slice.
- Phase 3C1 is delivered. Verified owners can load a property-scoped connection
  collection derived from invitation, delivery, and bounded-response facts.
  Deterministic stages and customer-safe labels expose question and interest,
  generalize decline, collapse opt-out and safety report into contact closure,
  and omit recipient email, capability/member identifiers, raw capacity/safety
  codes, private yard data, and competitors. Missing property, empty history,
  and outage remain distinct. Phase 3C2 provider progress is next.
- Phase 3C2 is delivered. The checked recipient can load a protected body-token
  progress projection that rechecks mailbox, invitation, provider relationship,
  organization, membership, capability, and expiry. It exposes gate recovery,
  the actor's own safe question/interest confirmation while authority remains
  effective, and status-only terminal confirmation; it repeats no owner/yard
  snapshot, disclosure choice, capability ID, other response, or safety case.
  Phase 3C3 production interface adoption is next.
- Phase 3C3a is delivered. The production Yard Owner property flow now loads
  connection progress independently from private brief/media state and renders
  accessible loading, empty, unavailable, refresh, action-needed, safe-next-
  step, limited-access, and interest-boundary states. Client tests, TypeScript,
  and the production build pass. The updated mobile browser scenario is
  committed but could not run in the available Node container because Chromium
  lacked `libnspr4`; this remains validation pending, not a passing claim.
  Phase 3C3b provider recipient interface adoption is next.
- Phase 3C3b is delivered. The authenticated provider invitation surface can
  consume a bearer token once from the URL fragment, immediately remove it from
  the address, send it only in the protected request body, and show verified-
  mailbox progress or status-only closure plus the fixed withholding boundary.
  Route/client tests, TypeScript, and production build pass; the browser
  scenario is committed but shares the pending compatible-Chromium rerun.
  Phase 3C is implementation complete. Phase 3D versioned provider-specific
  grants and immutable disclosure receipts is next.
- Phase 3D0 is delivered as the provider-specific disclosure contract. It fixes
  owner-only transactional prerequisites, five independently selected category
  semantics, per-photo selection, no-default affirmation, complete approved/
  withheld partitioning, immutable receipt versus revocable current grant,
  category-filtered provider reads, short-lived media authorization, versioned
  revocation, minimized audit, and fail-closed acceptance criteria. Phase 3D1
  owner review and transactional receipt/grant creation is next.
- Phase 3D1a is delivered. PostgreSQL now separates append-only disclosure
  receipts, current revocable grants, and immutable grant events; constrains the
  full five-category approved/withheld partition, selected-photo consistency,
  purpose, versions, lifecycle, replay keys, and one active grant per
  invitation; and admits minimized grant create/revoke audit kinds. Phase 3D1b
  server-derived owner review and atomic creation is next.
- Phase 3D1b is delivered. Verified owners can load a server-derived,
  provider-specific assessment review naming the current property, provider,
  ready brief, exact selectable categories, ready-photo options, policy
  versions, deadline, retention notice, and non-work authority boundary. Atomic
  approval rechecks recipient, claim, organization, membership, capability,
  interest, brief, media, suppression, expiry, and active-grant state; records
  the exact review version on the immutable receipt; and provides exact replay,
  stale/conflict, isolation, minimized-audit, and outage behavior. Phase 3D2
  category-filtered provider disclosure access is next.
- Phase 3D2 is delivered. The checked provider can open its own active grant
  through a protected body-token request; every read rechecks mailbox, actor,
  organization, membership, relationship, capability, invitation, suppression,
  property, workspace, brief, media, and expiry state. Responses omit every
  withheld category, issue only selected ready-photo URLs bounded by grant
  expiry, expose safe owner/provider progress after approval, reject cross-
  provider access, and reconcile stale authority to status-only expired or
  suspended recovery. Phase 3D3 owner receipt history and explicit revocation is
  next.
- Phase 3D3 is delivered. Owners can inspect property-scoped immutable receipt
  history with named provider, approved/withheld categories, selected-photo
  labels, policy and grant versions, current projection, and latest event. The
  confirmed revoke action is owner-isolated, reason-controlled, optimistic-
  versioned, exactly replayable, append-only, and minimized in general audit;
  it ends future provider reads without rewriting consent history or claiming
  already-viewed information was erased. Owner and provider progress now show
  access-ended recovery separately from invitation closure. Phase 3D4
  production interface adoption and assurance is next.
- Phase 3D4 is delivered. The production Yard Owner flow now presents every
  disclosure category unselected, supports individual ready-photo choice,
  distinguishes shared from withheld information, requires a separate named-
  provider affirmation, and preserves assessment-only, retention, pricing,
  scheduling, crew-assignment, and work-authority boundaries. Owners can review
  immutable access history and explicitly end future access with a controlled
  reason; providers see only present approved fields and photos, an honest
  withheld summary, grant deadline, and status-only ended-access recovery.
  Client tests, the complete frontend unit suite, TypeScript, and the production
  build pass. All four responsive owner/provider browser journeys pass in a
  compatible Chromium runtime, including selective approval and future-access
  revocation from both sides of the connection.
  Phase 3E pilot hardening, privacy/security review, and signed human-device
  assurance is next.
- Phase 3E0 is delivered as the pilot-hardening contract. It separates
  repeatable repository evidence from external technical evidence and signed
  human assurance; orders retry/stale-tab recovery, server authorization and
  concurrency regression, compatible-browser automation, minimized monitoring,
  runbook validation, and synthetic launch rehearsal; and keeps delivery
  integration, human usability/AT/device, privacy/security, staffing,
  operational, and go/no-go decisions explicitly launch-blocking and unsigned.
  The Phase 3E1 retry-safe disclosure approval/revocation slice is next.
- Phase 3E1 is delivered. Owner disclosure approval and revocation retain one
  idempotency key across uncertain retries, preserve the reviewed decision when
  the response is lost, and clear the key only on success, cancel, property
  change, or authoritative conflict. Conflicts reload receipt and connection
  projections before another decision and never claim success. Frontend
  typecheck, all 397 unit tests, isolated production build, and the focused
  compatible-Chromium lost-response/stale-revocation journey pass. Phase 3E2
  server authorization and concurrency regression is next.
- Phase 3E2 is delivered. Exact concurrent disclosure-grant attempts now return
  one created result and one authoritative replay, while changed or stale reuse
  conflicts without partial receipts. Protected grant reads and revocation use
  valid PostgreSQL aliases; the retained-evidence lifecycle fixture is
  repeatable; and the claim-review constraint admits the checked-recipient
  appeal actor required by the existing contract. Rust formatting, the focused
  PostgreSQL lifecycle, all backend tests, and a clean full migration replay
  pass. Strict repository-wide Clippy remains pending on 19 pre-existing
  warnings outside this slice. Phase 3E3 cross-browser, responsive, and
  accessibility automation is next.
- Phase 3E3 is delivered. Playwright now runs the production Yard Owner and
  checked-provider journeys in mobile and desktop Chromium, desktop Firefox,
  and mobile WebKit, with CI provisioning and production-image gating. Coverage
  includes secure fragment removal and refresh recovery, disclosure/revocation
  focus movement, post-revocation closure, 320/768/1366/1440 reflow, visible
  keyboard focus, reduced motion, and forced colors. The combined 24-journey
  matrix, 8 responsive/accessibility profiles, all 397 frontend unit tests,
  TypeScript, and the isolated production build pass. Real assistive-technology
  and physical-device evidence remains unsigned. Phase 3E4 minimized telemetry,
  runbook validation, and synthetic rehearsal is next.
- Phase 3E4 is delivered as automated repository evidence. The machine-readable
  pilot manifest defines 11 minimized metrics across 10 required families, 14
  alert/runbook mappings, seven synthetic launch scenarios,
  rollback/escalation paths, passed
  automated checks, and separate external/unsigned blockers. CI validates the
  synthetic trigger routing and six negative cases that reject private metric
  labels, missing alerts/scenarios, uncontrolled values, and false external
  passes. Live delivery/monitoring integration, dashboards, pager routing,
  calibrated thresholds, named staffing, human usability/AT/devices,
  Privacy/Security approval, and go/no-go remain external Phase 3E5 launch
  blockers. Repository-owned Phase 3E automation is complete.
- Phase 4A1 is delivered. PostgreSQL now records one remote review or proposed
  on-site assessment per invitation only after rechecking the verified provider
  actor, mailbox, explicit interest, organization relationship and membership,
  current owner/property/brief, and active provider-specific disclosure grant.
  Exact concurrent starts replay one authoritative assessment; changed reuse,
  second assessments, wrong actors, stale grants, and outages fail distinctly.
  Owner reads remain property-scoped, and general audit omits mailbox, address,
  schedule, time zone, brief, media, and access details. The following Phase 4A2
  slices deliver lifecycle APIs and customer-safe/private storage separation.
- Phase 4A2a is delivered. Authenticated verified providers can start a remote
  review or proposed on-site assessment through `POST /provider-assessments`,
  with invalid, missing, changed, conflicting, replayed, and unavailable
  outcomes mapped explicitly. Verified owners can list only their property's
  assessment history through `GET /owner-properties/{property_id}/provider-assessments`.
  Route authorization and no-persistence behavior are covered. Following
  Phase 4A2b/c slices deliver separate customer-safe/private stores and the
  optimistic lifecycle transitions.
- Phase 4A2b1 is delivered as the assessment communication persistence boundary.
  Customer-safe owner/provider messages and provider-private assessment notes
  live in separate constrained tables; the owner projection selects only the
  shared table, author roles are restricted by message kind, provider notes use
  controlled production/scope/safety categories, and append-only events omit
  both bodies. PostgreSQL coverage proves private crew-hour, disposal, and route
  assumptions cannot enter the owner message projection or minimized event
  payloads. Optimistic lifecycle transitions are now delivered; authorized
  repository writes remain next.
- Phase 4A2c1 is delivered. A verified owner can confirm a proposed on-site
  assessment window or request a different one through a property/assessment-
  scoped API. The mutation locks current state, requires the expected version,
  accepts only the two controlled actions, records one append-only minimized
  event, exactly replays uncertain retries, and returns authoritative current
  state for invalid lifecycle attempts. Cross-owner, concurrent, changed-key,
  stale-state, invalid-request, route-authorization, outage, and PostgreSQL
  behavior are covered. Confirmation remains an assessment appointment only; it
  does not accept service, create a customer, assign a crew, or release work.
  Phase 4A2c2 is also delivered. The same verified provider actor can begin an
  authorized remote review or owner-confirmed visit, then complete, mark unable
  to assess, or cancel it through a versioned transition API. Every mutation
  rechecks current invitation, capability, interest, provider organization and
  membership, disclosure grant, property, workspace, and brief authority;
  exact retries replay, stale or ended authority returns authoritative state,
  terminal outcomes use controlled reasons and a bounded owner-visible summary,
  and minimized events do not duplicate that summary. These transitions still
  cannot accept a proposal, activate service, create work, or assign a crew.
  Phase 4A2b2 is delivered. Owners can persist only owner-authored shared
  messages for their own property/assessment, while the verified provider actor
  can persist controlled customer-safe messages or provider-private notes only
  after current authority is rechecked. Writes require the current assessment
  version, exactly replay actor-scoped retries, return status-only terminal
  recovery, and append events without copying either body. Owner repository
  reads use only the shared projection and have no private-note source.
  Phase 4A2b3 is delivered. Authenticated owners can list/create only their
  assessment's shared messages, and verified providers use separate shared-
  message and provider-private-note routes. Separate validation and response
  mapping preserve invalid, missing, ended-state, conflict, replay, and outage
  distinctions; there is no owner private-note route.
- Phase 4A2c3 is delivered. The production Yard Owner property journey now
  lists assessment history, distinguishes proposed, confirmed, active, and
  terminal states, lets the owner confirm or request another on-site window,
  and supports only customer-safe owner/provider conversation. Retry keys are
  preserved across uncertain decisions, stale conflicts reload authoritative
  state, provider-private notes remain absent, and the interface never presents
  assessment as pricing, service acceptance, crew assignment, or scheduling.
  Phase 4A2c4 is delivered. Verified providers can start a remote review or
  propose an on-site window, obey owner confirmation before beginning a visit,
  record controlled outcomes, exchange customer-safe messages, and maintain a
  separately projected private-note workspace. Active disclosure reloads now
  recover the current assessment and both visibility-specific threads, while
  retry keys and concurrent start recovery preserve one authoritative result.
  Phase 4A2c5 is delivered. After an owner requests a different on-site time,
  the same verified provider can submit one bounded replacement against the
  current version; exact retries replay, changed/stale writes conflict, ended
  authority fails closed, and the assessment returns to owner confirmation
  without scheduling service. Versioned initial-service proposals follow.
- Phase 4B proposal design is complete in
  [`docs/owner-provider-initial-service-proposal-design.md`](docs/owner-provider-initial-service-proposal-design.md).
  Acquisition proposals remain separate from project bids because they precede
  customer accounts and jobs. The contract defines immutable proposal versions,
  exact-version owner decisions, accepted-but-unactivated snapshots, separate
  question/change requests, minimized audit, and a Phase 4B1 persistence-first
  implementation sequence.
- Phase 4B1a is delivered. A clean migration replay now creates acquisition-
  specific proposal versions, owner decisions, accepted snapshots, and
  minimized events with bounded content, currency/price/cadence controls, one
  open or accepted proposal per assessment, actor-scoped replay uniqueness, and
  database-enforced published-content immutability.
- Phase 4B1b is delivered. Verified providers can persist an initial proposal
  or immutable revision only against a completed, currently authorized
  assessment; actor-scoped exact retries replay and stale or changed writes
  conflict. Owner/property-scoped history reconciles server-derived expiration,
  exact-version accept/decline writes create one immutable decision, and
  acceptance creates a hashed accepted-but-unactivated snapshot. PostgreSQL
  coverage verifies concurrency, isolation, immutability, minimized audit, and
  the absence of customer, service-property, job, plan, or crew side effects.
- Phase 4B2a is delivered. Authenticated verified-provider publication/revision
  and owner/property-scoped proposal list, detail, and exact-version decision
  routes now preserve invalid, missing, expired/current-state, conflict, replay,
  and persistence-outage distinctions. The authorization policy explicitly
  permits only these methods and paths, and route tests fail closed without
  storage.
- Phase 4B3 is delivered. The verified-provider assessment workspace now
  authors initial and revised customer-safe proposals, preserves idempotency
  keys across uncertain writes, keeps production assumptions in private notes,
  and reloads the latest immutable version from the disclosure projection. The
  Yard Owner workspace neutrally presents all versions, scope, exclusions,
  cadence, policies, price, monthly comparison, revision notes, and expiration;
  only a current sent version exposes explicit acceptance or controlled decline.
  Acceptance requires the versioned affirmation and states that no visit,
  payment, or crew assignment was created. Phase 4B2b1 now persists owner
  questions/change requests and provider responses separately, with exact
  proposal-version context and no decision, audit-event, or operational side
  effect. Authenticated owner/provider routes, disclosure reload, and both
  responsive workspaces are now delivered with retry and version-link guidance.
- The Phase 3 working design and production acceptance contract are complete in
  [`design/review/yard-owner-known-provider-connection-handoff.md`](design/review/yard-owner-known-provider-connection-handoff.md);
  overall delivery remains incomplete until server authorization, messaging,
  versioned grants/receipts, opt-out, abuse, and support behavior ship.
- Use [`docs/yard-owner-acquisition-production-plan.md`](docs/yard-owner-acquisition-production-plan.md)
  as the phased production tracker and preserve the design handoff’s consent,
  assessment, proposal, activation, and relationship boundaries.

Current Phase 4B exit condition: a verified provider can publish or revise an
owner-visible proposal after an authorized completed assessment, and a verified
owner can inspect immutable versions and make an exact-version decision in the
production interfaces. Acceptance must remain explicitly unactivated and create
no provider customer, service property, job, contract, route, schedule, payment,
or crew assignment.

### Operational exception activity integration

Goal: connect the exception recovery queue to the persisted manager activity
timeline so lifecycle decisions remain visible and actionable outside the queue.

Planned slice:

- Include operational-exception creation and lifecycle audits in persisted
  operational activity reads with readable actor, status, assignment, and
  resolution context.
- Map those records into manager activity tones and labels without breaking
  unknown-event fallback behavior.
- Add an activity-to-Recovery handoff that opens the operational exception tool
  with the affected item context.
- Cover tenant scoping, event mapping, and mobile handoff behavior, then update
  delivery records after validation.

Exit condition: a manager can see who changed an operational exception, understand
the outcome, and return to its recovery workflow from persisted activity history.

## Delivered

### Local role-review authentication

- Development can run without AWS through a production-rejected
  `AUTH_MODE=local_review` runtime.
- Seven fixed reviewer identities cover organization owner, manager, crew lead,
  crew member, property manager, property owner, and support administrator.
- The backend derives each selected identity from an allowlist, rejects unknown
  reviewers, and overlays demo-organization memberships without persisting fake
  production accounts.
- A persistent application banner and per-tab reviewer selector reload the
  workspace on identity changes so prior-user React state is not retained.
- Docker Compose and the mobile-review script use local role review by default;
  legacy disabled authentication remains available for automated tests.

### Design review foundation

- Source-controlled design workspace mirrors the eventual application areas
- Browsable visual gallery covers twenty public, authenticated, field, manager,
  customer, revenue, homeowner, and multi-vendor wireframes
- Deterministic SVG artifacts remain editable, diffable, and viewable without a
  hosted design platform
- Information-architecture, responsive-composition, state-coverage, and design
  decision records establish a review gate before new UI implementation
- V1 professional design system and representative high-fidelity concepts replace
  generic card-grid styling with page-specific marketing, field, and dispatch
  compositions
- V2 working public-homepage design carries audience context through the complete
  visitor journey and demonstrates responsive, keyboard, validation, recovery,
  and success behavior without a production dependency
- Desktop and mobile review images, browser validation, implementation handoff,
  and explicit prototype boundaries make the public design adoption-ready
- The local Vite server exposes the live design gallery at `/design/` for remote
  VPN review without copying design documents into the production frontend build

### Public product experience

- Public root homepage introduces Grover without requiring authentication
- Outcome-led hero positions Grover around the plan, field care, and customer-ready proof
- Hero signup invitations now keep both acquisition paths visible: Yard Owners
  enter the private yard workspace and landscaping companies enter authenticated
  organization onboarding without first changing the audience selector
- Interactive audience selector tailors the complete landing-page narrative for
  yard owners, property managers, landscaping companies, and crew leads,
  including the hero, trust, proof, capabilities, and final invitation
- Product preview, Plan-Care-Proof workflow, capability story, trust cues, and repeated workspace calls to action create a complete marketing narrative
- `/app` remains the direct authenticated or auth-disabled workspace entry, while callbacks, invitations, diagnostics, shared bids, and shared reports retain dedicated routing
- Installed application sessions now start directly at `/app`
- Public marketing remains independent of API, network, update, and installation banners so backend readiness cannot make the homepage appear unavailable
- Persona-specific conversion actions distinguish demo requests, portfolio discussions, and yard-owner early access
- Conversion form captures contact consent, audience, team or portfolio size, goals, landing path, and UTM attribution with a hidden spam honeypot
- Public marketing-lead API validates requests and persists production submissions to PostgreSQL without requiring authentication
- Confirmation clearly distinguishes durably recorded production requests from non-persisted local preview submissions
- Shareable campaign paths tailor the complete page story and conversion action
  for yard owners, property managers, landscaping companies, and crew leads
- Persona selection keeps UTM attribution while updating the browser URL, canonical metadata, and search/social descriptions without a page reload
- Public crawler guidance keeps workspace, authentication, invitation, diagnostics, and customer-share routes out of search results
- Interactive Plan-Care-Proof tour lets visitors inspect shipped route, field, offline, evidence, reporting, and recommendation workflows
- Tour outcomes adapt to the active marketing persona while retaining a single connected product narrative
- Credibility section maps marketing claims to delivered capabilities and explicitly reserves customer quotes, logos, and metrics for verified approvals
- Persona outcome panel replaces placeholder numbering with benefit-led titles and concise explanations of the operational change
- First-party conversion events measure page views, persona selection, tour use, CTA engagement, form starts, submissions, and failures
- Analytics uses a random per-tab identifier plus bounded persona, placement, path, and UTM context without third-party cookies or personal form data
- Analytics session creation tolerates non-secure iPhone URLs, unavailable `randomUUID`, and storage-denied privacy modes without blocking the public page
- Public analytics API rejects events outside the explicit funnel allowlist and persists production events for later manager reporting
- Support-admin marketing inbox lists up to 250 recent leads with contact, persona, intent, campaign, and request context
- Lead workflow supports ownership, next-action scheduling, qualification status, and bounded follow-up notes
- Every workflow update records the platform operator, previous and new status, assignment, next action, note, and timestamp
- Public POST submission remains unauthenticated while all lead reads and mutations require the SupportAdmin role; auth-disabled local review receives that role
- SupportAdmin conversion dashboard reports a 30-day unique-session funnel, failures, and persona and campaign segments
- Low-volume messaging keeps early conversion rates explicitly directional until at least 100 measured visits
- Open leads with past next-action dates are counted, promoted above other leads, and visually marked overdue

### Mobile navigation and context

- Persona-aware authenticated application Home is the default mobile workspace
- Home identifies the signed-in person and active persona, summarizes assigned, finished, and pending-sync work, and provides relevant quick actions
- Yard owners, property managers, field crews, company operators, dispatch, billing, and support receive different Home shortcuts
- Home uses a branded first-impression hero with a time-aware greeting, current date, and persona-specific headline
- Home pairs an original Southwestern landscape hero with persona-specific product promises and concise plan-care-proof brand cues
- Home translates progress into persona-relevant service, portfolio, route, revenue, or field-delivery language
- Desktop now opens with the same premium landscape imagery, persona promise, brand cues, and contextual progress as mobile
- Authentication and session-loading screens now introduce Grover with premium imagery, an outcome-led value proposition, trust cues, and a clearer workspace call to action
- Daily progress, sync health, and a recommended next action establish a clear visual and task hierarchy
- Secondary persona destinations use compact workspace cards while signed-in identity details remain available below the primary workflow
- Home status messaging prioritizes pending sync, no assigned work, remaining work, or a completed day with distinct visual tones
- Explicit Route, Jobs, Job, and Manager mobile workspace views replace long-page anchor jumps
- Fixed bottom navigation preserves a stable thumb-reachable location and iPhone safe-area spacing
- Sticky mobile context identifies the current workspace, selected customer, property, job status, workload, and pending sync count
- Selecting a job opens its dedicated mobile view with a clear return to assigned jobs
- Returning between mobile workspaces restores each view's prior scroll position while newly selected jobs open at the top
- Signed-in roles map to yard owner, property manager, crew lead/member, yard-care company owner/manager, dispatcher, billing, and support personas
- Persona-specific navigation hides irrelevant workspaces, and multi-role users can switch their active view without signing out
- Yard owners receive a customer property workspace while property managers receive portfolio and management navigation
- Desktop applies the same persona boundaries: customer roles see property and portfolio care, crews see field execution, company roles see operations, and support sees diagnostics and recovery
- Install and application-update notifications stack above the mobile navbar and iPhone safe area instead of covering navigation
- Install guidance uses device-neutral language across phones, tablets, and desktop computers
- Failed route recovery clears stale Grover Field shell caches before reloading, and online application assets use network-first delivery with offline cache fallback
- Manager activity renders photo-erasure recovery audits and safely falls back for newer server event kinds instead of crashing application startup
- Managers land on a compact role-filtered category home instead of every office tool in one continuous page
- Manager Overview, Schedule, Customers, Team, Reports, and Recovery categories render only when relevant to the active persona
- Each manager category has a compact task picker and renders only one selected tool on mobile and desktop
- Customer, team, report, schedule, and recovery panels no longer stack together inside their category views
- Active manager tools collapse the picker into a compact context bar with a clear return to the category tools
- Crew routes default to the current and next stop instead of rendering the full day down the mobile page
- Crews can expand the complete route on demand and return to the current-work focus in one tap
- Mobile job detail keeps customer context and Start/Complete actions visible while opening Checklist, Photos, Add-ons, and Report individually
- Job workflow tabs show checklist progress, evidence counts, add-on counts, and report readiness without expanding each section
- Selecting a different job resets the mobile workflow to its overview instead of retaining stale secondary context
- Yard-owner and customer portal views start with compact property rows instead of every service timeline
- Mobile customer history renders one selected property's work and reports at a time with a clear return to all properties
- Customer mobile history separates Properties and Bids into counted views instead of stacking both timelines
- Customer bid history provides an explicit empty state and resets property drill-down when changing history areas
- Selected properties preview the two newest completion reports on mobile and disclose the older-report count
- Customers can expand or collapse older property reports without lengthening every property view
- Desktop retains the existing route, jobs, manager, and sticky job-detail dashboard layout

### Crew dashboard foundation

- React/Tailwind crew dashboard
- Assigned job list
- Job detail panel
- Start-job action
- Complete-job action
- Completion checklist display
- Completion report panel
- Completion report API endpoint with job, account, readiness, and photo evidence
- Frontend completion report snapshot client and selected-job wiring
- Completion report PostgreSQL table and report-state persistence helper
- Stable share-token generation for persisted completion reports
- Shared completion report endpoint by share token
- Browser fallback mode when backend is unavailable

### Backend API foundation

- Rust Axum API service
- Health endpoint
- Job list endpoint
- Job detail endpoint
- Account status endpoint for a job
- Job start endpoint
- Job completion endpoint
- Local photo upload-ticket endpoint
- Photo completion endpoint
- Job photo metadata endpoint
- Persisted photo evidence display in the completion report
- Crew day-plan endpoint returning the current route
- Stop-progress endpoint contract and route

### Authentication and production runtime foundation

- Cognito authorization-code flow with PKCE in the React application
- Rust access-token verification against Cognito JWKS
- Route-level role gates for manager, crew, and public report access
- Public runtime authentication configuration endpoint
- Database-backed organization and active membership foundation
- Protected current-user access summary endpoint with claim roles and organization memberships
- Development-only disabled authentication mode for local seed workflows
- Recoverable authentication initialization when the local API starts after the frontend
- Terraform definitions for development and production Cognito user pools
- Single-origin production container and Render deployment definition
- Database-backed readiness checks and production smoke-test script
- Tenant-scoped collection and recovery endpoints return explicit `503` responses
  when active-membership storage is unavailable instead of presenting valid empty data
- Specific-resource authorization distinguishes unavailable membership verification
  from genuine access denial, returning `503` for storage outages and `403` for real denials

### Crew route and stop progress

- Daily crew day-plan panel
- Ordered route stops
- Drive and service time estimates
- Open job from a route stop
- Tightened route-stop fallback job selection
- Local stop progress states: pending, in progress, finished
- Browser persistence for stop progress
- Route progress reset action
- Route progress sync status display
- Frontend client sync attempts for stop progress
- Stop progress domain helpers
- Stop progress helper tests
- Day-plan domain tests
- Backend stop-progress validation
- Backend stop-progress persistence helper for PostgreSQL
- Stop-progress route attempts database persistence and reports whether it persisted
- PostgreSQL-backed stop-progress writes return explicit not-found or unavailable responses instead of local-success payloads
- No-database demo mode retains local stop-progress responses
- First-attempt persisted progress conflicts enter the durable manager-review queue immediately
- Day-plan API response includes stop status
- Backend day-plan read helper for PostgreSQL-backed crew routes
- PostgreSQL-backed day-plan reads return explicit missing or unavailable results instead of substituting seeded routes
- No-database demo mode retains its seeded crew route
- Mobile crew routes distinguish persisted absence and API unavailability from browser fallback
- Route summary finished count resolves server status plus local browser status

### Manager scheduling foundation

- Frontend draft day-plan API client
- Frontend create-draft fallback helper
- Manager create day-plan panel on the dashboard
- Manager draft day-plan card
- Manager publish day-plan API client
- Manager publish fallback helper
- Manager publish button component
- Manager draft action wrapper for card plus publish action
- Manager day-plan helper tests for draft IDs, local draft fallback, local publish fallback, and persistence labels
- Backend draft day-plan request and mutation response contract
- Backend draft day-plan repository helper
- PostgreSQL draft day-plan creation helper
- PostgreSQL publish day-plan helper
- Backend manager route for creating draft day plans
- Backend manager route for publishing day plans
- Backend manager routes for assigning, removing, and reordering day-plan stops
- PostgreSQL-backed route-stop mutations return explicit conflict, not-found, or unavailable responses instead of local success payloads
- Manager route planning preserves the last synced route and offers retry guidance after rejected persisted mutations
- PostgreSQL-backed draft creation and route publication return explicit conflict or unavailable responses instead of local success payloads
- API-rejected draft creation leaves manager scheduling unchanged, while failed publication retains the synced draft for retry
- Newly assigned manager route stops receive reviewable drive and service estimates so a synced route can satisfy the publish guard
- New day-plan drafts snapshot the crew organization's timezone, service-area label, and daily stop capacity
- Manager crew selection shows each crew's capacity and whether a crew lead is assigned before drafting
- Draft route assignment is blocked at the snapshotted stop capacity with mobile manager feedback
- Frontend API clients for manager day-plan stop assignment, removal, and ordering
- Manager draft route planner is mounted under created draft day plans
- Manager add/remove/reorder actions call persisted stop mutation endpoints with local fallback
- Manager route planner shows sync status for persisted and local changes
- Manager route planner shows workload summary for estimated drive and service duration
- Manager route planner shows recovery notices when route changes fall back to local state
- Manager route planner shows retry controls for failed route mutation sync attempts
- Manager route planner shows next-step workflow guidance while drafting
- Manager route planner explains publish blockers from the publish guard
- Manager publish success refreshes the crew-facing day plan route
- Manager activity history panel for route review, completion evidence, and sync fallback events
- Manager activity domain model and history helpers for future persisted activity wiring
- Manager activity history records runtime route, job, photo, and sync events in local state
- Manager activity history supports source filters, tone filters, filtered empty states, active filter summaries, and accessible filter controls
- Manager activity filters persist in browser storage with storage-availability detection and reset behavior
- Manager activity label helper tests
- Manager completion report review queue derived from current job report snapshots
- Manager report queue groups submitted, in-review, change-requested, draft, and delivered reports with counts
- Manager report queue supports active, status-specific, readiness, blocked, local-only, and delivered-history filters
- Manager report queue links queue items back to the job report detail panel
- Backend manager completion-report list endpoint for current job report snapshots
- Backend manager completion-report list endpoint accepts status and readiness filters for server-side queue narrowing
- Frontend report queue uses the list endpoint with per-job fallback

### Crew amendment and bid foundation

- Frontend domain types for crew day-plan amendment requests
- Frontend service catalog item contract for standard and extra services
- Frontend project bid contract with bid statuses and line items
- Helper for detecting when an extra-service amendment requires a bid
- Helper for totaling project bid line items
- Helper for determining whether an approved bid can convert to work
- Frontend tests for amendment labels, bid requirements, bid totals, and bid conversion
- Crew-facing amendment controls for add-stop, remove-stop, and add-service requests
- Crew-facing submitted amendment request summary with bid-review labeling
- PostgreSQL persistence for submitted day-plan amendment requests
- Backend create and list amendment endpoints
- PostgreSQL-backed route-amendment creation and review return explicit conflict or unavailable responses instead of local-success payloads
- First-attempt amendment conflicts enter the durable manager-review queue immediately
- PostgreSQL-backed amendment-list failures return an unavailable response instead of an empty review queue
- No-database demo mode retains an intentionally empty amendment queue
- PostgreSQL-backed crew and day-plan ownership lookups return explicit missing or unavailable results instead of seeded tenant IDs
- Route authorization fails closed with `503` when persisted ownership cannot be verified
- PostgreSQL-backed job and completion-report ownership lookups return explicit missing or unavailable results instead of seeded tenant IDs
- Job and report authorization fail closed with `503`, and the phone detail view does not substitute seeded job detail after an API denial
- PostgreSQL-backed job list and detail reads return explicit missing or unavailable results instead of seeded field work
- Completion-report construction propagates unavailable job reads, while no-database demo mode retains seeded jobs
- The phone assigned-work list distinguishes persisted unavailability from an empty schedule and network-only demo fallback
- PostgreSQL-backed job add-on read failures return an unavailable response instead of an empty add-on list
- Completion-report construction propagates unavailable add-on reads, while demo mode retains an intentionally empty list
- PostgreSQL-backed photo-evidence read failures return an unavailable response instead of empty proof
- Completion-report construction propagates unavailable evidence reads, while demo mode retains intentionally empty evidence
- The phone job view keeps persisted proof hidden and labels evidence unavailability explicitly
- Frontend amendment API client with authenticated requests
- Persisted amendment reload and local fallback with visible sync state
- Manager amendment review panel with pending-request counts and refresh control
- Manager approval and rejection actions for standard route amendments
- Persisted bid-review routing and manager notes for priced extra-service requests
- Role policy preventing crew members from calling manager review operations
- Project-bid and line-item PostgreSQL tables linked to source amendments and customer accounts
- Idempotent draft-bid save and day-plan bid list endpoints
- Manager bid editor for adding, removing, pricing, and annotating line items
- Customer-facing bid message editing with draft persistence state
- Server-derived customer account ownership for amendment-sourced bids
- Manager-only project-bid route policy
- Cryptographically random customer bid share tokens
- Manager send action that locks draft editing and creates a customer review link
- Public customer-safe bid review page with proposal totals and line-item detail
- Two-step customer approve/reject confirmation
- One-time persisted customer decision with sent and responded timestamps
- Generic notification outbox with queued delivery metadata and retry-ready fields
- Email and E.164 SMS destination validation for bid approval delivery
- Atomic bid-token issuance and notification enqueueing
- Seven-day customer approval link expiry enforced on reads and decisions
- Manager link revocation and secure token reissue
- Revocation atomically marks queued or failed delivery work as skipped
- Manager delivery status, channel, recipient, and expiry display
- Background notification dispatcher with PostgreSQL-safe concurrent row claiming
- Generic HTTPS webhook adapter for email/SMS delivery gateways
- Exponential retry backoff capped at one hour and five attempts by default
- Recovery of abandoned in-progress claims
- Dead-letter state for exhausted notifications
- Provider HTTP response code and message ID receipts
- Absolute production customer links in provider payloads
- Idempotent approved-bid conversion into source-job add-ons
- Project-bid conversion records linking bids to execution jobs
- One scheduled job add-on per approved bid line item
- Transactional bid, amendment, and conversion status updates
- Crew job add-on API and job-detail display
- Crew controls for starting and completing approved job add-ons
- Guarded add-on lifecycle transitions from scheduled through completion
- Completed add-on work included in completion report responses and UI

### Account and service tracking foundation

- Customer account summary model
- Customer accounts persist normalized primary contact names, email addresses, and E.164 phone numbers
- Account onboarding readiness requires a named contact and at least one customer communication destination
- Managers can configure account-level email/SMS opt-ins and paired quiet hours
- Notification preferences cannot enable a channel without its validated account contact destination
- Account status card in completion report
- Seed account states for demo jobs
- PostgreSQL migration foundation for customer accounts
- Organization-to-customer account relationship persistence
- Tenant-scoped customer account list and create APIs
- Manager customer-account onboarding panel with local fallback visibility
- Tenant-scoped customer account detail updates for billing and service state
- Manager customer-account editing controls for account status and billing notes
- Persisted customer properties linked to organization/account relationships
- Tenant-scoped customer property list and create APIs
- Manager account cards list and create customer properties inline
- Newly created properties become available to operational onboarding without reload
- Persisted customer properties repopulate operational onboarding after refresh
- Operational onboarding writes require matching property, account, and organization ownership
- PostgreSQL onboarding misses no longer degrade into local seed responses
- Customer portfolio reads use explicit customer property ownership records
- Portfolio creation and grouping enforce active account relationships and same-account property ownership
- Tenant-scoped crew list API for property setup
- Crew assignment requires an existing non-archived property in the crew organization
- Manager property setup panel creates portfolios, groups properties, and assigns crews independently
- Property setup loads portfolio and crew capabilities independently so limited roles retain their authorized tools
- Manager property setup shows persisted portfolio membership and updates membership counts after regrouping
- Tenant-scoped property archive/reactivation ends active crew service and records lifecycle audit events
- Property identity, activation, archival, reactivation, and status audit events are accepted by fresh database migrations
- Mobile property setup uses two-step lifecycle controls and excludes archived properties from operational onboarding
- Managers can edit property names and service addresses from mobile setup
- Database uniqueness prevents duplicate property identities while permitting distinct service areas at one address
- First activation requires an active operational profile and crew assignment
- Mobile lifecycle guidance distinguishes activation, archival, and reactivation
- Tenant-scoped activation readiness exposes safe profile and crew prerequisite booleans
- Mobile property setup shows activation prerequisites before enabling activation
- Account onboarding progress combines customer details, property coverage, service readiness, and activation
- Mobile customer account cards refresh progress after profile, crew, and lifecycle changes
- Manager account onboarding filters separate incomplete work from completed accounts
- Managers can create a service-ready account with primary contact, email or mobile destination, and explicit channel consent in one mobile workflow
- Customer-account search matches customer, contact, email, phone, property name, and service address while composing with onboarding filters
- New-account submission warns on exact normalized customer name, email, or phone matches and supports review or explicit separate creation
- Tenant-scoped customer-account archival preserves records, rejects current properties or unfinished jobs, leaves active onboarding, and records an audit event
- Archived customer accounts have a separate tenant-scoped review and can return to active onboarding through audited two-step reactivation
- Account creation persists direct-owner, property-manager, or service-provider relationship type and shows it in mobile account summaries
- Authorized managers can change active customer relationship types through a tenant-scoped, audited two-step mobile workflow that preserves linked properties and history
- Customer relationship filters compose with onboarding status and search, show active type counts, and persist per organization across mobile reloads
- Managers can download the current filtered customer-onboarding review with relationship, contact readiness, property coverage, activation, and attention counts
- Account progress identifies property-level profile, crew, blocked-status, and activation attention reasons
- Mobile property cards translate attention reasons into manager actions
- Property attention actions select the affected yard and open the relevant operational-profile or service-setup workspace
- Incomplete customer-detail progress opens the account editor with a mobile-sized action
- Missing-property progress opens the affected account's property form and closes it after creation
- Mobile team administration creates organization-scoped role invitations and distinguishes queued delivery from local fallback
- First-owner setup actions open property, crew, route-planning, and team-invitation workspaces
- Owners can review tenant-scoped invitation history and distinguish pending, accepted, revoked, and expired access without exposing invite tokens
- Owners can revoke only pending invitations through a two-step mobile control that archives invited membership access and records an audit event
- Owners can review active and suspended tenant memberships and make two-step role changes without removing the last active organization owner
- Owners can suspend and reactivate memberships through audited two-step controls while preserving the last active owner
- Owners can review the 25 newest tenant-scoped team access events, refreshed after mobile administration actions
- Fresh database migrations permit invitation revocation and membership lifecycle audit events
- Authenticated recipients can preserve an invitation route through sign-in, explicitly accept access, and review the activated organization role and scope
- Invitation notification payloads and local fallback receipts link to the browser acceptance workflow
- API authorization merges active database membership roles with Cognito claims while preserving original claim roles in access summaries
- Workspace guidance refreshes after acceptance and hides manager tools from crew and customer roles
- Mobile invitation creation uses finite 7-, 14-, or 30-day access windows and defaults to seven days
- Invitation history projects elapsed pending access as expired, and expired invitations cannot be accepted or revoked
- Owners can reissue expired or revoked invitations through a two-step mobile control that invalidates old tokens, queues fresh delivery, and records an audit event
- Concurrent and case-variant duplicate pending invitations are blocked per organization and recipient, with mobile guidance back to history and reissue
- Mobile invitation history shows the newest email delivery state and attempt count, with failed-delivery guidance to the retry workflow
- Owners can return failed or dead-letter invitation email to the delivery queue through a two-step mobile action
- Invitation acceptance requires the authenticated Cognito token's verified email to match the normalized recipient, without disclosing which guard failed
- Current-user access exposes verified-email readiness, and mobile acceptance blocks early with actionable Cognito claim guidance when identity is unavailable
- Owners can load and edit organization name and company type from the mobile first-user workspace, with tenant guards and audited persistence
- Organization profiles include validated contact email, phone, and website details in the same mobile owner editor
- Owners can set a supported operating timezone, default service-area label, and 1–100 daily stop planning capacity
- First-owner setup shows persisted completion for organization profile, first crew, first published route, and team invitation with mobile workspace actions
- First-owner setup recommends one next incomplete launch action and confirms when all launch milestones are complete
- First-owner progress refreshes after organization profile, route publication, invitation, and team administration changes
- Organization owners can create uniquely named tenant-scoped crews from the mobile first-user workflow without seed data
- Manager day-plan creation loads tenant-scoped crews and uses a mobile select instead of accepting arbitrary crew IDs
- Owners can rename, deactivate, and reactivate crews with audit history; crews with active property assignments or current routes cannot be deactivated
- Owner administration history includes crew rename, deactivation, and reactivation audit events
- Owners can set a tenant crew's 1–100 stop daily capacity and assign an active owner or crew-lead membership
- Crew lead assignments are constrained to active eligible memberships in the same organization
- New draft routes snapshot the selected crew's daily stop capacity for assignment and publish guards
- Nested customer-account APIs are explicitly protected by route authorization

### Local development and project setup

- Docker Compose local stack
- Tailscale mobile-review command for phone testing without Docker or PostgreSQL
- Mobile-review startup reuses an already healthy no-login phone environment and reports partial port conflicts clearly
- Mobile-first dashboard flow prioritizing route, assigned jobs, and field actions
- Collapsible mobile manager workspace separated from the crew workflow
- Phone-safe gutters, form sizing, overflow handling, and touch targets
- Sticky mobile workflow navigation for route, jobs, job detail, and manager tools
- Phone job selection moves directly to the actionable job detail
- Mobile application manifest, standalone display metadata, field icon, and safe-area viewport support
- Compact mobile route cards with primary progress actions kept visible
- Progressive disclosure for route changes, submitted requests, and per-stop amendments
- Mobile job detail prioritizes start and complete actions above secondary content
- Expandable job checklist with compact completion-count summary
- PostgreSQL migrations
- Day-plan, crew, and stop table migration
- Local migration script
- Backend test structure
- Frontend test/build commands
- GitHub Actions CI workflow
- Project README rewritten as practical project documentation

## In Progress

### Day-plan backend persistence

Goal: move crew route and stop progress from local/browser state to database-backed state.

Current state:

- Frontend has a day-plan API client for `GET /crews/{crew_id}/day-plan/today`
- Frontend has stop-progress API client for `POST /day-plans/{day_plan_id}/stops/{stop_id}/status`
- Backend has `GET /crews/{crew_id}/day-plan/today` returning explicit `404` and `503` responses for missing and unavailable persisted routes
- Backend has stop-progress route returning `persisted: true` when the PostgreSQL update succeeds and local fallback when it does not
- Backend has a PostgreSQL day-plan read helper that joins day plans, crews, stops, and jobs
- Day-plan, crew, and stop tables exist in migrations
- Frontend syncs route progress to the backend when the endpoint is available
- Frontend falls back to browser persistence when backend sync is unavailable
- Frontend can consume backend `stop_status` values for each route stop
- Frontend route summary finished count resolves backend stop status plus local browser status
- Backend repository fallback tests cover day-plan reads and stop mutations without a database pool
- GitHub Actions provisions PostgreSQL, applies migrations, and runs database-backed integration tests
- Integration tests fail loudly in CI when `DATABASE_URL` is missing instead of silently skipping

Delivered:

- Job-account summaries load customer billing, approval, and service-period data from PostgreSQL
- Persisted job-account reads distinguish missing data from unavailable storage while retaining no-database demo summaries
- Completion report generation fails closed instead of presenting seeded billing or approval context in persisted mode
- Phone completion reports hide seeded account figures and explain when persisted account context is unavailable
- Active and archived customer-account lists return explicit persisted-storage unavailable responses
- Manager onboarding clears stale account collections and distinguishes unavailable lists from valid empty lists
- Customer-property collections return explicit unavailable responses instead of empty persisted lists
- Manager onboarding warns when persisted property counts and readiness inputs are incomplete
- Account onboarding progress and property activation readiness distinguish not-found from unavailable persistence
- Manager setup warns when persisted progress or readiness cannot be trusted
- Customer-account creation and updates distinguish unavailable persistence from missing tenant-scoped records
- Mobile onboarding explains when create or update attempts were not saved
- Manager and customer portfolio reads distinguish unavailable persistence from valid empty grouping
- Property setup blocks grouping controls when persisted portfolio context cannot be loaded
- Property and crew assignment lists distinguish unavailable persistence from valid unassigned state
- Property setup blocks assignment controls when persisted assignment history cannot be loaded
- Day-plan and customer project-bid lists distinguish unavailable persistence from valid empty history
- Manager amendment review warns when existing persisted bid context cannot be trusted
- Project-bid draft creation returns explicit conflict and unavailable outcomes in persisted mode
- Manager bid editing explains when a draft was not saved
- Project-bid revoke and approved-work conversion distinguish business conflicts from unavailable persistence
- Manager bid editing states when links were not revoked or add-ons were not created
- Shared-bid reads distinguish missing links from unavailable persisted storage
- Customer bid decisions return explicit conflict and unavailable outcomes, with browser-safe retry guidance
- Property-crew assignment writes distinguish invalid targets from unavailable persistence
- Property setup confirms that no assignment changed when persisted storage is unavailable
- Property-portfolio creation and linking distinguish business conflicts from unavailable persistence
- Property setup confirms that unavailable portfolio storage created or changed nothing
- Organization membership and invitation collections distinguish unavailable persistence from valid empty lists
- Owner administration clears stale collections and refuses to present seeded or empty history during outages
- Team-administration and operational activity distinguish unavailable persistence from valid empty audit history
- Manager activity views preserve browser-local warnings while identifying unavailable persisted history
- Organization profile and first-owner setup reads distinguish unavailable persistence from missing organizations
- First-owner onboarding refuses to infer missing or completed setup when persisted reads fail
- Organization profile updates distinguish unavailable persistence from invalid or missing organizations
- Profile editing confirms that no changes were saved when persisted storage is unavailable
- Invitation create, revoke, reissue, and acceptance writes distinguish persistence outages from lifecycle conflicts
- Invitation workflows confirm that no invitation or access change occurred during persisted write outages
- Membership role, status, and profile writes distinguish persistence outages from membership conflicts
- Membership administration confirms that no team access or identity change occurred during persisted write outages
- Active membership and principal-access reads distinguish persistence outages from valid users with no memberships
- Authentication and onboarding fail closed instead of substituting seeded owner access during database outages
- Job start, completion, and checklist writes distinguish unavailable persistence from missing records
- Phone job actions queue durable offline mutations instead of reporting persisted success during write outages
- Shared completion-report and property report-history reads distinguish unavailable persistence from missing or empty results
- Customer report links explain storage outages separately from invalid links
- Completion-report persistence and immutable delivered-snapshot writes return explicit unavailable outcomes
- Report construction and delivery refuse to report success when required persisted artifacts cannot be stored
- Photo-upload ticket creation and completion distinguish unavailable persistence from missing uploads
- Persisted photo writes no longer return accepted upload messages after database failures
- Photo-processing and erasure-deletion worker claims distinguish unavailable persistence from empty queues
- Worker cycles log unavailable claim storage instead of reporting an idle successful cycle
- Photo-processing and erasure-deletion completion/failure writes distinguish unavailable persistence from unchanged jobs
- Worker cycles report unavailable when claimed work cannot be durably completed or failed

Next implementation work:

- Continue auditing remaining persisted customer reads for silent empty or missing fallbacks
- Audit remaining notification, report, and job repository methods for boolean or empty fallbacks
- Harden and validate the next highest-impact persisted workflow

### Manager scheduling workflow

Goal: let managers create, review, and publish day plans before crews start routes.

Current state:

- Frontend manager panel can create draft day plans through the API client with local fallback
- Frontend manager panel is visible below the crew day-plan panel
- Frontend can display draft day-plan mutation results
- Frontend has a publish client and local publish fallback
- Frontend has a publish button and action wrapper ready for manager panel actions
- Backend repository and PostgreSQL helpers exist for draft creation
- PostgreSQL helper exists for publishing a day plan
- Backend create and publish routes are exposed through Axum
- Backend stop assignment, removal, and ordering routes are exposed through Axum
- Frontend API clients can call manager stop assignment, removal, and ordering routes
- Frontend manager panel creates a draft plan and renders the editable route planner for that draft
- Frontend manager route add/remove/reorder actions attempt backend persistence and degrade to local state
- Frontend manager route planner shows estimated workload summary
- Frontend manager route planner explains local fallback recovery when mutation persistence fails
- Frontend manager route planner shows retry controls for failed route mutation sync attempts
- Frontend manager route planner shows next-step guidance while drafting
- Frontend manager route planner explains publish blockers from the publish guard
- Frontend manager activity history panel surfaces route review, completion evidence, and sync fallback events
- Frontend manager activity history records runtime manager events for route publishes, job lifecycle changes, photo evidence, and sync fallback
- Frontend manager activity history can filter by source and tone, summarize active filters, show filtered empty states, persist filter preferences, and reset saved filters
- Frontend manager activity label helpers have focused tests for source labels, tone labels, and filter summaries
- Crew-facing day-plan panel refreshes after a persisted manager publish
- Crew-facing day-plan reads ignore draft routes until they are published
- Frontend has domain contracts for crew amendment requests, service catalog items, and project bids
- Crew-facing day-plan panel submits and reloads amendment requests through the backend
- Backend persists add-stop, remove-stop, and add-service requests with request status, pricing, approval, and bid-review metadata
- Backend exposes create and list routes for day-plan amendments
- Frontend retains a local request and displays sync-pending state when persistence is unavailable
- PostgreSQL integration coverage verifies amendment creation and retrieval
- Manager review UI loads current-route amendments and distinguishes submitted, bid-review, approved, and rejected states
- Manager decisions persist through a dedicated review endpoint with optional manager notes
- Extra-service requests requiring pricing transition to bid review instead of being treated as approved work
- Manager bid workspace builds persisted draft bids directly from bid-review amendments
- Draft saves replace line items atomically and reload through the day-plan bid endpoint
- Bid responses expose draft approval status, customer message, customer account, and computed total
- Sent bids expose a shareable customer review link without manager-only identifiers
- Customer decisions transition sent bids to approved or rejected exactly once
- Bid delivery requests are recorded as queued rather than falsely reported as provider-delivered
- Expired and revoked customer tokens cannot read or answer a bid
- Revoked bids can issue a replacement token and enqueue a new delivery
- Approved bids convert once without duplicating job add-ons
- Converted add-ons are visible to crews as scheduled source-job work
- Converted add-on service duration is included in route workload estimates

Next implementation work:

- Configure and validate an email/SMS provider gateway in the production environment
- Add an authenticated customer-scoped bid history after tenant boundaries are persisted
- Connect manager activity history to persisted notification events

### Authentication, authorization, and access controls

Goal: require managed identity and role-aware API access before production release.

Current state:

- React uses Cognito managed login with OAuth authorization code and PKCE
- The API verifies bearer access-token signature, issuer, audience/client, expiry, and Cognito groups
- Manager, crew, customer, and public report route policies are covered by focused tests
- Runtime authentication configuration is served from `GET /auth/config`
- Local development can explicitly use disabled authentication outside production
- Development and production Cognito infrastructure is declared in Terraform
- Persisted completion report review, change request, resubmit, and delivery transitions record organization-scoped audit events
- Crews carry organization ownership, and day-plan, amendment, stop, and manager bid APIs enforce active organization membership before using persisted or local fallback data
- Job list/detail, job account, job report, add-on, photo, and completion-report action routes enforce active organization membership before returning or mutating job-scoped data
- Property portfolio create/list/link APIs are wired to PostgreSQL and enforce active organization membership before grouping customer yards
- Property crew-assignment APIs are wired to PostgreSQL and enforce active organization membership plus crew organization ownership before changing service assignments
- Organization invitation APIs create pending memberships, queue invitation email delivery, accept invite tokens into active memberships, and audit invite acceptance plus role changes
- Persisted portfolio grouping and crew assignment changes record organization-scoped audit events
- Persisted customer bid approvals, customer bid rejections, and manager bid conversions record organization-scoped audit events
- Persisted notification retry and manual resolution actions record organization-scoped audit events
- Persisted job account-summary reads record organization-scoped `account_viewed` audit events
- Authenticated current-user access summary reads record organization-scoped `login` audit events
- First-user bootstrap API atomically creates a service organization, assigns the signed-in Cognito subject as organization owner, and records an audit event only when the user has no active membership
- Frontend first-owner setup detects missing membership, creates the organization through the persisted bootstrap API, and shows the first-route readiness checklist
- Hosted pilot runbook documents Cognito provisioning, first-owner creation, PostgreSQL membership binding, validation, and rollback notes
- Cognito hosted-pilot validation script checks Terraform outputs and optional deployed `/auth/config` values
- Customer property portfolio reads ignore wrong-account portfolio links so scoped customer yards remain visible as ungrouped properties
- Property completion-report reads return delivered reports and share links within active customer/manager organization scopes
- Customer portal preview loads delivered property report history from the authenticated property completion-report endpoint
- Customer account bid history returns sent, answered, and converted bids within active customer/manager organization scopes
- Customer portal preview loads authenticated customer account bid history with local bid-review fallback
- Production smoke script validates Cognito auth config plus route, report, photo upload-ticket, customer portfolio, bid-history, and report-history reads
- Notification webhook validation script checks production delivery configuration and supports opt-in provider test requests

Next implementation work:

- Provision the Cognito environment and create the first organization-owner identity
- Continue tenant-aware resource boundaries for remaining shared customer reads

### Photo evidence flow

Goal: evolve local photo placeholders into production-ready evidence capture.

Current state:

- Frontend can request a local upload ticket
- Backend returns a local placeholder upload response
- Backend stores local photo ticket metadata in PostgreSQL when persistence is available
- Completion report can display photo-ticket evidence
- Backend can list persisted job photo metadata
- Frontend loads persisted photo evidence for the selected job and merges it with browser-local evidence
- Completion report counts photo evidence without double-counting persisted job photo totals
- Completion report endpoint attaches persisted photo evidence
- Configurable S3 presigned upload tickets for production photo evidence storage
- Expiring S3 display URLs for persisted photo evidence when object storage is configured
- Browser-generated thumbnail preview uploads for S3-backed photo evidence
- S3 upload tickets define thumbnail normalization policy with JPEG content type and max pixel dimension
- S3-backed upload completion attempts server-side JPEG thumbnail generation using the normalized thumbnail policy
- Persisted thumbnail display URLs for job photo evidence and customer-visible completion reports
- Upload completion records validated client-reported file size and image dimensions on persisted photo evidence
- S3-backed upload completion attempts server-side file-size verification and PNG, GIF, JPEG, or WebP dimension extraction before falling back to client-reported metadata
- Photo evidence reads hide pending upload tickets and mark server-extracted uploads as processed
- Photo upload-ticket requests reject blank file names, unsupported photo categories, and non-image content types before storage rows are created
- Rejected photo uploads persist rejection reason/timestamp metadata and remain quarantined from photo evidence reads
- Upload completion enqueues durable thumbnail-generation retry work when S3 inspection or thumbnail generation cannot finish synchronously
- Optional background photo-processing worker claims queued thumbnail jobs, retries failures, and dead-letters exhausted work
- Manager APIs list organization-scoped photo processing history and retry or resolve failed/dead-letter thumbnail jobs with audit events
- Frontend manager dashboard surfaces photo processing recovery history and can retry or resolve failed/dead-letter thumbnail jobs
- Production smoke script covers photo upload-ticket creation, upload completion metadata, evidence listing, and photo-processing recovery history
- Optional Terraform S3 photo-storage module defines public-access blocks, encryption, versioning, CORS, incomplete upload cleanup, archive transition, current-object expiration, and noncurrent-version deletion
- Manager privacy APIs export customer account/job/report/photo metadata and erase retained photo evidence with audit records, object-key deletion manifests, and delivered snapshot redaction
- Frontend manager dashboard surfaces customer privacy export and retained photo erasure controls with object-key deletion manifests
- Photo erasure attempts object-store deletion immediately and returns only failed object keys for follow-up
- Failed photo erasure object deletions are queued durably and retried by the photo-processing worker with exponential backoff and dead-lettering
- Manager APIs expose organization-scoped photo erasure deletion history with audited retry and manual resolution actions
- Frontend manager dashboard surfaces failed and dead-lettered erasure deletions with retry and resolution controls

### Completion reports

Goal: turn the local completion summary into a backend-backed report that can be reviewed, persisted, and eventually sent to customers.

Current state:

- Frontend displays a completion report panel for the selected job
- Backend exposes `GET /jobs/{id}/report`
- Report response includes job detail, checklist progress, account status, readiness state, and photo evidence
- Frontend loads the selected job's report snapshot when the API is available
- Report helper tests cover draft and ready states
- PostgreSQL migration exists for `job_completion_reports`
- Report endpoint materializes current report state when PostgreSQL is available
- Backend persistence test verifies stored report status, readiness, and checklist progress
- Persisted reports receive stable share tokens and return share URLs
- Backend exposes `GET /reports/{share_token}` for shared report reads
- Frontend renders the shareable report link when one is available
- Backend supports submitted, in-review, changes-requested, and delivered lifecycle transitions
- Frontend manager actions can start review, request changes, resubmit, and deliver persisted reports
- Frontend manager report queue summarizes current report review work across loaded jobs
- Backend exposes `GET /completion-reports` for manager report queue loading
- Backend manager report queue loading supports `status`, `readiness`, readiness-blocker, organization, crew, customer, property, and scheduled-date query filters
- Backend readiness-blocker filtering covers checklist, before/after evidence, unfinished add-ons, and route-stop state
- Manager report queue controls apply persisted organization and crew filters with local fallback parity
- Manager report queue controls apply persisted customer, property, and inclusive scheduled-date filters with validated date ranges
- Manager lifecycle, readiness, and readiness-blocker controls apply to persisted report loading with equivalent local fallback filtering
- Manager report queue summarizes applied persisted filters and restores the default active queue in one action
- Manager report queue safely restores supported persisted filters after mobile browser reloads and reapplies them to server loading
- Pixel 7 smoke coverage proves persisted report filtering and automatic restoration over the live Tailscale Docker stack
- Blocked queue items name each required checklist, evidence, add-on, or route-stop recovery and open the affected job directly
- Manager dispatch view groups loaded jobs by service date and assigned crew, prioritizes unassigned work, and summarizes day-level lifecycle counts
- Tenant-scoped dispatch assignment API moves only scheduled jobs to active same-organization crews and transactionally audits old/new crew and date context
- Manager day workload exposes persisted move controls for scheduled jobs with active tenant crew choices and no-op prevention
- Dispatch move review projects destination active stops against crew daily capacity and blocks overloaded choices before confirmation
- Persisted job reassignment locks the destination crew and transactionally rejects projected active stops beyond daily capacity
- Dispatch move review shows remaining source workload and flags crew/date changes as customer-continuity impacts
- Date-changing dispatch moves require explicit customer-notification intent and retain it in transactional audit metadata
- Manager operational activity renders reassignment context and recommends customer follow-up when the audited intent requires notification
- Pixel 7 smoke coverage proves audited date-change confirmation, required notification intent, persisted dispatch movement, activity follow-up, and cleanup over Tailscale
- Tenant-scoped dispatch notification completion records channel/note context once against the latest unresolved notification-required move
- Manager operational activity can complete dispatch customer follow-up by channel and suppresses actions for linked completed reassignment events
- Pixel 7 dispatch smoke completes and verifies channel-specific customer follow-up before restoring the baseline schedule
- Tenant-owned branch and territory tables enforce same-organization hierarchy and backfill existing crews into default operational scopes
- Crew APIs expose branch/territory scope, new crews inherit tenant defaults, and dispatch workload cards show their operational hierarchy
- Protected branch and territory list endpoints derive tenant scopes exclusively from active manager memberships
- Manager dispatch workload resolves readable branch/territory names and filters loaded day work by hierarchy scope
- Organization owners can create validated tenant branches with unique normalized codes and transactional audit records
- Organization owners can create uniquely named service territories only inside active same-tenant branches with transactional audit
- Organization owners can create branches and nested territories from a mobile hierarchy panel, with new scopes immediately available to dispatch filters
- Organization owners can assign existing crews to active same-tenant branch/territory pairs from mobile crew administration
- Persisted crew hierarchy changes validate the branch/territory relationship transactionally and write actor-attributed audit context
- Organization owners can deactivate and reactivate branches and territories from mobile with two-step confirmation
- Territory deactivation is blocked while active crews remain assigned; branch deactivation also requires every nested territory to be inactive
- Branch and territory lifecycle changes are tenant-guarded and actor-attributed in the audit trail
- Pixel 7 smoke coverage verifies owner hierarchy visibility, persisted crew scope selections, assigned-territory lifecycle guards, invalid hierarchy rejection, and mobile overflow safety
- Owner activity includes readable hierarchy creation, crew assignment, and lifecycle events with persisted filtering and export labels
- Mobile owner hierarchy summarizes active and inactive branch and territory counts before lifecycle controls
- Owner hierarchy lifecycle lists share mobile search across branch names, codes, service areas, territory names, and parent branch context
- Hierarchy lists combine active/inactive status with search, applied-result counts, and one-action filter clearing
- Owner hierarchy search and lifecycle status restore per organization across mobile reloads with malformed-storage fallback
- Pixel 7 hierarchy smoke restores persisted search/status after reload and verifies one-action clearing
- Branch and territory lifecycle records show active and total assigned crew counts and refresh after crew creation or reassignment
- Owner hierarchy filtering finds staffed or unstaffed scopes from active crew assignments and persists that choice with other filters
- A mobile quick filter counts and opens active unstaffed branches and territories for immediate owner review
- Active unstaffed results provide a direct accessible handoff to focused crew administration
- Unstaffed review lists active crews with current branch/territory context and preselects the chosen crew during handoff
- Backend manager report queue loading is scoped to the principal's active organization memberships
- Delivered completion reports store an immutable customer-facing JSON snapshot for shared report links
- Delivered completion report snapshots include schema version, capture timestamp, and evidence-count metadata
- Delivered completion reports can queue validated email/SMS notification outbox records for customer share links
- Manager report detail actions can queue delivered completion report email/SMS notifications
- Manager notification history panel lists queued, sending, sent, failed, skipped, and dead-letter notification outbox records
- Backend notification history endpoint supports entity, status, and limit filters
- Backend notification history and notification retry/resolve actions are scoped to active organization memberships
- Manager notification history can retry failed and dead-letter delivery records by returning them to queued status
- Manager notification history can mark failed and dead-letter delivery records manually resolved
- Manually resolved delivery failures persist an explicit `resolved` status and recovery note, remain filterable in manager history, and stay distinct from provider- or preference-skipped notifications
- Unified manager notification history filters completion-report, project-bid, and organization-invitation deliveries with readable work-type labels and filter-preserving recovery actions
- Operational exceptions have a tenant-scoped PostgreSQL foundation with validated categories, priorities, lifecycle and affected-resource context, manager list/create APIs, fail-closed outages, filters, and atomic creation audits
- Managers can assign, start, resolve with a note, and reopen operational exceptions through tenant-guarded optimistic lifecycle updates with atomic actor-attributed audits
- Mobile managers have a focused Recovery exception queue with persisted filters, attention counts, creation, assignment, start, resolution, reopen, refresh, and conflict-safe last-synced state
- Crews are owned by organizations, and day-plan, amendment, stop, and manager bid routes reject access outside the principal's active organization memberships
- Job-scoped reads and mutations, photo endpoints, add-on status updates, and completion-report actions reject access outside the principal's active organization memberships

### Property ownership, portfolios, and crew assignments

Goal: keep customer/property ownership separate from crew service assignment while supporting many yards per owner, many yards per crew, and many crews per company.

Current state:

- Customer/property ownership is modeled separately from active crew assignment
- A property can switch active crews without changing its customer or organization ownership
- A crew must be enabled and belong to the same service organization before it can serve a property
- PostgreSQL migrations exist for property portfolios, portfolio-property links, and property crew assignment history
- Portfolio boundary indexes prevent duplicate portfolio names per account and restrict a property to one portfolio group per service organization
- Backend API contracts are documented for property portfolio management and property crew assignment workflows
- Backend property portfolio routes can create portfolios, link properties to portfolios, and list account portfolios within active organization memberships
- Backend property crew-assignment routes can assign crews, list property assignment history, and list active crew property workloads within active organization memberships
- Backend customer property portfolio reads return grouped and ungrouped customer yards within active organization memberships
- Backend property onboarding profiles capture validated service address, access notes, billing contact, notification contact, and onboarding status
- Manager dashboard can load, create, validate, and save property onboarding profiles with persisted/local state feedback
- Customer portal preview displays grouped yards and keeps customer-owned ungrouped yards visible
- Portfolio coverage summary reports total, grouped, and ungrouped yard counts
- Completion-report and project-bid delivery queues enforce each account's enabled channel and configured recipient
- Customer deliveries queued during account quiet hours are deferred until quiet hours end in the organization's timezone
- Project-bid notification records carry organization ownership for tenant-scoped history and recovery
- Manager report and bid workflows explain when delivery is blocked by account channel or recipient preferences
- Manager activity history includes persisted queued, sent, failed, skipped, and dead-letter customer notification events
- Tenant-scoped operational activity combines persisted route state with completion-report lifecycle audit events
- Manager activity refreshes persisted route and report events after schedule and report workflow changes
- Manager activity includes persisted bid decisions/conversions and photo-processing/privacy recovery events
- Manager activity starts from persisted operational data instead of demo seed records while retaining current-browser warnings
- Clearing browser activity preserves tenant-scoped operational history
- Operational activity supports bounded event-kind filtering and timestamp-cursor pagination
- Managers can load older persisted activity without duplicating records already in the review queue
- Draft creation, route publication, stop assignment/removal, and stop reorder operations write transactional audit events
- Schedule audit events retain the authenticated manager identity and organization boundary
- Existing persisted route states are backfilled into operational history during migration
- Access audit events support structured JSON metadata without changing existing audit writers
- Route activity metadata records crew/date context plus affected stop, job, or reorder count
- Manager route activity messages use persisted mutation details instead of generic plan-only copy
- Organization memberships carry persisted display labels with backfill for existing members
- Operational activity returns both immutable actor IDs and readable membership labels
- Backfilled system route history is clearly identified as a migration rather than a human action
- Organization owners can edit active and suspended member display names without changing immutable identity IDs
- Membership display-name changes are tenant-scoped, validated, and included in owner team-administration history
- Crew-lead selection uses readable member names with immutable membership IDs as option values
- Owner team activity resolves readable actor and affected-resource labels while retaining immutable IDs in the API
- Mobile team administration supports member-name or identity search plus role and status filters
- Owner team activity supports actor-name or identity search plus event-type filtering
- Owner team activity supports bounded timestamp-cursor pagination and duplicate-safe older-event loading
- Owner team event filters are tenant-scoped and applied across server-paginated history
- Owner team actor search matches readable names or immutable identities across server-paginated history
- Owner team affected-item search matches readable member, crew, or organization labels and immutable target IDs across persisted history
- Mobile member and team-activity filters show active-filter counts and offer one-tap clearing
- Mobile team administration summarizes active, suspended, owner, manager, and field-team counts
- Mobile owner activity summarizes loaded access, crew, and organization changes
- Owners can export the currently filtered loaded team activity as quoted CSV with readable and immutable audit identities
- Owners can export the currently filtered member directory as quoted CSV with identity, role, status, and scope
- Mobile member administration sorts the visible and exported directory by readable name, role, or status
- Owner team activity sorts the loaded filtered view and CSV export newest-first or oldest-first without changing pagination cursors
- Owner team activity shows each event's exact local date and time
- Owners can reveal immutable actor and target IDs per activity event without cluttering the readable default view
- Touch-safe activity controls copy immutable actor and target IDs with mobile clipboard feedback
- Mobile member cards copy immutable user identities with success and unavailable-clipboard feedback
- Owners can reveal and copy immutable membership record IDs without cluttering the default roster
- Member-directory CSV exports include immutable membership record IDs and user identities
- Team-activity CSV exports include immutable audit event IDs
- Owners can reveal and copy immutable audit event IDs from each mobile activity card
- Owner audit-ID search is debounced, tenant-scoped, and applied across server-paginated history
- Production builds split React and OIDC vendor code from the application bundle, keeping every chunk below the 500 kB warning threshold
- Public bid, report, invitation, and authenticated dashboard route bodies are lazy-loaded with an accessible loading state
- Public bid and report startup paths defer the authenticated shell and OIDC bundle, reducing the entry chunk below 5 kB
- Lazy-route failures render a touch-safe reload recovery screen instead of leaving a blank mobile view
- Production service-worker caching provides network-first navigation fallback and cache-first static assets without intercepting API traffic or retaining tokenized route keys
- The service-worker strategy documents cache versioning, security boundaries, and the separation from future offline mutation queues
- A global mobile banner distinguishes offline state from slow startup across public and authenticated routes
- Mobile users receive a four-second confirmation when network connectivity returns
- A global readiness probe distinguishes API downtime from phone connectivity and retries automatically every 30 seconds
- Mobile users receive a four-second confirmation when API readiness recovers
- API readiness checks pause while the mobile tab is hidden and refresh immediately when it becomes visible
- API downtime feedback includes a touch-safe immediate readiness retry action
- Production shell updates are announced and applied only after a user-controlled reload
- Android users receive the native install prompt while iPhone users receive Safari home-screen guidance
- A public mobile diagnostics page checks connectivity, API readiness, secure context, shell control, and installed display mode
- Mobile diagnostics react to network and shell-control changes and copy a token-safe support summary
- Supported phones can send the sanitized diagnostics summary through the native share sheet
- Mobile diagnostics can download the sanitized support summary as a dated text file
- Every mobile diagnostic warning provides capability-specific recovery guidance
- Mobile diagnostics measure API readiness latency and flag responses of two seconds or longer
- Phase 2 offline mutations have a versioned IndexedDB queue contract that preserves tenant, actor, ordering, and retry context
- Failed and local-fallback stop-progress writes enter the tenant/actor queue and show a durable pending count
- Queued stop progress replays tenant/actor-scoped and oldest-first on load, network recovery, or manual retry
- Stale or invalid offline transitions become durable conflicts that block blind retry and request manager review
- Crew queue review shows ordered stop, requested state, queued time, classification, and attempt count without internal error text
- Two-step reviewed-conflict discard reconciles local stop state and resumes ordered replay without dropping later changes
- Offline queue tenancy binds to the loaded crew day plan's server-owned organization rather than membership ordering
- Offline stop-progress replay uses transactionally persisted client mutation IDs for exact deduplication and conflicting-reuse rejection
- Mobile route queue feedback summarizes state counts, oldest queued time, and maximum retry attempts
- Mobile route feedback distinguishes unavailable durable browser storage, and legacy local progress writes no longer throw when storage is blocked
- The first durable field mutation requests persistent browser storage and reports browser-managed retention accurately
- The offline mutation schema supports tenant/actor-scoped job start and completion records
- Failed job start and completion actions queue only with resolved server tenancy and show durable mobile pending feedback
- Queued job lifecycle actions replay ordered per tenant with transactional server idempotency, automatic recovery, manual retry, and conflict blocking
- Crew job queue review exposes safe action details and two-step reviewed-conflict discard with server-state refresh
- The offline mutation schema supports tenant/actor-scoped checklist item completion records
- Crew checklist toggles persist item and summary state transactionally and queue failed writes with mobile pending feedback
- Queued checklist changes replay ordered per tenant with transactional idempotency, retry-state feedback, and conflict blocking
- Crew checklist queue review exposes safe details and two-step reviewed-conflict recovery with server-state refresh
- Offline photo capture boundaries define atomic blob/metadata storage, validation, privacy, quota, and replay behavior
- IndexedDB schema version 3 atomically stores validated offline photo metadata and blobs and deletes them together
- Failed photo workflows retain local previews and claim durable queueing only after the tenant/actor blob transaction commits
- Queued photo blobs replay oldest-first with deterministic client-mutation ticket identities, fresh upload credentials, completion confirmation, and safe retry/conflict feedback
- Crew photo queue review exposes safe capture details and two-step reviewed-conflict deletion before ordered replay resumes
- Browser-compatible IndexedDB tests cover photo blob persistence, conflict retention, ordered replay, idempotency identity, and atomic reviewed deletion
- IndexedDB schema version 4 discovers the signed-in actor's queued job, checklist, and photo work without a jobs response while preserving tenant context, creation order, actor isolation, and existing photo blobs
- Stop-progress and route-amendment queues are discovered for the signed-in actor without a day-plan response and replay from their stored tenant and route context
- Client photo checks reject unsupported, unpreviewable, undersized, and duplicate captures before upload or offline storage
- Job completion requires both before and after evidence, including captured offline evidence, with crew-readable recovery guidance
- Completion-report responses expose ordered server-owned checklist and before/after readiness blockers, rendered as actionable field guidance
- Completion reports attach current route-stop context and block submission for unfinished stops or approved add-on work
- Docker mobile access rewrites only loopback API hosts to the page's Tailscale host and enables the existing permissive local CORS policy
- Cross-origin JSON preflight bypasses API authorization only for OPTIONS, while protected business requests retain normal authorization
- Offline mutation IDs remain RFC 4122 UUIDs on non-secure HTTP phone origins through a cryptographic random-values fallback
- A Pixel 7 viewport smoke test proves Tailscale route loading, interruption queueing, pending feedback, automatic recovery, and confirmed queue clearance
- The offline mutation schema supports tenant/actor-scoped day-plan amendment requests with stop, service, pricing, and note context
- Failed day-plan amendment submissions enter the durable tenant/actor queue with accurate route-request feedback
- Queued day-plan amendments replay oldest-first with deterministic server IDs, PostgreSQL deduplication, automatic recovery, manual retry, and conflict blocking
- Crew amendment queue review exposes safe route-request details and two-step reviewed-conflict recovery
- The Tailscale mobile smoke test proves both stop-progress and unplanned-stop amendment queueing and confirmed recovery
- Active unstaffed territories can open crew administration with their branch and territory already prepared for review
- Crew administration identifies prepared hierarchy destinations as unsaved and can restore the crew's saved assignment before submission
- Each active unstaffed territory offers direct active-crew choices with current hierarchy and daily capacity context
- Territory staffing candidate lists search crew and hierarchy names, cap initial results, and guide refinement when matches exceed the mobile list
- Territory staffing choices prioritize crews already assigned to the destination branch before cross-branch candidates
- Prepared crew moves show their saved source and intended destination, with an explicit cross-branch scheduling and reporting warning
- Successful prepared moves close the unsaved handoff and retain a source-to-destination completion summary across hierarchy refresh
- Completed crew moves can return directly to the refreshed, focusable hierarchy review on mobile
- Pixel 7 smoke coverage proves territory staffing preparation, reset, direct crew selection, save confirmation, and hierarchy return without mutating shared fixture data
- Owner activity resolves crew hierarchy audit metadata to readable source and destination names, searches those names server-side, and includes them in CSV exports
- Owner activity and CSV exports classify crew hierarchy changes as cross-branch or within-branch moves
- Owner activity filters cross-branch and within-branch crew moves server-side across paginated history
- Owner activity summarizes loaded cross-branch and within-branch crew move counts separately
- Crew move scope summary cards apply the paginated hierarchy-event and scope filters together, with mobile smoke coverage for selection and clearing
- Owner hierarchy-event and move-scope filters restore per organization across mobile reloads with safe storage fallback
- Owner activity newest/oldest ordering restores with the per-organization crew-move review state
- A single reset restores persisted owner activity filters and ordering to the default newest/all review view
- Owner activity filters crew moves by readable source and destination branch or territory across paginated server history
- Directional crew-move source and destination fields restore per organization across mobile reloads and clear with the review reset
- Touch-safe source and destination chips expose active directional review and remove either filter independently
- Crew hierarchy owner activity opens the affected crew directly in focused crew administration, with live mobile smoke coverage
- Audit-launched crew inspection exposes a focused return action back to owner activity
- Audit-launched crew inspection keeps the readable move scope, source, and destination visible beside crew controls
- Crew inspection context includes the immutable audit event ID and localized event timestamp
- Crew inspection copies immutable audit IDs with explicit fallback on mobile origins without clipboard access
- Crew inspection copies a concise readable move path, timestamp, and immutable audit identity for support handoff
- Crew inspection shares the support summary through the native phone share sheet and falls back to copy when sharing is unavailable
- Crew inspection downloads the move support summary as an audit-ID-named text file when share and clipboard capabilities are restricted
- Crew inspection compares the audited destination IDs with the crew's current assignment and flags crews that moved again after the selected event
- Subsequent-move warnings show the crew's current readable branch and territory beside the audited move context
- Copied, shared, and downloaded support summaries include the current hierarchy when it differs from the audited destination
- Stale crew inspections open a newest-first hierarchy activity view filtered to the inspected crew
- Focused crew history highlights the newest matching hierarchy event as the latest crew move
- Focused crew history compares the latest move destination with the current assignment captured during inspection
- Focused latest-move context remains visible and selected after inspecting the newest event and returning to owner activity
- Focused crew history provides a dedicated touch-safe exit from the specialized activity review
- Exiting focused crew history restores the owner's prior transient and persisted activity filters and ordering
- Owner activity confirms when a prior review has been restored after focused crew history
- Owners can dismiss restored-review feedback without changing the restored filters or ordering
- Focused latest-move entry is announced politely to assistive technology while activity-section focus is preserved
- Focused latest-move context reports the number of matching crew moves currently loaded
- Full focused-history pages identify when older matching crew moves may remain available
- Focused crew history confirms when pagination has loaded all matching moves
- Focused crew pagination deduplicates overlapping cursor-boundary audit events by immutable event ID
- The latest crew-move row remains the single semantic current item after older history is appended
- Paginated focused history offers a touch-safe return that scrolls to and focuses the latest crew move
- Returning from crew inspection scrolls to and focuses the exact audit row that opened the inspection
- Returning from crew inspection announces the exact immutable audit event restored in owner activity
- Dismissing audit-row return feedback restores focus to that exact event without scrolling away
- Returned audit rows remain visually identified after inspection feedback is dismissed
- Restored-row markers clear automatically when the owner changes or exits the activity review
- Restored-row markers persist through same-review refreshes and older-page loading
- Refresh clears stale restored-row context and explains when that audit event is no longer loaded
- Missing restored events provide a one-tap immutable audit-ID search in the current owner review
- Successful audit-ID recovery confirms the immutable event and restores its row marker and dismissal focus target
- Failed audit-ID recovery explains owner-access and retry paths while retaining the immutable search action
- Failed immutable-ID searches can retry the same audit directly after a transient history gap
- Recovered audit searches return to full focused crew history without losing the inspected crew context
- Exiting recovered crew history restores prior transient actor and audit-ID searches with persisted review settings
- Restored recovered-review summaries count all active actor, audit-ID, source, and move-scope filters
- Activity review summaries identify oldest-first ordering beside the active-filter count
- Oldest-first review summaries provide a touch-safe newest-first reset that preserves every active filter
- Summary-driven newest-first ordering persists per organization across mobile reloads while actor and audit-ID searches remain transient
- Mobile reloads announce the count of saved organization-scoped activity review settings restored
- Dismissing saved-review restoration feedback leaves every restored setting applied
- Saved-review feedback can clear persisted settings directly, and defaults remain after the next mobile reload
- Saved-review clearing provides a current-session undo that restores the exact prior review
- An undone saved review is persisted again and restores after a subsequent mobile reload
- Saved settings survive navigation after undo, but the session-only undo action does not
- Active and archived customer-account lists distinguish persisted-storage failures from valid empty collections
- Manager account onboarding hides stale collection data and surfaces active and archived availability warnings
- Customer-property lists distinguish unavailable persistence from a valid account with no properties
- Onboarding progress and activation readiness return explicit unavailable persistence states
- Customer-account create and update paths return explicit unavailable persistence states
- Property portfolio lists and customer grouping reads return explicit unavailable persistence states
- Property and active-crew assignment lists return explicit unavailable persistence states
- Day-plan and customer project-bid lists return explicit unavailable persistence states
- Project-bid draft writes fail closed when persisted storage is unavailable
- Project-bid revoke and conversion writes return explicit conflict and unavailable outcomes
- Shared-bid reads and customer decisions return explicit missing, conflict, and unavailable outcomes
- Property-crew assignment writes return explicit conflict and unavailable outcomes
- Property-portfolio create and link writes return explicit conflict and unavailable outcomes
- Organization membership and invitation reads return explicit unavailable outcomes
- Team-administration and operational activity reads return explicit unavailable outcomes
- Organization profile and first-owner setup reads return explicit missing and unavailable outcomes
- Organization profile updates return explicit invalid, missing, and unavailable outcomes
- Invitation lifecycle writes return explicit applied, conflict, invalid, and unavailable outcomes
- Membership role, status, and profile writes return explicit unavailable outcomes
- Principal access reads fail closed and report explicit unavailable outcomes
- Job lifecycle and checklist writes return explicit missing, conflict, and unavailable outcomes
- Completion-report share and property-history reads return explicit missing and unavailable outcomes
- Completion-report persistence and snapshot writes return explicit unavailable outcomes
- Photo-upload creation and completion return explicit missing and unavailable outcomes
- Photo worker claims return explicit loaded and unavailable outcomes
- Photo worker completion and failure writes return explicit loaded and unavailable outcomes
- Dispatch crew, branch, and territory collections distinguish unavailable persistence from valid empty setup
- Manager dispatch hierarchy clears stale collections, warns about persistence outages, and blocks setup writes until authoritative scope data returns
- Crew creation and updates distinguish unavailable persistence from duplicate or missing crews
- Completion-report generation fails closed when authoritative assigned-route context is unavailable
- Corrupt delivered completion-report snapshots surface as persistence decode failures instead of missing customer reports
- Customer report links distinguish route-context outages from invalid or expired links
- Property-onboarding reads and writes distinguish unavailable persistence from missing profiles and business conflicts
- Manager property onboarding refuses to substitute an empty editable profile during storage outages
- Photo rejection and processing-retry writes distinguish unavailable persistence from missing uploads
- S3 photo completion fails closed when required thumbnail or inspection recovery work cannot be queued
- Amendment reviews distinguish missing requests from requests that changed before a manager decision
- Manager amendment feedback distinguishes missing, conflicting, and unavailable review writes
- Day-plan draft creation and publication distinguish missing crews or drafts from lifecycle conflicts
- Manager scheduling feedback directs missing route targets back to authoritative crew and schedule refreshes
- Route-stop assignment, removal, and reorder distinguish missing plans, jobs, or stops from capacity and lifecycle conflicts
- Principal access summaries fail closed when their required persisted login audit cannot be written
- Sensitive job-account reads fail closed when their required persisted account-view audit cannot be written
- Docker services expose health status, tolerate bounded cold starts, and restart automatically after repeated runtime readiness failures
- Controlled Vite-process failure testing proves automatic frontend recovery and restored Tailscale HTTP access
- Customer photo erasure transactionally persists object-deletion recovery before redacted evidence becomes committed
- Privacy exports decode delivered-snapshot photo counts with a stable PostgreSQL bigint contract
- Backend library readiness suite compiles against explicit persistence result contracts and passes all 160 tests
- Frontend unit readiness suite passes all 340 tests across 78 test files
- Day-plan and amendment PostgreSQL integration coverage follows explicit applied, missing, conflict, and unavailable mutation outcomes
- Photo-erasure retry and manual-resolution audit events are accepted by PostgreSQL and included in manager operational activity
- Photo processing recovery integration coverage remains isolated when durable jobs from earlier runs are present

Next implementation work:

- Continue the mobile navigation phase with compact service-work history, actionable persona Home alerts, and iPhone interaction validation
- Audit remaining persisted repositories for lossy missing, conflict, or unavailable outcomes
- Continue application-readiness hardening from observed runtime failure modes
- Audit privacy recovery history and cleanup behavior for pilot-scale retention
- Complete the remaining serialized backend integration suites, then run broad mobile browser coverage against the Tailscale runtime
- Harden and validate the next highest-impact persisted workflow

## Planned

### Phased Development Roadmap

The product is past the first proof-of-completion prototype. The next work should ship in vertical slices that reduce local-only assumptions, harden customer-visible workflows, and prepare the app for a small hosted pilot before broader operations features.

#### Feature Reference and Audience Coverage

The `features/` folder now defines four major user tracks. Treat these as product inputs for roadmap planning and acceptance criteria:

| Feature file | Primary audience | Current plan coverage | Planning decision |
| --- | --- | --- | --- |
| `features/yard-crew.md` | Crew leads, crew members, dispatchers, account managers, billing admins, customers | Strong near-term coverage through crew route, proof-of-completion, amendments, bids, offline sync, quality review, labor/material, and billing-readiness phases | Keep as the first field workflow track because it matches the implemented MVP foundation |
| `features/yard-care-company.md` | Multi-crew yard-care companies: operations managers, dispatchers, branch managers, fleet/equipment, account managers, finance users | Partial coverage through manager command center, route capacity, service catalog, contracts, billing readiness, analytics, and scale phases | Expand Phase 3 and Phase 5 around branch, territory, equipment, inventory, and cross-crew operations |
| `features/self-service.md` | Homeowners maintaining their own yards | Limited coverage in the current customer portal plan | Add a separate homeowner self-service phase because adaptive yard planning is a different product mode from provider-managed service delivery |
| `features/property-managment.md` | Property management organizations coordinating multiple independent yard-care vendors | Partial coverage through portfolios, vendor-safe links, evidence, bids, and invoices, but not enough vendor governance | Add a separate multi-vendor property management phase after core tenant, evidence, service catalog, billing, and portal foundations exist |

Key coverage gaps from the feature review:

- Homeowner self-service needs its own property setup, climate-aware scheduling, guided yard sessions, equipment/supplies, issue management, and educational task explanations.
- Multi-crew service companies need branch/territory hierarchy, master schedule, cross-crew reassignment, fleet/equipment allocation, inventory, labor productivity, and billing-readiness validation.
- Property management organizations need vendor onboarding, compliance tracking, service coverage, standardized work-order distribution, evidence validation, three-way invoice matching, vendor scorecards, and portfolio dashboards.
- Crew users need stronger work-order, contract-scope, safety, equipment, materials, treatment record, labor, and offline synchronization support beyond the existing stop-progress workflow.

#### Phase 1: Pilot Readiness and Data Boundaries

Goal: make the current manager, crew, and customer-safe link workflows usable in a hosted pilot without relying on seed data or browser-only state.

Build scope:

- Provision and validate Cognito for the first organization owner, manager, crew lead, and customer test users.
- Persist organization membership, role assignments, and tenant-aware resource ownership for jobs, crews, day plans, properties, completion reports, bids, photos, and notifications.
- Add organization/customer scoping to manager completion-report list, day-plan, amendment, bid, job, photo, and shared customer queries.
- Wire property portfolio and active crew assignment models into backend API routes after access boundaries are enforced.
- Add audit events for login-sensitive and business-sensitive actions: role changes, schedule changes, report review, bid send/revoke/decision/convert, notification enqueueing, and customer-visible delivery.
- Document hosted pilot setup, seed data expectations, first-user creation, and rollback notes.

Validation and exit criteria:

- API tests prove cross-organization access is rejected for manager, crew, customer, and public-token-adjacent routes.
- A hosted smoke test can authenticate, read jobs, read today route, submit stop status, upload photo metadata, review a completion report, send a bid, and read customer-safe links.
- Local fallback mode still works for frontend demos, but hosted pilot workflows do not depend on browser-only persistence for core state.

#### Phase 2: Field Crew Mobile Reliability

Goal: make the daily route and proof-capture workflow dependable from a mobile browser with weak connectivity.

Build scope:

- Validate the delivered PWA manifest, install metadata, and shell service worker on pilot iOS and Android devices.
- Move queued field mutations into IndexedDB for stop progress, job lifecycle actions, photo completion, checklist updates, and amendment requests.
- Add sync status and retry controls for each queued mutation type, using consistent pending, persisted, failed, and conflict states.
- Add client-side photo quality checks for required before/after evidence, minimum previewability, duplicate file selection, and missing evidence before report submission.
- Add server-side image processing and metadata extraction for uploaded photo evidence after object storage upload completes.
- Include route, stop, add-on, and photo context in completion report readiness checks.

Validation and exit criteria:

- Browser tests cover offline queue persistence, retry behavior, and conflict messaging for route progress and photo evidence.
- Backend tests cover image metadata persistence and report readiness rules.
- A mobile viewport smoke script can complete a route slice with simulated API interruption and later sync recovery.

#### Phase 3: Manager Command Center

Goal: give managers one operational surface for schedule risk, quality review, communications, and recovery work.

Build scope:

- Finish persisted manager completion-report queue filters by status, organization, crew, customer, property, date, and readiness blocker.
- Connect manager activity history to persisted route, report, bid, notification, photo, and audit events.
- Add notification history endpoints and UI for queued, sent, failed, retried, skipped, dead-letter, and manually resolved states.
- Add route capacity planning with crew capacity defaults, duration estimates, overage warnings, and publish blockers.
- Add dispatch views for moving jobs between crews or service dates and reviewing day-level workload.
- Add manager recovery actions for failed notification delivery, failed photo processing, and report readiness blockers.
- Add branch, territory, and crew hierarchy support so multi-crew companies can separate company, region, branch, crew, route, work order, and task responsibilities.
- Add cross-crew reassignment workflows with route impact, equipment conflicts, overtime risk, customer continuity impact, and audit records.
- Add centralized exception management for route delays, staffing shortages, access failures, weather interruptions, equipment failures, safety concerns, and customer escalations.

Validation and exit criteria:

- Manager workflows can be completed from persisted data after a page refresh and across browser sessions.
- Integration tests cover report queue filters, notification history reads, route capacity guards, branch/territory boundaries, and reassignment audit records.
- The manager can identify and act on every failed customer communication or blocked report without inspecting logs.
- A dispatcher can see at-risk work, compare reassignment options, move work between crews, and preserve a clear customer-notification and audit trail.

#### Phase 4: Customer Portal and Portfolio Experience

Goal: turn public one-off bid/report links into an authenticated customer portal for property owners, management companies, HOAs, and commercial clients.

Build scope:

- Add independent Yard Owner identity and private property setup before any
  provider membership, customer account, provider property, job, or route exists.
- Add an owner-controlled yard brief with optional guided photographs, explicit
  per-provider disclosure, retention, revocation, export, and deletion behavior.
- Add known-provider connection invitations first, then provider assessment,
  versioned initial-service proposals, explicit acceptance, and audited
  projection into provider-scoped customer/property records.
- Add curated provider discovery only after the direct-connect loop is validated;
  match provider organizations by coarse location and capability while providers
  retain internal crew assignment.
- Add authenticated customer portal access scoped to customer accounts, properties, portfolios, reports, photos, bids, scheduled work, and service history.
- Build portfolio/group views for individual owners, property management companies, HOAs, and commercial accounts.
- Surface completed service timelines with immutable report snapshots and customer-safe photo evidence.
- Add bid history, current approvals, rejected bids, expired bids, and converted-work status.
- Add customer notification preferences for email/SMS opt-in, quiet hours, recipient validation, and template-specific preferences.
- Add customer support or issue-capture entry points tied to a property, report, or scheduled service.

Validation and exit criteria:

- A new Yard Owner can save a private property and brief without provider access,
  share it with one chosen provider, complete an assessment/proposal flow, and
  enter provider setup without silent scheduling or cross-party data leakage.
- Customer portal tests prove a customer can only see their own scoped accounts, properties, reports, photos, bids, and notification preferences.
- Delivered completion reports use immutable customer snapshots rather than live mutable job state.
- Customer-visible pages cover empty, loading, error, expired-link, revoked-link, and no-portfolio states.

#### Phase 5: Revenue Operations and Service Administration

Goal: support recurring landscaping operations, service catalog management, account status, and revenue workflows beyond one-off project bids.

Build scope:

- Build a service catalog for standard recurring services and extra services with duration, unit, pricing defaults, approval rules, and active/inactive status.
- Add recurring service contracts, contracted frequency, scheduled service generation, skipped-service tracking, and account service-period summaries.
- Add estimates, change orders, deposits, invoices, payment status, tax/discount fields, account balances, and payment-link placeholders or provider integration.
- Add customer/account onboarding checklists for address, access notes, service preferences, billing state, notification contacts, and required operational data.
- Add organization settings for crews, service areas, default capacity, roles, invitation policies, and data retention settings.
- Add work-order and task templates with contract scope categories: included, conditionally included, customer requested, requires approval, approved additional work, not included, and prohibited.
- Add labor, material, equipment, treatment, and job-cost capture so completed work can be reviewed for billing readiness and profitability.
- Add fleet, equipment, and inventory records for vehicles, trailers, tools, chemicals, supplies, reservations, inspections, failures, and material usage.

Validation and exit criteria:

- Managers can onboard a customer/property and schedule recurring service without editing seed data.
- Service and billing state can explain whether work is schedulable, blocked, completed, billable, paid, or needing manager review.
- Tests cover service catalog rules, contract scheduling boundaries, scope protection, equipment allocation, material usage, treatment record policy, billing readiness, and account/payment status transitions.

#### Phase 6: Scale, Integrations, and Operational Hardening

Goal: prepare the product for broader customer adoption after pilot usage proves the core workflows.

Build scope:

- Add staging and production release gates with migration checks, smoke tests, rollback notes, and environment-specific configuration.
- Add structured logs, metrics, traces, alerting, backups, restore drills, and incident runbooks.
- Add background workers and queues for notification delivery, image processing, report delivery, route optimization, and integration sync.
- Add object lifecycle policies for photo evidence retention, archival, deletion, and customer data export.
- Add rate limits, organization usage limits, feature flags, support impersonation with audit controls, and abuse monitoring.
- Add integration surfaces only when needed: calendar export, map routing provider, accounting export, CSV import/export, webhook events, and public API boundaries.

Validation and exit criteria:

- Production releases require passing smoke checks for health, auth config, migration state, job list, route read, report read, upload ticket, notification queue, and customer portal access.
- Operational dashboards show failed requests, job/route mutation errors, upload failures, notification failures, authentication failures, and worker queue health.
- Backup restore and incident response procedures are documented and tested before expanding beyond early customers.

#### Phase 7: Homeowner Self-Service Yard Assistant

Goal: support individual homeowners who perform their own yard care and need an adaptive maintenance assistant instead of a contractor operations workflow.

Build scope:

- Add homeowner property onboarding for location, yard size, landscaped area, maintenance goals, availability, household constraints, climate profile, and preferred intensity.
- Add yard zones, plant assets, irrigation zones, equipment assets, supplies, inventory, task templates, scheduled tasks, observations, photos, and task completion history.
- Add a climate-aware scheduling engine that uses season, weather, recent completion, watering restrictions, homeowner availability, task dependencies, supplies, and equipment availability.
- Add Today, guided yard session, calendar, property, task detail, issues, history, equipment, supplies, and settings screens.
- Add educational task explanations covering why, when, how, tools, supplies, safety guidance, and postponement conditions.
- Add homeowner notifications for today plans, weather postponements, suitable work windows, irrigation problems, equipment service, low supplies, safety tasks, and monthly summaries.

Validation and exit criteria:

- A homeowner can create a property and yard zone, enter availability, receive a personalized four-week schedule, and complete a guided yard session.
- Weather-sensitive tasks can be postponed with an explanation and rescheduled into a suitable availability window.
- Issues create follow-up tasks, blocked tasks connect to missing supplies or equipment, and zone history shows completed work, photos, notes, products, and time/cost totals.
- This phase can share authentication, photo, notification, and property primitives with the B2B product, but it must not expose provider-only concepts like crews, contracts, invoices, or manager approvals in the homeowner-first experience.

#### Phase 8: Multi-Vendor Property Management Platform

Goal: support property management organizations that coordinate yard care across many properties, regions, owners, and independent vendors.

Build scope:

- Add portfolio hierarchy for property management organization, ownership group, portfolio, region, property, yard zone, vendor, vendor branch, service territory, and assigned properties.
- Add vendor onboarding, compliance tracking, insurance/license/certification expirations, vendor statuses, territory coverage, capabilities, capacity, and assignment eligibility.
- Add standardized service catalog, scope-of-work packages, scope versioning, vendor acknowledgment, service standards, evidence policies, and regional service variations.
- Add property-to-vendor assignment, backup vendor coverage, coverage-gap reporting, work-order distribution, vendor acceptance/rejection, and vendor portal/API submission paths.
- Add evidence packages, required photo standards, automated evidence checks, remote review, sampling rules, validation statuses, quality scorecards, and correction-request workflows.
- Add additional-work governance with approval matrices, competitive estimates, owner/asset-manager escalation, and audit-ready decision records.
- Add standardized invoice submission, normalized invoice lines, three-way invoice matching against contract or purchase order plus validated work order plus vendor invoice, tolerance rules, invoice exceptions, and accounts-payable approval.
- Add portfolio dashboards for coverage, overdue services, evidence review, open issues, vendor compliance, budget variance, invoice validation, service levels, and vendor performance.

Validation and exit criteria:

- A property management organization can create portfolios, add properties in multiple regions, onboard multiple vendors, validate compliance, assign properties, and identify uncovered properties.
- Vendors can accept work orders, submit evidence, report issues, submit estimates, correct rejected records, and see only assigned records.
- Accounts payable can normalize vendor invoices, detect duplicates or mismatches, match valid lines to completed work, and route exceptions back to vendors.
- Portfolio operations can compare vendor performance by on-time service, evidence completeness, quality, rework, complaints, response time, invoice accuracy, and cost.

#### Phase Sequencing Rules

- Tenant boundaries and auditability come before broad customer portal or marketing launch work.
- Offline field reliability should ship before adding heavier manager dispatch workflows.
- Customer-visible report snapshots must be immutable before report history becomes part of the authenticated portal.
- Notification provider integration should be validated for bids first, then reused for reports, route changes, and customer preferences.
- Payment and accounting integrations should wait until service catalog, contracts, and account status rules are stable.
- Homeowner self-service should share core property, photo, notification, and task infrastructure, but it should remain a distinct experience from crew/provider workflows.
- Multi-vendor property management should wait until tenant boundaries, evidence validation, service catalog, work orders, and billing-readiness foundations are stable.
- Scaling infrastructure should follow measured pilot usage instead of speculative load assumptions.

## User Story Map

These stories convert the capability roadmap into deliverable role outcomes. Keep the first acceptance criteria small enough to ship locally, then broaden persistence, tenant boundaries, and provider integrations as those foundations mature.

### Manager command center stories

- As a manager, I need one queue of completion reports needing review so I can approve, request changes, or deliver customer-ready work without opening every job manually.
  - Acceptance criteria: submitted, in-review, change-requested, and delivered reports are grouped with counts; each queue item links back to the job detail and shows checklist/photo readiness.
  - Implementation path: first derive the queue from existing job report snapshots in the frontend, then add a persisted `GET /completion-reports` manager endpoint with organization scoping and filters.
- As a manager, I need delivery failure and notification history visible beside report and bid work so I can retry or resolve customer communication problems.
  - Acceptance criteria: queued, sent, failed, retried, skipped, and dead-letter states are visible with recipient, channel, last attempt, and next retry.
  - Implementation path: reuse the notification outbox and receipts, add manager query endpoints, then connect the activity history panel to persisted notification events.
- As a manager, I need route planning to show capacity risk before publish so I can avoid overloading crews.
  - Acceptance criteria: each route has estimated duration, capacity remaining/overage, risk label, and blockers before publish.
  - Implementation path: extend existing workload helpers, persist crew capacity defaults, then add calendar/day-level dispatch views.

### Crew field workflow stories

- As a crew lead, I need the daily route to work reliably on a mobile browser with weak connectivity so I can keep working from the field.
  - Acceptance criteria: route, stop status, selected job detail, and photo evidence can be captured offline and synced with clear pending/failed states.
  - Implementation path: add a PWA manifest and service worker, store queued mutations in IndexedDB, and reconcile with backend status endpoints.
- As a crew member, I need photo capture quality checks before submitting a report so managers do not have to request avoidable fixes.
  - Acceptance criteria: the app warns when before/after evidence is missing, duplicate, too small, or not previewable before completion report submission.
  - Implementation path: use browser image metadata initially, then add server-side image processing and audit rows for quality checks.
- As a crew member, I need to request extra work from the job screen and track whether it needs manager approval, pricing, or customer approval.
  - Acceptance criteria: standard add-ons can be approved into work, priced add-ons become bids, and crew sees the current review state.
  - Implementation path: continue from amendment and bid foundations, then add crew-visible amendment status updates and accepted-work sync.
- As a crew lead, I need work orders to show contracted scope, property zones, hazards, access instructions, required evidence, materials, and equipment so the crew can complete the visit without guessing.
  - Acceptance criteria: each work order distinguishes included, conditional, approved additional, requires approval, not included, and prohibited tasks; completion cannot be submitted without required evidence or an approved exception.
  - Implementation path: introduce contract service items, work-order tasks, zone requirements, scope categories, and required evidence policies, then connect them to the existing route stop and completion report flow.
- As a crew lead, I need pre-shift equipment, material, safety, and attendance checks so route risk is visible before the crew leaves the shop.
  - Acceptance criteria: missing equipment, missing materials, unavailable crew members, certification gaps, and safety blockers are surfaced before dispatch.
  - Implementation path: add crew check-in, equipment reservations, material loading, skill/certification checks, and route capacity warnings.

### Yard-care company operations stories

- As an operations manager, I need a company, region, branch, crew, route, work-order, and task hierarchy so responsibilities and reports match how a multi-crew company operates.
  - Acceptance criteria: users can filter operational work by company, region, branch, crew, route, customer, contract, and service date with role-appropriate access.
  - Implementation path: extend tenant membership with branch/region scope, add hierarchy tables, then backfill route and work-order reads through those boundaries.
- As a dispatcher, I need service territories, crew capacity, route risk, and cross-crew reassignment tools so I can recover from delays, equipment failures, weather, and staffing gaps.
  - Acceptance criteria: at-risk work can be reassigned with visible travel, overtime, equipment, customer-continuity, and audit impacts.
  - Implementation path: build territory and capacity models first, then add reassignment proposals and persisted route mutations.
- As a billing or finance user, I need completed work to become billing-ready only after required tasks, photos, labor, materials, approvals, and exceptions are complete.
  - Acceptance criteria: billing batches can be grouped by customer, contract, property, branch, service period, billing cycle, and service type.
  - Implementation path: extend completion reports into work-order validation records and add billing-readiness states before invoice generation.

### Customer portal stories

- As a property owner, I need a secure portal listing my properties, completed services, report evidence, bids, and next scheduled work so I can trust what was done without calling the office.
  - Acceptance criteria: customer-visible pages show only the authenticated customer's accounts, properties, reports, photos, and bids.
  - Implementation path: start with the delivered report and bid pages, then add authenticated customer account scoping after tenant membership is persisted.
- As a property manager, I need grouped portfolios across many properties so I can review service status by owner, HOA, commercial site, or management group.
  - Acceptance criteria: grouped and ungrouped properties are visible, each portfolio has service counts, and report/bid history can be filtered by portfolio.
  - Implementation path: wire portfolio models to customer portal queries, then add manager-owned portfolio administration.
- As a customer, I need notification preferences so service updates arrive through the channel I trust.
  - Acceptance criteria: email/SMS opt-in, quiet hours, recipient validation, and template-specific preferences are persisted.
  - Implementation path: add customer contact and preference tables, then gate notification enqueueing through those preferences.

### Homeowner self-service stories

- As a homeowner, I need the app to generate a property-specific yard care schedule so I do not have to decide every recurring task myself.
  - Acceptance criteria: onboarding captures location, availability, yard zones, maintenance goals, equipment, supplies, and climate profile; the app produces a four-week plan with explanations.
  - Implementation path: reuse property and photo primitives, then add homeowner-only yard zones, task templates, schedule rules, and availability preferences.
- As a homeowner, I need a Today view and guided yard session so I can inspect, prepare, complete, clean up, and record work with minimal phone handling.
  - Acceptance criteria: tasks are grouped into a session with tools, supplies, ordered steps, completion controls, notes, photos, elapsed time, and a completion summary.
  - Implementation path: build a homeowner task/session model separate from provider work orders while sharing photo and history components where practical.
- As a homeowner, I need weather, season, supply, equipment, and issue conditions to change the schedule with a clear reason.
  - Acceptance criteria: unsuitable tasks can move to a better window, blocked tasks explain missing supplies or equipment, and observations can create follow-up tasks.
  - Implementation path: add scheduling rules for weather holds, seasonal holds, supply holds, equipment holds, recurrence behavior, and issue-generated tasks.

### Property management and vendor governance stories

- As a portfolio operations manager, I need portfolio, region, property, vendor, territory, and coverage status views so I can see which properties are covered and which need intervention.
  - Acceptance criteria: every property has a coverage status, assigned vendor or gap reason, service requirements, evidence policy, and escalation path.
  - Implementation path: extend portfolio/property models with vendor assignments, vendor territories, service capabilities, coverage statuses, and backup vendor rules.
- As a vendor manager, I need vendor onboarding, compliance, insurance, license, certification, service territory, and performance records so only qualified providers receive work.
  - Acceptance criteria: expiring or missing compliance records prevent or warn on new assignments according to policy.
  - Implementation path: add vendor profiles, compliance documents, expiration monitoring, vendor statuses, and assignment eligibility checks.
- As an accounts payable user, I need invoices matched against contracts and validated work orders so duplicate, unsupported, or incorrect billing is caught before payment.
  - Acceptance criteria: invoice lines produce matched, matched with tolerance, duplicate suspected, rate mismatch, quantity mismatch, missing work order, missing approval, missing evidence, or rejected outcomes.
  - Implementation path: add normalized vendor invoice records, invoice lines, matching rules, tolerance policy, and invoice exception workflow.

### Organization and onboarding stories

- As an organization owner, I need to invite managers, crews, and customers by role so the product can be used by a real company instead of seed users.
  - Acceptance criteria: invitations create pending memberships, accepted users receive role-scoped access, and role changes are audited.
  - Implementation path: persist organization memberships, add invite tokens, then connect Cognito groups or app roles to tenant membership.
- As an office manager, I need customer/property onboarding checklists so new service accounts are not scheduled without required address, access, service, billing, and notification details.
  - Acceptance criteria: incomplete accounts are flagged, required fields are visible, and scheduling can block on missing operational data.
  - Implementation path: add onboarding status fields and validation helpers, then build manager forms around the existing property/account models.

### Operations and scale stories

- As an operator, I need staging smoke tests and deployment checks so releases do not break crew work, report delivery, or authentication.
  - Acceptance criteria: health, auth config, migration status, job list, route read, report read, upload ticket, and notification queue checks are documented and scriptable.
  - Implementation path: extend the production smoke script, add staging environment variables, and require smoke results before production deploys.
- As a support user, I need audit trails for schedule, price, report, access, and communication changes so customer disputes can be investigated.
  - Acceptance criteria: each sensitive action records actor, organization, target, timestamp, old/new state summary, and source request metadata.
  - Implementation path: extend access audit events into domain-specific audit helpers and surface them in manager/admin views.

### Customer portal

- Add a customer-facing portal for property owners to track work completed on their property
- Show scheduled, in-progress, completed, and upcoming services for each property
- Show completion reports with checklist status, crew notes, account status, and photo evidence
- Allow customers to view service history by property and service date
- Allow customers to review and approve project bids or extra-service requests
- Add customer notification preferences and portal links for email and text/SMS delivery
- Add role-scoped portal access so customers only see their own accounts, properties, reports, photos, and bids

### Onboarding and organization management

- Add onboarding flows for new customers, properties, yard crews, managers, and management companies
- Support management companies with multiple crews and multiple managed customer accounts
- Model organization ownership, crew membership, manager roles, and customer/property relationships
- Invite users by role: customer, crew member, crew lead, manager, and organization owner
- Capture property details during onboarding, including address, access notes, service preferences, and contracted services
- Capture crew operating details, including service area, crew capacity, default schedule, and assigned services
- Add onboarding status tracking for invited, active, incomplete, suspended, and archived accounts
- Add tenant-aware data boundaries so each organization only sees its own crews, customers, jobs, reports, bids, and notifications

### Notification strategy

- Add provider-specific delivery receipt webhooks and manually resolved failure handling
- Extend email and SMS templates beyond the implemented project-bid review payload
- Add notification preferences for channel opt-in, quiet hours, and customer contact rules
- Add templates for day-plan publication, crew route changes, completion reports, bid approvals, and extra-service requests
- Connect manager activity history to persisted notification events

### Crew day-plan amendments

- Allow crews to request day-plan changes from the field
- Support adding an unplanned stop to the current day plan
- Support removing or skipping a stop with reason capture
- Support adding an extra service to a stop, such as sprinkler repair or tree-limb removal
- Require manager approval or pricing review for billable day-plan amendments
- Preserve an audit trail showing who requested, approved, rejected, or completed each amendment
- Sync accepted amendments back into the crew-facing route and manager activity history

### Service catalog and project bidding

- Add a service list/catalog for standard yard care and extra services
- Track service attributes such as name, description, unit, default duration, default price, and whether manager approval is required
- Allow crews to attach proposed extra services to a stop from the field
- Add a project bid workspace for managers to review requested work, build line-item bids, and send customer approval requests
- Support bid statuses: draft, sent, approved, rejected, expired, and converted to work
- Convert approved bids into scheduled services, day-plan stops, or job add-ons

### Completion reports

- Add report status transitions beyond draft/ready, including sent
- Include crew route context in report responses
- Add immutable report snapshots for customer delivery
- Add customer delivery by email and text/SMS
- Surface completed reports in the customer portal

### Manager scheduling workflow

- Assign jobs to crews
- Manually order route stops
- View crew workload and estimated duration
- Move jobs between crews or service dates

### Customer/account management

- Customer account list
- Account detail page
- Payment/account status update flow
- Services contracted per period
- Services completed this period
- Manager review flag
- Property list and property detail page
- Customer-to-property relationship management
- Organization-to-customer relationship management for management companies

### Marketing and advertising campaign

- Build segmented campaign messaging for individual homeowners, property manager teams, small yard-care companies, and larger yard-care companies
- Position individual homeowner messaging around trust, proof of completion, photo evidence, clear service history, bid approvals, and easier communication with service providers
- Position property manager messaging around multi-property visibility, portfolio grouping, crew accountability, completion evidence, tenant/owner communication, and service issue tracking
- Position small yard-care company messaging around simple mobile crew workflows, daily route clarity, before/after proof, customer confidence, faster completion reporting, and reduced office follow-up
- Position larger yard-care company messaging around multi-crew operations, manager scheduling, route oversight, audit trails, role-based access, reporting consistency, and scalable service operations
- Extend the delivered persona-selectable public homepage with campaign-specific paths, production screenshots, customer proof, and pilot signup flows
- Plan advertising channels for local search, social media, industry directories, referral partnerships, property-management associations, landscaping trade groups, and targeted email outreach
- Add campaign tracking for source, audience segment, landing page, signup intent, demo requests, pilot conversion, and customer acquisition cost
- Keep campaign claims tied to implemented or planned product capabilities, and avoid promising automations, integrations, or scale features before they are ready

### Early hosting plan

- Keep the first hosted environment simple and operationally boring: hosted static frontend, containerized Rust API, managed PostgreSQL, managed object storage for photo evidence, managed secrets, and HTTPS by default
- Create separate development, staging, and production environment configuration before customer-facing pilots
- Use managed authentication for the hosted release rather than custom password storage
- Store photo evidence in object storage with short-lived upload/download URLs instead of routing large files through the API
- Run database migrations as an explicit release step with rollback notes
- Add basic observability for API health, failed requests, job/route mutation errors, upload failures, notification failures, and authentication failures
- Validate the crew mobile browser workflow, manager scheduling workflow, and customer portal workflow against the hosted environment before inviting external users

### Growth hosting and scale plan

- Scale only after adoption exceeds the initial release assumptions; do not overbuild before pilot usage proves the bottlenecks
- Move from one small API deployment to horizontally scalable API instances behind a load balancer when traffic requires it
- Add background workers for notifications, report delivery, image processing, route optimization, and long-running integrations
- Add queues for retryable work such as SMS/email delivery, photo processing, completion report delivery, and third-party sync jobs
- Add read replicas, connection pooling, and query/index reviews when PostgreSQL load becomes visible
- Add CDN caching for frontend assets, public marketing pages, and safe static content
- Add object lifecycle policies for photo evidence retention, archival, and deletion rules
- Add organization-level usage limits, rate limiting, and abuse monitoring before broad public sign-up
- Add structured logs, metrics, traces, alerting, backups, restore drills, and incident runbooks before scaling beyond early customers
- Consider regional deployment, enterprise SSO, SCIM-style user lifecycle management, and stronger data residency controls only after adoption and customer requirements justify them

### Professional product roadmap

Goal: evolve the MVP into a polished, professional landscaping operations product that can support paying customers, internal office teams, field crews, property managers, and multi-crew service companies.

Priority feature groups:

- Professional onboarding: guided setup for organizations, crews, properties, portfolios, service catalogs, invite roles, sample data, and first-route publishing
- Branded customer experience: service history timeline, delivered report cards, customer-safe evidence detail, bid history, support requests, communication preferences, and company-branded portal surfaces
- Field crew excellence: installable mobile PWA experience, offline-ready daily routes, photo capture quality checks, GPS/time context for evidence, issue capture, safety notes, and crew handoff notes
- Manager command center: dispatch calendar, drag-and-drop route planning, crew capacity heatmaps, work backlog, approval queues, quality review queues, and exception alerts for missed or delayed work
- Revenue operations: recurring service contracts, estimates, bids, change orders, deposits, invoices, payment status, tax/discount fields, account balances, and customer payment links
- Communication center: customer and crew message threads, templated updates, notification preferences, quiet-hour rules, delivery receipts, failed-delivery recovery, and manager-visible communication history
- Quality assurance: completion report review workflow, evidence completeness checks, before/after comparison, manager sign-off, audit trail, and customer-visible approved summary versions
- Analytics and reporting: crew productivity, route efficiency, service profitability, account health, bid conversion, customer retention, missed-service trends, and marketing campaign attribution
- Integrations and exports: calendar export, map routing provider integration, accounting export, CSV import/export, webhook events, public API boundaries, and CRM-style lead capture handoff
- Administration and support: organization settings, role administration, feature flags, support impersonation with audit controls, data retention settings, backup/restore drills, and operational runbooks

Professional release milestones:

- Pilot-ready release: authenticated manager/crew/customer roles, reliable hosted environment, object-storage photo evidence, basic customer portal, completion report delivery, and supportable onboarding
- Professional operations release: persisted route planning, approval queues, recurring contracts, customer bid history, notification provider integration, and manager analytics dashboard
- Scale-ready release: multi-tenant administration, billing and payments, integration hooks, observability, incident runbooks, data retention controls, rate limits, and organization-level usage governance

Product quality bar before paid launch:

- Core crew, manager, and customer workflows work without local-only assumptions
- Every customer-visible report is scoped to the correct customer account and property portfolio
- Every manager action that changes schedule, price, report status, or customer communication is auditable
- Photo evidence and completion reports are persisted as immutable customer delivery snapshots
- Notification, upload, and payment failures are visible to managers with retry or recovery guidance
- The product has a staging environment, smoke-test checklist, rollback notes, and documented support procedures
