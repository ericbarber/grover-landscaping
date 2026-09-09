# Simplified Product Experience Comparative Study

Status: session package ready; participant evidence pending

Design phase: SX4 — Evidence-led refinement

Last updated: 2026-09-09

## Decision this study supports

Determine whether the post-MVP service-thread design lets people understand and
complete real service outcomes with fewer context changes, wrong turns, and
authority mistakes than the current feature-oriented product.

This is a workflow comparison, not a preference test or visual-style vote. A
participant liking the new screen is not evidence that it is safer, clearer, or
ready for production adoption.

Use this package with the neutral facilitation, privacy, evidence-ID, and
synthesis rules in the retained
[workflow session guide](minimal-product-workflow-session-guide.md). The
[simplified product experience plan](simplified-product-experience-plan.md)
defines the design contract under review.

Use the [yard-care completion event timeline](yard-care-completion-event-timeline.md)
to assign every observation to the exact expected or conditional event under
review. Do not require product-gated follow-ons to complete a core task.

## Artifacts under comparison

| Condition | Primary artifact | Fallback | Evidence boundary |
| --- | --- | --- | --- |
| Current product | Private-review React application with a prepared non-production account and representative records | [Dated current frontend mirror](../prototypes/current-frontend-review/index.html) | Record the exact commit, data fixture, viewport, and unavailable external service. The dated mirror is not current production parity. |
| Simplified design | [Service-thread prototype](../prototypes/simplified-service-thread/index.html) | Published gallery captures for discussion only | Actions are illustrative and non-persistent. The prototype tests composition and language, not backend feasibility or authorization. |

Never compare a live, incomplete current record with an idealized prototype
record without noting that asymmetry. Prepare equivalent facts and outcomes in
both conditions before the session.

## Study round

Run a small formative comparison round before any React adoption plan:

- two or more relevant participants for each core perspective: Yard Owner,
  Property Manager, Company Owner, Company Manager, and Crew Lead;
- at least one Company Owner who also performs Company Manager work;
- at least one Crew Lead using a representative phone outdoors or under
  simulated intermittent connectivity;
- one Support specialist for the minimized incident path, when available; and
- one organization administrator or recently invited user for access-recovery
  comprehension, without exposing real ended memberships.

Billing-readiness review requires the product owner or operating specialist who
can distinguish evidence readiness from financial authority. It does not
require or imply a billing implementation decision.

This round is formative. Report observed counts and contexts, not population
percentages or statistical significance.

## Counterbalanced sequence

Learning from the first interface can make the second appear easier. Alternate
the order within each persona group.

| Participant sequence | First condition | Neutral reset | Second condition |
| --- | --- | --- | --- |
| A | Current product | Two-minute unrelated context prompt and fresh task record | Simplified design |
| B | Simplified design | Two-minute unrelated context prompt and fresh task record | Current product |

Do not tell participants which condition is new or preferred. Use the same
outcome prompt, underlying facts, permitted authority, and success definition in
both conditions. Do not reuse a record whose answer the participant has already
memorized.

## Core task set

Each task starts from the persona's normal entry point, not a deep link. The
facilitator may provide sign-in and prototype-review instructions but must not
name the destination or control needed to finish.

### ST-01 — Yard Owner decision and outcome

Prompt: “Find the service that needs your response. Decide what you would need
to do before work can be scheduled, then show how you would later confirm what
was delivered.”

Success requires the participant to identify the exact scope/version, price,
decision consequence, next owner, and reviewed proof without treating acceptance
as scheduling or draft evidence as delivered.

### ST-02 — Property Manager exception

Prompt: “One property in your authorized portfolio needs attention. Find it,
explain what is blocking progress, and show the response you would make.”

Success requires the exact property, decision/version, consequence, and provider
handoff. Opening unrelated properties or relying on provider-private route or
crew detail is a wrong turn.

### ST-03 — Company Owner business risk

Prompt: “Determine whether tomorrow's customer commitment is covered and
whether you personally need to intervene.”

Success requires the business consequence, accountable operator, and a correct
statement about whether owner action is needed. Editing a plan or entering
low-level field work is an authority error.

### ST-04 — Company Manager conflict and proof correction

Prompt: “A proposed access change conflicts with released work. Resolve what
should happen without silently changing the plan. Then find the completion
package that cannot yet be delivered and explain why.”

Success requires retaining Plan 8 until review, identifying customer impact,
choosing an explicit conflict response, retaining completed field work, and
holding customer proof until the exact correction is made.

### ST-05 — Crew Lead interrupted field work

Prompt: “You are partway through the current stop when the connection drops.
Show what you can safely continue, what is retained, and what still belongs to
the office.”

Success requires the released plan, saved task/photo state, safe continuation,
and correct plan/contact authority. Restarting work, discarding device-held
evidence, changing the route, or contacting the customer directly is a critical
error.

## Exception comprehension tasks

Run these after the core task so they do not prime participants to expect a
failure everywhere.

| Task | Outcome prompt | Required understanding |
| --- | --- | --- |
| ST-06 Support | “An expected field update did not reach the manager. Find what Support can know and do.” | Owned incident, minimized service reference, last confirmed event, no standing access, exact manager return |
| ST-07 Access ended | “Your account works but workspace access does not. Find the safe next step.” | No active role assumed, no protected record loaded, invitation/membership recovery owner |
| ST-08 Authorization mismatch | “A property link cannot be authorized. Explain what the product knows and what it withheld.” | Mismatch is not an empty portfolio; property/service data is absent; authorized portfolio remains the safe exit |
| ST-09 Completion readiness | “Determine what is missing after reviewed completion and what financial action is available.” | Exact evidence gap and manager handoff; no invoice, payment, refund, ledger, or accounting action exists |

## Observation protocol

Start timing after the outcome prompt and stop when the participant says the
task is complete. Timing is diagnostic, not a standalone success measure.

For each task and condition record:

| Field | Allowed value or method |
| --- | --- |
| Evidence ID | `SX4-{persona}-{session}-{observation}` |
| Condition | `current` or `service-thread` |
| Sequence | `A` or `B` |
| Task | `ST-01` through `ST-09` |
| Completion | unassisted, assisted, incomplete, or unsafe |
| First answer | participant's first interpretation before acting |
| Time to orientation | seconds until correct record/state/owner are stated |
| Context changes | count of destination, tool, or record changes |
| Wrong turns | count plus destination and reason |
| Authority statement | exact or neutral paraphrase of what the participant believes they may change |
| Version/state accuracy | correct, partial, incorrect, or not applicable |
| Recovery accuracy | correct, partial, incorrect, or not applicable |
| Confidence | participant-reported 1–5 after completion |
| Facilitator help | timestamp and exact neutral help given |
| Severity | none, friction, consequential, or critical |
| Evidence type | observed behavior, participant statement, artifact, or team interpretation |

A context change is counted when the participant must leave the affected
service/incident/access record to gather facts or act. Opening progressive
detail inside the same record is not a context change. A wrong turn is a move
toward an unrelated destination, record, or authority—not exploratory reading
inside the relevant context.

## Severity and stop rules

| Severity | Definition | Study response |
| --- | --- | --- |
| Friction | Delay or uncertainty with no wrong outcome or authority consequence | Continue and record |
| Consequential | Likely missed handoff, duplicate work, stale version, or misunderstood outcome | Complete safely, then debrief |
| Critical | Protected-data exposure, unsafe field action, silent plan mutation, false proof delivery, or unauthorized financial action | Stop the task, protect data/safety, and record a release-blocking finding |

The facilitator must stop a task that could affect real customers, field safety,
production data, or external communications. Use non-production accounts and
illustrative records for all write-intent tasks.

## Adoption decision gates

The team may recommend a bounded React adoption slice only when all of these are
true for the relevant task and persona:

1. No unresolved critical privacy, safety, authorization, persistence, or truth
   finding exists.
2. Participants can identify the exact record, current state, and next owner
   without facilitator explanation.
3. The service-thread condition has no repeated authority misunderstanding.
4. It does not increase observed wrong turns or context changes relative to the
   prepared current-product condition without a documented safety benefit.
5. Required information from the current product is either retained, moved into
   progressive detail, or deliberately removed by an explicit decision.
6. The proposed slice maps to real API, authorization, persistence, failure,
   telemetry, and rollback contracts.

A mixed result is not a forced accept/reject. Record which composition is
accepted, revised, rejected, or still gated at the task and persona level.

## Session note template

```text
Session ID: SX4-__-__
Anonymous participant label:
Persona and operating context:
Device / viewport / connectivity:
Sequence: A | B
Current-product commit and fixture:
Service-thread prototype commit:
Consent and recording status:
Facilitator / note taker / observers:

Task:
Condition:
Outcome: unassisted | assisted | incomplete | unsafe
Orientation seconds:
Context changes:
Wrong turns:
Version/state accuracy:
Authority understanding:
Recovery understanding:
Confidence 1–5:
Facilitator help:
Observation IDs:
Critical or consequential finding:

Participant comparison, asked only after both conditions:
- Which path made the current state easiest to explain, and why?
- Where did you lose the service context?
- What appeared editable that should not be?
- What information arrived too early, too late, or not at all?

Facilitator debrief:
- Strongest observed evidence:
- Order or fixture confound:
- Contradicted hypothesis:
- Follow-up required:
```

## Synthesis output

After the round, create one evidence table organized by task and persona. For
each proposed design change record:

- linked observation IDs from both conditions;
- affected workflow stage and authority boundary;
- repeated pattern and meaningful context differences;
- severity and confidence level from the shared session guide;
- decision: accept, revise, reject, or remain gated;
- exact prototype change, if any; and
- whether a React adoption slice may be planned.

Do not edit the prototype during a participant session. Batch revisions after a
round so each observation refers to a stable commit and condition.

## SX4 exit checklist

- [ ] Prepared current and service-thread fixtures contain equivalent facts.
- [ ] Each core perspective has completed both counterbalanced conditions.
- [ ] Owner/Manager role overlap and realistic Crew Lead device context appear
      in the round.
- [ ] Critical findings are resolved or explicitly block adoption.
- [ ] Counts are reported with participant context, not as population claims.
- [ ] Every design decision links to anonymous evidence IDs.
- [ ] Accepted patterns map to production authorization and data contracts.
- [ ] `PLAN.md`, the decision log, and prototype adoption tracker distinguish
      observed results from remaining hypotheses.

SX4 remains incomplete until real participant sessions and synthesis satisfy
this checklist. A prepared script, prototype, or team walkthrough is not user
evidence.
