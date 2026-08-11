# Yard Owner Portal V2 Enhancement Plan

## Goal

Extend the validated Yard Owner V1 confidence portal into a service-day companion
that helps customers prepare, follow progress, understand proof, collaborate on a
recommendation, recover a concern, and control the information their provider may
use.

V2 keeps the V1 hierarchy—next service, delivered proof, and action needed—and
adds depth inside that lifecycle. It does not turn the customer portal into a
provider operations dashboard or present unconfirmed billing behavior as shipped.

## Delivery status

| Phase | Status | Review evidence |
| --- | --- | --- |
| 0. Contract and privacy foundation | Complete | V1 audit/handoff plus V2 product boundaries below |
| 1. Live service-day confidence | Planned | Service status modes, preparation, delay, and reschedule behavior |
| 2. Contextual communication and recovery | Planned | Visit question and concern workflows |
| 3. Proof, recommendation collaboration, and feedback | Planned | Evidence comparison, question/change request, decision meaning, feedback |
| 4. Customer preferences and access | Planned | Channel controls, quiet hours, access instructions, visibility contract |
| 5. Billing and account | Product-gated | Contract requirements and planned composition only |
| 6. Validation and handoff | Planned | Browser checks, references, gallery, records, and adoption mapping |

## Product principles

### One visit, one continuous story

The same service record should progress from confirmed to en route, arrived,
completed, proof delivered, recommendation decided, and concern resolved. The
customer should not have to reconstruct that story from separate databases.

### Explain what changed and what happens next

Every transient state needs both facts. “Delayed” without a reason or next update
creates more support work. “Approved” without scheduling expectations creates
uncertainty.

### Customer-authored and provider-authored data remain distinct

Gate, pet, and access instructions are customer-authored, visibly shared with the
provider, and editable through an auditable contract. Provider operational notes
remain private. The two must never reuse the same raw field.

### Communication starts from context

A question begins from a visit, report, recommendation, or concern. The portal
attaches that safe context so customers do not need internal identifiers and the
provider does not need to ask which service they mean.

### Decisions are not payments

Approving a recommendation authorizes the described scope only when the product
contract says so. The UI must explain whether approval schedules work, requests
scheduling, or creates a later estimate. V2 demonstrates approval and decline but
does not collect payment.

## Phase 0 — Contract and privacy foundation

### Required production contracts

- Customer visit summary: property, scheduled date, display arrival window,
  customer-visible service scope, service-day status, next update, preparation
  message, and weather/reschedule explanation.
- Customer conversation: customer-visible subject, message, optional safe
  attachment metadata, response expectation, lifecycle status, and provider
  response; no internal queue or assignment details.
- Customer concern: related delivered visit, category, description, optional
  evidence, received/under-review/visit-planned/resolved status, and safe outcome.
- Customer-visible proof preview: delivered status, service label, before/after
  evidence, completed care, and recommendation relationship.
- Customer preferences: consented channels by event, quiet hours, locale/time
  zone, and customer-authored access instructions with explicit crew visibility.
- Organization customer contact: provider display name, phone, email, support
  hours, and response expectation.

### Privacy corrections

- Remove raw `account.billingNotes` from shared customer reports.
- Never reuse provider property access notes as customer preparation copy.
- Keep provider notes, route/crew state, recovery records, internal identifiers,
  notification recipients, and staff quality decisions outside customer reads.
- Attach only delivered proof and explicitly customer-visible recommendation data
  to a conversation.

### Exit condition

Prototype language and handoff name every missing contract and never imply that
the design review stores or transmits customer information.

## Phase 1 — Live service-day confidence

### Customer journey

Confirmed → en route → arrived → care in progress → completed → proof pending →
proof delivered.

Weather delay and reschedule branch from confirmed or en route and must always
show the next provider update or new date.

### Working-design deliverables

- Service-day status rail inside the next-visit card and detail.
- En-route state with updated arrival window and next update.
- Arrived/in-progress state with preparation confirmation.
- Weather-delayed state with reason, safe expectation, and provider contact.
- Rescheduled state with old/new date explanation.
- Completed/proof-pending state that does not expose unpublished evidence.
- Preparation summary for gates, pets, vehicles, and irrigation.

### Acceptance

- Status does not expose live crew location, crew identities, route order, or
  internal schedule risk.
- Color is never the only status signal.
- A delayed customer knows what changed and when to expect the next update.
- A completed customer knows proof appears only after provider review/delivery.

## Phase 2 — Contextual communication and recovery

### Working-design deliverables

- “Ask about this visit” from Home and visit detail.
- Topic, message, optional safe photo attachment, response expectation, inline
  validation, simulated failure, recovery, and received state.
- “Report a concern” from delivered proof with service-area category and
  customer-visible evidence context.
- Concern lifecycle: received, under review, follow-up visit planned, resolved.
- Provider contact remains available when conversation persistence is unavailable.

### Acceptance

- The design explains that no prototype message or attachment is transmitted.
- A failure preserves the customer’s entries and allows retry.
- Success explains expected response timing and where status will appear.
- Customer copy never mentions tickets, queues, assignees, internal severity, or
  support tooling.

## Phase 3 — Proof, recommendation collaboration, and feedback

### Working-design deliverables

- Accessible before/after comparison with independent evidence fallback.
- Evidence labels by care area and time without requiring visual comparison.
- Recommendation entry from the related evidence and completed visit.
- Ask a recommendation question and request a scope change before deciding.
- Explanation of approval meaning, expiration, revised proposal, approved,
  declined, scheduled, and converted history.
- Post-proof feedback: “Everything looks good” or “Report a concern.”

### Acceptance

- Comparison has keyboard-operable controls and a nonvisual textual equivalent.
- Questions and scope-change requests do not silently approve or reject a bid.
- Revised scope invalidates the prior decision surface until a new customer-safe
  proposal is delivered.
- Feedback is tied to the delivered visit without revealing report/job IDs.

## Phase 4 — Customer preferences and access

### Working-design deliverables

- Event-level SMS/email controls for confirmed, en route, completed, and proposal
  notifications.
- Preferred channel and quiet-hours summary.
- Customer-authored access instructions with explicit “shared with your care
  provider” language.
- Gate, pet, parking/vehicle, and irrigation preparation fields.
- Unsaved, validation, simulated failure, saved, and externally changed states.

### Acceptance

- Consent changes are explicit and not inferred from a preferred channel.
- Critical transactional notices are distinguished from optional updates.
- Access content has length guidance, no secret-storage promise, and an emergency
  warning for unsafe/sensitive information.
- Save failure preserves entries and never claims the provider received them.

## Phase 5 — Billing and account · product-gated

### Gate before interactive high fidelity

Confirm:

- invoice ownership and immutable line-item source;
- payment processor, tokenization, and PCI responsibility;
- deposits, partial payments, refunds, credits, taxes, and failed-payment rules;
- recurring-service billing cadence;
- approved add-on to invoice relationship;
- statement and receipt retention;
- role and portfolio boundaries;
- production support and dispute workflow.

### Planned composition after the gate

- Balance due and next automatic charge, if applicable.
- Invoice/receipt history with status, service period, and downloadable document.
- Saved payment method summary without exposing sensitive account data.
- Clear relationship among recommendation approval, scheduled work, completed
  proof, invoice, and payment.

### Current V2 boundary

V2 may document and visually label the planned billing destination, but it does
not simulate payment entry, stored cards, invoice settlement, or financial
persistence until the contracts above are approved.

## Phase 6 — Validation and handoff

### Required browser coverage

- Desktop 1440 × 1000, tablet 768 × 1024, mobile 390 × 844, compact 320 × 720,
  and 200% text.
- Every service-day status and branch.
- Question validation, failure, retry, success, and focus return.
- Concern creation and recovery lifecycle.
- Evidence comparison by pointer and keyboard.
- Recommendation question/change request and decision independence.
- Preference/access validation, failure, retry, saved state, and unsaved warning.
- Minimum targets, overflow, H1, browser errors, reduced motion, and dialog focus.

### Handoff requirements

- Updated working prototype guide, state matrix, gallery references, manifest,
  project records, decision log, and production contract mapping.
- Current, new-design, and product-gated behavior visibly distinguished.

## Recommended production sequence

1. Privacy correction and customer visit read model.
2. Service-day status and preparation.
3. Delivered proof composition and concern recovery.
4. Contextual communication.
5. Recommendation collaboration.
6. Customer preferences and access instructions.
7. Billing only after the product gate.

This sequence prioritizes customer trust and contract safety while allowing each
slice to ship and be tested independently.
