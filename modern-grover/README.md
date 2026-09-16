# Modern Grover: independent planning and review

This directory owns the new application experience planning round. It is
separate from earlier website, persona, portal, minimalist, and service-thread
attempts in `design/`. Those artifacts are evidence or candidate ideas, not
automatic requirements for this track. The repository-wide [`PLAN.md`](../PLAN.md)
remains the canonical delivery-status tracker; this directory owns the working
questions, review findings, and proposed sequence for Modern Grover.

When the local Vite review server is running, the [styled phone review](index.html)
is available at `/modern-grover/`. It is served separately from `/design/`.

## Start here

| Document | Role | Status |
| --- | --- | --- |
| [Workplan](WORKPLAN.md) | Planning and development sequence, phase exits, and immediate work | Active |
| [Product decisions](PRODUCT_DECISIONS.md) | Questions that require a product choice before public or role adoption | Open decisions |
| [Public claim inventory](CLAIM_INVENTORY.md) | First-pass copy-to-capability audit and wording to test | Source audit; product copy unapproved |
| [Critical workflow review](review/application-workflow-critical-review-2026-09-16.md) | Evidence, design risks, and proposed rework | Expert/local-browser review; no participant results |
| [Experience blueprint](review/application-experience-blueprint.md) | First-pass cross-role service and handoff map | Hypothesis for testing |

The existing [modern website preview](../design/prototypes/modern-grover/README.md)
and its [earlier plan](../design/review/modern-website-prototype-plan.md) are
prior candidates. The [simplified service-thread prototype](../design/prototypes/simplified-service-thread/README.md),
[current frontend audit](../design/review/current-frontend-design-audit-2026-09-03.md),
and [persona hypotheses](../design/personas/README.md) are research inputs.
Their visual choices and navigation do not become the Modern Grover target
without evidence and an explicit decision here.

## Working rule

For every proposed change, distinguish **current app**, **prior prototype**,
**new hypothesis**, **observed user evidence**, and **approved development
slice**. A polished preview, local fixture, or team preference is not user
validation. The new working prototype, when scoped, belongs under this
directory so its review history stays distinct from the previous candidates.

No authentication, authority, persistence, privacy, offline, or payment
behavior is changed by this planning track. Production adoption requires an
approved task flow and the corresponding application/API contracts.
