# Yard Owner Acquisition Working Design

This dependency-free prototype demonstrates how a person can create a private
yard in Grover before having a service provider, then connect an existing company
or request assessment from suitable provider organizations.

Open [`index.html`](index.html) directly, from the design gallery, or from the
development server at:

```text
http://<vpn-ip>:5173/design/prototypes/yard-owner-acquisition/
```

## Complete journey

1. Enter from a private-first Yard Owner invitation.
2. Create an illustrative owner profile and affirm its private starting state.
3. Verify the owner email with an accessible six-digit-code and resend flow.
4. Add and confirm a private service address and authority statement; editing the
   location invalidates a stale confirmation.
5. Describe yard areas, care goals, cadence, and constraints in plain language,
   including “not sure” and provider-recommendation paths.
6. Add, remove, process, or continue without optional guided yard photographs.
7. Review the complete yard brief before sharing.
8. Invite an existing provider, finish later, or browse and filter suitable
   providers without revealing the exact address.
9. Track delivered, opened, failed, expired, declined, opted-out, and revoked
   invitation outcomes, each with a protected recovery path.
10. Enter through the recipient-specific provider invitation, choose an existing
    provider or claim/bootstrap one, and confirm limited opportunity authority.
11. Ask a preliminary question, express interest, safely decline, or report the
    request without widening access.
12. Choose and affirm provider-specific assessment information with no category
    selected by default, then inspect the immutable access receipt.
13. Select an assessment window and ask a contextual question.
14. Compare neutral proposals by scope, exclusions, cadence, policies, and
    annualized cost—not provider ranking.
15. Ask for clarification or a revision without making a decision.
16. Confirm proposal acceptance, inspect write failure/retry, and enter provider
    setup without silently scheduling service.
17. Confirm the first visit and continue to the Yard Owner V2 portal.
18. Review active-provider access, confirm future photo-access revocation,
    change/end care, and request export or unused-intake deletion.

## Review journey

Use **Review journey** in the prototype banner to jump to every stage, including
the provider-side preview and protected unavailable state. The review controls
can also make the next provider invitation or proposal decision fail once.

The prototype includes these major states:

| Area | Reviewable behavior |
| --- | --- |
| Owner identity | Empty/invalid, affirmative privacy consent, phone/channel dependency, valid, private draft |
| Email verification | Invalid code, resend, change email, successful confirmation |
| Address | Unconfirmed, coarse location confirmed, authority missing, valid |
| Yard brief | Areas, goal, cadence, constraints, “not sure” path |
| Photos | Zero-photo completion, add/remove, processing result, metadata notice |
| Sharing | Private summary, per-provider disclosure, no-provider finish-later |
| Invitation | Invalid, unconfirmed, simulated failure, preserved retry, delivered, opened, failed, expired, declined, opted out, revoked |
| Connection support | Delivery correction, identity dispute, safety report/block, withdrawal and access controls |
| Provider entry | Recipient-specific limited request, existing sign-in, organization claim/bootstrap, opt-out, abuse report |
| Provider authority | Separate email, organization relationship, and opportunity-response capability checks |
| Provider response | Preliminary question, interested, customer-safe decline, report/block, assessment-only meaning |
| Disclosure receipt | All categories initially unselected, explicit affirmation, approved/withheld snapshot, download, confirmed future revoke |
| Directory | Functional filters, no results, fit reasons, precise trust facts, shortlist, provider detail, bounded requests |
| Assessment | Time selection, question, confirmation, no-service boundary |
| Proposal | Scope comparison, detail, question/change request, decline, confirm, failure/retry, accepted snapshot |
| Activation | Accepted but unscheduled, provider setup, first visit confirmed |
| Relationship | Current access, confirmed photo revoke, confirmed provider end/change, export, confirmed deletion |
| Global | Saved private draft, unavailable/retry, responsive and 200% text |

## Product boundaries

- Every identity, address, provider, trust fact, photo-like illustration,
  assessment, proposal, price, and date is illustrative.
- No account, address, photo, invitation, message, assessment, proposal,
  relationship, notification, export, or deletion request is persisted or sent.
- Owners choose provider organizations. Provider crew assignments remain private
  provider operations.
- The owner creates a yard brief, not a professional diagnosis, quote, contract,
  operational service plan, or schedule.
- Identity and insurance labels demonstrate precise trust language but do not
  represent real verification.
- Recipient email verification, provider-organization relationship, and action
  authority are separate checks; none implies licensure, insurance, quality, or
  authorization to price, propose, assign crews, or release work.
- No AI diagnosis/training, instant booking, payment, marketplace fee, ranking,
  review score, sponsorship, or guaranteed availability is simulated.
- Production implementation requires the contracts in
  [`../../review/yard-owner-entry-provider-connection-plan.md`](../../review/yard-owner-entry-provider-connection-plan.md).

## Accessibility behavior

- One persistent H1 identifies the active stage.
- Semantic forms, fieldsets, labels, lists, articles, status regions, and dialogs.
- Visible focus, native keyboard controls, Escape close, and focus restoration.
- Inline validation associates errors with the affected decision and preserves
  input after simulated failures.
- Visible milestone progress exposes `aria-current="step"`; stage changes move
  focus to the persistent H1 and use a polite live announcement.
- Privacy acknowledgment and sensitive provider disclosures require affirmative
  selection instead of relying on preselected consent.
- Customer status always uses text and structure, not color alone.
- Mobile controls target at least 44 by 44 CSS pixels.
- Content reflows without horizontal scrolling at compact mobile and 200% text.
- Reduced-motion preference removes nonessential movement.

## Validation

From an environment with frontend dependencies installed:

```bash
node design/tools/validate-yard-owner-acquisition.mjs
```

Pass `--capture` to refresh the desktop and mobile gallery references. The
validator covers the connected known-provider and directory paths, email
verification, stale-address recovery, functional directory filters and no-result
guidance, neutral proposal language, affirmative consent defaults, destructive
confirmation, every invitation terminal state, recipient entry, provider claim,
provider-specific access receipts, programmatic control names and error
associations, semantic progress, focus behavior, compact touch targets, 200%
text, and overflow.

The completed connection contract is recorded in
[`../../review/yard-owner-known-provider-connection-handoff.md`](../../review/yard-owner-known-provider-connection-handoff.md).
