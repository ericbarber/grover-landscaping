# Minimal Product Workflow Session Guide

Status: retained research kit for the simplified-product redesign

Workflow phase: WF1 — Core persona discovery

Last updated: 2026-09-08

> Product-stage framing is superseded by the
> [Simplified Product Experience Plan](simplified-product-experience-plan.md).
> Use this guide's neutral questions, evidence protocol, and facilitation
> structure for the post-MVP redesign rather than an MVP scope exercise.
> Use the prepared
> [SX4 comparative study](simplified-product-experience-comparative-study.md)
> when comparing the current product with the service-thread design.

## Purpose

Provide a repeatable, professional research and facilitation method for
replacing the hypotheses in the
[minimal-product user workflow](minimal-product-user-workflow.md) with observed
user and operating evidence.

Use FigJam as the collaborative session board, Figma only when a participant
needs to react to a concrete interaction, and the repository workflow document
as the durable record. Do not revise the prototype during a session or treat a
participant's first solution suggestion as the underlying need.

## Research boundary

The active study includes:

- Yard Owner;
- Property Manager as an alternate customer path;
- Company Owner;
- Company Manager; and
- Crew Lead.

Support Administrator and no-role recovery enter a later exception review.
Billing Administrator remains product-gated. Dispatcher and Crew Member are
explicitly deferred and must not appear as necessary steps, assumed users, or
recruitment targets for the minimal-product study.

If a participant naturally describes dispatch or individual crew-member needs,
record the observation under the relevant scale threshold. Do not add a role to
the MVP during the session.

## Research questions

The study should answer:

1. What event causes each persona to open Grover?
2. What must they know first to feel oriented?
3. What outcome are they actually trying to reach?
4. What information is required before their next decision?
5. Which decisions can they make, and which must move to another person?
6. How is responsibility transferred today?
7. What happens when information, connectivity, access, or evidence is missing?
8. What makes the person believe the work is complete?
9. Which terms do they use without prompting?
10. At what operating scale would planning or field work need another role?

## Participant groups

Begin with a small formative round. Diversity of operating context matters more
than statistical representation at this stage.

| Group | Contexts to include | Primary learning goal |
| --- | --- | --- |
| Yard Owner | First-time service, recurring service, access constraints, remote owner | Confidence, decisions, preparation, proof, and recovery |
| Property Manager | Multiple authorized properties, on-site and remote management | Exception triage, property context, proof, and approvals |
| Company Owner | Owner-operator and owner with office staff | Setup, access, customer relationship, delegation, and business risk |
| Company Manager | Owner also acting as manager and a distinct manager | Planning, release, customer impact, recovery, and proof review |
| Crew Lead | Small crew, variable connectivity, interrupted route | Current work, access/safety, field decisions, evidence, and handoff |

Run at least one session with an owner-operator who performs both Company Owner
and Company Manager responsibilities. This tests whether the workflow supports
role overlap without merging authorization or confusing the user's current
task.

## Session types

| Session | Suggested length | Participants | Output |
| --- | --- | --- | --- |
| Discovery interview | 45–60 minutes | One participant plus facilitator and note taker | Goals, triggers, vocabulary, current path, failures, and evidence |
| Contextual workflow review | 60–90 minutes | One participant in a realistic setting | Environmental constraints, workarounds, artifacts, interruptions, and handoffs |
| Persona synthesis | 60 minutes | Product, design, engineering, and domain owner | Evidence-backed persona needs and disputed hypotheses |
| Cross-persona handoff workshop | 90–120 minutes | Representatives from customer, office, and field perspectives | Agreed handoff contracts, gaps, owners, and recovery paths |
| Prototype task review | 45–60 minutes | One target participant | Comprehension and completion evidence after the workflow is approved |

Do not combine the discovery interview and prototype task review in the same
opening exercise. Showing the interface first can anchor the participant to the
current design and hide how they naturally understand the work.

## Roles in the session

| Role | Responsibility |
| --- | --- |
| Facilitator | Protect the research question, ask neutral follow-ups, manage time, and prevent solution debates |
| Note taker | Capture exact language, evidence IDs, observed behavior, uncertainty, and timestamps |
| Workflow mapper | Update the current-path map only after the participant confirms the sequence |
| Observer | Listen silently, add private questions, and avoid explaining the product |
| Decision owner | Attend synthesis; do not convert an isolated comment into a product decision during the interview |

One person may perform note-taker and workflow-mapper duties in a small session.
The facilitator should not do both while interviewing.

## Evidence and privacy protocol

Before recording or retaining any information:

- obtain the participant's consent for the agreed session format;
- state how notes, audio, video, and screenshots will be used and retained;
- avoid collecting customer addresses, gate codes, phone numbers, account
  identifiers, employee performance details, or real support credentials;
- replace real properties and people with participant-approved neutral labels;
- do not paste production tokens, incident payloads, or private photographs into
  FigJam or Figma; and
- record when an answer is recalled, inferred, demonstrated, or supported by an
  existing artifact.

Repository records should contain synthesized evidence and approved anonymous
excerpts only. Raw research material belongs in an access-controlled research
location selected by the project owner.

## FigJam board structure

Create one board named `Grover · Minimal Product Workflow · WF1`. Use these
frames in order.

### Frame 0 — Session lobby

- Session purpose and date
- Participant context, anonymized label, and persona
- Consent and recording status
- Facilitator, note taker, and observers
- Scope reminder: Dispatcher and Crew Member are deferred
- Color and evidence legend

### Frame 1 — Context, not demographics

Capture facts that change the workflow:

- type and frequency of work;
- number of properties, customers, crews, or routes as relevant;
- office versus field environment;
- device and connectivity conditions;
- other people involved;
- current tools and informal workarounds; and
- consequences when the work fails.

Do not collect demographic facts unless a documented research question needs
them.

### Frame 2 — Trigger and desired outcome

Start with: “Think about the last time you needed to accomplish this work.”

Capture:

- triggering event;
- first question;
- desired result;
- urgency;
- information already available;
- person or system contacted first; and
- evidence that tells the participant the outcome is complete.

### Frame 3 — Current path

Map what happened, not what should happen:

`Trigger → first action → information gathered → decision → handoff → result`

Add every tool, message, spreadsheet, call, paper note, delay, repeated entry,
and manual confirmation. Use separate decision diamonds and explicit loops.

### Frame 4 — Decisions and authority

For each decision, ask:

- Who can make it?
- Who is consulted?
- Who must be informed?
- What exact information is required?
- Can the decision be reversed?
- What record must remain?
- What must another persona never see or change?

### Frame 5 — Handoffs

Create one card per handoff with:

| Field | Meaning |
| --- | --- |
| Sender | Person who currently owns the work |
| Receiver | Person expected to act next |
| Trigger | Event that makes the handoff necessary |
| Payload | Minimum information required by the receiver |
| Acknowledgment | How the sender knows it was received |
| Deadline | Real consequence of delay, if any |
| Failure | Missing, rejected, stale, conflicting, or unavailable state |
| Recovery owner | Person accountable for resolving the failure |

### Frame 6 — Breakdown and recovery

Prompt for a real recent example of:

- missing access information;
- changed customer scope or timing;
- a plan that could not be followed;
- interrupted connectivity or device-held work;
- incomplete or disputed completion evidence;
- an unauthorized or departed user; and
- a customer who did not understand the outcome.

For each breakdown, capture what was preserved, what was lost, who noticed,
who recovered it, and how everyone knew the recovery was complete.

### Frame 7 — Proposed minimum path

Only after the current path is confirmed, ask the participant to remove steps
that do not contribute to the outcome. The proposed path must still retain:

- authorization and exact property/work context;
- decisions and version consequences;
- ownership at every handoff;
- field safety and evidence requirements;
- unavailable, conflict, and recovery exits; and
- a customer-understandable completion outcome.

Mark every proposed node as Hypothesis until synthesis accepts it as a Decision.

### Frame 8 — Prototype reference

Link only the screens relevant to the mapped path. Ask the participant to
explain what they believe will happen before selecting an action. Capture:

- expected result;
- confidence;
- misunderstood language;
- missing information;
- perceived authority; and
- where they would go next without facilitator help.

### Frame 9 — Closing reflection

- What felt unnecessarily difficult?
- What would make the workflow unsafe or untrustworthy?
- What information was shown too early or too late?
- Which step would the participant remove?
- Which step must never be automated or hidden?
- Who else should be interviewed?

### Frame 10 — Facilitator debrief

Complete after the participant leaves:

- strongest evidence;
- surprises;
- contradicted assumptions;
- leading or weak questions;
- missing participant context;
- candidate workflow changes; and
- questions for the next session.

## Evidence identifiers

Use stable anonymous identifiers so synthesis can trace conclusions without
placing participant identity in the repository.

| Prefix | Persona |
| --- | --- |
| `YO` | Yard Owner |
| `PM` | Property Manager |
| `CO` | Company Owner |
| `MG` | Company Manager |
| `CL` | Crew Lead |
| `XP` | Cross-persona handoff workshop |

Format each observation as:

`WF1-{persona}-{session number}-{observation number}`

Example: `WF1-CL-02-014` identifies observation 14 from the second Crew Lead
session. Store the anonymous participant key outside the repository.

## Evidence card template

Every substantive sticky should include:

```text
Evidence ID:
Stage:
Type: observed behavior | recalled event | participant statement | artifact
Observation:
Participant consequence:
Related hypothesis:
Confidence: low | medium | high
Follow-up:
```

Use quotation marks only for an exact, consented, anonymized excerpt. Otherwise
record a neutral paraphrase and label it accordingly.

## Persona interview prompts

### Yard Owner

- Tell me about the last time you scheduled or received yard service.
- What did you need to know between agreeing to service and the crew arriving?
- How did you prepare the property?
- How did you know what was completed?
- Describe a time the result or status was unclear.
- What information about the provider is useful, and what feels like internal
  operational detail?

### Property Manager

- How do you decide which property needs attention first?
- What information must remain attached to the exact property and visit?
- How do you review completed work across properties?
- Which decisions can be standardized, and which require property-specific
  context?
- When does portfolio work require comparison rather than exception triage?

### Company Owner

- Walk me through becoming ready to serve the first customer.
- Which decisions do only you make today?
- Which operating details do you delegate?
- What business-level problem causes you to enter daily operations?
- If you also manage the schedule, how do you distinguish setup work from
  today's service work?

### Company Manager

- Show me how you turn accepted work into a service plan.
- What prevents a plan from being safe to release?
- Which customer changes force a new plan or customer update?
- How do field requests reach you, and how do crews know the result?
- What proof must you review before a customer sees it?
- At what workload would a separate dispatcher become necessary?

### Crew Lead

- Walk me through the first five minutes before starting a stop.
- Which property, access, safety, scope, and crew facts are essential?
- What can you decide in the field without office approval?
- Describe the last time the released plan could not be followed.
- What evidence do you capture, and how do you know it is safely retained?
- Which tasks need a named individual rather than crew-level responsibility?

## Neutral follow-up prompts

Use these instead of suggesting product behavior:

- “What happened next?”
- “How did you know?”
- “What made that difficult?”
- “Who owned it at that point?”
- “What information did they need?”
- “What did you expect to happen?”
- “Can you tell me about the last real example?”
- “What would happen if that information were missing?”

Avoid “Would you use…?”, “Do you like…?”, and explanations of what the
prototype is intended to do.

## Task scenarios for later prototype review

These are outcome prompts, not click instructions.

| Persona | Scenario | Success evidence |
| --- | --- | --- |
| Yard Owner | Find what will happen at the next visit and determine whether the property needs preparation | Participant states date/window, planned care, preparation, and next update owner |
| Property Manager | Find the one property blocking tomorrow's service and decide what to do | Participant identifies exact property/visit, missing context, authority, and consequence |
| Company Owner | Determine whether the company can operate tomorrow and resolve the highest owner-level blocker | Participant identifies business impact, responsible person, and bounded owner action |
| Company Manager | Turn accepted work into a publishable plan, then respond to a field access change | Participant preserves plan version, customer impact, field ownership, and recovery path |
| Crew Lead | Start the correct stop, record completion, and recover when access or connectivity changes | Participant confirms scope/safety, avoids silent plan mutation, and preserves evidence |

## Synthesis method

After each round:

1. Group evidence by workflow stage and persona, not by screen.
2. Separate observations from participant opinions and team interpretations.
3. Link every supported or contradicted hypothesis to evidence IDs.
4. Identify repeated triggers, questions, decisions, handoffs, breakdowns, and
   success signals.
5. Record meaningful differences in context rather than averaging them away.
6. Update the current path before proposing the target path.
7. Promote a workflow statement to Decision only when the decision owner
   accepts the evidence and tradeoff.

Use this confidence scale:

| Level | Evidence condition | Allowed use |
| --- | --- | --- |
| 0 — Assumption | Team belief only | Research prompt, never implementation justification |
| 1 — Signal | One relevant observation or artifact | Candidate pattern |
| 2 — Repeated | Similar evidence across multiple relevant sessions or contexts | Prototype direction |
| 3 — Triangulated | Repeated user evidence plus operating or product evidence | Adoption candidate, subject to authorization and feasibility |

Frequency alone does not override a severe safety, privacy, authorization, or
data-integrity consequence.

## WF1 completion checklist

- [ ] Each core persona has at least one completed discovery session.
- [ ] Owner-operator Company Owner/Manager overlap has been observed.
- [ ] Crew Lead context includes realistic device and connectivity conditions.
- [ ] Property Manager inclusion has an evidence-backed MVP decision.
- [ ] Every retained hypothesis links to evidence or remains explicitly weak.
- [ ] Current paths include tools, workarounds, delays, and failure recovery.
- [ ] Persona vocabulary is captured without prototype prompting.
- [ ] Dispatcher and Crew Member scale signals are recorded without entering the
      MVP path.
- [ ] Raw participant identity and sensitive operating data remain outside the
      repository.
- [ ] Synthesis decisions and unresolved questions are recorded in the workflow
      document and decision log.

WF1 is not complete merely because the board exists. Completion requires actual
participant evidence and synthesis.
