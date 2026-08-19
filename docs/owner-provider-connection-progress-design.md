# Owner and Provider Connection Progress Design

## Outcome

Phase 3C projects the delivered invitation, identity, organization, capability,
and bounded-response facts into two deliberately different read models. It does
not create a new authority, conversation, disclosure grant, assessment,
proposal, customer, job, or service relationship.

The owner model answers: **What happened with my invitation, and what can I
safely do next?** The provider model answers: **What step have I completed, and
is my limited response path still available?** Neither model exposes the other
party's private operational data.

## Design principles

- Derive progress from persisted facts; do not store a second mutable workflow
  status that can drift from invitation and response records.
- Scope owner reads by authenticated owner subject and property. Scope provider
  reads by authenticated checked recipient, verified invited mailbox, body
  token, and current relationship facts.
- Treat persistence outage as unavailable, never as an empty history or pending
  response.
- Return customer-safe labels and recovery codes. Raw provider capacity,
  internal notes, safety category, evidence, candidate organizations, recipient
  email, and security signals never enter the owner model.
- A progress read never restores or extends a response capability.
- Terminal history remains visible to the owning party as a safe receipt, but
  private invitation content and actions disappear from a provider whose
  authority is no longer effective.

## Owner connection-progress model

Route:

`GET /owner-properties/{property_id}/provider-connection-progress`

The route returns owner-scoped connections newest first. Each entry contains:

- invitation ID, provider display snapshot, invitation and delivery status;
- a stable `progress_stage` and customer-safe `status_label`;
- whether owner action is required and one controlled `next_action`;
- the latest bounded provider response kind when it is safe to disclose;
- a customer-safe response label; and
- invitation expiry plus response timestamp when present.

Owner stages and actions:

| Effective fact | `progress_stage` | Owner-safe meaning | `next_action` |
| --- | --- | --- | --- |
| Pending delivery | `sending` | Invitation is being sent | `wait` |
| Failed delivery | `delivery_failed` | Recipient did not receive access | `review_recipient` |
| Delivered | `awaiting_open` | Invitation delivered; no response yet | `wait_or_withdraw` |
| Opened, no response | `provider_reviewing` | Recipient is reviewing limited details | `wait_or_withdraw` |
| Preliminary question | `question_received` | Provider needs one named clarification category | `review_question` |
| Expressed interest | `disclosure_decision` | Provider requested the owner's next disclosure decision | `review_disclosure` |
| Declined | `declined` | Provider is not available for this request | `choose_another_provider` |
| Opted out or safety-reported | `contact_closed` | This recipient contact path is closed | `choose_another_provider` |
| Owner revoked | `withdrawn` | Owner withdrew this invitation | `start_new_invitation` |
| Expired | `expired` | Link expired without a completed response | `start_new_invitation` |

The owner may see `preliminary_question` with one mapped label such as “Does
this cadence fit your service?” The owner may see `express_interest`. A decline
code maps to the general label “Not available for this request”; raw capacity or
fit codes are provider-private. A report is never identified as a report and
its category, severity, case ID, and evidence are never exposed.

`owner_action_required` is true only for `delivery_failed`,
`question_received`, and `disclosure_decision`. It does not imply that the
provider was selected or that the owner has granted additional data.

## Provider progress model

Route:

`POST /provider-invitations/progress`

The body carries the invitation token. Effective authorization is rechecked on
every read. Before a response, the model may return the completed gates and
`respond_to_limited_request`. After a question or interest, it may return the
actor's own response kind, controlled response label, recorded time, and
`wait_for_owner`. It must not reveal owner disclosure choices until a separate
Phase 3D grant exists.

After decline, the provider receives a status-only confirmation that this
invitation is closed. After report, the reporter may receive only that contact
was blocked and the safety item was routed; no case evidence or internal
disposition is returned here. Expired, revoked, inactive-relationship, or
inactive-membership reads remain status-only and provide a controlled recovery
action.

## Ordering and precedence

Projection uses this precedence so concurrent or terminal facts cannot produce
misleading UI:

1. owner revocation, recipient opt-out/safety closure, decline, or expiry;
2. failed delivery;
3. latest bounded response (`express_interest` before
   `preliminary_question` when both exist);
4. opened/provider reviewing;
5. delivered/awaiting open;
6. pending delivery.

The projection reads response rows and invitation state in one database
snapshot. It never infers delivery, response, or owner action from elapsed time.

## Accessibility and wording contract

- Status text is complete without color or icon meaning.
- “Interested” is always qualified as “Interested in reviewing the next
  owner-approved details,” never “accepted,” “matched,” “won,” or “assigned.”
- “Question” names the controlled topic; it does not imply an open conversation
  channel.
- “Declined” is neutral and never exposes provider-private capacity detail.
- “Contact closed” does not disclose that a safety report exists.
- Every retry or next action states whether it creates a new invitation or
  continues the current one.

## Delivery slices

1. **3C0 — contract (delivered):** state precedence, visibility matrix,
   customer-safe wording, recovery actions, and acceptance criteria.
2. **3C1 — owner projection:** owner/property-scoped collection, safe response
   mapping, outage distinction, API, and persistence coverage.
3. **3C2 — provider projection:** checked-recipient body-token progress,
   status-only closure, own-response confirmation, API, and persistence
   coverage.
4. **3C3 — interface adoption:** connect the production Yard Owner and provider
   acquisition surfaces to these models with loading, empty, unavailable,
   stale-tab, narrow-screen, zoom, and assistive-technology validation.

## Acceptance criteria

- Cross-owner and cross-property reads return no connection data.
- Wrong provider actor, mailbox, or token returns no provider progress.
- Owner entries never contain recipient email, organization membership,
  capability identifiers, report category/case, raw decline code, owner-private
  address/media/access notes, or competitors.
- Provider status-only closure contains no owner, organization, yard, response
  action, or withheld-category data beyond the fixed recovery boundary.
- Question and interest do not create grants; decline does not suppress future
  invitations; report remains durably suppressed.
- Empty collection and unavailable storage are distinct.
- Projection order and labels remain deterministic across replay and stale-tab
  scenarios.
