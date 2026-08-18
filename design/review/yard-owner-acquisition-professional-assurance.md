# Yard Owner Acquisition Professional Product Assurance

## Purpose

This record governs the final professional review of the Yard Owner acquisition
working design. It distinguishes repository-verified evidence from external
human or operational signoff and records every material finding through
disposition.

Artifact under review:

- `design/prototypes/yard-owner-acquisition/index.html`
- V2 known-provider connection contract
- reciprocal Yard Crew entry
- Yard Owner portal transition

Review date: 2026-08-17

## Professional completion standard

A phase is complete when its scenarios, findings, dispositions, validation, and
remaining external evidence are recorded. The design is signoff-ready only when:

- no P0 or P1 design findings remain open;
- P2 findings are fixed or explicitly accepted with rationale;
- automated workflow, semantic, responsive, and resilience suites pass;
- human usability, physical-device, assistive-technology, privacy/security, and
  operational reviewers have executable protocols and named evidence fields;
- production-planned behavior is never represented as production-delivered.

Severity model:

| Severity | Meaning | Design exit rule |
| --- | --- | --- |
| P0 | Privacy exposure, unauthorized action, unsafe instruction, or irreversible loss | Must be fixed before any review approval |
| P1 | Blocked core task, misleading consent/lifecycle claim, inaccessible task, or missing critical recovery | Must be fixed before signoff-ready |
| P2 | Recoverable comprehension, hierarchy, responsive, or efficiency defect | Fix or record explicit acceptance |
| P3 | Polish or future optimization | May enter the forward backlog |

## Phase evidence matrix

| Phase | Repository evidence | External evidence | Status |
| --- | --- | --- | --- |
| 0 — baseline | Scenario matrix, severity model, finding register | None | Complete |
| 1 — workflow | Connected owner/provider validator, question/decline remediation, lifecycle assertions | Product walkthrough | Repository complete; external unsigned |
| 2 — content | Terminology, trust-claim, and consequence review with remediated copy | Owner/operator comprehension | Repository complete; external unsigned |
| 3 — trust | Visibility, capability, receipt, terminal-state, abuse, and threat review | Privacy/security approval | Repository complete; external unsigned |
| 4 — accessibility | Keyboard, semantics, focus, 320px reflow, 200% text, contrast, forced-colors, motion | VoiceOver, TalkBack, NVDA | Repository complete; external unsigned |
| 5 — device/resilience | Eight viewport classes, history, refresh, deep-link, session, failure checks | Physical iOS, Android, tablet | Repository complete; external unsigned |
| 6 — usability | Expert heuristic disposition and moderated owner/provider research kit | Five to eight owner and five provider sessions | Repository complete; external unsigned |
| 7 — operations | Responsibility, severity, recovery, monitoring, and pilot go/no-go runbook | Support/operations approval and staffing | Repository complete; external unsigned |
| 8 — closure | Passing suites, zero open design P0/P1, roadmap and release record | Cross-functional signatures | Repository complete; external unsigned |

## Critical scenario matrix

| ID | Persona | Scenario | Required outcome |
| --- | --- | --- | --- |
| OW-01 | Owner | Create private profile, property, brief, and no-photo intake | Private draft persists conceptually; no provider or service is created |
| OW-02 | Owner | Add, remove, replace, or skip photographs | Counts and privacy state remain clear; no diagnostic claim |
| OW-03 | Owner | Send known-provider invitation and recover failure | Recipient and choices remain; failed send never claims delivery |
| OW-04 | Owner | Inspect delivery, open, expiry, decline, opt-out, and revoke | Every state preserves the correct disclosure boundary and safe next action |
| PR-01 | Recipient | Open direct owner invitation | Only the limited invitation is visible; opt-out/report remain available |
| PR-02 | Provider | Use existing organization or claim/bootstrap another | Email, organization relationship, and capability remain separate |
| PR-03 | Provider | Ask, decline, report/block, or express interest | Consequence is explicit and no action silently creates service |
| DS-01 | Owner | Approve a subset of provider data | All choices start unselected; approved and withheld categories are recorded |
| DS-02 | Owner | Revoke future assessment access | Confirmation is required and historical receipt remains unchanged |
| DR-01 | Owner | Select multiple directory providers | Each disclosure is separate and affirmative; competitors remain hidden |
| SV-01 | Owner/provider | Assess, propose, clarify, accept, and prepare service | Assessment, proposal, activation, crew assignment, and visit confirmation remain distinct |
| RC-01 | Owner | Refresh, deep-link, use browser Back, or recover session | Current state is understandable and private data is not lost or widened |
| AT-01 | Any | Complete key paths by keyboard and assistive technology | Names, roles, states, order, focus, errors, and announcements are usable |

## Baseline findings

| ID | Severity | Finding | Planned disposition | Status |
| --- | --- | --- | --- | --- |
| WF-01 | P1 | Provider “Ask a preliminary question” records success without collecting a question | Added composer, validation, cancel, focus, associated error, and limited-data result | Fixed and validated |
| WF-02 | P1 | Provider decline closes a request without a confirmation step | Added explicit confirmation, customer-safe consequence, and closed competing actions | Fixed and validated |
| WF-03 | P1 | Browser navigation uses `replaceState`, so Back cannot return through the journey | Added push/replace history contract and `popstate` rendering | Fixed and validated |
| WF-04 | P1 | Direct access-receipt deep links show “Nothing selected,” contradicting the gallery’s completed receipt | Added a historical example receipt while keeping all consent inputs unselected | Fixed and validated |
| DS-01 | P1 | Directory disclosure preselects yard brief and email, conflicting with the V2 affirmative-consent contract | Removed all defaults and added explicit guidance and assertions | Fixed and validated |
| DS-02 | P2 | Photo disclosure can be selected when the brief contains zero photos | Disabled zero-photo categories and enabled them only after photo intake | Fixed and validated |
| CT-01 | P2 | “Identity checked” and “immutable snapshot” are broader or more technical than the underlying fact | Replaced with precise business-contact and saved-receipt language | Fixed and validated |
| CT-02 | P2 | Exact-address copy implies disclosure itself can be revoked, although only future access can end | Clarified future access and historical receipt consequence | Fixed and validated |
| RC-01 | P1 | No explicit expired-session recovery state exists | Added protected session-expired state and successful sign-in return | Fixed and validated |
| AT-01 | P1 | 400% text, forced-colors, systematic keyboard order, and focus visibility are not yet covered | Added group focus, forced-colors treatment, contrast/reflow/motion checks, and assurance suite | Fixed and validated |
| RS-01 | P2 | Physical-device and assistive-technology evidence cannot be produced by browser automation | Published executable device and AT matrices with evidence template | Ready; external evidence unsigned |
| US-01 | P2 | Moderated owner/provider comprehension evidence requires real participants | Published recruitment, scripts, tasks, metrics, stop rules, and evidence template | Ready; external evidence unsigned |
| OP-01 | P1 | Prototype support paths do not yet define production ownership, severity, service levels, or evidence boundaries | Published proposed responsibility, severity, recovery, monitoring, and launch-blocking runbook | Design fixed; operational approval unsigned |

## Workflow and lifecycle review

The completed walkthrough verifies that every consequential action states both
what happened and what did not happen. Invitation, response, disclosure,
assessment, proposal, provider setup, crew assignment, work-order release, and
first-visit confirmation remain separate transitions.

Key dispositions:

- provider questions now require question content and stay inside the limited
  request;
- provider decline requires confirmation and closes conflicting actions;
- invitation failure preserves the owner’s recipient and disclosure input;
- direct hash routes, refresh, browser Back, and expired-session recovery render
  an understandable private state;
- known-provider and directory disclosure both start with zero selected data
  categories;
- a historical receipt deep link contains an internally consistent approved and
  withheld example without preselecting the consent form.

## Content and terminology review

| Term | Approved meaning | Required boundary |
| --- | --- | --- |
| Yard brief | Owner-described goals, areas, cadence, and optional context | Not measurement, diagnosis, scope, price, schedule, or work instruction |
| Limited invitation | Recipient-specific owner name, coarse area, goal, and timing | No address, photos, phone, or access notes |
| Business contact checked | Dated relationship between recipient and provider organization | Not quality, licensure, insurance, availability, or universal authority |
| Opportunity-response authority | Review, preliminary question, safe decline, report/block, disclosure request | No price, proposal, crew assignment, work release, or field work |
| Assessment access | Provider may view only approved categories for the stated purpose | Not customer creation, proposal acceptance, visit scheduling, or service |
| Service proposal | Provider-authored scope, exclusions, cadence, policy, and price version | Not accepted until the owner decides explicitly |
| Provider setup | Post-acceptance operational preparation | Not a confirmed visit or silent crew assignment |
| First visit confirmed | Provider supplied date and arrival window | Only then may the design transition to active portal expectations |

The review removed broad “Identity checked” UI language and technical
“immutable snapshot” customer copy. Technical contracts may still use immutable
when describing append-only receipt storage to implementation teams.

## Privacy, authorization, and abuse review

| Threat or misuse | Design control | Production proof still required |
| --- | --- | --- |
| Forwarded/replayed invitation | Recipient-specific, expiring, revocable language; closed terminal states | Hashed single-purpose tokens, replay prevention, rate limits |
| Wrong provider claim | Separate recipient, organization, and capability checks; identity-dispute pause | Duplicate prevention, evidence policy, appeal, fail-closed authorization |
| Overbroad provider role | Opportunity-response capability names permitted and forbidden actions | Server-enforced capability checks on every read/write |
| Unintended owner disclosure | All categories unselected; approved/withheld receipt; provider/purpose shown | Versioned category grants and atomic immutable audit |
| Access after revoke | Explicit confirmation and historical/future distinction | Immediate deny, cache/media reconciliation, alerting, idempotent retry |
| Opt-out resend | Closed opt-out state and different-recipient recovery | Durable scoped suppression and monitoring |
| Harassment or impersonation | Separate report/block and owner/provider support paths | Restricted evidence, response ownership, appeal, retention |
| Support overexposure | Issue-specific support paths and no-additional-sharing language | Role-minimized support views and audited break-glass access |
| Stale/duplicate decision | History/refresh safety and explicit confirmation | Server versions, idempotency keys, stale-tab conflict handling |

No privacy/security approval is inferred from this expert review. The production
threat model and implementation evidence remain cross-functional gates.

## Expert usability heuristic disposition

| Heuristic | Result |
| --- | --- |
| Visibility of status | Pass — persistent stage, privacy/save state, lifecycle, receipts, and results |
| Match with user language | Pass after content remediation |
| User control and freedom | Pass — cancel, back/history, revoke, decline/report confirmation, finish later |
| Consistency | Pass — owner/provider action hierarchy and shared design foundation |
| Error prevention | Pass after opt-in, zero-photo, decline, receipt, and session fixes |
| Recognition over recall | Pass — summaries repeat provider, property, purpose, approved and withheld data |
| Efficiency | Pass for prototype — review controller and deep links remain reviewer-only aids |
| Minimalism | Pass — normal path separates advanced support and lifecycle review |
| Error recovery | Pass — invalid, failure, expiry, opt-out, revoke, unavailable, and session states |
| Help and support | Pass at design level; operational promises remain unsigned |

The moderated protocol is in
[`yard-owner-acquisition-human-validation-protocol.md`](yard-owner-acquisition-human-validation-protocol.md).
The pilot operations contract is in
[`../../docs/yard-owner-acquisition-pilot-operations-runbook.md`](../../docs/yard-owner-acquisition-pilot-operations-runbook.md).

## Repository validation evidence

```bash
node design/tools/validate-yard-owner-acquisition.mjs
node design/tools/validate-yard-owner-professional-assurance.mjs
node design/tools/validate-prototype-foundation.mjs
node design/tools/validate-yard-crew-acquisition.mjs
```

The assurance suite covers history, refresh, direct receipts, session expiry,
question/decline consequences, fully affirmative disclosure, zero-photo
prevention, contrast samples, skip/focus behavior, reduced motion, forced colors,
320px reflow as the 400% zoom-equivalent layout, 200% text, and high-risk states
across 320, 360, 390, 412, 768 portrait, 1024 landscape, 1366, and 1920 widths.

## Evidence integrity

Browser automation can verify interaction mechanics, semantics, responsive
reflow, focus behavior, media preferences, and deterministic recovery. It cannot
stand in for a person using a screen reader, a physical device, a moderated
participant, legal/privacy counsel, or an operating support team. Those items
will be prepared to execution quality and remain explicitly unsigned until the
appropriate people complete them.

## Final assurance decision

Repository/design decision: **Approved as a signoff-ready working design.**

- Open design P0 findings: 0
- Open design P1 findings: 0
- Open design P2 findings: 0
- External evidence tasks: prepared and unsigned
- Production Phase 3: planned, not delivered
- Pilot operations: designed, not staffed or approved

This decision means the prototype, review contracts, automated evidence, human
protocols, and operational blueprint meet the repository’s professional design
standard. It does not authorize production launch. Launch still requires real
participant, device, assistive-technology, privacy/security, support/operations,
and implementation evidence recorded in the linked protocols and runbook.
