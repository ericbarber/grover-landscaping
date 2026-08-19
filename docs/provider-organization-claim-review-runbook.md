# Provider Organization Claim Review Runbook

## Purpose and authority

This runbook operates the minimized provider-organization claim queue. Only an
authenticated `support_admin` assigned to Provider Operations may use the queue,
metrics, or decision routes. Evidence systems require their own restricted
authorization. Queue access does not grant customer, property, photograph,
membership-roster, proposal, pricing, or opportunity-response access.

## Queue service levels

| State | Due | Overdue | Handling |
| --- | --- | --- | --- |
| `duplicate_review` | 1 business day | 2 business days | Compare restricted identity evidence; never disclose the candidate |
| `under_review` | 2 business days | 3 business days | Confirm evidence availability and reviewer ownership |
| `disputed` | Immediately | Always priority | Assign Provider Operations and notify Trust & Safety when identity or unsafe-contact facts apply |

The aggregate metrics endpoint returns counts and oldest age only. Never add
claim, user, organization, email, property, or evidence identifiers to metric or
alert labels.

## Start-of-shift procedure

1. Check queue availability and aggregate metrics.
2. Acknowledge every `disputed` item and all overdue work.
3. Start review with the current claim version; a conflict means reload first.
4. Open evidence only through the restricted reference and approved evidence
   system. Do not copy evidence into queue fields, tickets, chat, or general
   audit.
5. Use only controlled reasons and legal transitions.

## Decisions

- Clear only with `distinct_organization` and evidence supporting that narrow
  fact. The recipient must still run final atomic bootstrap and duplicate rescan.
- Reject only with the approved customer-safe reason supported by evidence.
- Pause a linked relationship for identity dispute, unsafe contact, or suspected
  impersonation. Escalate the latter two to Trust & Safety.
- For an appeal, the original rejecting reviewer must not decide it. Ordinary
  clear/reject actions are not substitutes for appeal approval/rejection.
- No review or appeal decision grants opportunity-response capability.

## Alerts and response

- Alert Provider Operations when `overdue_count > 0`, oldest age increases for
  two checks, or queue depth grows for three checks.
- Page the on-call function when the queue or metrics endpoint is unavailable
  for two consecutive checks. Treat unavailable as unknown—not zero.
- Notify Trust & Safety immediately for any unassigned `disputed` claim.
- On repeated version conflicts, stop retrying and inspect concurrent review
  ownership. Never force an update around optimistic concurrency.

## Recovery and rollback

- Idempotently replay the same decision key after an ambiguous response.
- If persistence is unavailable, record no manual success and do not create an
  organization outside atomic bootstrap.
- A mistaken decision is corrected by a new authorized lifecycle event; never
  edit or delete review history.
- Disable the affected decision route if evidence authorization or separation
  of duties cannot be enforced. Keep read-only minimized status available when
  safe.

## Validation evidence

Before pilot launch, record dated evidence for queue authorization, restricted
evidence access, appeal separation, overdue alerts, outage behavior, replay,
version conflict, audit minimization, and on-call ownership. Product tests prove
the software contract; operational owners must separately sign the live alert
and evidence-system checks.
