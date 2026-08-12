# Yard Owner Acquisition Production Delivery Plan

## Objective

Adopt the validated Yard Owner acquisition experience in production without
placing pre-provider data inside a landscaping company tenant. Deliver the
journey in independently reviewable slices, beginning with self-scoped owner and
property persistence and ending with governed provider discovery and durable
relationship controls.

The approved experience is defined by:

- [`../design/prototypes/yard-owner-acquisition/index.html`](../design/prototypes/yard-owner-acquisition/index.html)
- [`../design/review/yard-owner-acquisition-professional-review.md`](../design/review/yard-owner-acquisition-professional-review.md)
- [`../design/review/yard-owner-acquisition-handoff.md`](../design/review/yard-owner-acquisition-handoff.md)

## Delivery status

| Slice | Status | Outcome |
| --- | --- | --- |
| 1A | Delivered | Private owner workspace/property schema, self-scoped repository, duplicate boundary, lifecycle audit, and PostgreSQL isolation coverage |
| 1B | In progress | Verified-identity self-service API |
| 1C | Planned | Production React private entry |
| 2–7 | Planned | Intake through governed pilot convergence |

## Delivery principles

- A private owner property is self-scoped by authenticated subject, not by an
  organization membership.
- Verified identity is required before private property creation or access.
- Owner intake never creates a provider customer account, service property, job,
  route, crew assignment, contract, or public listing.
- Exact location, intake media, contact details, and access constraints are
  disclosed through explicit, provider-specific grants.
- Empty, missing, invalid, conflicting, and unavailable states remain distinct.
- Every accepted relationship projection into provider records is idempotent,
  atomic, auditable, and provenance-preserving.
- Directory scale follows a direct-provider pilot and remains gated by provider
  eligibility, abuse operations, support readiness, and regional density.

## Phase 1 — Independent owner and private property

### Slice 1A: persistence foundation

- Add `owner_workspaces` keyed by authenticated subject with verified email,
  customer-facing display name, lifecycle status, and timestamps.
- Add `owner_properties` keyed to the owner workspace with nickname, structured
  address, coarse service area, address-confirmation state, authority
  attestation, acquisition lifecycle, and timestamps.
- Enforce per-owner duplicate property protection without claiming that two
  different authenticated household members can never reference the same yard.
- Add owner-acquisition lifecycle events for workspace and property mutations.
- Implement a repository whose reads and writes distinguish loaded, missing,
  duplicate/conflict, invalid, and unavailable outcomes.
- Prove owner subject isolation and transactional audit behavior with PostgreSQL
  integration tests.

### Slice 1B: authenticated self-service API

- Add self-scoped `/owner-workspace` and `/owner-properties` endpoints.
- Require a verified email claim; do not require organization membership.
- Derive the owner subject and verified email exclusively from authentication,
  never from request JSON.
- Validate structured address and authority fields while leaving third-party
  normalization and geocoding explicitly pending.
- Return pre-service status suitable for the acquisition Home state.
- Cover unauthenticated, unverified, cross-owner, missing, duplicate, invalid,
  unavailable, and successful outcomes.

### Slice 1C: production React entry

- Add an acquisition route and private-profile/property forms using the approved
  design system and copy.
- Reuse Cognito email verification; do not build a second verification-code
  authority in the API.
- Add save/reload, field validation, stale-address reconfirmation, authority
  attestation, unavailable recovery, and signed-in return behavior.
- Keep the existing provider/manager application navigation unchanged for users
  with organization memberships.

### Phase 1 exit condition

A verified signed-in person with no provider organization can create and reload
only their own private workspace and property. No provider-scoped record exists,
and persistence outages are never presented as an empty or successful state.

## Phase 2 — Yard brief and owner-scoped intake media

- Add versioned yard briefs with areas, goals, cadence, considerations, status,
  and author/source provenance.
- Add owner-intake media records independent of jobs, with guided shot type,
  upload authorization, processing, metadata result, retention, replacement,
  and deletion state.
- Reuse safe upload, image validation, thumbnail, worker, privacy-erasure, and
  recovery primitives without reusing provider job authorization.
- Add review-before-share snapshots and completeness guidance without a false
  diagnostic or pricing claim.
- Implement the approved brief and optional-photo React stages.

Exit condition: an owner can create, revise, reload, and delete a private brief
and optional media; nothing is visible to a provider.

## Phase 3 — Known-provider connection pilot

- Add provider-connection invitations distinct from organization-membership
  invitations.
- Reuse verified recipient, expiry, delivery, retry, revoke, opt-out, abuse
  report, and audit patterns.
- Route an existing recipient to an authorized provider inbox; route a new
  recipient through provider organization claim/bootstrap.
- Add limited invitation disclosure, provider interest/decline, identity fact
  review, and owner-approved per-provider access grants.
- Implement owner and provider progress/read models and recovery states.

Exit condition: an owner can connect a known provider for assessment without
granting organization membership or silently creating service.

## Phase 4 — Assessment, proposal, and activation

- Add assessment method/window lifecycle and customer-safe conversation.
- Separate provider-private assessment notes from owner-visible content.
- Add versioned initial-service proposals with scope, exclusions, cadence,
  arrival/weather/cancellation policy, proof expectation, price, expiration,
  revision, and immutable accepted snapshot.
- Support question/change requests without deciding and idempotent explicit
  acceptance/decline.
- Atomically project an accepted relationship into provider customer/property
  records with grants, provenance, portal access, and competing-request closure.
- Keep provider setup distinct from first-visit confirmation.

Exit condition: a verified assessment can produce an accepted proposal and a
confirmed first visit that safely transitions into the existing Yard Owner
portal.

## Phase 5 — Curated provider discovery pilot

- Add public provider profiles, service territory, capabilities, assessment
  methods, response expectation, precise trust facts, source, and freshness.
- Add coarse matching, functional filters, honest no-result states, bounded
  shortlists, separate request disclosures, and provider-neutral comparison.
- Add eligibility, correction/appeal, rate limiting, blocking, abuse reporting,
  and support workflows before regional launch.
- Measure request, response, assessment, proposal, and activation outcomes
  without exposing competitors or creating sponsored ranking.

Exit condition: a supported region can offer honest, bounded discovery with
enough eligible providers and complete trust/support operations.

## Phase 6 — Relationship governance

- Add inspectable provider grants and immutable disclosure receipts.
- Add confirmed future photo-access revocation, provider change/end, invitation
  and request withdrawal, blocking, export, deletion eligibility, and retention.
- Preserve accepted proposal and delivered-service history when legally or
  operationally required while ending future access.
- Add support and audit views for failed notification, projection, export, and
  erasure work.

Exit condition: owners and support can understand and safely control every
current and historical provider relationship.

## Phase 7 — Pilot readiness and convergence

- Complete privacy, security, consumer-policy, accessibility, and operational
  reviews.
- Validate responsive and assistive-technology behavior in the production React
  implementation, not only the design prototype.
- Run cross-tenant, idempotency, conflict, outage, delivery, processing,
  activation, export, and erasure suites.
- Publish support runbooks, monitoring, rollback, retention, abuse, and regional
  availability guidance.

Exit condition: a bounded known-provider pilot can be operated and supported
without weakening existing tenant, evidence, notification, or portal contracts.

## Active delivery order

1. Phase 1B — authenticated self-service API.
2. Phase 1C — production React private entry.
3. Phase 2 — brief and owner-scoped intake media.
4. Phase 3 — known-provider connection pilot.

Phases 4–7 follow only after the preceding data and authorization boundaries are
validated. No external address, messaging, identity-fact, or marketplace vendor
is selected by this plan; those choices require separate operational review.
