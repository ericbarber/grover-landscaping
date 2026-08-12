# Yard Owner Acquisition Professional UX Review

## Review outcome

The acquisition direction is strong: it gives the owner control before a
provider relationship exists, separates owner intent from provider-authored
scope, and makes service activation an explicit decision. The professional pass
focuses on removing the remaining trust, comprehension, accessibility, and
workflow gaps that could cause an owner to share more than intended or believe
care is further along than it is.

This review covers the complete owner and provider journey, including compact
mobile layouts, keyboard and screen-reader behavior, validation and recovery,
directory disclosure, proposal decisions, activation, and relationship controls.

## Prioritized findings and resolutions

| Priority | Finding | Risk | Resolution |
| --- | --- | --- | --- |
| Critical | Account creation moved directly to property setup even though verified identity is part of the product contract. | A production implementation could silently omit a required trust gate. | Add an explicit email-verification stage with invalid-code, resend, change-email, and successful continuation states. |
| Critical | Privacy acknowledgment and several sensitive disclosure choices were preselected. | Consent could be inferred from defaults instead of an affirmative owner decision. | Start acknowledgment, exact-address, photo, and final disclosure confirmation controls unselected; explain the minimum request separately. |
| Critical | The directory route sent requests and jumped directly to proposals. | The journey skipped provider interest, assessment scheduling, and verification of conditions. | Route directory disclosure to assessment before proposals and state that only responding providers continue. |
| High | Address confirmation remained valid after editing address fields. | A different address could appear confirmed without rechecking. | Invalidate the confirmation whenever a location field changes and require reconfirmation. |
| High | Only the street line received meaningful property validation. | Missing city, postal code, or property label could produce an unusable intake record. | Validate all required property fields, associate field errors, and focus the first invalid control. |
| High | “Closest to your brief” looked like Grover ranking despite the adjacent no-ranking statement. | Owners could infer endorsement or superior quality. | Replace recommendation styling with a factual “Matches requested cadence” label and use equal decision treatment. |
| High | Monthly proposal estimates used four-week arithmetic without saying so. | Owners could compare inaccurate recurring cost. | Show annualized monthly averages and label the calculation explicitly. |
| High | Photo access could be revoked immediately while ending service used confirmation. | Privacy/destructive controls behaved inconsistently. | Use consistent two-step confirmation for future photo access, service access, and unused-media deletion. |
| High | Error copy was visible but not consistently associated with its control. | Screen-reader users could reach an invalid field without hearing the reason. | Connect field errors with `aria-describedby`, expose `aria-invalid`, focus the first invalid field, and preserve entries on failure. |
| Medium | The five-stage rail did not expose its current step semantically. | Visual progress was not available to assistive technology. | Apply `aria-current="step"`, announce stage changes, and retain textual status labels. |
| Medium | A completion percentage implied precision that the brief does not have. | Owners could optimize for a score instead of describing what they know. | Replace the percentage with plain-language readiness based on actual selections. |
| Medium | “Skip photos” and “Review my yard brief” led to the same place. | Competing actions made the optional step feel more complex than it is. | Use one adaptive continuation action: “Continue without photos” or “Review my yard brief.” |
| Medium | “Fastest pilot path” exposed internal rollout language. | Product operations language reduced customer confidence. | Replace it with the owner-centered cue “I already have a provider.” |
| Medium | “Exact address stays private” sounded permanent even though it may later be shared. | The promise conflicted with assessment disclosure. | Use “Private until you approve a provider” consistently. |
| Medium | Directory filters appeared interactive without changing the results. | Controls could feel broken or deceptive. | Make care and assessment filters update visible providers, result count, selection state, and no-match guidance. |

## Stage model after review

The public journey continues to use five memorable milestones while supporting
the necessary substeps within them:

1. **Your yard:** private profile, verified email, confirmed property, and yard
   brief.
2. **Show the yard:** optional, guided, removable photographs.
3. **Choose a provider:** private summary, known-provider invitation or suitable
   provider discovery, recipient verification, and per-provider disclosure.
4. **Agree on care:** assessment, contextual questions, versioned proposals,
   comparison, revision, and explicit decision.
5. **Get ready:** provider operational setup, first-visit confirmation, portal
   handoff, and durable relationship controls.

The milestone rail is orientation, not a promise that each milestone is a single
screen. Screen headings state the immediate task; the rail states where that task
fits in the overall outcome.

## Content standard

- Lead with the owner’s immediate question or action.
- State what happens after the action and what does **not** happen.
- Use “provider” for the company the owner chooses and reserve “crew” for private
  provider operations.
- Use “yard brief” for owner input, “assessment” for provider verification, and
  “proposal” for provider-authored scope and price.
- Avoid “match,” “recommended,” “verified,” or “approved” unless the exact basis
  is adjacent and supportable.
- Distinguish private, shared, requested, accepted, setup, scheduled, active,
  revoked, and retained states in text rather than color alone.
- Do not use internal rollout language such as pilot, marketplace inventory, or
  provider density in customer-facing surfaces.

## Accessibility completion standard

- Every stage has one page-level H1 and a focused stage title on navigation.
- Progress uses semantic current-step state and does not rely on color or icons.
- Every input has a visible label, a useful autocomplete/input mode where
  applicable, programmatically associated help/error text, and preserved value on
  recoverable failure.
- Consent is affirmative and never preselected for privacy acknowledgment, exact
  address, photographs, or final disclosure confirmation.
- Dialogs have names, native modal focus containment, Escape close, and trigger
  focus restoration.
- Status changes and non-navigation outcomes use polite live announcements;
  blocking errors use alerts and focus the affected control.
- Interactive targets are at least 44 by 44 CSS pixels on compact touch layouts.
- Content reflows at 320 CSS pixels and 200% text without horizontal scrolling or
  loss of action, status, or disclosure information.
- Destructive or access-reducing actions explain consequences and require
  confirmation before changing state.

## Production note

Passing this review means the working design represents a complete, accessible
experience contract. It does not make illustrative provider facts, address
checking, email delivery, media processing, proposals, scheduling, persistence,
or deletion real. Those capabilities remain governed by the production handoff
and must preserve the same distinctions and failure behavior.
