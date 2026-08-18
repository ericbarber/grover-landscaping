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
| 1 — workflow | Connected owner/provider validator and lifecycle assertions | Product walkthrough | In progress |
| 2 — content | Terminology and consequence review | Yard owner and landscape-operator comprehension | Planned |
| 3 — trust | Visibility, capability, receipt, terminal-state, and abuse review | Privacy/security approval | Planned |
| 4 — accessibility | Keyboard, semantics, focus, zoom, forced-colors, motion checks | VoiceOver, TalkBack, NVDA sessions | Planned |
| 5 — device/resilience | Multi-viewport, history, refresh, deep-link, failure checks | Physical iOS, Android, tablet sessions | Planned |
| 6 — usability | Expert heuristic disposition and moderated research kit | Five to eight owner and five provider sessions | Planned |
| 7 — operations | Service blueprint and runbook acceptance matrix | Support/operations approval and service levels | Planned |
| 8 — closure | Passing suites, zero open design P0/P1, roadmap and release record | Cross-functional signatures | Planned |

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
| WF-01 | P1 | Provider “Ask a preliminary question” records success without collecting a question | Add an explicit question composer, validation, cancel, and send-without-disclosure result | Open |
| WF-02 | P1 | Provider decline closes a request without a confirmation step | Add explicit decline confirmation and terminal-state feedback | Open |
| WF-03 | P1 | Browser navigation uses `replaceState`, so Back cannot return through the journey | Add history entries for user navigation and a `popstate` renderer | Open |
| WF-04 | P1 | Direct access-receipt deep links show “Nothing selected,” contradicting the gallery’s completed receipt | Seed a clear historical example for direct review without preselecting the consent form | Open |
| DS-01 | P1 | Directory disclosure preselects yard brief and email, conflicting with the V2 affirmative-consent contract | Remove all preselected directory categories and update validation | Open |
| DS-02 | P2 | Photo disclosure can be selected when the brief contains zero photos | Disable the category until a photo exists and explain the recovery | Open |
| CT-01 | P2 | “Identity checked” and “immutable snapshot” are broader or more technical than the underlying fact | Use precise business-contact and saved-receipt language | Open |
| CT-02 | P2 | Exact-address copy implies disclosure itself can be revoked, although only future access can end | State the future-access and historical-receipt consequence precisely | Open |
| RC-01 | P1 | No explicit expired-session recovery state exists | Add a protected session-expired state with sign-in/return guidance | Open |
| AT-01 | P1 | 400% text, forced-colors, systematic keyboard order, and focus visibility are not yet covered | Add CSS treatment and repeatable professional assurance validation | Open |
| RS-01 | P2 | Physical-device and assistive-technology evidence cannot be produced by browser automation | Publish executable matrices; retain external status until real sessions occur | Open external evidence |
| US-01 | P2 | Moderated owner/provider comprehension evidence requires real participants | Publish scripts, tasks, metrics, consent-free note template, and stop rules | Open external evidence |
| OP-01 | P1 | Prototype support paths do not yet define production ownership, severity, service levels, or evidence boundaries | Publish operational service blueprint and pilot gates | Open |

## Evidence integrity

Browser automation can verify interaction mechanics, semantics, responsive
reflow, focus behavior, media preferences, and deterministic recovery. It cannot
stand in for a person using a screen reader, a physical device, a moderated
participant, legal/privacy counsel, or an operating support team. Those items
will be prepared to execution quality and remain explicitly unsigned until the
appropriate people complete them.
