# Owner–Provider Initial Service Proposal Contract

## Purpose

An initial-service proposal is the first provider-authored offer produced after
a completed owner–provider assessment. It lets the Yard Owner compare and
decide an exact version of proposed care without first creating a provider
customer account, service property, job, work order, schedule, or crew
assignment.

This is a separate bounded context from the existing `project_bids` subsystem.
Project bids require an established customer account, day plan, and amendment,
and approval can convert line items onto an existing service job. Acquisition
proposals exist before those records and must remain accepted-but-unactivated
until the later activation transaction succeeds.

## Entry authority

A provider may author or revise a proposal only when one transaction confirms:

- the invitation token and verified mailbox remain bound to the same provider
  actor;
- the invitation, response capability, explicit interest, organization claim,
  organization, and actor membership remain effective;
- the owner workspace, property, and disclosed yard-brief version remain
  current;
- the provider-specific disclosure grant remains active;
- the assessment belongs to the same invitation, organization, actor, grant,
  owner, and property and has status `completed`;
- no accepted proposal already closes the proposal series.

Owner reads and decisions are always authenticated by owner subject and
property. Neither side supplies organization, owner, property, or assessment
ownership as trusted authorization input.

## Versioned proposal model

Each invitation has one proposal series and immutable numbered versions. A
revision inserts a new version and supersedes the prior open version; it never
overwrites scope, terms, or price already reviewed by the owner.

Each version contains:

- provider organization and completed-assessment references;
- customer-safe title and summary;
- ordered included-scope items and explicit exclusions;
- cadence and arrival-window policy;
- weather and cancellation policy;
- proof/evidence expectation;
- price amount and basis, plus a clearly labelled server-derived annualized
  comparison when cadence supports it;
- issue and expiration timestamps;
- version number, status, and provider-authored customer-safe revision note.

Money is stored as integer minor units with an ISO currency. The foundation
supports one explicit price basis per proposal version; taxes, deposits,
payment collection, discounts, and invoices remain outside this phase.

## Lifecycle and decisions

Proposal-version states are `sent`, `superseded`, `accepted`, `declined`, and
`expired`. Draft estimation remains provider-private and must not enter the
owner proposal record.

The owner may:

- accept the exact current version;
- decline the exact current version with a controlled reason and optional
  customer-safe note;
- ask a question or request a revision without deciding.

Question/change requests are stored separately from decisions. Acceptance
creates an immutable accepted snapshot containing the exact proposal version,
scope, exclusions, cadence, policies, proof expectation, price, currency, and
owner affirmation text/version. It does not activate the relationship.

## Replay and concurrency

- Every create, revise, message, and decision write uses an actor-scoped
  idempotency key.
- Every revise or decision write supplies the current proposal version.
- Exact retries return the authoritative original result.
- Changed key reuse, stale versions, a superseded/expired version, or a second
  incompatible terminal decision conflicts without partial mutation.
- Concurrent exact acceptance produces one decision and one replay.
- Proposal expiration is server-derived and reconciled before reads or writes.

## Visibility and audit

Owner responses contain only customer-safe proposal data and proposal
conversation. Provider-private measurements, production assumptions, route
fit, margins, labor estimates, and internal notes have no owner projection.

Append-only audit events retain identifiers, version, controlled action/status,
price basis, currency, and timestamps. They do not copy message bodies,
addresses, photographs, access considerations, private estimates, or full
scope/exclusion text.

## Delivery slices

1. **4B1a — Schema foundation (delivered):** separate proposal, decision,
   accepted-snapshot, and minimized-event tables; constrained customer-safe
   content; one open/accepted version per assessment; actor replay uniqueness;
   and a database trigger that prevents published-content mutation.
2. **4B1b — Repository foundation (delivered):** immutable proposal versions,
   constrained scope/terms, current-series uniqueness, expiration, accepted
   snapshot, minimized events, and PostgreSQL isolation/replay coverage.
3. **4B2 — Authenticated APIs:** verified-provider create/revise, owner-scoped
   list/detail, question/change requests, and versioned accept/decline.
4. **4B3 — Production interfaces:** provider authoring/revision and neutral Yard
   Owner comparison/decision experiences with responsive recovery coverage.
5. **4C — Activation:** separately project an accepted snapshot into provider
   customer/property setup, then confirm the first visit without coupling crew
   assignment to acceptance.

## Foundation acceptance criteria

- Existing `project_bids` and service-job conversion paths are not reused.
- A proposal cannot exist without one completed, currently authorized
  assessment relationship.
- Published versions are immutable and ordered per invitation.
- Owner acceptance points to one exact immutable version and creates no
  customer, service property, job, route, work order, schedule, payment, or crew
  assignment.
- Cross-owner, cross-provider, stale, expired, concurrent, replay, and outage
  cases remain distinct and fail closed.
