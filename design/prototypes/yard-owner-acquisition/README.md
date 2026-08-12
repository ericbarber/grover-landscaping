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
2. Create an illustrative owner profile.
3. Add and confirm a private service address and authority statement.
4. Describe yard areas, care goals, cadence, and constraints in plain language.
5. Add, remove, process, and skip optional guided yard photographs.
6. Review the complete yard brief before sharing.
7. Invite an existing provider, finish later, or browse curated providers.
8. Review the provider-side request and explicit identity/access handoff.
9. Approve provider-specific information for assessment.
10. Select an assessment window and ask a contextual question.
11. Compare proposals by scope, exclusions, cadence, policies, and price.
12. Ask for clarification or a revision without making a decision.
13. Confirm proposal acceptance, inspect write failure/retry, and enter provider
    setup without silently scheduling service.
14. Confirm the first visit and continue to the Yard Owner V2 portal.
15. Review active-provider access, revoke future photo access, change/end care,
    and request export or unused-intake deletion.

## Review journey

Use **Review journey** in the prototype banner to jump to every stage, including
the provider-side preview and protected unavailable state. The review controls
can also make the next provider invitation or proposal decision fail once.

The prototype includes these major states:

| Area | Reviewable behavior |
| --- | --- |
| Owner identity | Empty/invalid, valid, consented, private draft |
| Address | Unconfirmed, coarse location confirmed, authority missing, valid |
| Yard brief | Areas, goal, cadence, constraints, “not sure” path |
| Photos | Zero-photo completion, add/remove, processing result, metadata notice |
| Sharing | Private summary, per-provider disclosure, no-provider finish-later |
| Invitation | Invalid, unconfirmed, simulated failure, preserved retry, delivered, revoked |
| Provider response | Identity gate, interested, declined, assessment-only meaning |
| Directory | Match reasons, trust fact precision, shortlist, provider detail, bounded requests |
| Assessment | Time selection, question, confirmation, no-service boundary |
| Proposal | Scope comparison, detail, question/change request, decline, confirm, failure/retry, accepted snapshot |
| Activation | Accepted but unscheduled, provider setup, first visit confirmed |
| Relationship | Current access, photo revoke, provider change/end, export, deletion |
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
- Customer status always uses text and structure, not color alone.
- Mobile controls target at least 44 by 44 CSS pixels.
- Content reflows without horizontal scrolling at compact mobile and 200% text.
- Reduced-motion preference removes nonessential movement.

## Validation

From an environment with frontend dependencies installed:

```bash
node design/tools/validate-yard-owner-acquisition.mjs
```

Pass `--capture` to refresh the desktop and mobile gallery references.
