# Owner–Provider Opportunity Response Capability Design

## Objective

Allow the checked recipient of a known-provider invitation to perform a small,
auditable set of pre-disclosure responses on behalf of the linked yard-care
organization without granting proposal, pricing, scheduling, work-release, or
private-property access.

The capability is a persisted authorization fact. It is not inferred from email
control, organization membership, organization creation, claim status, or token
possession alone.

## Issuance prerequisites

The server may issue one active capability only when all of these facts are true
in one transaction:

- the invitation is `opened`, unexpired, and still scoped to the immutable yard
  brief version and limited disclosure snapshot;
- the authenticated account controls the invited verified mailbox and owns the
  persisted recipient check;
- the provider organization is active and linked by either an active checked
  membership claim or a completed new-organization claim;
- the authenticated account has an active membership in that exact active
  `yard_care_company` organization;
- the claim is neither disputed, rejected, withdrawn, nor under review;
- the recipient explicitly acknowledges that exact address, photographs, owner
  contact, access considerations, and all ungranted categories remain private;
- no prior active capability exists for the invitation.

Issuance is recipient-requested but server-authorized. The original owner
invitation supplies the bounded purpose; the recipient cannot expand it.

## Capability scope

The immutable capability records:

- capability, invitation, recipient-check, claim, organization, actor, owner,
  property, brief, and brief-version identifiers;
- purpose `known_provider_yard_assessment_response`;
- allowed actions: `preliminary_question`, `express_interest`, `decline`, and
  `report`;
- explicitly withheld categories and acknowledgement timestamp;
- status, expiry, version, issuance provenance, idempotency, and timestamps.

The capability response exposes only the identifiers needed by the actor,
allowed actions, status/expiry, and withheld categories. It does not expose the
owner user identifier or private property fields.

## Allowed actions

### Preliminary question

A short controlled question about service fit, coarse service area, cadence, or
assessment method. No free-form request for address, contact details, gate
codes, photographs, pricing commitment, or sensitive household facts.

### Express interest

Records willingness to continue to owner-controlled disclosure and assessment.
It is not acceptance, a quote, a proposal, a scheduled visit, assignment, or
work authorization.

### Decline

Closes the provider response path for this organization and invitation using a
controlled reason. It does not suppress future invitations unless the recipient
separately opts out.

### Report

Routes suspicious or unsafe contact through the established restricted safety
boundary. It does not copy evidence or descriptions into general response
audit.

## Withheld data

Until an owner creates a later provider-specific disclosure grant, the inbox and
all response actions withhold:

- exact address and precise map location;
- yard and property photographs;
- owner email, phone, and direct-contact channel;
- access instructions, gate information, pets, occupancy, and security facts;
- provider-private competitor activity;
- pricing expectations, proposal authority, schedule commitment, contract,
  work order, crew assignment, route, or job.

## Lifecycle and revocation

Statuses are `active`, `declined`, `revoked`, `expired`, `suspended`, and
`superseded`.

The server fails closed and reconciles an active capability when the invitation
is revoked, opted out, declined, expired, or otherwise terminal; the claim or
organization becomes disputed, suspended, archived, or no longer linked; the
actor loses active membership; the recipient binding changes; or the immutable
brief/invitation scope is superseded.

Capability expiry cannot exceed invitation expiry. Reissue creates a new token
and capability lifecycle; it never silently revives the prior authorization.

## API sequence

| Method and route | Capability |
| --- | --- |
| `POST /provider-invitation-organization-claims/{claim_id}/response-capabilities` | Evaluate every prerequisite and issue/replay the bounded capability |
| `POST /provider-invitations/inbox` | Body-token read of the actor's authorized limited opportunity entry |
| `POST /provider-opportunity-responses` | Write one allowed bounded response under capability/version checks |
| Owner/provider progress routes | Read customer-safe delivery, response, and recovery state without competitor disclosure |

All provider routes require authenticated actor, verified invited mailbox,
body-carried token, recipient binding, organization relationship, capability,
and current lifecycle checks. Capability identifiers are not bearer tokens.

## Acceptance coverage

- Email control without organization relationship cannot issue capability.
- Organization relationship without the checked recipient/token cannot issue it.
- Existing and newly bootstrapped organization paths recheck active membership.
- Issuance replay creates one capability and leaves the allowed action set fixed.
- The response never contains owner identity, exact address, photos, access
  considerations, or proposal/work authority.
- Closed invitation, disputed claim, inactive organization/membership, expiry,
  wrong actor/mailbox, and outage all fail closed.
- Concurrent issuance creates at most one active capability.
- Every allowed action is enforced server-side; unknown or higher-authority
  actions are rejected even if submitted directly.
- General audit records authorization and action identifiers without question
  content, report evidence, recipient email, or private owner data.

## Delivery slices

1. **3B3a — capability issuance (delivered):** schema, prerequisite transaction,
   acknowledgement, idempotency, expiry, isolation, reconciliation flags, and
   outage/concurrency coverage.
2. **3B3b — provider inbox (delivered):** limited authorized entry, progress/recovery states,
   withheld-category clarity, and responsive production UI.
3. **3B3c — bounded actions:** preliminary question, interest, decline, report,
   controlled content, idempotency, lifecycle closure, and minimized audit.
