# Customer Contextual Communication Source

Status: Decision D-060 accepted on 2026-08-26. The question-first persistence,
provider queue, and minimized customer/provider APIs are delivered; responsive
workspace adoption is next.

## Source-audit outcome

The repository has several message-like records, but none is a safe source for
an active customer's service-visit question or a post-service concern:

- assessment messages belong to pre-activation assessment versions and checked
  invitation/provider authority;
- initial-service proposal messages belong to proposal versions and change-
  request/decision collaboration before service activation;
- customer service-day events are one-way provider publications, not a customer
  conversation or acknowledgement channel;
- notification outbox rows record external delivery attempts and recipients,
  not inbound customer content, provider ownership, or threaded responses;
- operational exceptions are mutable provider-internal recovery records whose
  descriptions, assignments, priorities, and resolutions are not customer-safe;
- completion-report review notes are provider/crew workflow and are never
  customer concern records; and
- project-bid customer messages remain bound to one proposal and decision.

Reusing any of these would mix lifecycle authority, make customer visibility
depend on an internal tool, or imply receipt/response behavior the source does
not actually provide.

## Accepted decision D-060

Deliver contextual visit questions first through a dedicated customer-service
conversation. Keep delivered-service concerns as a later, separate evented
workflow because concern category, triage owner, response expectation,
escalation, resolution, and delivered-proof linkage require additional product
and operations ownership.

The visit-question contract should use:

1. a random immutable customer-safe visit reference attached to the exact D-059
   service release. The reference is an identifier, not a bearer credential;
2. hybrid portal authorization on every customer read/write, including the
   current organization/account/property grant, relationship, exact release,
   and customer subject;
3. immutable actor-attributed messages with `customer_question` and
   `provider_response` kinds, bounded customer-safe text, an allowlisted topic,
   exact reply linkage, timestamps, and actor-scoped idempotency keys;
4. provider reads/responses restricted initially to an active organization-
   scoped `organization_owner` or `manager` membership in the exact provider
   organization;
5. an authoritative server projection for the thread; no operational exception,
   notification, support ticket, or minimized audit event becomes conversation
   content; and
6. explicit created/replayed/stale/missing/ended/unavailable recovery. An unknown
   write retains its retry key and reloads the thread before retrying.

Recommended initial topics are `timing`, `preparation`, `access`,
`service_scope`, and `other`. The initial slice should be text-only. Reusing
private intake media or job evidence would violate purpose/visibility boundaries;
optional customer attachments need a later dedicated selection, upload,
retention, malware/content-safety, erasure, and provider-visibility contract.

## Customer and provider routes after acceptance

The customer read may return the random `customer_visit_reference` only inside
the already authorized visit projection. Proposed routes are:

```http
GET  /customer-portal/visits/{customer_visit_reference}/messages
POST /customer-portal/visits/{customer_visit_reference}/messages
```

The browser never submits organization, account, property, release, job, route,
crew, provider-membership, or notification identifiers. The repository resolves
them through the reference and rechecks the hybrid grant.

The provider needs an organization-scoped queue and exact thread response, for
example:

```http
GET  /provider-customer-visit-threads
GET  /provider-customer-visit-threads/{customer_visit_reference}
POST /provider-customer-visit-threads/{customer_visit_reference}/responses
```

Route-role checks do not replace exact membership and relationship validation.
Support administrators, property owners in another provider tenant, property
managers outside the exact grant, and crew roles receive no implicit access.

## Deliberate non-effects

A customer question does not change the visit status/window, accepted scope,
job, route, crew assignment, operational exception, report, recommendation,
billing state, or provider service-level commitment. Saving a thread does not
claim that an email/SMS was sent or that a person has read/responded. External
notifications and response-time promises require separate approved policies.

## Concern boundary retained for a later decision

A concern should begin only from an exact customer-authorized delivered report
or visit/proof relationship. It should have immutable customer/provider events
and a customer-visible state projection such as `received`,
`follow_up_planned`, and `resolved`, while provider-private investigation remains
separate. Before implementation, product/operations/security must approve:

- allowed categories and emergency/safety redirection;
- accountable provider roles and reassignment/escalation behavior;
- response expectations without an unstaffed service-level promise;
- attachment purpose, retention, erasure, and visibility;
- customer reopening/correction rules and immutable history; and
- whether a concern may create a linked provider operational exception without
  exposing that internal record or treating it as the customer source.

## Accepted delivery boundary

Product, operations, and security accepted these three choices on 2026-08-26:

1. question-first delivery, with concern persistence deferred;
2. a dedicated random non-bearer customer visit reference rather than exposing
   or accepting release/job identifiers; and
3. an organization-owner/manager persisted provider queue with no automatic
   notification or response-time promise in the initial slice.
