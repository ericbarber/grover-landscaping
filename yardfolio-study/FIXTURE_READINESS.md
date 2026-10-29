# Current-app fixture and authority map

Status: source- and live-verified fixture record, updated after two isolated
full-lifecycle seed/read/reset cycles on 2026-10-09. Supported matched records
have been prepared and returned to zero; no participant comparison is claimed.
The [matched facts](MATCHED_FIXTURES.md)
describe task moments, not one record that can be in every lifecycle state at
once.

## What the current app can represent

| Task moment | Current route and surface | Authority and data needed | Readiness for a matched task |
| --- | --- | --- | --- |
| Yard Owner decides proposal v3 | `GET /owner-properties/{property_id}/initial-service-proposals`, detail, messages, and `POST .../{proposal_id}/decision`; `OwnerInitialServiceProposalPanel` in the acquisition flow | Owner property, invitation, disclosure grant, assessment, immutable v3 proposal with $420 fixed price; exact-version acceptance and affirmation. A change request is a proposal message; the decision endpoint supports accept or decline. | Both records were live-verified through exact v3 reads, stale-v2 conflict, cross-owner denial, and acceptance. A participant task at the open moment requires a fresh independent copy because the full journey advances it forward. |
| Customer sees confirmed work | `GET /customer-portal/visits` and `.../{visit_reference}/messages`; Yard Owner Home and My yard | Active portal grant plus matching active organization, account relation, property, and membership with the same role and scope. Accepted proposal alone is insufficient: activation, active relationship, confirmed first-visit series/proposal/decision, and a service release are needed for a linked visit. | Both fixed owners live-read one authorized visit; the generic owner remained denied. A participant task before later completion requires its own forward-only copy. |
| Company Manager releases work | Provider service release for an activation and confirmed first-visit version; separately `POST /day-plans`, stop assignment, and `POST /day-plans/{id}/publish`; Manage → Schedule → Day plans | Organization owner/manager can release the initial service and manage a crew schedule. The immutable service release creates/links a job; the route stop links that job to a crew and service date. | Separate workflows exist. There is no single service-centered “accepted proposal → crew fit → release Plan 8” screen. `day_plans` has an ID, date, status, and stops but no Plan 8/9 version field or exact-version publish guard. Label Plan 8/9 as prototype language only. |
| Crew Lead works and recovers | `GET /crews/{crew_id}/day-plan/today`, stop status, job checklist, photos, and day-plan amendments; Route and Job surfaces | Crew route read requires an authorized organization role. The route query picks a published plan for today first, then latest past, then earliest future. The field UI currently requests the seeded `crew_1001` ID. Offline queueing exists for stop progress and amendments; photo/checklist queues have separate paths. | Both runs published and read a current-day exact stop, progressed stop/job state, and completed placeholder before/after evidence. Offline replay/conflict still needs observation on the actual study device; amendments do not express the prototype's access clarification. |
| Manager resolves field access | `GET/POST /operational-exceptions`, `PUT /operational-exceptions/{id}`; Manage → Exceptions. Day-plan amendment review is a separate route. | Exception list/write requires an active owner/manager schedule role. An exception may reference a route, job, property, crew, or stop and can be assigned, started, resolved, or reopened with an expected update timestamp. | Both jobs live-created an access exception, assigned the fixed manager, and entered `in_progress` through optimistic updates. Crew Lead cannot create it through this endpoint, so the prototype's origin/handoff and Plan 8/9 revision remain non-comparable. |
| Manager reviews and delivers proof | `GET /completion-reports`, `POST /completion-reports/{id}/review`, `.../request-changes`, `.../resubmit`, `.../deliver`; Manage → Reports | Report lifecycle, eligible reviewer/deliverer role, job evidence, and a delivered snapshot. Customer `GET /customer-portal/visits/{reference}/proof` returns only delivered proof; pending proof has a distinct response. | Both records live-passed change request, resubmission, re-review, delivery, pending-before-delivery, cross-owner denial, and minimized owner/manager proof. Placeholder evidence verifies workflow/privacy, not image quality; “package 1/2” remains prototype-only language. |
| Property Manager scans portfolio | `/app` Portfolio now uses `PropertyManagerAuthorizedPortfolioPanel` with `GET /customer-portal/visits`; Home uses the same protected read. Backend also has customer-controlled manager invitation, acceptance, and revocation routes. | At least two properties returned by separately accepted property-manager grants and matching membership/scope; one customer-safe visit question. | Two customer-issued invitations were accepted through supported APIs; the fixed Property Manager live-read two properties, two visits, and two delivered-proof indicators. The collection still lacks grouping, addresses, and a provider-originated access request. |
| Company Owner finds accountable operator | `/app` Home → Manage; operational exceptions and manager schedule routes use the owner's organization authority | One company-level exception with a named accountable manager and a linked resource | Two job-linked in-progress exceptions with the named fixed manager were live-verified. Home still leads with field job totals, so a normal-entry owner task must measure navigation rather than imply a dedicated business-risk queue. |

The route and permission statements above come from `backend/src/main.rs`,
`backend/src/access_control.rs`, `backend/src/customer_portal_access.rs`,
`backend/src/postgres_day_plans.rs`, the related migrations, and the named
frontend panels. The [current journey trace](CURRENT_JOURNEYS.md) records the
limited local browser observation. The isolated API/database transitions and
exact reset were exercised live; protected hosting remains separate evidence.
The [read-only local-review probe](fixtures/README.md) provides reproducible
API-level counts and states without exposing record details.
The [isolated seed contract](fixtures/SEED_CONTRACT.md) records the transition
and reset gates needed before writing matched study data.

## Record chain and comparison boundary

The current customer chain is owner property → invitation/disclosure/assessment
→ immutable initial proposal and decision → relationship activation and portal
grant → confirmed first visit → provider service release/job → route stop →
completion report/delivered snapshot → customer proof. The authorization chain
is a separate check. In particular, an active portal grant is valid only when
the matching active membership, role, scope, account relation, organization,
and property agree. Do not bypass those checks by inserting a grant alone.

The current route is identified by plan ID and date. The prototype's Plan 8/9
conflict is a design hypothesis about explicit revision handling. A new fixture
cannot prove that behavior in the current app. Similarly, the prototype's
access question and tab-held checklist state cannot be treated as successful
Crew Lead → manager transfer. For these tasks, compare comprehension and wrong
turns only; mark completion **not comparable** until an equivalent authorized
path exists.

## Safe fixture sequence

1. Reserve two synthetic organization/property/account chains and reviewer
   identities. Record exact role, membership, property scope, app commit,
   migration revision, fixed service date, and reset method. Use no real
   address, phone, or customer evidence.
2. Prepare the Yard Owner proposal-decision snapshot through supported
   acquisition writes and verify the v3 read and stale-version response. Keep
   a clean copy for each participant. Do not force a decided proposal back to
   `sent` by SQL.
3. Progress separate copies through activation, confirmed first visit, service
   release, job, day-plan stop, and authorized portal visit. Check each role's
   normal `/app` entry and direct API read. The customer-controlled
   [Property Manager access contract](PROPERTY_MANAGER_ACCESS.md) must be
   exercised through owner invitation and recipient acceptance before a manager
   fixture can be treated as production-equivalent. Do not use a direct SQL
   grant as proof that the intended access workflow exists.
4. The executor records field, exception, proof-review, and delivered-outcome
   checkpoints through supported transitions, including pending/cross-owner
   denial. Prepare independent copies when a session needs an earlier checkpoint.
5. Capture a reset/replay script or repeatable database snapshot, then run the
   same task at 320 and 390 px with a recorded online/offline condition. Only
   score tasks for which both current and new conditions show the same facts
   and authorized next action.

## Next bounded development

Property Manager Portfolio reads the authorized visit collection and withholds
sample records on denial or failure. Next prepare the smallest independent
proposal, portal, review, and delivered copies required by the participant task
order, using the verified executor and exact reset between sessions. The previous
preview-only Proof and Approvals tabs are not presented as live
capabilities in this protected view; source-backed equivalents require their
own contract and verification. Separately decide whether the proposed plan
revision and Crew Lead access-question handoff warrant new product/API
contracts. These decisions are prerequisites for claiming a full current-app
versus prototype completion comparison; they do not block simulated design
review of those moments.
