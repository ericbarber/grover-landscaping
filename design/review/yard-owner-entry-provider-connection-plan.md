# Yard Owner Entry and Provider Connection Delivery Plan

## Goal

Let a yard owner create a Grover account before they have a landscaping provider,
build a private profile of their property with guided photographs and care goals,
then either connect an existing provider or request service from suitable provider
companies. After assessment and explicit agreement, the accepted provider can
activate the property in the existing service lifecycle and assign its own crew.

This plan extends the validated Yard Owner V2 portal backward from “service is
already connected” to “I need to get my yard into Grover and establish care.”

## Product recommendation

### Owners choose provider companies, not internal crews

A crew is an internal operating unit controlled by a yard-care company. Capacity,
staffing, route assignment, equipment, absence coverage, and crew membership can
change without changing the customer relationship. Exposing crews as marketplace
choices would leak provider operations and create a promise the provider may not
be able to keep.

The owner should choose a **yard-care provider** based on service territory,
capabilities, availability to assess, service approach, verified business facts,
and a delivered proposal. The provider assigns the servicing crew after the
relationship is accepted. A sole proprietor may appear as both provider and
service team, but the relationship still belongs to the provider organization.

### The owner creates a yard brief, not an operational care plan

The owner can describe goals, desired cadence, yard areas, known problems,
access constraints, household considerations, and budget comfort. Grover may
organize those answers into a **draft care brief** and suggest questions to ask.

It must not claim that photographs alone establish plant health, treatment,
hazards, labor, price, exact service scope, or schedule. The provider verifies the
property remotely or on site and authors a versioned service proposal. Only the
accepted proposal becomes the customer-visible agreement and provider operational
service-plan input.

### Start with known-provider invitations before an open marketplace

Inviting a provider the owner already knows validates the complete relationship
workflow without requiring ranking, compliance, coverage, marketplace support,
or enough provider density in every location. A curated provider directory should
follow only after the direct connection loop is safe and measurable.

## Current-system audit

### Foundations that can be reused

| Foundation | Current capability | Reuse |
| --- | --- | --- |
| Identity | Cognito sign-in, PropertyOwner role, verified-email invitation acceptance | Reuse authentication and verified identity; add a personal owner workspace independent of provider membership. |
| Provider organizations | Yard-care company bootstrap, profile, contacts, service-area label, team invitations | Reuse organization setup after a new provider claims an owner invitation. |
| Customer/property records | Provider-scoped customer accounts, properties, onboarding, readiness, activation | Project an accepted owner/provider relationship into these records; do not use them as the owner’s pre-provider property store. |
| Provider invitations | Audited organization membership invitations with expiry and delivery recovery | Reuse delivery, token, expiry, verified-recipient, audit, and recovery patterns; introduce a separate provider-connection invitation type. |
| Photos | Validated formats, direct upload, processing, thumbnails, privacy and erasure patterns | Reuse storage and processing primitives; add owner-intake media not tied to a job. |
| Proposals | Sent bid, expiration, version-like revision behavior, confirmation, decision, and audit patterns | Reuse decision safety patterns; introduce pre-service assessment and initial recurring-service proposal semantics. |
| Notifications | Outbox, history, retry, recipient validation, preferences, and quiet hours | Reuse for provider requests, responses, assessment, proposal, expiry, and activation events. |
| Portal | Validated Yard Owner V2 Home, Visits, Proof, and Account lifecycle | Make connection progress the pre-service Home state, then transition into the existing portal after activation. |

### Missing contracts

- A self-created owner identity/profile that does not require prior provider
  membership.
- An owner-controlled property that can exist before any service organization is
  selected.
- Address normalization, verification, duplicate/claim handling, geocoding, and
  location privacy rules.
- Owner-intake photographs, guided shot types, consent, retention, deletion, and
  safe sharing grants.
- Yard zones, care goals, desired cadence, constraints, and a versioned yard brief.
- Provider public profiles, service territories, capabilities, assessment
  availability, verification facts, and directory eligibility.
- Direct provider invitations that connect organizations rather than granting a
  crew or provider access to the owner’s personal workspace.
- Provider connection requests, controlled disclosure, lifecycle, questions,
  declines, expiry, withdrawal, blocking, and abuse reporting.
- Assessment and initial-service proposal contracts.
- Accepted relationship activation that safely maps owner data into a
  provider-scoped customer account/property without losing provenance or consent.

### Important incompatibilities

- Current customer/property creation is manager-capable and organization-scoped;
  it cannot safely represent a private yard before provider selection.
- Current photo upload is tied to a provider job; onboarding photos need their own
  owner-scoped storage and authorization boundary.
- Current organization invitations make the recipient a member of the inviter’s
  organization; provider connection needs a relationship between two parties,
  not an owner-created provider membership or a provider-created crew.
- The existing `billingNotes` field is not appropriate for an owner care brief or
  customer-visible relationship data.

## Improved end-to-end workflow

### 1. Create a private yard

The owner selects **Get started with my yard**, signs up, verifies email and an
optional mobile number, accepts the privacy notice, and enters:

- property nickname;
- service address;
- address confirmation or manual correction;
- ownership/authority attestation;
- preferred contact channel and quiet hours.

The first save creates a private owner workspace and draft property. It does not
create a provider organization, customer account, service contract, job, route,
or public marketplace listing.

### 2. Build a guided yard profile

Use a short, save-and-resume wizard instead of asking for professional landscape
knowledge:

1. **What needs care?** Front yard, back yard, side yard, lawn, desert landscape,
   beds, shrubs, trees, irrigation, cleanup, or “not sure.”
2. **What outcome matters?** Keep it healthy, basic upkeep, make it presentable,
   restore an overgrown yard, solve a specific issue, or seasonal care.
3. **What rhythm do you expect?** One-time, weekly, biweekly, monthly, seasonal,
   or “recommend one.”
4. **What should a provider know?** Pets, gates, parking, access windows, noise,
   HOA constraints, chemical preferences, and accessibility needs. Sensitive
   access credentials are not collected here.
5. **Show the yard.** Guided front, back, side, lawn/ground, planting, irrigation,
   and issue photographs, each optional and replaceable.

The result is a plain-language yard brief with completeness guidance. Owners can
continue even when they do not know yard size, plants, irrigation type, or exact
service frequency.

### 3. Choose how to connect care

Present three honest choices:

- **Invite my current provider.** Enter a business email or mobile number and
  optional company name. Grover sends an expiring connection invitation.
- **Find a provider.** Browse eligible providers whose declared territory and
  capabilities match the property’s approximate area and requested care.
- **Finish later.** Keep the private yard profile without sending anything.

“I maintain it myself” may later hand off to the distinct homeowner assistant,
but it must not mix DIY tasks with provider operations in this workflow.

### 4A. Invite an existing provider

- The owner sees exactly which brief fields and photos will be shared.
- The invitation reveals the owner’s name, approximate service area, requested
  care, and invitation source; exact address and photos remain private until the
  owner approves the provider’s verified/claimed identity.
- If the destination matches an existing provider organization, an authorized
  provider user receives it in a connection inbox.
- If it is new, the recipient signs in, verifies the invited destination, creates
  or claims a yard-care organization, completes minimum public profile details,
  and accepts or declines the connection request.
- Accepting an invitation allows assessment communication; it does not activate
  recurring service or create a crew assignment.

### 4B. Find a provider

The directory shows provider organizations, not individual employees, and only
facts Grover can support:

- business/trade name and contact route;
- declared service territory;
- supported care categories;
- languages and accessibility/contact options;
- assessment method and typical response window;
- business identity, insurance, license, or certification status only when the
  specific check and freshness date are recorded;
- clearly labeled review/source policy if reviews are added later.

The owner may shortlist providers, inspect why each matched, and request an
assessment from a small bounded number. Providers see no competitors or ranking
position. Exact address, full photos, phone, email, and access details are shared
only per provider after a clear consent step.

### 5. Provider review and assessment

The provider can:

- acknowledge, ask a contextual question, express interest, decline with a safe
  category, or allow the request to expire;
- request additional owner photos without exposing internal IDs;
- propose a remote or on-site assessment window;
- record provider-private assessment notes separately from owner-visible facts;
- mark conditions that require an in-person review before pricing.

The owner can answer, reschedule, withdraw, revoke access, block further contact,
or report misuse. A decline never exposes private provider capacity or internal
reasoning unless the provider intentionally shares a customer-safe explanation.

### 6. Proposal, comparison, and decision

Each provider authors a versioned initial-service proposal containing:

- customer-visible scope and exclusions;
- proposed frequency and service window policy;
- price model and total/period estimate;
- one-time setup or restoration work;
- weather, access, cancellation, and renewal terms;
- expected proof and communication;
- expiration and what acceptance authorizes;
- next step before the first visit.

Owners compare the same high-level categories without Grover pretending unlike
scope is identical. They may ask a question or request a revision without deciding
the proposal. Acceptance uses explicit confirmation and is distinct from payment.
Declined, expired, withdrawn, and superseded versions remain understandable.

### 7. Activate the service relationship

After accepted scope—and only then—the system atomically:

1. creates or links the provider-scoped customer account;
2. creates or links the provider-scoped service property;
3. records the owner/provider/property relationship and accepted proposal version;
4. copies only consented, current customer-visible fields with source provenance;
5. creates a property-scoped PropertyOwner access membership or equivalent portal
   authorization;
6. closes competing requests without revealing the selected provider;
7. asks the provider to complete operational onboarding and assign a crew;
8. shows the owner **Provider setup in progress** until the first visit is truly
   confirmed.

The existing Yard Owner V2 service lifecycle begins after the provider has made
the property ready and confirmed the first service. Proposal acceptance must not
silently schedule work.

## Core state model

| Entity | States |
| --- | --- |
| Owner property | Draft, profile ready, connection in progress, provider setup, active care, paused, archived |
| Yard brief | Draft, ready to share, shared, revised, withdrawn |
| Provider invitation | Draft, sent, delivered, viewed, claimed, accepted for assessment, declined, expired, revoked |
| Directory request | Draft, sent, viewed, interested, question pending, assessment proposed, declined, expired, withdrawn, blocked |
| Assessment | Not required, requested, proposed, scheduled, completed, cancelled, needs on-site review |
| Initial proposal | Draft, sent, revision requested, superseded, accepted, declined, expired, withdrawn |
| Service connection | Pending activation, provider setup, active, paused, ended |
| Intake photo | Local preview, uploading, processing, ready, rejected, shared, access revoked, deletion pending, deleted |

Every state transition needs actor, timestamp, previous/new state, customer-safe
copy, idempotency behavior, authorization, and audit requirements.

## Privacy, safety, and trust requirements

### Address and identity

- Exact addresses are private, excluded from public/provider search results, and
  never used as public profile identifiers.
- Directory matching uses a coarse service area until per-provider disclosure is
  approved.
- Address verification must allow legitimate manual correction and must not imply
  legal ownership verification.
- Duplicate-address handling must avoid revealing whether another person has an
  account at the property; use a private support/claim process.
- Household members and renters require explicit authority/relationship rules.

### Photographs

- Explain guided shot purpose before camera access; every photo is optional.
- Strip EXIF/GPS metadata by default, rotate safely, validate type/size, scan and
  process outside the public path, and never train models on photos without a
  separate opt-in contract.
- Warn users to avoid people, faces, license plates, house numbers, security
  devices, keys, documents, and neighboring private areas.
- Do not promise automatic plant, disease, hazard, treatment, or price diagnosis.
- Support replace, revoke-sharing, download/export, retention, and deletion with
  clear pending/failed states.

### Provider trust

- Use **profile complete**, **identity checked**, **insurance on file**, or other
  precise labels; never say **verified** or **vetted** without defining and
  completing the underlying check.
- Directory eligibility, ranking, sponsorship, fees, complaints, suspension, and
  appeals need explicit policies before broad launch.
- Provider users never receive owner workspace membership. Owner/provider access
  is relationship- and property-scoped.
- Rate-limit invitations and requests; add recipient opt-out, blocking, abuse
  reporting, malware checks, moderation, and support escalation.

## Proposed data and API boundaries

| New boundary | Purpose |
| --- | --- |
| `owner_profiles` | Verified identity linkage, contact preferences, status, and deletion/export lifecycle. |
| `owner_properties` | Private owner property identity and normalized/coarse location before provider connection. |
| `yard_zones` / `yard_brief_versions` | Owner-authored conditions, goals, desired cadence, constraints, and shareable snapshots. |
| `owner_intake_photos` | Owner/property/zone-scoped media with processing, consent, sharing, and retention state. |
| `provider_public_profiles` | Deliberately public organization facts, capabilities, contact path, and directory status. |
| `provider_service_territories` | Coarse matching areas, care categories, assessment modes, and declared availability. |
| `provider_connection_invitations` | Known-provider invitation, recipient verification, organization claim, expiry, and audit. |
| `provider_connection_requests` | Owner-to-provider disclosure grant and assessment lifecycle. |
| `initial_service_proposals` | Versioned provider scope, cadence, price, terms, expiry, revision, and decision. |
| `owner_provider_relationships` | Property-scoped relationship, accepted proposal, access state, and activation lifecycle. |
| `relationship_projection_audits` | Provenance for owner data copied into provider-scoped account/property records. |

Do not overload organization membership invitations, job photos, shared bids,
provider access notes, or billing notes to represent these concepts.

## Phased delivery plan

### Phase 0 — Workflow contract and trust foundation

**Outcome:** The product can describe who owns each record and what consent means
before any private address or photo is collected.

Deliver:

- Final state machines, ownership matrix, threat model, abuse model, retention and
  deletion policy, disclosure receipt, and support/recovery runbook.
- Decide initial launch geography, provider eligibility standard, maximum active
  requests, invitation channels, assessment expectations, and whether Grover is
  only a connector or a party to the service agreement.
- Define address provider/fallback behavior and exact/coarse location rules.
- Create responsive low-fidelity owner and provider journeys plus failure states.
- Instrumentation event dictionary with no address, photo, message, or contact
  contents in analytics.

Exit: privacy/security/product review approves the state, consent, retention,
provider-claim, duplicate-property, and support contracts.

### Phase 1 — Independent Yard Owner identity and private property

**Outcome:** An owner can sign up and save a private address without a provider.

Deliver:

- Yard Owner signup/sign-in/recovery and a personal workspace independent from
  organization membership.
- Owner profile, verified contact, address entry/normalization, manual correction,
  authority attestation, duplicate-safe claim flow, and draft property states.
- Save/resume, loading, offline/network failure, unavailable, delete draft, and
  account export/deletion request behavior.
- Home pre-service state: **Finish your yard profile**.

Exit: a new identity can create, reopen, edit, and delete only its own property;
tenant and enumeration tests prove no cross-owner or provider access.

### Phase 2 — Guided yard profile, zones, and intake photographs

**Outcome:** The owner can create a useful brief without landscape expertise.

Deliver:

- Progressive yard areas, goals, desired cadence, known issues, access
  constraints, household considerations, and “not sure” answers.
- Guided photo capture/upload with shot prompts, preview, replace, retry, process,
  rejection, revoke, export, and deletion states.
- EXIF/GPS removal, image normalization, malware/content safety pipeline, quotas,
  retention, and explicit no-AI-training default.
- Versioned private yard brief and a review-before-sharing summary.

Exit: an owner can finish with zero photos or a complete set; failures preserve
safe progress; accessibility and mobile camera flows pass; no provider can read
the brief.

### Phase 3 — Known-provider invitation pilot

**Outcome:** An owner can connect a provider they already use.

Deliver:

- Email-first provider invitation with bounded resend, expiry, revoke, opt-out,
  delivery history, and abuse controls; add SMS only after consent/delivery rules.
- Existing-organization routing and new-provider claim/bootstrap.
- Minimum provider public profile and authorized connection inbox.
- Staged disclosure: coarse request first, exact address/photos only after owner
  confirms the claimed provider identity.
- Provider acknowledge, question, interested, decline, expiry, and owner withdraw.

Exit: a real owner and existing/new provider can reach **accepted for assessment**
without creating service, membership leakage, crew assignment, or silent data
sharing.

### Phase 4 — Assessment, initial proposal, and activation

**Outcome:** A connection becomes real service through informed agreement.

Deliver:

- Contextual owner/provider messaging and additional-photo requests.
- Remote/on-site assessment proposals, confirmation, rescheduling, completion,
  cancellation, and no-response recovery.
- Versioned initial recurring-service proposals with scope, exclusions, cadence,
  price, policies, proof expectation, expiry, question, revision, and decision.
- Explicit owner confirmation and immutable accepted snapshot; payment remains a
  separate product gate.
- Atomic relationship projection into provider customer/property records,
  property-scoped owner access, provider operational onboarding, and activation
  progress.
- Transition to Yard Owner V2 only after first visit confirmation.

Exit: accepted scope is traceable end to end; the provider can prepare/assign the
property; the owner sees setup progress; nothing is scheduled by proposal
acceptance alone.

### Phase 5 — Curated provider directory and request comparison

**Outcome:** Owners without a provider can find eligible care in an initial region.

Deliver:

- Provider public profiles, territory/capability declarations, eligibility,
  freshness, suspension, and manual review.
- Coarse-location matching with transparent match reasons and explicit no-result,
  outside-area, unavailable, and waitlist paths.
- Shortlist and bounded multi-provider assessment requests with per-provider
  disclosure receipts, revoke/block/report controls, and response deadlines.
- Proposal comparison by scope, exclusions, cadence, price model, terms, and next
  step without misleading normalization.
- Close other requests safely after selection without disclosing competitors.

Exit: a curated launch cohort can receive, respond to, and convert requests while
privacy, provider eligibility, spam, complaints, and support queues meet defined
service levels.

### Phase 6 — Service continuity and relationship management

**Outcome:** Provider connection is durable beyond the first accepted plan.

Deliver:

- Owner/provider relationship center with active provider, accepted plan,
  renewal/change history, contact, sharing grants, and end-service flow.
- Provider change and secondary/specialty provider rules without corrupting
  historical proof or current operational ownership.
- Household delegates and property-manager handoff with explicit authority.
- Provider unavailability, suspension, owner move, property sale, and data
  retention/transfer recovery.
- Connection status integrated with Yard Owner Home, Visits, Proof, Account, and
  notification preferences.

Exit: ending or changing a relationship revokes future access without deleting
immutable records the owner is entitled to retain or exposing one provider’s
private data to another.

### Phase 7 — Marketplace governance and scale

**Outcome:** Directory expansion is measurable, supportable, and trustworthy.

Deliver:

- Defined verification/compliance integrations, expirations, appeals, sanctions,
  and re-verification.
- Ranking and sponsorship policy, review authenticity/moderation if enabled,
  provider lead controls, fair-use limits, and anti-circumvention policy only if
  needed.
- Funnel/support dashboards using privacy-safe events.
- Regional rollout controls, directory density thresholds, provider onboarding
  operations, fraud/abuse monitoring, and incident runbooks.
- Marketplace fees or lead charges only after disclosure, dispute, refund, tax,
  and provider agreement contracts are approved.

Exit: expansion requires acceptable match availability, provider response,
owner-to-assessment conversion, complaint, abuse, and support-resolution metrics.

## Recommended release sequence

| Release | Included phases | Why |
| --- | --- | --- |
| Design and contract gate | Phase 0 | Prevents premature address/photo collection and incorrect tenant modeling. |
| Owner profile alpha | Phases 1–2 | Proves owners can create a useful private yard brief. |
| Direct-connect pilot | Phase 3 | Tests provider acquisition and identity claim with known relationships. |
| Service-conversion pilot | Phase 4 | Closes the loop into real provider operations and Yard Owner V2. |
| Curated market beta | Phase 5 | Adds discovery only after direct connection and proposal flows work. |
| Durable marketplace | Phases 6–7 | Adds relationship changes, governance, regional scale, and monetization gates. |

## Cross-phase acceptance matrix

Every phase must cover:

- owner, provider, support, and unauthenticated authorization boundaries;
- mobile-first composition, desktop, 320px, 390px, tablet, and 200% text;
- save/resume, loading, empty, validation, conflict, unavailable, expiry,
  withdrawal, retry, success, and focus restoration where applicable;
- customer-safe copy with no internal IDs, crew operations, provider-private
  notes, raw storage/provider errors, or unsupported trust claims;
- idempotent transitions, concurrent update/conflict handling, audit history, and
  notification delivery/recovery;
- accessibility labels, keyboard operation, announcements, target sizes, error
  association, reduced motion, and no photo-only meaning;
- data export, access revocation, retention, deletion, support, rate limiting, and
  abuse recovery proportional to the phase.

## Success measures

### Funnel

- Signup → verified identity.
- Verified identity → property saved.
- Property saved → yard brief ready.
- Brief ready → provider invitation/request sent.
- Request sent → provider response and assessment.
- Assessment → proposal delivered.
- Proposal → accepted relationship.
- Accepted relationship → first confirmed visit and first delivered proof.

### Quality and trust guardrails

- Address/photo unauthorized-access attempts and incidents.
- Owner photo processing, deletion, and revocation failures.
- Provider invitation delivery, claim, expiry, and opt-out rates.
- Provider median response time and no-response rate.
- Proposal revision and misunderstanding/contact-support rate.
- Complaints, spam, blocking, safety escalation, and provider suspension rate.
- Accepted relationships that fail to reach first confirmed service.
- First-service concern rate and provider retention after initial service.

Metrics must use bounded identifiers and lifecycle events; analytics must not
contain addresses, photo URLs, message text, access instructions, or proposal
free text.

## Explicitly deferred

- Selecting a provider’s named internal crew.
- AI plant/disease diagnosis or automated pricing from photos.
- Public exact-address or yard-photo listings.
- Instant booking before provider assessment and scope confirmation.
- Payments, deposits, stored payment methods, refunds, or marketplace fees.
- Unqualified “verified,” “best,” or guaranteed-availability claims.
- Open-ended provider blasting or unbounded sales contact.
- DIY adaptive task planning inside the provider connection flow.

## Immediate next design slice

Build one connected working design covering Phase 1 through the Phase 3
direct-connect pilot:

1. public Yard Owner entry;
2. identity and private property setup;
3. guided yard brief and photograph states;
4. review-before-sharing;
5. invite existing provider;
6. provider claim/inbox response;
7. owner connection progress and failure recovery.

That working design should pass the same seven gates used by Yard Owner V2 before
Phase 4 production implementation begins.
