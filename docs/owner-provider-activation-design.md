# Owner–Provider Relationship Activation Contract

## Purpose

Activation is the explicit bridge from an accepted Yard Owner acquisition
proposal into the provider's existing customer and property setup. Proposal
acceptance remains a review decision only. A second owner affirmation starts
one atomic, replay-safe activation transaction.

Activation creates enough durable relationship state for the provider to
finish onboarding and for the owner to receive property-scoped portal access.
It does not create a service job, day plan, route stop, work order, invoice,
payment, crew assignment, recurring schedule, or first visit.

## Entry authority

Only the authenticated owner subject for the acquisition property can activate.
The server derives every provider and operational identifier. In one locked
transaction it must confirm that:

- the owner workspace and property remain active and owner-controlled;
- the proposal belongs to that owner and property and is `accepted`;
- the one acceptance decision and immutable acceptance snapshot identify the
  same proposal version, organization, assessment, owner, and property;
- the accepted snapshot digest still matches its stored JSON content;
- the provider organization is an active yard-care company;
- no earlier activation exists for the proposal, property, or accepted
  snapshot, except an exact replay by the same owner and idempotency key.

The transaction does not require an assessment disclosure grant to remain open.
Acceptance permanently records the offer reviewed by the owner; later expiry or
revocation of assessment-only access must not silently erase that decision.

## Explicit activation request

The owner supplies:

- the accepted proposal version they are affirming;
- the activation affirmation text version shown by the client;
- an explicit `owner_confirmed` value;
- an actor-scoped idempotency key.

The owner does not supply customer account, provider organization, service
property, membership, scheduling, billing, price, scope, or cadence values.

## Atomic projection

A successful activation transaction creates:

1. one provider customer account in `customer_accounts`, initially using
   `manual_account`, `not_required`, and `manager_review` setup states;
2. one active `organization_customer_accounts` relationship with type `owner`;
3. one `customer_properties` row in `onboarding`, using the owner property's
   current display name and complete formatted service address;
4. one active, property-scoped `property_owner` organization membership for the
   owner subject;
5. one explicit customer-account/property portal-access row binding the owner
   subject to only the projected operational records;
6. one immutable activation record containing proposal, decision, acceptance
   snapshot, owner property, provider organization, customer account, service
   property, membership, portal-access, affirmation, and snapshot-digest
   provenance;
7. one minimized activation event; and
8. closure of other still-open provider invitations for the same owner
   property, recorded as an explicit activation effect.

The customer account contact name and email come from the verified owner
workspace. Proposal price and cadence stay in the immutable acceptance snapshot;
they do not silently configure billing, a service period, or recurring work.

## Portal-access boundary

Organization membership establishes the owner's customer persona in the
provider tenant. The separate portal-access record is the authoritative
account/property allow-list. Customer-facing reads adopted after this foundation
must use that allow-list and must not treat organization membership alone as
access to every customer account in the provider tenant.

Operational managers continue to use their existing tenant-scoped account and
property APIs. Activation does not grant the owner manager, scheduling, crew,
billing, or organization-administration authority.

## Replay, conflict, and rollback

- Exact same-owner retries return the original activation and identifiers.
- Reusing an idempotency key with a different proposal, version, affirmation,
  or confirmation value conflicts.
- Concurrent activation of the same accepted snapshot yields one activation and
  one authoritative replay.
- A stale proposal version, non-accepted proposal, mismatched or corrupt
  snapshot, different owner, different property, or already activated property
  conflicts or fails closed without partial setup.
- Any failed insert or competing-request closure rolls back the account,
  property, membership, access, activation, and event together.

## Competing-request closure

Only invitations for the same owner property are affected. The selected
invitation remains as accepted relationship history. Other invitations still in
`pending_delivery`, `delivered`, or `opened` become `revoked` with an activation
closure reason in minimized event data. Their response capabilities and active
disclosure grants are reconciled to ended access in the same transaction.

Invitation history, proposal history, disclosure receipts, assessment history,
and accepted snapshots remain immutable. No other owner property or provider
relationship is changed.

## First-visit boundary

Provider setup and first-visit confirmation are separate lifecycle steps. After
activation, the provider may propose a bounded first-visit window and the owner
may confirm or request a change. That later contract may establish a service
appointment, but it must not assign a crew or create route work merely because
the relationship was activated.

## Delivery slices

1. **4C0 — Contract (delivered):** authority, atomic projection, portal allow-
   list, provenance, replay, competing closure, and no-operational-side-effect
   boundaries.
2. **4C1 — Persistence:** constrained activation/provenance and portal-access
   schema plus the atomic repository transaction and PostgreSQL isolation,
   replay, concurrency, rollback, and side-effect coverage.
3. **4C2 — Authenticated API:** owner-only activation and activation-status
   reads with invalid, missing, stale, conflict, replay, and unavailable
   recovery mappings.
4. **4C3 — Production interfaces:** an explicit post-acceptance activation
   review and provider setup status in the owner/provider workspaces.
5. **4C4 — First visit:** separate provider proposal and owner confirmation or
   change-request lifecycle, without implicit crew assignment.

## Acceptance criteria

- Proposal acceptance alone continues to create none of the activation outputs.
- Activation is owner-confirmed, exact-version, idempotent, atomic, and
  server-derived.
- One accepted snapshot can produce only one customer/property relationship.
- Portal access is bound to the projected account and property, not merely the
  provider organization.
- Competing closure cannot affect a different owner property.
- No job, route, day plan, work order, payment, invoice, recurring schedule,
  crew assignment, or first visit is created by activation.
- Cross-owner, cross-property, stale-version, changed-replay, concurrent, and
  unavailable cases remain distinct and fail closed.
