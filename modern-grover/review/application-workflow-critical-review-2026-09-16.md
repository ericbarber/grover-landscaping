# Grover application workflow: critical review

Status: current-state review and design hypotheses; participant evidence pending

Reviewed: 2026-09-16

Decision owner: product/design

## Review boundary

I walked through the PostgreSQL-backed local-review React app at 390 × 844 as
Company Owner and Company Manager, opened the manager's Schedule path, inspected
the public entry and provider entry source, and traced the modern website
concept, persona profiles, delivery plan, and existing SX4 comparison package.
The local-review identity selector is diagnostic chrome, not hosted product UI.
The modern concept uses fixed illustrative data and does not save actions. No
participant sessions or healthy production deployment were available for this
review. Findings below distinguish direct observations from risks to validate.

The [September 3 frontend audit](../../design/review/current-frontend-design-audit-2026-09-03.md)
already identified date/state truth, Yard Owner recovery, manager continuity,
shell height, and artifact-parity problems. Subsequent delivery work addressed
those specific issues. This review focuses on the remaining end-to-end workflow
and the new concept; it does not reopen those findings without new evidence.

## Judgment

Grover has strong individual surfaces, but the current application's organizing
unit is still a destination or tool, while its most important user outcome is a
service that moves between people. The modern concept states that outcome more
clearly. It is a communication prototype, not yet a workflow prototype: its
single scripted record, role selector, and inspect-only dialogs cannot test a
decision, release, field interruption, proof correction, or recovery. The next
design investment should be a shared service blueprint and matched task tests,
then a bounded React adoption slice. A broad visual refresh would leave the
main workflow uncertainty intact.

## Findings and design response

| Priority | Finding and evidence | Consequence | Rework to test |
| --- | --- | --- | --- |
| P1 · observed | **A manager reaches work through a tool directory.** In the live Company Manager fixture, Home recommends “Manage,” Manage shows six categories, Schedule then shows a second choice of Day plans or Workload. The manager's first screen also emphasizes `0 of 3 jobs complete` and Route/Jobs/Job shortcuts. See [workspace persona navigation](../../frontend/src/domain/workspacePersona.ts), [Home shortcuts](../../frontend/src/components/WorkspaceHomePanel.tsx), and [manager menu](../../frontend/src/components/ManagerWorkspaceMenu.tsx). | A user must know the software's categories before finding the affected service or office decision. A manager may read field output as their own primary task. | Start Company Manager at a short Today queue ordered by customer/service consequence. Open an exact service with plan version, customer impact, next owner, and contextual Schedule/Reports/Recovery actions. Keep global tools for exceptional administration. Validate with ST-04. |
| P1 · observed, adoption risk | **The public promise and product boundary diverge.** The current public default is Landscaping company and says billing and revenue stay connected and describes “completed revenue”; [landing copy](../../frontend/src/components/PublicLandingPage.tsx) and [default persona](../../frontend/src/components/PublicLandingPage.tsx) show this. [PLAN.md](../../PLAN.md) still gates billing, invoices, and payments. The modern concept instead opens with a broad care story and two audience paths. | A buyer may infer that invoicing or payment is available, while the new concept does not yet establish which audience should enter first. Trust is at risk before sign-up. | Decide the first buyer/user and make a capability-verified promise matrix. Separate delivered completion evidence and billing readiness from invoice/payment capability. Test the entry choice with MW-01/MW-02 before using the concept as the live site. |
| P1 · observed in concept | **The prototype stops before the consequential action.** Each role has one fixed Mesa Court state; “Inspect task” opens a dialog explaining what production would require. The [prototype script](../../design/prototypes/modern-grover/app.js) does not model response, release, saved field work, proof correction, or handoff completion. | Reviewers can approve attractive layout while missing whether the next step is safe, reversible, and understandable. | Give one service thread real branching in the prototype: Yard Owner decision → manager release → Crew Lead progress/offline request → manager proof review → Yard Owner outcome. Include version conflict and failed read. Keep actions explicitly simulated. Compare task outcomes, not preference. |
| P1 · hypothesis | **Entry paths may hide important identities.** The modern site has customer/provider paths; Property Manager is grouped with Yard Owner and provider opens a Company Manager preview. The production [provider entry](../../frontend/src/components/ProviderEntryPage.tsx) distinguishes owner-operator, company owner, invited team member, and known-owner connection. | A property manager or one-person provider may choose a plausible but wrong path or expect an account they cannot create. | Test the four real entry intents from the public home. Promote Property Manager or owner-operator only if observed wrong turns justify it. Keep invitation-specific entry attached to its token and scope. |
| P2 · observed in concept | **“On track” and unavailable states lose accountability.** The [prototype script](../../design/prototypes/modern-grover/app.js) replaces the exact next owner with “the responsible team”; the unavailable dialog refers to a support path without naming a supported route. | A calm state can still leave a user unsure when to check back or who will act. In an outage, an unspecified support promise may create a dead end. | Show the exact responsible role and expected next update when the source provides them; otherwise state that timing/owner cannot be confirmed. Link recovery only to a real authorized destination. Test MW-08 and the SX4 access/authorization tasks. |
| P2 · observed, limited to local review | **The phone's first useful action is late.** At 390 × 844 the Company Manager Home stacks diagnostic identity chrome, a large hero, delivery count, sync status, and a reminder before the recommended Manage action. The diagnostic strip accounts for some of the height; the production effect is unverified. | A field or office user may need to scroll before seeing the reason to open the app. | Measure a hosted-equivalent viewport without local-review chrome. If the action still falls below the first viewport, put current work and a single next action before the editorial hero; test at 320/390 px, browser chrome, and 200% text. |
| P1 · evidence gap | **Persona and prototype confidence exceeds user evidence.** The [personas](../../design/personas/README.md) are explicitly hypotheses; the [modern comparison guide](../../design/review/modern-website-comparison-guide.md) and [SX4 study](../../design/review/simplified-product-experience-comparative-study.md) are ready but contain no participant observations. | Design choices may follow team expectations, sample-data polish, or a visual preference vote. | Run matched current-app versus service-thread tasks with representative users. Keep the website entry test separate from authenticated task completion. Record wrong turns, time to orientation, authority/version accuracy, recovery, and confidence. |

P1 means resolve before adopting the affected composition into production. P2
means validate and fix in the next related design slice. These are design
priorities, not claims about production incident severity.

## What to preserve

- The current customer, Route, and Portfolio surfaces show useful role filtering
  and stronger task hierarchy than the manager tool directory.
- Exact plan versions, customer/provider privacy separation, offline retention,
  and reviewed proof are essential contracts. Simplification must keep them.
- The modern concept has a coherent visual language and clearly marks sample
  content; its responsive and accessibility checks are useful implementation
  groundwork.
- The [simplified service-thread design](../../design/review/simplified-product-experience-plan.md)
  already defines a plausible shared information model. Treat it as a testable
  proposal, not as a proven replacement.

## Build a clear picture of the experience

Use one service outcome as the unit of study, then view it through each person's
authorized perspective. The
[first-pass cross-role blueprint](application-experience-blueprint.md) records
the shared handoffs and open failure branches. It follows this chain:

`public entry → access/relationship → need/scope → customer decision → exact plan/release → field work/offline exception → proof review → customer outcome/recovery`

For each transition, record the same eight facts: actor, their first question,
exact record/version, authoritative source, action allowed, next owner, expected
update, and failure/recovery route. Mark whether each fact is **implemented**,
**prototype only**, **planned**, or **unknown**. Use the existing
[54-event timeline](../../design/review/yard-care-completion-event-timeline.md) as the event index;
the new map should compress it into an understandable cross-role service
blueprint rather than duplicate its detail.

### Evidence sequence

1. **Freeze a fair baseline.** Record current commit, local-review mode,
   fixtures, roles, viewport, connectivity, and which external services are
   unavailable. Compare equivalent service facts in each design condition.
2. **Trace five complete paths.** Yard Owner decision/outcome, Property Manager
   exception, Company Owner blocker/handoff, Company Manager plan conflict and
   proof correction, and Crew Lead interrupted stop. Include first-run access
   and an unavailable read. Draw handoffs and failure branches, not just screens.
3. **Run the prepared [SX4 study](../../design/review/simplified-product-experience-comparative-study.md).**
   Start each task at the normal entry, counterbalance order, and use at least
   two people per core perspective as that guide specifies. Run
   [MW-01/MW-02](../../design/review/modern-website-comparison-guide.md) separately for public path
   selection. Include a real phone and intermittent connectivity for Crew Lead.
4. **Synthesize by task and event.** For every issue, keep a timestamped
   observation, participant statement, or code/fixture artifact distinct from
   the team's interpretation. Count unassisted completion, wrong turns, context
   changes, authority/version errors, recovery success, and confidence. Report
   small-sample counts and conditions, not population percentages.
5. **Make a bounded adoption decision.** Keep, revise, or reject each task
   composition. Before React work, name the exact API, authorization, state,
   persistence, offline, failure, telemetry, and rollback contracts for that
   slice. Re-run the affected task after revision.

## Immediate design decisions

1. Choose the primary public audience and truthful capability promise before
   refining the home hero or sign-up CTA. Decide whether Property Manager and
   owner-operator need their own first-level paths from observed entry errors.
2. Decide whether Company Owner/Manager Home should lead with business/office
   decisions by default, while Route/Jobs remain reachable only when the active
   user's authorized field responsibility calls for them.
3. Use the service-thread model to prototype one consequential cross-role flow,
   then run the already prepared comparative study. Do not adopt the modern
   workspace layout solely from visual review.
