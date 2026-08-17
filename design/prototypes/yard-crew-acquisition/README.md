# Yard Crew Acquisition Working Design

This dependency-free prototype explores how landscape service professionals
discover Grover, choose the correct provider or invitation path, establish
qualification, review owner-authorized service opportunities, complete a site
assessment, issue a service proposal, and mobilize approved work into provider
operations.

Open [`index.html`](index.html) from the design gallery or at:

```text
http://<vpn-ip>:5173/design/prototypes/yard-crew-acquisition/
```

## Review journey

1. Review the evidence-based Yard Crew marketing promise.
2. Compare owner-operator, multi-crew provider, and invited-team-member paths.
3. Build an illustrative provider organization.
4. Configure service categories, territory, capacity, work preferences,
   response standard, and precise qualification facts.
5. Review ready and ready-with-limits states, then search and filter
   owner-authorized service opportunities.
6. Recover no-result, unavailable, and paused-request states.
7. Review a disclosure-limited preliminary service brief and request site-
   assessment access.
8. Simulate a statement-of-interest write failure, retry, track the owner's
   response, and inspect owner-authorized disclosure.
9. Complete the structured site checklist and select an on-site assessment when
   evidence still needs field verification.
10. Build a provider-private production basis, issue the owner-facing service
    proposal, and inspect clarification, revision, and approval states.
11. Keep approved scope distinct from service mobilization, crew assignment,
    work-order release, and initial-service confirmation; preview the exact
    owner update before sending it and inspect its delivery receipt.
12. Save an opportunity alert, recover a failed save, and inspect frequency,
    channel, quiet-hour, capacity-suppression, pause, and resume behavior.
13. Compare team authority, prepare an invitation, require owner approval, and
    inspect recipient acceptance, correction, expiry, and revocation.
14. Review the known-owner pilot boundary and the gates that keep curated
    marketplace claims out of the release.
15. Review contextual provider setup, opportunity, safety, field, access, and
    data support.

Use **Review journey** to jump directly to each stage, change provider path, set
opportunities to suitable, empty, unavailable, or paused; inspect saved-alert,
invitation, and pilot states; and make the next statement-of-interest or owner-
notification submission fail once.

## Product boundaries

- “Yard Crew” is the marketing audience, not a public marketplace account type.
- A solo owner-operator receives a provider organization of one.
- Established companies use a provider organization with authorized roles.
- Crew leaders and team members join existing providers by invitation and do not become
  independently searchable work inventory.
- Yard owners select provider organizations; providers assign internal crews.
- First-service communication is previewed before the work order is confirmed;
  its owner-visible content and provider-private exclusions remain explicit.
- Team roles do not grant access before an approved invitation is accepted, and
  meaningful authority must be capability-based, auditable, and revocable.
- Saved alerts are opt-in and capacity-aware. They do not reserve, rank, widen
  eligibility, reveal private owner data, or guarantee work.
- Opportunity previews omit exact address, owner contact, photos, access notes,
  competitors, rank, budget, and guaranteed job value.
- A statement of interest requests site-assessment access. It is not owner
  selection, proposal approval, crew assignment, work-order release, scheduling,
  or service activation.
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
The [industry language review](../../review/yard-crew-industry-language-review.md)
defines the production vocabulary used here. The
[professional V2 review](../../review/yard-crew-acquisition-professional-review-v2.md)
records the foundational workflow improvements and their dispositions. The
[V3 extension review](../../review/yard-crew-acquisition-extension-review-v3.md)
records first-service communication, team authority, saved alerts, pilot
governance, and their production contracts. The production handoff must resolve
the product gates recorded in the phased plan before curated opportunity
discovery or credential language ships.
