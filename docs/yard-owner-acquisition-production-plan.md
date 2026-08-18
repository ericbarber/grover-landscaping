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
- [`../design/review/yard-owner-known-provider-connection-handoff.md`](../design/review/yard-owner-known-provider-connection-handoff.md)
- [`../design/review/yard-owner-acquisition-professional-assurance.md`](../design/review/yard-owner-acquisition-professional-assurance.md)
- [`../design/review/yard-owner-acquisition-human-validation-protocol.md`](../design/review/yard-owner-acquisition-human-validation-protocol.md)
- [`yard-owner-acquisition-pilot-operations-runbook.md`](yard-owner-acquisition-pilot-operations-runbook.md)

## Delivery status

| Slice | Status | Outcome |
| --- | --- | --- |
| 1A | Delivered | Private owner workspace/property schema, self-scoped repository, duplicate boundary, lifecycle audit, and PostgreSQL isolation coverage |
| 1B | Delivered | Verified-identity, self-scoped workspace and property API with explicit validation, missing, duplicate, and unavailable outcomes |
| 1C | Delivered | Production React private entry with public owner CTA, verified-email gate, profile/property recovery, address reconfirmation, authority attestation, and responsive browser coverage |
| 2A | Delivered | Append-only private yard briefs with areas, goals, cadence, considerations, source/version provenance, draft/ready state, API isolation, and production React editing |
| 2B | Delivered | Owner-scoped guided intake media with upload, processing/rejection, preview, replacement, explicit deletion, and responsive React recovery |
| 3A1 | Delivered | Recipient-specific known-provider invitation schema and repository creation/list foundation with limited immutable snapshots, hashed bearer tokens, replay-safe idempotency, live-recipient duplicate protection, suppression checks, pending delivery attempts, minimized audit, expiry projection, and owner isolation |
| 3A2 | Delivered | Verified-owner create/list/detail/revoke API with validation, explicit accepted/replayed/conflict/suppressed/unavailable outcomes, no token disclosure, idempotent revoke, and atomic pending-delivery suppression |
| 3A3 | Delivered | Internal delivery outcome mapping, durable batched expiry, retry token rotation, per-attempt idempotency, stale-attempt rejection, and lifecycle audit; no unauthenticated callback is exposed |
| 3A4 | In progress | Authenticated delivery adapter/callback, recipient opt-out, and abuse lifecycle operations |
| 3B–3E | Planned | Provider claim/authority, bounded responses/read models, grants/receipts/revocation, and pilot hardening |
| 4–7 | Planned | Assessment/proposal through governed pilot convergence |

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

### Slice 2A: versioned private yard brief — delivered

- Add versioned yard briefs with areas, goals, cadence, considerations, status,
  and author/source provenance.
- Expose only the latest owner-scoped version through the acquisition read model
  while retaining prior versions for audit and recovery.
- Keep draft saves flexible, but require at least one yard area and care goal
  before the owner marks a brief ready.
- Implement the approved brief React stage with explicit privacy and non-
  diagnostic boundaries.

### Slice 2B: guided private intake media — delivered

- Add owner-intake media records independent of jobs, with guided shot type,
  upload authorization, processing, metadata result, retention, replacement,
  and deletion state.
- Reuse safe upload, image validation, thumbnail, worker, privacy-erasure, and
  recovery primitives without reusing provider job authorization.
- Add review-before-share snapshots and completeness guidance without a false
  diagnostic or pricing claim.
- Implement the approved optional-photo React stage.

Delivered behavior is specified in
[`owner-private-intake-api.md`](owner-private-intake-api.md). Replaced originals
remain visible as inactive records until the owner explicitly deletes them;
they cannot silently disappear while retained. Upload completion is idempotent,
cross-owner access fails closed, and deletion removes configured object-store
objects before committing the deleted state.

Exit condition: an owner can create, revise, reload, and delete a private brief
and optional media; nothing is visible to a provider.

## Phase 3 — Known-provider connection pilot

Design status: complete and browser validated. Production status: in progress;
the 3A1 persistence foundation, 3A2 verified-owner API, and 3A3 internal
delivery lifecycle are delivered while adapter authentication and recipient
lifecycle operations remain active work.
The precise interaction, visibility, authority, recovery, and receipt contract is
recorded in the
[`yard-owner-known-provider-connection-handoff.md`](../design/review/yard-owner-known-provider-connection-handoff.md).

- Add provider-connection invitations distinct from organization-membership
  invitations.
- Reuse verified recipient, expiry, delivery, retry, revoke, opt-out, abuse
  report, and audit patterns.
- Keep delivered, opened, failed, expired, declined, opted-out, and revoked
  outcomes distinct; closed links cannot be reopened and corrections create new
  invitation records.
- Route an existing recipient to an authorized provider inbox; route a new
  recipient through provider organization claim/bootstrap.
- Evaluate recipient email, organization relationship, and explicit opportunity-
  response capability separately; do not infer price, proposal, assignment,
  work-release, or field authority.
- Add limited invitation disclosure, provider interest/decline, identity fact
  review, and owner-approved per-provider access grants.
- Persist immutable provider-, property-, purpose-, category-, and version-
  specific receipts containing both approved and withheld categories. Record
  later revocation as a new event rather than rewriting historical consent.
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

1. Phase 3 — known-provider connection pilot.
2. Phase 4 — assessment, proposal, and activation.

Phase 3 should proceed in these implementation slices:

1. Recipient-specific invitation persistence, token security, delivery mapping,
   suppression, expiry, revoke, retry, and audit. The creation/list foundation
   verified-owner API, internal outcome mapping, expiry, and retry foundations
   are delivered; authenticated delivery integration and recipient lifecycle
   transitions are next.
2. Existing-provider inbox plus duplicate-safe organization claim/bootstrap and
   explicit opportunity-response capability.
3. Provider question/interest/decline/report writes and owner/provider progress
   read models with fail-closed authorization.
4. Versioned provider-specific grants and approved/withheld disclosure receipts,
   followed by revocation reconciliation and support views.
5. Pilot hardening: idempotency, stale-tab conflict, monitoring, runbooks,
   human/AT/device evidence, cross-functional signoff, and launch rehearsal.

Phases 5–7 follow only after the preceding data and authorization boundaries are
validated. No external address, messaging, identity-fact, or marketplace vendor
is selected by this plan; those choices require separate operational review.
