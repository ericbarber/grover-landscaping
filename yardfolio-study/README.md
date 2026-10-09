# Yardfolio Study: independent planning and review

This directory owns the new application experience planning round. It is
separate from earlier website, persona, portal, minimalist, and service-thread
attempts in `design/`. Those artifacts are evidence or candidate ideas, not
automatic requirements for this track. The repository-wide [`PLAN.md`](../PLAN.md)
remains the canonical delivery-status tracker; this directory owns the working
questions, review findings, and proposed sequence for Yardfolio Study.

When the local Vite review server is running, the [styled phone review](index.html)
is available at `/yardfolio-study/`. It is served separately from `/design/`.

## Start here

| Document | Role | Status |
| --- | --- | --- |
| [Workplan](WORKPLAN.md) | Planning and development sequence, phase exits, and immediate work | Active |
| [Product decisions](PRODUCT_DECISIONS.md) | Questions that require a product choice before public or role adoption | MG-D6 decided; MG-D1–D5 open |
| [Property Manager access contract](PROPERTY_MANAGER_ACCESS.md) | Customer-controlled delegation after provider relationship activation | API/UI delivered; two isolated live grants verified through supported writes |
| [Independent personas](personas/README.md) | Five first-wave task and authority hypotheses plus secondary/recovery perspectives | Research hypotheses; not participant findings |
| [Public claim inventory](CLAIM_INVENTORY.md) | First-pass copy-to-capability audit and wording to test | Source audit; product copy unapproved |
| [Current journey trace](CURRENT_JOURNEYS.md) | Phone review of normal entry paths and protected-read repairs | Local-review observation; participant comparison pending |
| [Matched fixture specification](MATCHED_FIXTURES.md) | Two equivalent synthetic services for fair comparison | Specified and live-verified through supported outcome delivery |
| [Current-app fixture and authority map](FIXTURE_READINESS.md) | Route, permission, data-chain, and comparison prerequisites | Source and isolated live fixture checks complete |
| [Local-review fixture probe and manifest contract](fixtures/README.md) | Privacy-minimized readiness probe plus structural manifest validation | Seeder/reset implemented and live-verified three times end to end |
| [Isolated seed contract](fixtures/SEED_CONTRACT.md) | Transition order, reset ownership, and date/role gates for matched records | Implemented; participant evidence remains |
| [Local study environment](fixtures/LOCAL_STUDY_ENV.md) | Separate database, API, and migration baseline | Three full-lifecycle cycles reset to zero on this host |
| [Formative session protocol](research/SESSION_PROTOCOL.md) and [notes template](research/SESSION_NOTES_TEMPLATE.md) | Neutral public and five-role tasks, comparison eligibility, and evidence capture | Prepared; no participant sessions |
| [Service handoff prototype](prototype/README.md) | M2 customer, manager, field, office, proof, outcome, portfolio, and owner task moments | Interactive concept; no real write or participant result |
| [Critical workflow review](review/application-workflow-critical-review-2026-09-16.md) | Evidence, design risks, and proposed rework | Expert/local-browser review; no participant results |
| [Experience blueprint](review/application-experience-blueprint.md) | First-pass cross-role service and handoff map | Hypothesis for testing |

The existing [modern website preview](../design/prototypes/yardfolio-study/README.md)
and its [earlier plan](../design/review/modern-website-prototype-plan.md) are
prior candidates. The [simplified service-thread prototype](../design/prototypes/simplified-service-thread/README.md),
[current frontend audit](../design/review/current-frontend-design-audit-2026-09-03.md),
and [prior persona hypotheses](../design/personas/README.md) are research inputs.
Their visual choices and navigation do not become the Yardfolio Study target
without evidence and an explicit decision here.

## Working rule

For every proposed change, distinguish **current app**, **prior prototype**,
**new hypothesis**, **observed user evidence**, and **approved development
slice**. A polished preview, local fixture, or team preference is not user
validation. The new working prototype lives under this directory so its review
history stays distinct from the previous candidates.

No authentication, authority, persistence, privacy, offline, or payment
behavior is changed by this planning track. Production adoption requires an
approved task flow and the corresponding application/API contracts.
