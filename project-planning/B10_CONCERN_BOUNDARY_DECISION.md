# B10 Yard Owner concern and preference decision packet

Status: decision-ready proposal; not approved and not authorization to build.
Prepared 2026-10-01 from the delivered contextual-question, customer-proof,
notification-preference, operational-exception, privacy, and recovery contracts.

This packet narrows the choices needed before Yardfolio accepts a customer concern.
The existing visit-question thread remains for ordinary timing, preparation,
access, and service-scope questions. A concern is a separate lifecycle because
it may require ownership, escalation, retention, correction, and privacy
handling that a conversation thread does not provide.

## Recommended first-release contract

| Decision | Recommended boundary | Why this is the smallest responsible release |
| --- | --- | --- |
| Entry context | Begin only from an exact customer-authorized delivered visit/report. | Preserves property, provider, service, proof, and grant authority without accepting an unscoped inbox message. |
| Categories | `service_quality`, `property_access`, or `property_damage`. | These are service-linked and can have one provider owner. Safety emergencies, billing disputes, account/privacy requests, and general messages need different handling. |
| Customer content | One bounded plain-text summary; no attachment in the first release. | Avoids image purpose, malware/content review, retention, and accidental secret/PII expansion before those controls have owners. |
| Provider owner | Exact provider organization; active organization owner or manager may claim the concern. One accountable assignee is required before `follow_up_planned`. | Reuses authoritative provider membership without inventing a Dispatcher role or silently assigning work. |
| Backup owner | Organization owner sees unassigned/escalated items. Yardfolio Support handles only platform access/privacy failures, not landscape-service resolution. | Prevents an unstaffed support promise and keeps provider accountability visible. |
| Customer-visible states | `received`, `follow_up_planned`, `resolved`, `closed_without_resolution`, and `reopened`. | Names customer-understandable outcomes without exposing provider investigation notes. |
| Provider-private state | Separate notes, linked operational exception, assignment history, and internal severity. Never serialize these into customer projections. | Keeps field, employee, liability, and investigation detail out of the customer record. |
| Response expectation | Confirm persistence immediately. Show a next-update time only after an accountable provider explicitly records one. Do not publish a general response-time promise. | Distinguishes “Yardfolio saved this” from “the provider read or answered this.” |
| Notifications | In-app state is authoritative. Email/SMS may be queued only through the existing verified recipient, channel preference, quiet-hours, retry, receipt, and dead-letter controls. “Queued” or “sent” never means read. | Uses delivered delivery controls without turning notification success into concern resolution. |
| Correction and reopen | Customer may append a correction while open and reopen once within 14 days of resolution. Prior events remain immutable. Provider may not rewrite customer text. | Allows recovery while preserving the evidence trail and bounding indefinite workflow churn. |
| Escalation | Unassigned after the configured internal review interval, failed notification, explicit property-damage category, or provider-marked high severity creates provider-visible Recovery work. | Makes operational follow-through detectable without exposing an internal exception to the customer. |
| Urgent/safety language | Stop submission and show a fixed instruction that Yardfolio is not an emergency service; direct the person to local emergency services or the provider's separately verified urgent contact when one exists. Do not automatically classify free text as safe. | Avoids implying monitoring or emergency response that is not staffed or verified. |
| Billing/account/privacy | Do not create a service concern. Route billing/scope disputes to a separately owned billing/support destination only when delivered; route access/privacy requests to the existing owned support/privacy process. | Prevents a concern queue from becoming an unsupported financial, identity, or legal system. |
| Appreciation/reviews | Excluded. Private thanks and neutral external-review links retain their separate eligibility and policy gate. | Avoids coupling problem resolution to review solicitation or worker ratings. |
| Retention/erasure | Keep the immutable concern/event record for a proposed 24 months after closure, then delete or irreversibly minimize it unless an approved legal hold applies. Provider-private notes follow the same or shorter schedule. Export/erasure acts only within verified customer authority. | Supplies an implementable default, but privacy/legal approval is required before this duration becomes policy. |

## Decisions requiring explicit approval

The product owner may approve the recommended contract as one decision, but
the following fields must be confirmed or changed before implementation:

1. Provider owner and backup owner.
2. The three accepted categories and all excluded routes.
3. Whether the first release remains text-only.
4. No general response-time promise; next-update time is explicit per concern.
5. The 14-day reopen window.
6. The proposed 24-month closed-record retention period and legal-hold rule.
7. The urgent/safety stop language and verified-contact rule.
8. Whether existing notification delivery controls may be enabled in the first
   release or concern updates remain in-app only.

Approval must name product and operations owners. Privacy approval is required
for retention/export/erasure. Legal review is required for the property-damage,
urgent/safety, legal-hold, and public wording boundaries. If those owners are
not yet assigned, the feature remains gated.

## Implementation contract after approval

The first implementation slice should include:

- tenant-scoped concern, immutable event, assignment, and customer-safe state
  projections linked to the exact delivered report/visit;
- hybrid customer authorization and active provider-membership checks on every
  read and write;
- actor-scoped idempotency, optimistic state versions, replay, stale/conflict,
  ended-access, and persistence-unavailable behavior;
- provider queue claim/reassign/escalate/respond/resolve actions and a separate
  provider-private note surface;
- bounded customer correction/reopen actions and a customer-safe history;
- optional notification outbox writes only after authoritative preference and
  recipient checks;
- retention, export, erasure, and legal-hold jobs with audit evidence; and
- API, PostgreSQL, privacy-projection, accessibility, browser, operational,
  and rollback tests.

The implementation must not reuse visit-question messages, completion-report
review notes, notification rows, or operational exceptions as the concern's
source of truth. It may link to those records through purpose-specific,
tenant-scoped references after rechecking authority.

## Acceptance evidence

- Wrong tenant, wrong customer, wrong property, ended grant, unverified
  provider membership, and stale state all fail without partial events.
- Customer projections never contain provider-private notes, employee detail,
  internal severity, operational-exception content, notification recipients,
  or provider-only audit metadata.
- `received` proves persisted receipt only; queued/sent notification states do
  not imply reading, response, or resolution.
- Resolution and reopen preserve immutable history, exact actors, timestamps,
  and state versions.
- Retention, export, erasure, and legal-hold behavior pass live PostgreSQL jobs
  and operator recovery tests before rollout.
- The public and customer UI makes emergency, billing, privacy, and unsupported
  routes explicit without promising an unavailable responder.

Until the approval fields above are resolved, no concern form, free-form inbox,
attachment upload, response-time statement, appreciation prompt, or external
review link should be added to the product.
