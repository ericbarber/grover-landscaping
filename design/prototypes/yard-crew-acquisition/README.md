# Yard Crew Acquisition Working Design

This dependency-free prototype explores how working yard-care professionals
discover Grover, choose the correct provider or invitation path, establish
readiness, review owner-approved opportunities, assess a yard, author scope, and
hand accepted work into provider operations.

Open [`index.html`](index.html) from the design gallery or at:

```text
http://<vpn-ip>:5173/design/prototypes/yard-crew-acquisition/
```

## Review journey

1. Review the evidence-based Yard Crew marketing promise.
2. Compare owner-operator, multi-crew company, and invited-worker paths.
3. Build an illustrative provider organization.
4. Configure services, territory, response, and precise readiness facts.
5. Search and filter owner-approved opportunities.
6. Recover no-result, unavailable, and paused-request states.
7. Review a disclosure-limited opportunity and request assessment access.
8. Simulate an interest write failure, retry, and owner-approved disclosure.
9. Review the yard remotely and select an on-site assessment when needed.
10. Send a provider-authored proposal and inspect owner question, revision, and
    acceptance states.
11. Keep accepted scope distinct from internal crew assignment and first-visit
    confirmation.
12. Review contextual provider setup, opportunity, safety, field, access, and
    data support.
13. Inspect the invited crew-lead least-privilege path.

Use **Review journey** to jump directly to each stage, change provider path, set
opportunities to suitable, empty, unavailable, or paused, and make the next
interest request fail once.

## Product boundaries

- “Yard Crew” is the marketing audience, not a public marketplace account type.
- A solo owner-operator receives a provider organization of one.
- Established companies use a provider organization with authorized roles.
- Crew leads and members join existing providers by invitation and do not become
  independently searchable work inventory.
- Yard owners select provider organizations; providers assign internal crews.
- Opportunity previews omit exact address, owner contact, photos, access notes,
  competitors, rank, budget, and guaranteed job value.
- Interest requests assessment access. It is not owner selection, work
  acceptance, assignment, scheduling, or service activation.
- Yard photos and owner answers do not establish measurement, diagnosis, safety,
  price, or treatment instructions.
- Every business, trust fact, opportunity, yard, price, date, and outcome is
  illustrative. Nothing is persisted or sent.
- The prototype does not simulate background checks, legal eligibility,
  insurance/license verification, payment, payouts, lead fees, rankings,
  reviews, earnings, exclusive territories, or guaranteed work.

## Accessibility behavior

- One persistent stage H1 receives focus after stage changes.
- Semantic forms, fieldsets, native controls, lists, tables, articles, dialogs,
  and live announcements expose structure and state.
- Provider path, assessment, consent, and destructive actions do not rely on
  color alone.
- Failure states preserve user input and expose an alert before retry.
- Dialogs use native focus containment and Escape behavior.
- Mobile actions target at least 44 by 44 CSS pixels.
- Layout reflows at compact mobile and text zoom without horizontal scrolling.
- Reduced-motion preferences remove nonessential movement.

## Design contract

Review the phased product and trust model in
[`../../review/yard-crew-acquisition-plan.md`](../../review/yard-crew-acquisition-plan.md).
The later production handoff must resolve the product gates recorded there
before opportunity discovery or verification language ships.
