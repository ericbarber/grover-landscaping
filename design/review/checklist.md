# Design Review Checklist

Use this checklist for each page or connected workflow.

## Audience and outcome

- Is the audience and active context immediately clear?
- Does the page support one primary outcome?
- Are internal/provider concepts hidden from customer and homeowner views?
- Does the page make shipped, planned, and unavailable behavior honest?

## Hierarchy and navigation

- Is the primary action visible without scanning the whole page?
- Can a user identify current status, blockers, and pending sync quickly?
- Does each drill-down have a clear return path?
- Is navigation stable across related screens?
- On mobile, is only the necessary workflow expanded?

## Content and data

- Are labels written in the language of the persona rather than database terms?
- Are counts, dates, money, status, ownership, and affected records unambiguous?
- Do filters explain the active review scope and provide a safe reset?
- Are sensitive IDs and internal notes shown only when operationally necessary?

## States and safety

- Are loading, empty, unavailable, offline, conflict, and permission states covered?
- Do destructive actions identify the exact target and recovery consequence?
- Does success explain what was persisted and what happens next?
- Are audit and recovery paths discoverable without overwhelming normal work?

## Responsive and accessible behavior

- Are touch targets at least 44 by 44 CSS pixels?
- Does essential context survive narrow widths and text zoom?
- Does the workflow reflow at the 320px equivalent of 400% browser zoom and at
  200% text resize without horizontal scrolling?
- Is meaning independent of color?
- Do selected, disabled, error, and focus states survive forced colors/high
  contrast and reduced motion?
- Are focus order, headings, labels, and announcements defined?
- Does fixed navigation respect safe areas and avoid covering actions?
- Do refresh, deep links, browser Back/Forward, duplicated tabs, expired
  sessions, and stale decisions fail safely?

## Approval record

- Reviewer:
- Artifact and version:
- Commit and environment:
- Decision: Open / Revise / Approved
- P0/P1/P2/P3 findings:
- Required changes:
- Interaction states still needed:
- Automated evidence:
- Physical-device evidence:
- Assistive-technology evidence:
- Participant/usability evidence:
- Privacy/security and operations signoff:
- High-fidelity handoff owner:
