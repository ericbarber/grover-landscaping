# Yard Owner Acquisition Pilot Operations Runbook

## Purpose and status

This runbook defines the operating design required before a known-provider Yard
Owner acquisition pilot can open. It is an approval contract, not evidence that
the services, staffing, monitoring, or response targets exist today.

Repository status: design complete. Verified-recipient opt-out and minimized
block/report intake are implemented. The minimized monitoring contract,
machine-checked runbook mappings, and synthetic rehearsal are repository-
validated; live Trust & Safety operations, named staffing, evidence controls,
approved retention, monitoring integrations, and approval remain pending.

Operational status: proposed and unsigned. Product Operations, Trust & Safety,
Privacy/Security, Support, and Engineering must assign accountable people and
approve achievable service levels before production launch.

## Operating principles

- Fail closed whenever recipient identity, provider relationship, action
  authority, grant validity, or support state is uncertain.
- Never expose owner-private categories to troubleshoot delivery or identity.
- Keep provider-internal capacity, security signals, decline reasons, and staff
  notes out of owner-facing responses.
- Preserve immutable invitation and disclosure receipts; corrections create new
  records.
- Separate ordinary delivery help, provider identity disputes, unwanted contact,
  immediate safety concerns, access revocation, and legal/privacy requests.
- Do not promise emergency response. Direct immediate danger to local emergency
  services using approved jurisdiction-neutral wording.

## Responsibility model

| Function | Accountable for | Must not access by default |
| --- | --- | --- |
| Customer Support | Delivery correction, expiry explanation, owner/provider status, ordinary navigation | Unnecessary exact address, photos, access notes, security signals |
| Provider Operations | Organization claim, duplicate review, relationship correction, capability assignment | Owner data beyond the disputed invitation boundary |
| Trust & Safety | Spam, harassment, impersonation, suspicious contact, blocking, evidence preservation | Proposal pricing and ordinary provider-private operations unless relevant |
| Privacy/Security | Unauthorized disclosure, access-grant defects, export/deletion/retention, security incident coordination | Routine customer content unrelated to the case |
| Engineering on-call | Availability, delivery pipeline, authorization, audit, notification, and erasure failures | Manual business decisions or identity approval |
| Product Operations | Pilot policy, region/provider eligibility, service levels, training, reporting, go/no-go | Case content not needed for aggregate operations |

Named primary and backup owners must replace each functional placeholder before
pilot approval.

## Severity and proposed response objectives

These are proposed design targets and require staffing approval.

| Severity | Example | Acknowledge target | Containment/next-update target |
| --- | --- | --- | --- |
| S0 | Confirmed cross-owner/provider data exposure, active account takeover, unsafe access instruction exposed | 15 minutes, 24/7 only if an on-call program is approved | Immediate containment; updates at least hourly |
| S1 | Credible impersonation, harassment, failed revoke, authorization ambiguity, repeated opt-out contact | 1 staffed hour | Contain or fail closed within 4 staffed hours |
| S2 | Invitation bounce, expiry, wrong recipient, duplicate provider claim, notification delay | 1 business day | Action plan within 2 business days |
| S3 | Wording question, nonblocking navigation issue, receipt-download help | 2 business days | Resolution or backlog disposition within 5 business days |

If staffing cannot meet a target, revise the public/support promise before pilot
launch. Do not publish aspirational response language.

## Case intake minimum

Capture only:

- case identifier and authenticated reporter identifier;
- invitation, provider organization, request, or receipt identifier as relevant;
- issue category and customer-safe description;
- delivery/status events already authorized for the support role;
- affected data categories, never raw content unless necessary;
- block/revoke state, timestamps, assigned function, severity, and disposition;
- separately controlled evidence reference when Trust & Safety requires content.

Never ask for passwords, one-time codes, alarm codes, complete payment details,
or unrelated customer/provider records.

## Delivery and recipient recovery

### Bounced or failed invitation

1. Confirm the authenticated owner and invitation identifier.
2. Read only delivery status and masked recipient address.
3. Confirm no recipient access occurred.
4. Let the owner correct the address through a new invitation review.
5. Preserve the failed invitation receipt; do not mutate it to delivered.
6. Rate-limit resend and surface provider-level suppression or opt-out.

### Expired invitation

1. Confirm the link is closed server-side.
2. Explain that it cannot be reopened.
3. Require a new recipient/disclosure review.
4. Preserve the expired event and prior limited-data snapshot.

### Wrong recipient

1. Revoke the open link immediately if still active.
2. Confirm no additional owner categories were disclosed.
3. Block resend to the wrong address where appropriate.
4. Create a new reviewed invitation for the corrected recipient.
5. Escalate suspicious forwarding or repeated wrong-recipient activity to Trust
   & Safety.

## Provider organization claim and dispute

1. Pause invitation response and all new disclosure access.
2. Do not reveal existing organization members, private identifiers, customers,
   or evidence to the claimant.
3. Compare approved organization evidence under the provider-claim policy.
4. Route likely duplicates to Provider Operations; do not create silently.
5. Record supplied, checked, corrected, rejected, and appeal states separately.
6. Restore only the minimum opportunity-response capability after approval.
7. Notify the owner with a customer-safe status, not internal security evidence.

## Opt-out, block, and abuse

### Recipient opt-out

- Close active invitation links for the opted-out address.
- Suppress automatic and manual resend to that recipient under the approved
  suppression scope.
- Retain the minimum suppression proof required to honor the preference.
- Do not use opt-out as a negative provider ranking signal.

### Owner/provider block

- Require explicit confirmation.
- End future request/contact capability between the scoped parties.
- Do not erase historical receipts or accepted/delivered records automatically.
- Explain which future access ended and which records remain.

### Harassment, impersonation, or suspicious contact

1. Block the scoped contact path and fail closed on pending grants.
2. Preserve minimum authorized evidence with restricted access and retention.
3. Assign severity based on credible harm, exposure, and ongoing access.
4. Avoid sharing reporter location or contact information with the reported
   party.
5. Provide an appeal path that does not reopen access automatically.

## Access-grant and receipt recovery

### Owner reports incorrect disclosure

1. End future provider access to the disputed categories immediately.
2. Preserve the original receipt and create a revocation event.
3. Determine whether the receipt, policy version, actor, provider, property,
   purpose, and category set match server audit events.
4. If any category was accessible without a valid grant, escalate as S0/S1 under
   the approved incident policy.
5. Never claim previously accessed information was unseen or erased.

### Revocation job fails

1. Present access as uncertain/unavailable, never successfully revoked.
2. Deny provider reads while recovery is pending.
3. Retry idempotently and alert Engineering on-call.
4. Reconcile grant, read model, cache, media authorization, and audit records.
5. Notify the owner when containment and durable completion are confirmed.

## Session and authorization recovery

- On session expiry, preserve local/private draft inputs only under the approved
  client-storage policy and submit no queued decision automatically.
- After sign-in, reload authoritative server state before enabling decisions.
- A changed account, organization, or capability requires a fresh authorization
  evaluation.
- Duplicated tabs must detect stale versions and prevent double invitation,
  disclosure, proposal, or revocation decisions.
- Authentication and authorization outages must appear unavailable, not empty or
  successful.

## Monitoring and alerts

Minimum pilot dashboards and alerts:

- invitation queued/delivered/failed/expired/opened-if-lawful/declined/opted-out/revoked counts;
- resend rate-limit and suppression enforcement;
- provider claim duplicates, disputes, rejection, appeal, and aging;
- authorization denials and unexpected cross-scope access attempts;
- grant creation/revocation/read-model reconciliation failures;
- provider reads after revoke request;
- question, interest, decline, report, and block write failures;
- support volume, severity, aging, reopen rate, and handoff rate;
- notification retry/backlog and dead-letter age;
- export/deletion/retention workflow failures;
- P0/P1 design or production defects by pilot cohort.

Monitoring must use minimized identifiers and approved retention. Product
analytics cannot contain exact addresses, photographs, access notes, message
content, or security evidence.

The controlled metric names, labels, alert mappings, and synthetic scenarios are
defined in
[`yard-owner-acquisition-pilot-assurance.json`](yard-owner-acquisition-pilot-assurance.json)
and explained in
[`yard-owner-acquisition-pilot-monitoring-contract.md`](yard-owner-acquisition-pilot-monitoring-contract.md).
Repository validation proves those mechanics only. Live dashboards, pager
routing, traffic-calibrated thresholds, and staffed response remain external
launch blockers.

## Pilot go/no-go checklist

- [ ] Named primary and backup for every responsibility function
- [ ] Approved staffed hours and honest public support language
- [ ] Incident, privacy, identity-appeal, abuse, opt-out, retention, and evidence policies
- [ ] Recipient-specific expiring/revocable token threat review
- [ ] Server-enforced provider organization and capability authorization
- [ ] Versioned grants, receipts, revocation, and read-model reconciliation
- [ ] Delivery provider status mapping, suppression, retry, and dead-letter runbook
- [ ] Support role access tests and audited break-glass procedure
- [ ] Cross-owner/provider isolation and stale-tab/idempotency tests
- [ ] Human usability, physical-device, and assistive-technology evidence
- [ ] Regional/provider pilot cohort and rollback criteria
- [ ] Monitoring dashboards and tested S0/S1 alerts
- [ ] Launch rehearsal covering bounce, expiry, wrong recipient, impersonation,
      unintended disclosure report, failed revoke, and system outage

Any unchecked authorization, disclosure, revocation, abuse, or incident-control
item blocks pilot launch.

## Case evidence template

```text
Case ID:
Opened / last updated / timezone:
Authenticated reporter scope:
Invitation / provider / request / receipt identifier:
Category and severity:
Affected data categories (names only):
Current link/grant/block state:
Containment action:
Assigned function and owner:
Customer-safe update sent:
Audit/evidence reference:
Next update due:
Final disposition:
Policy/runbook changes required:
```
