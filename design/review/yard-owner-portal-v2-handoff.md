# Yard Owner Portal V2 Working-Design Handoff

Production adoption status: design ready with partial underlying customer-safe
report, bid, property, and portfolio contracts. Production still needs the
customer next-visit read model and connected Home/Visits/Proof/Account adoption;
billing is product-gated. See the
[`adoption tracker`](../../project-planning/PROTOTYPE_ADOPTION.md).

## Outcome

Yard Owner V2 is a validated service-lifecycle companion. It preserves the V1
confidence hierarchy—next service, delivered proof, and action needed—while
showing what changes on service day, giving customers contextual ways to ask for
help, making concern recovery visible, and letting customers control notification
and access information.

The working design is complete for design review. Production behavior remains
separately gated by the contracts in this handoff.

## Review package

- [Working prototype](../prototypes/yard-owner-portal/index.html)
- [Prototype behavior and boundaries](../prototypes/yard-owner-portal/README.md)
- [V2 phased enhancement plan](yard-owner-portal-v2-enhancement-plan.md)
- [V1 foundation and production audit](yard-owner-portal-handoff.md)
- [Desktop V2 reference](../high-fidelity/customer/yard-owner-portal-desktop-v2.png)
- [Mobile V2 reference](../high-fidelity/customer/yard-owner-portal-mobile-v2.png)
- [Repeatable browser validator](../tools/validate-yard-owner-portal.mjs)
- [Design decisions](decision-log.md)

The development server exposes the prototype at
`/design/prototypes/yard-owner-portal/` and the gallery at `/design/`.

## Delivered V2 design phases

### Phase 1 — Service-day confidence

- Confirmed, en-route, arrived/care-in-progress, weather-delay, rescheduled, and
  visit-complete/proof-pending modes use the same visit surface.
- A visible progress rail, current status text, timing, preparation expectation,
  and next update explain both what changed and what happens next.
- Rescheduling identifies the original date and confirmed replacement date.
- Completed service does not expose unpublished evidence while provider review is
  pending.
- Crew identity, location, route order, internal risk, and provider operations
  remain absent.

### Phase 2 — Contextual communication and concern recovery

- Customers can ask from Home or visit detail without copying an internal ID.
- The form carries safe visit context, topic, message, optional photo selection,
  response expectation, inline validation, failure recovery, and confirmation.
- Failed sends preserve entries and explicitly say that nothing was transmitted.
- Delivered proof can start a concern that progresses from received to follow-up
  planned to resolved in customer language.

### Phase 3 — Proof, recommendations, and feedback

- The latest proof includes a keyboard-operable before/after balance control plus
  textual care-area and checklist equivalents.
- Positive feedback is lightweight; a concern opens the recovery workflow.
- Customers can ask a bid question or request changed scope before deciding.
- A scope-change request remains independent and cannot silently approve or
  decline the recommendation.
- Accepted, declined, revision-requested, expired, and scheduled outcomes retain a
  customer-readable history and next expectation.

### Phase 4 — Preferences and access

- Account contains event-level controls for confirmed, en-route, completed, and
  recommendation updates, plus preferred channel and quiet hours.
- Access, pet, and vehicle guidance is customer-authored and explicitly described
  as visible to the care provider.
- The design warns against storing sensitive or emergency information.
- Unsaved, invalid, recoverable-failure, retry, and saved states preserve customer
  input and do not claim provider receipt before success.

### Phase 5 — Billing remains product-gated

Billing is intentionally not interactive. Before designing payment collection or
presenting it as available, the product must approve invoice ownership, immutable
line-item sources, processor/tokenization responsibility, deposits, partial
payments, credits, refunds, taxes, recurring cadence, payment failures, document
retention, portfolio permissions, disputes, and support ownership.

## State matrix

| Area | Reviewable states |
| --- | --- |
| Portal | Default, loading, unavailable |
| Schedule | Confirmed, en route, care in progress, weather delay, rescheduled, no scheduled service, visit complete/proof pending |
| Proof | Delivered, no delivered proof, expired shared link, comparison control, positive feedback |
| Question | Empty validation, ready, simulated send failure, preserved retry, received |
| Concern | Received, follow-up planned, resolved |
| Recommendation | Pending, confirmation, simulated write failure, approved, declined, revision requested, expired, scheduled |
| Preferences | Clean, unsaved, invalid shared access, simulated save failure, preserved retry, saved, changed elsewhere, explicit refresh |
| Property | Sonoran House, Backyard Garden |

## Production contract requirements

Customer portal authorization now follows the accepted
[hybrid authorization model](../../docs/customer-portal-authorization-model.md):
verified owners inherit properties through an account-scoped grant, while
delegates require explicit property grants. Persisted portal reads remain
blocked until that migration and fail-closed resolver are delivered.

| Design concept | Production requirement |
| --- | --- |
| Service-day visit | Customer-scoped property, display date/window, safe scope, lifecycle status, preparation, next update, delay reason, and reschedule dates. |
| Contextual question | Customer-visible visit/report/recommendation reference, subject, message, safe attachment metadata, delivery state, response expectation, and provider response. |
| Concern recovery | Delivered visit relationship, category, description, safe evidence, customer-visible status, follow-up expectation, and outcome. |
| Proof preview | Delivered publication state, evidence labels/times, completed care, preview authorization, and recommendation relationship. |
| Recommendation collaboration | Sent proposal version, expiration, scope, total, question/change-request state, independent decision state, and next milestone. |
| Preferences | Event-by-channel consent, preferred channel, quiet hours, time zone, change audit, and externally changed/conflict behavior. |
| Access guidance | Dedicated customer-authored field, explicit provider visibility, length/safety rules, audit, and no reuse of private provider notes. |
| Provider contact | Organization-owned display name, phone, email, hours, and response expectation. |

### Blocking privacy corrections

- Remove raw `account.billingNotes` from shared completion reports or replace it
  with a deliberately authored customer-visible contract.
- Never derive customer preparation or access guidance from raw provider property
  notes.
- Keep crew operations, routes, assignments, unpublished evidence, internal
  recovery records, staff decisions, internal identifiers, and notification
  recipients outside customer reads.

## Recommended production slices

1. Correct the shared-report privacy leak and add the customer-specific visit read
   model.
2. Adopt the four-destination shell, property context, and service-day lifecycle.
3. Recompose delivered proof and add customer-safe feedback/concern recovery.
4. Add contextual conversation persistence and provider response presentation.
5. Add recommendation questions, versioned scope changes, and decision history.
6. Add notification consent and dedicated customer-authored access preferences.
7. Design and implement billing only after its product gate is approved.

Each slice should ship with tenant/customer scoping, publication boundaries,
loading/empty/unavailable/write-failure behavior, keyboard/focus tests, responsive
coverage, and customer-copy review.

## Validation evidence

`validate-yard-owner-portal.mjs --capture` passes with:

- 1440 × 1000 desktop, 768 × 1024 tablet, 390 × 844 mobile, and 320 × 720 compact;
- all four destinations without horizontal overflow at 200% root text;
- portal-wide property switching and customer-facing content updates;
- every service-day branch and its customer explanation;
- question validation, one-shot failure, preserved content, retry, success, and
  focus return;
- keyboard proof comparison and textual evidence equivalents;
- concern received, follow-up, and resolved states;
- recommendation confirmation, failure/retry, scope-change independence, and
  approved/declined/expired/scheduled history;
- preference unsaved, failure, preserved retry, saved, externally changed,
  stale-save prevention, and explicit refresh states;
- minimum mobile targets on Home and Account, H1 count, overflow, modal focus,
  Escape behavior, and browser-error checks.

## Review decision

V2 is complete as a working design and ready for remote product review and phased
production adoption. Billing remains deliberately product-gated and is not an
approved delivered capability.
