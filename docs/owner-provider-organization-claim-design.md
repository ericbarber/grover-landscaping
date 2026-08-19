# Owner–Provider Organization Claim Design

## Objective

Connect a checked invitation recipient to one yard-care provider organization
without silently duplicating an existing company, revealing another company’s
private data, or granting opportunity-response authority as a side effect.

This contract follows recipient email control. It does not replace recipient
verification, provider eligibility, credential review, capability assignment,
or the owner’s later disclosure decision.

## Non-negotiable boundaries

- A checked recipient may see only their own active yard-care organization
  memberships.
- A possible duplicate never reveals organization members, identifiers,
  customers, service records, contact details, or the reason for the match.
- Display-name similarity is a duplicate-review signal—not proof of company
  identity or ownership.
- Claiming an existing organization requires an active relationship already
  visible to the authenticated recipient or an approved Provider Operations
  dispute workflow.
- A new organization is created only after an atomic duplicate rescan under a
  normalized-name lock.
- Organization relationship and opportunity-response capability are separate
  persisted facts. A successful claim alone cannot question, decline, express
  interest, request disclosure, price, propose, assign, or release work.
- Corrections and disputes create lifecycle events; they do not overwrite the
  original claim attempt.

## Claim paths

### Existing provider relationship

1. Require an active invitation recipient check for the authenticated account.
2. List only that account’s active memberships in active
   `yard_care_company` organizations.
3. The recipient selects one organization.
4. Recheck the membership and invitation server-side in one transaction.
5. Record `relationship_checked`; do not grant response capability.

### New provider organization

1. Recipient supplies a provider display name and affirms authority to begin
   provider setup.
2. Server normalizes whitespace and case into a claim fingerprint.
3. If a possible active organization match exists, record
   `duplicate_review` without returning the matching record.
4. If no match exists, record `bootstrap_ready`.
5. Final bootstrap takes an advisory lock on the fingerprint, repeats the match
   query, creates the organization and owner membership atomically, and records
   `claimed`.
6. A match discovered during final bootstrap returns to `duplicate_review`; no
   organization or membership is created.

### Dispute or correction

Provider Operations may move `duplicate_review` to `under_review`, `rejected`,
or `bootstrap_ready` under the approved evidence policy. Evidence content uses
a separately restricted reference. The public claim record stores only status,
reason code, assigned function, timestamps, and the minimum organization link
after approval.

An appeal never reopens invitation access or grants capability automatically.

## Provider Operations review contract

### Authorization and queue visibility

- Only an authenticated `support_admin` acting in the `provider_operations`
  function may list or mutate organization-claim reviews.
- The general queue contains claim identifier, proposed display name, claim
  kind, customer-safe status/reason, assigned function, version, created and
  updated times, and an age/SLA band.
- The queue never includes owner identity, property/address, yard photographs,
  access notes, recipient email, membership roster, customers, services, or a
  possible duplicate organization identifier.
- Candidate comparison and evidence use a separately authorized restricted
  record. General queue and audit responses carry only its opaque reference.

### Append-only review record

`owner_provider_organization_claim_review_events` records:

- review event, claim, authenticated support actor, and actor function;
- action: `review_started`, `cleared_for_bootstrap`, `rejected`,
  `dispute_paused`, `appeal_submitted`, or `appeal_decided`;
- prior and resulting status, controlled reason code, optional restricted
  evidence reference, expected claim version, and timestamp;
- actor-scoped idempotency key.

Evidence content and internal notes do not belong in this table. Corrections
append another event and increment the claim version; they never alter prior
events.

### Legal transitions

| Action | From | To | Required facts |
| --- | --- | --- | --- |
| Start review | `duplicate_review` | `under_review` | Provider Operations actor and current version |
| Clear distinct organization | `duplicate_review` or `under_review` | `bootstrap_ready` | `distinct_organization` reason and restricted evidence reference |
| Reject claim | `duplicate_review` or `under_review` | `rejected` | controlled rejection reason and restricted evidence reference |
| Pause linked relationship | `relationship_checked` or `claimed` | `disputed` | identity/safety reason and restricted evidence reference |
| Submit appeal | `rejected` | `under_review` | original checked recipient, active appeal category, and new restricted evidence reference |
| Decide appeal | `under_review` | `bootstrap_ready` or `rejected` | different support actor from the appellant, current version, reason, and evidence reference |

Clearing a claim does not create an organization. The recipient must invoke the
versioned atomic bootstrap again, which repeats the duplicate scan. Rejecting,
pausing, appealing, or deciding never grants response authority.

### Reason codes and customer wording

- Clear: `distinct_organization`.
- Reject: `existing_organization_relationship_required`,
  `authority_not_supported`, `identity_evidence_incomplete`, or
  `policy_ineligible`.
- Pause: `identity_dispute`, `unsafe_contact`, or `suspected_impersonation`.
- Appeal: `new_identity_evidence`, `relationship_correction`, or
  `decision_correction`.

Internal investigation labels are mapped to these stable customer-safe codes;
raw notes are never returned to the recipient.

### Aging and monitoring

- `duplicate_review` becomes due after one business day and overdue after two.
- `under_review` becomes due after two business days and overdue after three.
- `disputed` is immediately priority and remains so until disposition.
- Monitor queue depth, oldest age, transition failures, replay conflicts,
  evidence-reference failures, and overdue counts without recipient or owner
  identifiers in metric labels.
- Alert Provider Operations on overdue review growth and Trust & Safety on any
  unassigned `disputed` claim.

## Proposed persistence

`owner_provider_invitation_organization_claims`:

- claim, invitation, recipient-check, and authenticated actor identifiers;
- claim kind: `existing_relationship` or `new_organization`;
- proposed display name and normalized fingerprint;
- organization identifier only after an authorized existing relationship or
  completed bootstrap;
- status: `relationship_checked`, `bootstrap_ready`, `duplicate_review`,
  `under_review`, `claimed`, `rejected`, `disputed`, or `withdrawn`;
- authority affirmation timestamp for new setup;
- reason code, assigned function, evidence reference, version, and timestamps;
- actor-scoped idempotency key and one active claim per invitation.

No owner address, photographs, contact details, access considerations, other
organization facts, or duplicate candidate identifiers belong in this table or
its general audit events.

## API sequence

| Method and route | Capability |
| --- | --- |
| `POST /provider-invitations/organization-options` | Body-token read of the checked recipient’s own eligible memberships; no global directory search |
| `POST /provider-invitations/organization-claims` | Create an existing-relationship check or new-organization readiness assessment |
| `GET /provider-invitation-organization-claims/{claim_id}` | Read only the authenticated actor’s claim and customer-safe status |
| `POST /provider-invitation-organization-claims/{claim_id}/bootstrap` | Atomically rescan and create only a duplicate-clear new organization |
| Support-only dispute routes | Assign, disposition, and reference restricted evidence under audited Provider Operations authority |

All recipient routes require the checked recipient account, verified invited
mailbox, active opened invitation, and body-carried token. Token possession
alone is insufficient.

## Customer-safe status language

| State | Recipient wording |
| --- | --- |
| `relationship_checked` | “Your existing relationship with this provider is checked.” |
| `bootstrap_ready` | “This provider name is ready for final setup.” |
| `duplicate_review` | “This provider may already have an account. Provider Operations must review it before setup continues.” |
| `under_review` | “Provider Operations is reviewing the company relationship.” |
| `claimed` | “Provider setup is linked. Response permission is checked separately.” |
| `rejected` | “We could not approve this company relationship. Review the support decision or appeal.” |
| `disputed` | “The company relationship is paused while an identity concern is reviewed.” |
| `withdrawn` | “This claim attempt was withdrawn. No company relationship was created.” |

Avoid “verified company,” “approved contractor,” or claims about licensing,
insurance, quality, availability, or suitability unless a separate dated fact
supports the exact statement.

## Acceptance coverage

- Unchecked, wrong-mailbox, closed-link, and different-account requests fail
  closed.
- Existing options contain only the authenticated actor’s eligible memberships.
- Selecting another organization identifier returns not found without revealing
  whether it exists.
- Case and whitespace variants produce the same duplicate fingerprint.
- Concurrent same-name bootstrap attempts create at most one organization.
- A possible duplicate returns customer-safe review status and no candidate ID.
- Replayed requests do not create another claim, organization, or membership.
- Claim success leaves `opportunity_response_capability` false.
- Persistence outages never appear as no memberships, no duplicate, or success.
- General audit contains claim/status identifiers but no evidence, owner-private
  data, recipient email, or duplicate-candidate data.

## Delivery slices

1. **3B2a — claim assessment (delivered):** schema, own-membership options,
   existing relationship checks, duplicate-safe readiness, idempotency, and
   isolation.
2. **3B2b — atomic bootstrap (delivered):** fingerprint lock, final duplicate
   rescan, organization/membership creation, provenance, and concurrency tests.
3. **3B2c1 — dispute operations (delivered):** Provider Operations minimized
   queue, age bands, restricted evidence references, append-only review events,
   and controlled review/clear/reject/pause dispositions.
4. **3B2c2a — recipient appeal (delivered):** checked-recipient rejected-claim
   appeal with controlled category, restricted evidence, rejection linkage,
   versioning, replay, and minimized audit.
5. **3B2c2b — independent appeal decision (delivered):** original-rejector
   exclusion, bypass prevention, controlled approval/rejection, append-only
   linkage, and final duplicate-rescan preservation.
6. **3B2c2c — monitoring (delivered):** identifier-free aggregate SLA metrics,
   outage distinction, alert/escalation guidance, recovery, rollback, and live
   validation checklist.
7. **3B3 — response capability:** explicitly grant and enforce only the bounded
   opportunity-response actions after relationship checks.
