# Yard Crew Acquisition Working-Design Handoff

Production adoption status: the public landscaping-company persona and reciprocal
known-owner provider entry are partial foundations; the complete acquisition,
readiness, first-service, team-authority, alert, and curated-opportunity journey
is not yet adopted. Curated marketplace behavior remains product-gated. See the
[`adoption tracker`](../../project-planning/PROTOTYPE_ADOPTION.md).

## Outcome

The Yard Crew acquisition working design is complete as a connected journey from
public marketing through the correct provider or invitation path, service
capability and qualification, owner-authorized opportunity discovery,
provider-specific disclosure, site assessment, service estimate and proposal,
mobilization, work-order release, and contextual support.

The central product decision is that **Yard Crew is an audience, not a public
marketplace account type**. An owner-operator creates a provider organization of
one. A multi-crew business creates or claims a provider organization. Crew
leaders and team members join one by invitation. Yard owners choose provider organizations;
providers retain responsibility for internal crew assignment and continuity.

This package is a review artifact, not production behavior. Every identity,
business, trust fact, opportunity, yard, photograph-like summary, price, date,
selection, assessment, proposal, assignment, and support result is illustrative.
Nothing is persisted or transmitted.

## Review artifacts

- [Interactive Yard Crew acquisition journey](../prototypes/yard-crew-acquisition/index.html)
- [Prototype behavior and boundaries](../prototypes/yard-crew-acquisition/README.md)
- [Product audit and phased plan](yard-crew-acquisition-plan.md)
- [Professional workflow review V2](yard-crew-acquisition-professional-review-v2.md)
- [Extension review V3](yard-crew-acquisition-extension-review-v3.md)
- [Industry terminology and voice review](yard-crew-industry-language-review.md)
- [Desktop marketing reference](../high-fidelity/field/yard-crew-acquisition-desktop-v1.png)
- [Mobile opportunity reference](../high-fidelity/field/yard-crew-acquisition-mobile-v1.png)
- [Desktop assessment-to-estimate reference](../high-fidelity/field/yard-crew-acquisition-estimate-desktop-v2.png)
- [Desktop saved-alert reference](../high-fidelity/field/yard-crew-opportunity-alerts-desktop-v3.png)
- [Desktop first-service communication reference](../high-fidelity/field/yard-crew-first-service-notification-desktop-v3.png)
- [Desktop team-authority reference](../high-fidelity/field/yard-crew-team-authority-desktop-v3.png)
- [Repeatable browser validator](../tools/validate-yard-crew-acquisition.mjs)

Use **Review journey** to jump to each stage, switch between owner-operator and
multi-crew provider paths, open the invited-team-member path, select suitable,
empty, unavailable, or paused opportunity states; inspect saved-alert,
invitation, and pilot states; and make the next statement of interest or owner
update fail once.

## Validated experience contract

### Marketing and account fit

- The public promise is warm and operational: find work that fits, assess the
  property clearly, and deliver a clear scope.
- Headings and actions use an experienced account-manager voice; formal terms
  remain in supporting receipts, lifecycle definitions, and operational records.
- The page does not guarantee referral volume, contract award, revenue, owner
  selection, route density, territory exclusivity, or availability.
- Solo operators, multi-crew companies, and invited workers receive distinct
  explanations and account outcomes before account creation.
- Marketing proof uses supported Grover capabilities—scope, field handoff,
  availability control, evidence, and recovery—not unverified testimonials or
  growth claims.

### Provider identity and qualification

- An owner-operator still receives a provider organization, with combined owner
  and field responsibilities.
- A company can create or claim a provider organization and later delegate
  opportunity, assessment, pricing, and field responsibilities by role.
- Duplicate-organization recovery precedes creating another provider.
- Draft identity does not make a provider public or eligible for opportunities.
- Service categories, territory, assessment method, response standard,
  languages, and opportunity availability describe fit without exposing routes
  or customers.
- Supplied identity, checked identity, supplied documents, pending review,
  expiration, correction, not-applicable, and not-collected states must remain
  distinct. One broad “verified” badge is not acceptable.

### Opportunity discovery

- The workspace says **Service opportunities**, not claim jobs.
- Progress is grouped into **Get started**, **Find the right work**, and **Start
  service**; Support remains available without appearing as a completion step.
- Readiness names allowed and restricted services, recurring openings, preferred
  work, typical crew size, and preferred service days.
- Opportunity previews contain approximate area, owner-authorized maintenance
  requirements, service objective/cadence, size band, landscape profile,
  requested start, route impact, response window, assessment expectation, and
  factual alignment reasons.
- Exact address, owner contact, photographs, access details, competitor activity,
  rank, budget, and guaranteed value stay hidden before provider-specific owner
  approval.
- Filters never silently broaden territory or privacy to fill an empty list.
- Empty, unavailable, and provider-paused states remain different and
  recoverable.
- Authorized representatives can submit a statement of interest, request
  clarification, decline, report, pause, or withdraw without representing an
  opportunity as assigned work.

### Disclosure and site assessment

- A statement of interest asks the owner for site-assessment access; it is not
  contract award, proposal approval, assignment, scheduling, or activation.
- A failed statement-of-interest submission preserves the provider’s note and
  allows retry.
- Pending requests show submission, owner-review, disclosure, and expiration
  states instead of an undifferentiated waiting message.
- Exact address, in-app contact, photos, and access constraints are independent
  grants recorded in an inspectable disclosure receipt.
- Site photos and owner answers are context, not measurement, diagnosis, safety
  proof, or a treatment plan.
- The provider can say a desktop assessment is sufficient, require an on-site
  assessment, or decline when the site cannot be safely or credibly assessed.
- Provider-private notes remain separate from owner-visible observations.
- A structured checklist covers scope, measurements, access, disposal,
  irrigation boundaries, hazards, and owner concerns, with field-verification
  states where evidence remains incomplete.
- Assessment windows explain that no service visit or work order is authorized.

### Proposal and operational handoff

- Provider-private crew-hours, equipment, disposal, access, and route
  assumptions appear beside—but are never included in—the owner proposal.
- The authorized provider authors versioned scope, exclusions, one-time versus
  recurring work, cadence, price, policies, proof expectations, expiration, and
  mobilization and initial-service prerequisites.
- Owner questions and revision requests do not approve the proposal.
- Approval is explicit and binds an immutable proposal version.
- Proposal approval does not imply payment, internal crew assignment, work-order
  release, or a scheduled service visit.
- Provider operations link the customer/property relationship, review
  operational scope, assign a responsible crew, and release the initial work
  order before handing it to the existing Route → Work order → Service evidence
  workflow.

### Invited worker and support

- An invitation shows provider, inviter, verified destination, offered role,
  scope, expiration, allowed data, and excluded data before acceptance.
- Crew roles do not automatically expose company opportunities, customer price,
  other crews, or business administration.
- Wrong-recipient, wrong-role, expired, revoked, already-used, unexpected, and
  correction paths are required.
- Setup, qualification, opportunity/contact, assessment/safety, team/access,
  field synchronization, and data/relationship support remain contextual.
- Safety stop, emergency guidance, incident intake, harassment, and ordinary
  product support cannot collapse into one undifferentiated queue.

## Production contract map

| Design capability | Required production contract | Existing foundation to evaluate |
| --- | --- | --- |
| Provider entry routing | Owner-operator, provider-owner, organization claim, and invitation decision model | Cognito, organization bootstrap, memberships, invitations |
| Provider organization of one | Combined business-owner/field roles without bypassing organization scope | Organization and access-control contracts |
| Public provider profile | Customer-facing identity, capabilities, language/contact, assessment, and pause state | Organization profile |
| Service territory | Coarse regions, postal codes/radius/map, service categories, and fit explanation | Branch and service-territory hierarchy |
| Capacity and work preferences | Recurring openings, preferred service mix, crew profile, preferred days, pause state, and availability provenance | Availability controls require a provider-acquisition projection |
| Qualification facts | Requirement policy, source, supplied/validated state, effective date, expiry, correction, and appeal | Organization setup progress; new credential-validation model required |
| Opportunity eligibility | Owner-authorized preview, coarse matching, privacy-safe size/profile/start/route facts, allocation, response window, rate limit, fairness, and audit | Yard Owner request/discovery contracts remain planned |
| Opportunity actions | Statement of interest, clarification, decline, withdraw, pause, block, report, failure recovery, and notifications | Notification, audit, and operational-exception patterns |
| Provider disclosure | Owner-specific grants, receipt, withdrawal, access audit, and current visibility | Yard Owner acquisition grants remain planned |
| Site assessment | Desktop/on-site lifecycle, structured evidence checklist, owner-visible facts, provider-private notes, schedule, uncertainty, and safety stop | Scheduling and activity patterns |
| Estimate and initial service proposal | Provider-private production basis plus versioned owner scope, exclusions, price, terms, collaboration, expiration, explicit decision, and immutable approval | Project-bid lifecycle patterns; new private-estimate contract required |
| Operational projection | Idempotent relationship-to-customer/property projection, provenance, responsible manager/crew, initial work order | Accounts, properties, onboarding, assignments, routes |
| Owner service update | Versioned owner-visible message tied to work-order confirmation, recipient/channel, idempotent send/retry, result, exact receipt, and provider-private exclusions | Notification delivery and audit patterns require an owner-safe projection |
| Team authority and invited worker | Capability grants by organization/branch, approval authority, verified destination, role/scope preview, accept/decline/correct/expire/revoke/report, active-access lifecycle, and audit | Organization invitation, membership, and access-control contracts require finer capability scope |
| Saved opportunity alert | Filter snapshot, frequency/channel/quiet hours, capacity and eligibility suppression, pause/resume, delivery history, and no-priority semantics | Notification preferences and delivery patterns require provider-opportunity scope |
| Pilot governance | Named gate owners, supported region/service boundary, launch checklist, measurement definitions, support/incident readiness, claims review, and rollback | Product and operating governance contract required |
| Provider support | Contextual intake, urgency, ownership, response target, audit, correction/appeal, safety and abuse operations | Operational exceptions and platform support require expansion |

## Recommended production design/adoption slices

1. **Public fit and entry routing:** adopt the Yard Crew marketing story and
   correct-path decision without implying opportunity availability.
2. **Provider identity and organization qualification:** deliver owner-operator,
   provider claim/bootstrap, profile, service territory, response ownership,
   invitations, and precise credential facts.
3. **Known-owner connection pilot:** let an owner invite a provider, then validate
   provider inbox, disclosure, assessment, proposal, and operational projection
   before search-based acquisition.
4. **Curated opportunity pilot:** add bounded owner-authorized previews, coarse
   eligibility/matching, statement of interest, decline, pause, report, rate limits, support,
   and honest empty/unavailable states in one supported region.
5. **Assessment and proposal workspace:** add provider-private separation,
   uncertainty/safety states, scheduling, versioned proposals, collaboration,
   decisions, and failure recovery.
6. **Operational convergence:** connect approved relationships to provider
   customer/property onboarding, crew assignment, initial work-order release,
   field execution, proof,
   and owner lifecycle without weakening tenant boundaries.
7. **Governance and scale:** add credential-validation operations, correction/appeal,
   abuse/incident handling, fairness review, relationship controls, retention,
   measurement, and only then evaluate monetization or broader regions.

Known-owner provider connection should precede open opportunity discovery. It
validates provider identity, disclosure, assessment, proposal, activation, and
support with less marketplace density and allocation risk.

## Production gates

Before any provider opportunity pilot, approve:

- supported provider entity types, organization-claim authority, duplicate
  resolution, and ownership transfer;
- provider eligibility per region/service and exact meaning of every trust fact;
- insurance, license, certification, background-check, or identity sources,
  freshness, expiration, correction, appeal, and support ownership;
- worker classification, employment, contractor, tax, payments, payouts, lead
  fees, subscriptions, refund, and dispute implications if applicable;
- owner request eligibility, opportunity allocation, fairness, response windows,
  provider density, rate limits, pause behavior, and measurement;
- information visible before and after owner-specific provider approval;
- spam, unsafe requests, discrimination, harassment, blocking, reporting,
  incident, evidence, retention, and emergency operations;
- assessment authorship, safety/qualification boundaries, scheduling, proposal
  versioning, cancellation, acceptance, and consumer-policy language;
- least-privilege roles for interest, disclosure, assessment, pricing, proposal,
  assignment, and customer access;
- supported languages, accessibility assistance, support hours, escalation
  targets, monitoring, rollback, and regional availability wording.

## Validation evidence

The repeatable browser validator passes the connected desktop owner-operator
journey, precise qualification wording, suitable and no-result opportunity
states, hidden-data boundaries, one-shot statement-of-interest failure and
retry, owner-authorized disclosure, on-site assessment, versioned proposal and
explicit approval, approved-but-unassigned state, initial-work-order handoff,
owner-message preview/failure/receipt, saved-alert preference failure and
pause/resume, team-authority approval and invitation terminal states, limited-
pilot governance, mobile layouts at 390 and 320
CSS pixels, tablet layout, 200% text, minimum mobile targets, accessible control
names, one-visible-H1 integrity, horizontal-overflow checks, and browser-error
checks.

Run from an environment with frontend dependencies installed:

```bash
node design/tools/validate-yard-crew-acquisition.mjs --capture
```
