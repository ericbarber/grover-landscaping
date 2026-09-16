# Modern website comparison guide

Status: session guide ready; no participant evidence collected

Date: 2026-09-16

## Decision this review supports

Determine whether the proposed public entry helps Yard Owners and known
providers choose the right path, and whether the five role previews make the
first answer, next owner, and authority boundary easier to understand. This is
an input to design refinement, not a production adoption gate by itself.

Use the [SX4 comparative study](simplified-product-experience-comparative-study.md)
for neutral facilitation, matched fixtures, counterbalancing, severity, and
privacy rules. The [persona profiles](../personas/README.md) define the ten
role hypotheses; this round covers the five core perspectives only.

## Artifacts and fair comparison

| Condition | Entry | What it can demonstrate |
| --- | --- | --- |
| Current app | Live local-review React at a recorded commit, with the [dated mirror](../prototypes/current-frontend-review/index.html) as fallback | Real navigation and current workflow, subject to fixture and deployment limits |
| Service thread | [Existing working prototype](../prototypes/simplified-service-thread/index.html) | Role-filtered service comprehension and illustrative task composition |
| Modern concept | [Public website and role preview](../prototypes/modern-grover/index.html) | Entry-path choice, visual hierarchy, next-step comprehension, and role boundary |

The modern concept has inspect-only actions. Do not score it as completing a
decision, publishing a plan, starting a job, or persisting proof. Compare
comprehension outcomes across all three conditions, and measure actual task
completion only where equivalent working behavior exists. Record the current
app commit, sample fixture, viewport, and any missing external service.

## Session tasks

Start the public-path tasks from each site's home, without pointing to a button.
For workspace tasks, start at each condition's normal persona entry. Rotate the
condition order across participants and use equivalent facts with distinct
record names to reduce memorization.

| ID | Participant prompt | What to observe |
| --- | --- | --- |
| MW-01 · Yard Owner entry | “You want to know what will happen before and after the next yard visit. Show where you would start.” | First chosen path, expected outcome, confusion with provider sign-in or proof claims |
| MW-02 · Provider entry | “Your company already has a customer relationship. Find the part of Grover that would help the office and field stay coordinated.” | Path choice, whether provider discovery or marketplace availability is incorrectly inferred |
| MW-03 · Yard Owner | “Find what you need to do next for Mesa Court and who takes over afterward.” | Exact decision, next owner, pending versus reviewed proof |
| MW-04 · Property Manager | “One property needs attention. Find it and explain what decision is yours.” | Exact property, version, portfolio scope, absence of provider-private detail |
| MW-05 · Company Owner | “Decide whether this risk requires you or the operating manager.” | Business blocker, named handoff, no route editing assumption |
| MW-06 · Company Manager | “Explain what must be checked before this service plan is released.” | Accepted scope, exact plan version, crew fit, next field owner |
| MW-07 · Crew Lead | “At the next stop, show what you need before starting and who can change the released plan.” | Assignment/access/safety, office plan authority, no customer price |
| MW-08 · Unavailable | “The service cannot be confirmed right now. What would you do, and what does the screen know?” | No invented current status, no protected record in the unavailable view, safe retry/support expectation |

For MW-03 through MW-07, ask the participant to state the answer before they
inspect a detail panel, then ask what they expect the primary action would do in
the live product. This separates first-glance comprehension from prototype
interaction.

## Evidence sheet

Record one row per participant, condition, and task. Use anonymous IDs of the
form `MW-{persona}-{session}-{task}`. Record: condition order; viewport and
device; first destination; first stated answer; correct record/version/owner;
wrong turns; authority assumption; proof/status interpretation; facilitator
help; confidence (1–5); and a timestamped observation or short participant
paraphrase. Mark each field as observed, participant statement, or team
interpretation. Do not enter customer names, addresses, tokens, or screenshots
of real private data in this repository.

## Decision rules

- A privacy, field-safety, false-proof, or unauthorized-action misunderstanding
  is critical and stops adoption of the affected composition until resolved.
- A design change is promising when participants can identify the right path,
  exact service or property, current state, next owner, and their own authority
  without facilitator help and without repeated wrong turns relative to the
  matched current condition.
- Keep separate findings for public messaging and authenticated workspace
  composition. A successful website path does not validate a service action.
- Mark each issue accepted, revised, rejected, or still open at the task and
  persona level. Update the prototype and rerun the affected task before
  proposing a bounded React implementation slice.
