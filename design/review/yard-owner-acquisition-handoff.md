# Yard Owner Acquisition Working-Design Handoff

## Outcome

The acquisition working design is complete and validated as one connected owner
and provider journey. A person can create a private yard before having a service
provider, describe what matters without professional landscaping knowledge,
optionally add guided photographs, invite a known provider or compare curated
providers, review an assessment and proposal, explicitly activate care, and then
enter the existing Yard Owner portal.

This is an implementation contract and review artifact, not a production feature.
All identities, properties, photographs, providers, trust facts, proposals,
prices, and dates are illustrative. The prototype does not persist or transmit
data.

## Review artifacts

- [Interactive acquisition journey](../prototypes/yard-owner-acquisition/index.html)
- [Prototype behavior and boundaries](../prototypes/yard-owner-acquisition/README.md)
- [Product audit and phased contract](yard-owner-entry-provider-connection-plan.md)
- [Desktop reference](../high-fidelity/customer/yard-owner-acquisition-desktop-v1.png)
- [Mobile reference](../high-fidelity/customer/yard-owner-acquisition-mobile-v1.png)
- [Repeatable browser validator](../tools/validate-yard-owner-acquisition.mjs)

Use **Review journey** in the prototype banner to inspect every state without
replaying the full path. It also enables one-shot invitation and proposal-write
failures for recovery review.

## Validated experience contract

### Private owner entry

- A yard can exist before a provider relationship.
- Verified email is an explicit substage with invalid-code, resend, change-email,
  and recovery behavior.
- Creating a yard does not create a provider tenant, customer account, job,
  contract, route, or public listing.
- Address confirmation and authority are explicit gates.
- Editing a confirmed address invalidates the confirmation and requires a new
  location check.
- Exact address, contact information, photographs, and access constraints remain
  private until an owner approves disclosure to a specific provider.
- Save-and-resume and protected-unavailable states state whether anything was
  shared.

### Yard brief and photographs

- Plain-language areas, outcomes, cadence, and considerations form a draft yard
  brief rather than a professional care plan.
- The owner can choose “not sure” or request a recommendation and continue
  without measurements, plant names,
  diagnosis, or exact frequency.
- Photographs are optional, guided, replaceable, removable, and accompanied by a
  processing and metadata-removal result.
- Review-before-share lists the current brief and states that no provider can see
  it yet.

### Provider connection

- Owners choose provider organizations, never an internal crew.
- The known-provider route is primary because it proves the relationship loop
  before requiring marketplace density or ranking.
- An invitation begins with approximate area and requested care. Exact address
  and photographs require a later provider-specific approval.
- Provider interest means assessment access, not accepted recurring service.
- A provider can decline safely, and a failed invitation preserves the owner’s
  input for retry.

### Curated discovery

- Directory results explain why each organization may fit without claiming a
  quality ranking.
- Care and assessment filters update the visible result set and provide an honest
  no-result state without contacting a provider.
- Trust labels name the specific represented fact and its freshness rather than
  implying a general Grover endorsement.
- The owner can inspect provider detail, shortlist a bounded number, and approve
  disclosure separately for each provider.
- Exact address, photographs, and final disclosure confirmation are not
  preselected. Directory requests proceed to assessment before proposals.
- Providers cannot see competitors, rank position, or requests sent elsewhere.
- The design does not introduce sponsored ranking, reviews, instant booking, or
  guaranteed availability.

### Assessment and proposal

- Assessment precedes price and can be remote or on site.
- The owner can ask a contextual question without making a service decision.
- Proposals compare scope, exclusions, cadence, policy, and price without
  pretending unlike offers are identical.
- Proposal cards use factual cadence labels instead of provider rankings, and
  recurring monthly figures are explicitly annualized comparison averages.
- Acceptance requires explicit confirmation and is separate from payment.
- Failed decisions retain the proposal and can be retried safely.
- Acceptance enters provider setup; it does not silently schedule work.

### Activation and relationship continuity

- The existing Yard Owner portal begins only after a provider confirms the first
  visit.
- Active access remains inspectable by provider and data category.
- The owner can revoke future photo access, change or end the provider
  relationship, request an export, and request deletion of unused intake data.
- Access-reducing and destructive actions explain their effect and require a
  second confirmation before changing state.
- Historical agreement and access events need immutable audit representation in
  production even when future access is revoked.

## Production contract map

| Design capability | Required production contract | Existing foundation to reuse |
| --- | --- | --- |
| Independent owner | Personal owner workspace and verified identity not dependent on organization membership | Cognito sign-in and PropertyOwner role |
| Private property | Owner-scoped property, normalized address, authority, duplicate/claim handling, coarse service area | Provider property validation patterns |
| Yard brief | Versioned owner draft with areas, outcomes, cadence, constraints, and provenance | Customer onboarding validation patterns |
| Intake media | Owner-scoped upload authorization, shot type, processing, retention, deletion, and per-provider grants | Job-photo upload, processing, thumbnails, and erasure recovery |
| Provider profile | Public organization profile, service territory, capability, eligibility, trust-fact source, and freshness | Organization profile and hierarchy |
| Direct invitation | Expiring provider-connection invitation with verified recipient, claim, revoke, decline, and audited delivery | Organization invitation and notification outbox patterns |
| Directory request | Bounded per-provider request, disclosure snapshot, lifecycle, blocking, withdrawal, and abuse report | Tenant authorization and recovery patterns |
| Assessment | Proposed windows, remote/on-site method, owner questions, provider-private notes, and lifecycle | Scheduling and activity patterns |
| Initial proposal | Versioned customer-visible scope, exclusions, terms, price, expiration, revision, decision, and immutable accepted snapshot | Bid confirmation, expiry, and decision patterns |
| Activation | Idempotent owner-property/provider relationship projection into provider customer/property records | Customer/property onboarding and portal membership |
| Relationship control | Access-grant history, revoke/end/change, export, deletion eligibility, retention, and audit | Membership, audit, and erasure patterns |

## Recommended production slices

1. **Identity and private property:** add the independent owner workspace,
   verified identity, address normalization, authority, duplicate handling,
   coarse-area derivation, and a pre-service Home read model.
2. **Brief and intake media:** add the versioned brief, owner-scoped media,
   processing/retention rules, deletion, and review-before-share snapshot.
3. **Known-provider connection:** add invitation delivery, provider claim or
   existing-organization routing, provider inbox response, per-provider grants,
   withdrawal, expiry, audit, and recovery.
4. **Assessment and initial proposal:** add scheduling, contextual conversation,
   provider-private separation, versioned proposals, explicit decisions, and
   idempotent activation into current customer/property records.
5. **Curated discovery pilot:** add profile eligibility, coarse matching, precise
   trust facts, bounded requests, abuse controls, and density/support monitoring.
6. **Relationship governance:** add durable access history, provider change/end,
   export, deletion, retention, support operations, and marketplace measurement.

Each slice should retain the prototype’s loading, empty, unavailable, invalid,
expired, revoked, conflict, retry, and success distinctions. Do not collapse a
persistence outage into an empty result or a failed write into apparent success.

## Production gates

Before a production pilot, approve and test:

- address normalization, geocoding vendor, location precision, retention, and
  duplicate-property resolution;
- owner-intake media consent, EXIF handling, content rules, retention, erasure,
  and storage isolation;
- provider eligibility, identity and insurance fact sources, freshness,
  correction, appeal, and support ownership;
- invitation abuse, recipient verification, rate limits, withdrawal, blocking,
  reporting, and notification delivery recovery;
- assessment and proposal authorship, versioning, expiration, acceptance,
  cancellation, payment separation, and consumer-policy review;
- atomic activation, idempotency, provenance, competing-request closure, and
  rollback behavior;
- export, deletion, legal retention, audit visibility, and provider access after
  relationship termination;
- regional provider density, response expectations, marketplace support, and
  honest no-match behavior.

## Validation evidence

The repeatable Playwright validator passes the connected desktop journey and
directory branch, email verification and resend semantics, stale-address
reconfirmation, functional filters and no-result guidance, invitation and
proposal one-shot failures, affirmative consent defaults, programmatic field
errors and control names, semantic current-step progress, focus return,
activation boundary, destructive confirmation and relationship controls, mobile
layouts at 390 and 320 CSS pixels, tablet layout, 200% text, minimum mobile touch
targets, horizontal-overflow checks, one-visible-stage integrity, and
browser-error checks.

Run from an environment with the frontend dependencies installed:

```bash
node design/tools/validate-yard-owner-acquisition.mjs --capture
```
