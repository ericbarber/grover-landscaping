# Yard Crew Acquisition Professional Review V2

Date: 2026-08-15
Status: Review complete; priority improvements implemented in the working design

## Review objective

Evaluate whether the Yard Crew acquisition experience helps an owner-operator or
landscape company make sound business decisions from first visit through the
initial work order. The review covers acquisition clarity, provider trust,
opportunity quality, site assessment, estimating, operational handoff, support,
responsive behavior, and accessibility.

The review preserves the existing product boundary: owners choose landscape
service providers; providers control pricing, staffing, crew assignment, and
field execution. A service opportunity is not a public job claim.

## Executive assessment

The V1 journey establishes the correct privacy and marketplace model, but it
initially presented the entire lifecycle as one long onboarding checklist. It
also asked a provider to make consequential decisions with limited visibility
into readiness, capacity, property characteristics, owner-response status,
assessment completeness, and internal production assumptions.

The V2 direction keeps the successful visual system and trust boundaries while
making the portal more useful as an operating tool:

- organize the journey around **Get started**, **Find the right work**, and
  **Start service**;
- treat support as a destination, not a required onboarding step;
- state which opportunities the business is ready to pursue and which remain
  restricted;
- show privacy-safe property and route-fit facts before requesting access;
- make owner response and disclosure progress visible;
- structure the site assessment around the facts needed for a reliable scope;
- keep provider-private production assumptions beside the owner-facing proposal;
- preserve an explicit crew-assignment and work-order handoff.

## Findings and recommendations

| Priority | Finding | Risk | Recommendation | V2 disposition |
| --- | --- | --- | --- | --- |
| P0 | Nine equal steps mix onboarding, marketplace work, support, and operations | Users cannot tell what is required to get started versus what happens later | Group the lifecycle into three phases and remove Support from numbered progress | Implemented |
| P0 | Readiness facts do not state what the provider may do now | A pending document can appear either harmless or silently blocking | Add an opportunity-readiness summary that names allowed and restricted service categories | Implemented |
| P0 | Opportunity cards provide too little operational context | Providers may request private access for work that is obviously wrong for route, property, or capacity | Add owner-supplied size band, landscape profile, requested start, service fit, and route impact without revealing the address | Implemented |
| P0 | A sent assessment request becomes a generic waiting state | Providers cannot see what happened, what comes next, or when the request expires | Add a three-stage owner-response tracker and expiry guidance | Implemented |
| P0 | Assessment is mainly prose and method selection | Important site, access, disposal, safety, labor, and equipment questions can be missed | Add a structured assessment checklist with confirmed and field-verification states | Implemented |
| P0 | Owner proposal is disconnected from provider production assumptions | The provider can quote without checking crew-hours, disposal, equipment, or route impact | Add a provider-private estimate basis beside the owner-facing proposal | Implemented |
| P1 | Support appears as the final success step | Users may read help as required before completion | Keep persistent help access and reviewer access, but remove it from progress | Implemented |
| P1 | Business capacity is implied only by a pause control | Opportunity fit cannot reflect how much or what kind of work the provider wants | Add recurring-opening, preferred-work, and typical-crew preferences | Implemented |
| P1 | Opportunity fit is described but not traceable | A “fit” badge can feel like a ranking | Continue showing factual reasons and explicitly avoid score, rank, or guaranteed availability | Retained and expanded |
| P1 | First-service preparation lacks an owner-facing summary | Internal completion may not equal customer clarity | Add owner notification preview in the next implementation slice | Implemented in V3 |
| P1 | Invited personnel cannot inspect alternate valid roles | Wrong-role correction exists, but role comparison is thin | Add role comparison and manager-approval status in the team-administration design slice | Implemented in V3 |
| P2 | Saved searches do not define alert behavior | Providers may assume they will be notified | Design explicit saved-search notification controls and quiet hours | Implemented in V3 |
| P2 | Marketplace health is invisible | Providers cannot distinguish no owner demand from eligibility, pause, or allocation limits | Add regional availability and marketplace-health language only after governance and measurement exist | Product-gated |

## V2 journey model

### Get started

1. Choose owner-operator, company, or invited-team-member path.
2. Establish the private business profile.
3. Select services, service area, capacity, and response preferences.
4. Review precise business and credential facts.
5. See what the business may browse, request, or must keep paused.

### Find the right work

1. Review privacy-safe property, service, timing, size, and route-fit facts.
2. Request assessment access without claiming work.
3. Track the owner’s response and each shared detail.
4. Complete a desktop or on-site assessment checklist.
5. Build provider-private production assumptions.
6. Send a versioned owner-facing scope and proposal.

### Start service

1. Link the owner-approved customer and property records.
2. Convert the approved scope into crew instructions.
3. Assign the responsible crew.
4. Create and confirm the initial work order.
5. Enter Route → Work order → Service evidence.

## Information and privacy decisions

### Safe before owner approval

- approximate service area;
- owner-supplied landscape size band;
- broad landscape profile and requested services;
- requested start window and cadence preference;
- whether desktop or on-site assessment is expected;
- factual service-area and capability alignment;
- approximate route impact derived without exposing the address.

### Owner approval required

- exact service address;
- selected property photographs;
- in-app owner conversation;
- gate, pet, parking, and visit-access details;
- any site note that could identify the owner or property.

### Provider-private throughout

- crew-hours and labor assumptions;
- equipment, disposal, travel, margin, and capacity reasoning;
- internal hazards and production notes;
- competing providers, ranking, allocation logic, and private decline reasoning.

## Implementation phases

### Phase A — Navigation and readiness

- Group progress into Get started, Find the right work, and Start service.
- Remove Support from numbered progress.
- Add opportunity-readiness and capacity/preference summaries.

Acceptance: a provider can explain what is required to become ready, what is
optional, and what work remains restricted without opening support or a policy
document.

### Phase B — Opportunity decision quality

- Add privacy-safe property size, landscape profile, start window, and route fit.
- Preserve factual fit reasons and no-rank/no-guarantee language.
- Add the owner-response tracker and expiry state.

Acceptance: a provider can reject an obvious mismatch before requesting private
details and can understand the status of a request after submission.

### Phase C — Assessment and estimating

- Add structured site-assessment facts and field-verification states.
- Separate owner-visible assessment content from provider-private production
  notes.
- Add crew-hour, disposal, equipment, and route assumptions beside the proposal.

Acceptance: the owner-facing price can be traced to a provider-private operating
basis without exposing cost, margin, or staffing details to the owner.

### Phase D — Operational handoff and support

- Preserve explicit crew assignment and initial work-order release.
- Keep contextual Support reachable from every stage but outside acquisition
  completion.
- Preview and receipt the owner update; compare team authority and invitation
  lifecycle; and expose capacity-aware saved-alert preferences.

Acceptance: approved scope does not appear scheduled until the provider assigns
a crew and confirms the work order, and no owner update is sent before its final
review. See the [V3 extension review](yard-crew-acquisition-extension-review-v3.md).

## Validation requirements

- Complete connected owner-operator path from marketing through work-order
  confirmation.
- Grouped progress has one current step and accurate mobile counts.
- Support and invited-team-member routes remain directly reviewable.
- Readiness and opportunity facts do not imply broad verification or ranking.
- Owner-pending tracker survives failure and retry.
- Provider-private estimate basis is clearly excluded from owner visibility.
- Empty, unavailable, paused, declined, report, and correction paths remain.
- Desktop, tablet, 390px, 320px, 200% text, accessible names, 44px targets,
  visible focus, overflow, and browser-error checks pass.
