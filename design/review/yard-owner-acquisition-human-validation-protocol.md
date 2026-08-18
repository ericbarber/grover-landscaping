# Yard Owner Acquisition Human Validation Protocol

## Purpose and evidence status

This protocol completes the preparation required for professional human review
of the Yard Owner acquisition V2 design. It covers content comprehension,
moderated usability, assistive technology, and physical devices.

Repository status: execution-ready.

External evidence status: not yet performed. Do not mark the product approved or
accessible from this protocol alone. Each session requires a real participant or
tester, device/software evidence, findings, and reviewer signature.

## Recruitment

### Yard owners

Recruit five to eight people who have hired, considered hiring, or directly
managed residential yard care. Include:

- at least two people who are not confident with online account setup;
- at least two people who have worked with an existing landscape provider;
- at least two people who would need help finding a provider;
- a mix of mobile-primary and desktop-primary participants;
- accessibility participants when they choose to disclose relevant access needs.

### Landscape providers

Recruit at least five people across:

- solo owner-operator;
- office or opportunity manager;
- field/crew lead without proposal authority;
- multi-crew company owner or manager;
- provider who receives customer requests by email today.

Do not collect immigration status, unnecessary credential documents, customer
lists, private pricing, real addresses, or real customer photographs.

## Session controls

- Use the working-design disclosure before every session.
- Use only illustrative Morgan Reyes, Sonoran House, and Desert Bloom data.
- Ask participants to think aloud without teaching the interface.
- Do not ask leading questions such as “Did you notice this was private?”
- Stop immediately if a participant enters real secrets, alarm codes, payment
  data, or another person’s private information.
- Record observations by task ID. Recordings require separate participant
  consent and the approved retention period.

## Yard owner moderated session

Target duration: 45–60 minutes.

### Opening questions

1. How do you currently arrange yard care?
2. What information would you expect to give a provider before receiving a
   proposal?
3. What would you hesitate to share online?

### Tasks

| ID | Participant prompt | Observe without prompting |
| --- | --- | --- |
| UO-01 | “Set up this yard so you can look for care. You do not want to add photos.” | Private-start comprehension, verification, address confirmation, authority, optional-photo exit |
| UO-02 | “You already know Desert Bloom. Invite the business, but make sure the street address is not sent yet.” | Invitation disclosure scan, recipient confidence, affirmative send, post-send understanding |
| UO-03 | “The invitation email failed. Correct the problem without rebuilding the yard information.” | Failure recognition, input preservation, recovery choice |
| UO-04 | “Desert Bloom responded. Share the yard goals and email, but do not share the address, photos, or gate/pet information.” | Provider fact review, unselected defaults, category accuracy, consent comprehension |
| UO-05 | “Check what was shared, then stop future assessment access.” | Receipt interpretation, approved/withheld distinction, revocation consequence |
| UO-06 | “You no longer want to invite this recipient. End the invitation.” | Revoke discovery, confirmation, terminal-state comprehension |
| UO-07 | “Instead, compare possible providers and send two separate requests.” | Matching caveat, trust-fact precision, competitor privacy, separate consent |
| UO-08 | “Review a proposal, ask for a change without accepting it, then accept the final described care.” | Scope/exclusions, no-decision question, price/cadence comprehension, activation boundary |
| UO-09 | “Your sign-in expired. Continue without sending anything accidentally.” | Protected state, confidence, return path |

### Owner comprehension questions

Ask after tasks, without showing the relevant screen again:

1. Before Desert Bloom responded, what could it see?
2. What did “business contact checked” mean to you?
3. Did anything guarantee provider quality, licensing, insurance, or
   availability?
4. What did approving assessment access do? What did it not do?
5. Did accepting a proposal schedule the first visit immediately?
6. After revocation, what historical information did you expect to remain?

## Provider moderated session

Target duration: 45–60 minutes.

| ID | Participant prompt | Observe without prompting |
| --- | --- | --- |
| UP-01 | “Open Morgan’s invitation and tell us what is still private.” | Recipient-specific context, disclosure boundary, no-job interpretation |
| UP-02 | “Connect the invitation to Desert Bloom and confirm only the authority you actually have.” | Organization selection, duplicate concern, capability language |
| UP-03 | “You need one answer before deciding whether to assess. Ask the owner without requesting more data.” | Question composer, specificity, send consequence |
| UP-04 | “You are interested in an assessment but cannot yet price, propose, assign a crew, or schedule work.” | Interest action, authority boundary, owner approval expectation |
| UP-05 | “Decline the request without exposing internal capacity or staffing details.” | Confirmation, customer-safe outcome, closed-action state |
| UP-06 | “The request appears suspicious. Block it and begin a report.” | Report distinction, confirmation, data minimization |

### Provider comprehension questions

1. What actions did opportunity-response authority permit?
2. Could you see the exact address before Morgan approved it?
3. Did expressing interest mean the owner selected your company?
4. Did the request create a customer, proposal, crew assignment, work order, or
   scheduled visit?
5. What would you do if the invitation named the wrong provider organization?

## Success measures

| Measure | Signoff-ready target |
| --- | --- |
| Critical owner task completion | At least 90% without moderator intervention |
| Critical provider task completion | At least 90% without moderator intervention |
| Unintended sensitive disclosure | 0 occurrences |
| Invitation versus service comprehension | At least 80% answer all boundary questions correctly |
| Assessment versus scheduled-service comprehension | At least 80% answer correctly |
| Provider authority comprehension | At least 80% distinguish response from price/proposal/release authority |
| Repeated terminology confusion | No P1 pattern across two or more participants |
| Single Error Question score | 5 or lower for each critical task |

Treat any unintended address/photo/access-note disclosure or belief that service
was scheduled as a P1, regardless of aggregate completion rate.

## Assistive-technology matrix

Run the critical paths OW-01, PR-01, PR-03, DS-01, DS-02, and RC-01 with:

| Environment | Required evidence |
| --- | --- |
| VoiceOver + current iOS Safari | Device/OS/browser version, task result, rotor headings/forms review, focus/announcement notes |
| TalkBack + current Android Chrome | Device/OS/browser version, task result, reading order, control-state and error notes |
| NVDA + current Windows Chrome | Versions, browse/forms-mode behavior, dialogs, live regions, validation and focus return |
| NVDA + current Windows Firefox | Versions and any browser-specific differences |
| Keyboard-only desktop | Tab order, skip link, visible focus, dialog containment/Escape, no pointer dependency |
| Voice Control or equivalent | Accessible action names and duplicate-name ambiguity |

For every environment verify:

- one active H1 and logical H2/H3 structure;
- owner/provider persona change is announced through the stage title;
- labels, legends, hints, errors, checked/disabled states, and required
  confirmations are exposed;
- status updates do not interrupt or repeat excessively;
- dialogs announce their names, contain focus, close with Escape where
  available, and restore focus;
- receipt terms and approved/withheld values read in a logical order;
- no hidden or disabled control receives unexpected focus.

## Physical-device matrix

| Class | Minimum session |
| --- | --- |
| Small supported iPhone | Full owner invite and disclosure path in portrait |
| Large supported iPhone | Provider recipient and receipt path in portrait and landscape |
| Small supported Android | Owner no-photo and failure-recovery path |
| Large supported Android | Provider claim/question/interest path |
| Tablet | Directory comparison and proposal review in portrait and landscape |
| Laptop | Full keyboard path at 100%, 200%, and 400% browser zoom |
| Large desktop | Full journey, dialogs, and dense review controller |

Also test high contrast/forced colors where supported, reduced motion, increased
text size, slow network, refresh, browser Back/Forward, duplicated tab, expired
session, and an expired invitation link.

## Content comprehension card sort

Ask owners and providers to place these terms into “before service,” “decision,”
or “provider operations,” then explain each:

- limited invitation;
- preliminary question;
- assessment access;
- service proposal;
- accepted care;
- provider setup;
- crew assignment;
- first visit confirmation;
- work order.

Terms confused by two or more participants require revised copy or an explicit
plain-language explanation before approval.

## Session evidence template

```text
Session ID:
Reviewer:
Participant segment:
Date/time and timezone:
Prototype commit:
Device / OS / browser / assistive technology:
Tasks attempted:
Tasks completed without help:
Critical errors:
Comprehension answers:
Observed quotes (de-identified):
P0/P1/P2/P3 findings:
Recording consent and retention (if applicable):
Reviewer decision: Pass / Revise / Blocked
```

## External signoff record

| Review | Reviewer | Evidence link | Decision | Date |
| --- | --- | --- | --- | --- |
| Yard owner usability | Pending | Pending | Unsigned | Pending |
| Provider usability | Pending | Pending | Unsigned | Pending |
| VoiceOver | Pending | Pending | Unsigned | Pending |
| TalkBack | Pending | Pending | Unsigned | Pending |
| NVDA Chrome/Firefox | Pending | Pending | Unsigned | Pending |
| Physical mobile/tablet | Pending | Pending | Unsigned | Pending |
| Content comprehension | Pending | Pending | Unsigned | Pending |
