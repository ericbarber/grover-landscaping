# Yard Crew Acquisition Working-Design Handoff

## Outcome

The Yard Crew acquisition working design is complete as a connected journey from
public marketing through the correct provider or invitation path, service and
readiness setup, owner-approved opportunity discovery, provider-specific
disclosure, yard assessment, provider-authored proposal, operational handoff,
and contextual support.

The central product decision is that **Yard Crew is an audience, not a public
marketplace account type**. An owner-operator creates a provider organization of
one. A multi-crew business creates or claims a provider organization. Crew leads
and members join one by invitation. Yard owners choose provider organizations;
providers retain responsibility for internal crew assignment and continuity.

This package is a review artifact, not production behavior. Every identity,
business, trust fact, opportunity, yard, photograph-like summary, price, date,
selection, assessment, proposal, assignment, and support result is illustrative.
Nothing is persisted or transmitted.

## Review artifacts

- [Interactive Yard Crew acquisition journey](../prototypes/yard-crew-acquisition/index.html)
- [Prototype behavior and boundaries](../prototypes/yard-crew-acquisition/README.md)
- [Product audit and phased plan](yard-crew-acquisition-plan.md)
- [Desktop marketing reference](../high-fidelity/field/yard-crew-acquisition-desktop-v1.png)
- [Mobile opportunity reference](../high-fidelity/field/yard-crew-acquisition-mobile-v1.png)
- [Repeatable browser validator](../tools/validate-yard-crew-acquisition.mjs)

Use **Review journey** to jump to each stage, switch between owner-operator and
multi-crew company paths, open the invited-worker path, select suitable, empty,
unavailable, or paused opportunity states, and make the next interest request
fail once.

## Validated experience contract

### Marketing and account fit

- The public promise is operational: find work that fits, review clearly, and
  deliver agreed scope.
- The page does not promise leads, earnings, owner selection, route density,
  exclusive territory, or guaranteed availability.
- Solo operators, multi-crew companies, and invited workers receive distinct
  explanations and account outcomes before account creation.
- Marketing proof uses supported Grover capabilities—scope, field handoff,
  availability control, evidence, and recovery—not unverified testimonials or
  growth claims.

### Provider identity and readiness

- An owner-operator still receives a provider organization, with combined owner
  and field responsibilities.
- A company can create or claim a provider organization and later delegate
  opportunity, assessment, pricing, and field responsibilities by role.
- Duplicate-organization recovery precedes creating another provider.
- Draft identity does not make a provider public or eligible for opportunities.
- Services, territory, assessment method, response expectation, languages, and
  request availability describe fit without exposing routes or customers.
- Supplied identity, checked identity, supplied documents, pending review,
  expiration, correction, not-applicable, and not-collected states must remain
  distinct. One broad “verified” badge is not acceptable.

### Opportunity discovery

- The workspace says **Find opportunities**, not claim jobs.
- Opportunity previews contain approximate area, owner-approved care needs,
  desired outcome/cadence, response window, assessment expectation, and factual
  fit reasons.
- Exact address, owner contact, photographs, access details, competitor activity,
  rank, budget, and guaranteed value stay hidden before provider-specific owner
  approval.
- Filters never silently broaden territory or privacy to fill an empty list.
- Empty, unavailable, and provider-paused states remain different and
  recoverable.
- Providers can express interest, ask a safe question, decline, report, pause,
  or withdraw without pretending an opportunity is assigned work.

### Disclosure and yard assessment

- Interest asks the owner for assessment access; it is not work acceptance,
  owner selection, assignment, scheduling, or activation.
- A failed interest request preserves the provider’s note and allows retry.
- Exact address, in-app contact, photos, and access constraints are independent
  grants recorded in an inspectable disclosure receipt.
- Yard photos and owner answers are context, not measurement, diagnosis, safety
  proof, or a treatment plan.
- The provider can say remote review may be enough, require an on-site
  assessment, or decline when the yard cannot be safely or credibly assessed.
- Provider-private notes remain separate from owner-visible observations.
- Assessment windows explain that no service visit is booked.

### Proposal and operational handoff

- The authorized provider authors versioned scope, exclusions, one-time versus
  recurring work, cadence, price, policies, proof expectations, expiration, and
  first-visit prerequisites.
- Owner questions and revision requests do not decide the proposal.
- Acceptance is explicit and binds an immutable proposal version.
- Acceptance does not imply payment, internal crew assignment, or a scheduled
  first visit.
- Provider operations link the customer/property relationship, review
  operational scope, assign a responsible crew, and confirm the first visit
  before handing work to the existing Route → Job → Proof workflow.

### Invited worker and support

- An invitation shows provider, inviter, verified destination, offered role,
  scope, expiration, allowed data, and excluded data before acceptance.
- Crew roles do not automatically expose company opportunities, customer price,
  other crews, or business administration.
- Wrong-recipient, wrong-role, expired, revoked, already-used, unexpected, and
  correction paths are required.
- Setup, verification, opportunity/contact, assessment/safety, team/access,
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
| Readiness facts | Requirement policy, source, supplied/checked state, freshness, expiry, correction, and appeal | Organization setup progress; new verification model required |
| Opportunity eligibility | Owner-approved preview, coarse matching, allocation, response window, rate limit, fairness, and audit | Yard Owner request/discovery contracts remain planned |
| Opportunity actions | Interest, question, decline, withdraw, pause, block, report, failure recovery, and notifications | Notification, audit, and operational-exception patterns |
| Provider disclosure | Owner-specific grants, receipt, withdrawal, access audit, and current visibility | Yard Owner acquisition grants remain planned |
| Yard assessment | Remote/on-site lifecycle, owner-visible facts, provider-private notes, schedule, uncertainty, and safety stop | Scheduling and activity patterns |
| Initial proposal | Versioned scope, exclusions, price, terms, collaboration, expiration, explicit decision, immutable acceptance | Project-bid lifecycle patterns |
| Operational projection | Idempotent relationship-to-customer/property projection, provenance, responsible manager/crew, first visit | Accounts, properties, onboarding, assignments, routes |
| Invited worker | Verified destination, role/scope preview, accept/decline/correct/report, least-privilege entry | Organization invitation and membership contracts |
| Provider support | Contextual intake, urgency, ownership, response target, audit, correction/appeal, safety and abuse operations | Operational exceptions and platform support require expansion |

## Recommended production design/adoption slices

1. **Public fit and entry routing:** adopt the Yard Crew marketing story and
   correct-path decision without implying opportunity availability.
2. **Provider identity and organization readiness:** deliver owner-operator,
   provider claim/bootstrap, profile, service territory, response ownership,
   invitations, and precise readiness facts.
3. **Known-owner connection pilot:** let an owner invite a provider, then validate
   provider inbox, disclosure, assessment, proposal, and operational projection
   before search-based acquisition.
4. **Curated opportunity pilot:** add bounded owner-approved previews, coarse
   eligibility/matching, interest, decline, pause, report, rate limits, support,
   and honest empty/unavailable states in one supported region.
5. **Assessment and proposal workspace:** add provider-private separation,
   uncertainty/safety states, scheduling, versioned proposals, collaboration,
   decisions, and failure recovery.
6. **Operational convergence:** connect accepted relationships to provider
   customer/property onboarding, assignment, first visit, field execution, proof,
   and owner lifecycle without weakening tenant boundaries.
7. **Governance and scale:** add verification operations, correction/appeal,
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
journey, precise readiness wording, suitable and no-result opportunity states,
hidden-data boundaries, one-shot interest failure and retry, owner-approved
disclosure, on-site assessment, versioned proposal and explicit acceptance,
accepted-but-unassigned state, first-visit handoff, mobile layouts at 390 and 320
CSS pixels, tablet layout, 200% text, minimum mobile targets, accessible control
names, one-visible-H1 integrity, horizontal-overflow checks, and browser-error
checks.

Run from an environment with frontend dependencies installed:

```bash
node design/tools/validate-yard-crew-acquisition.mjs --capture
```
