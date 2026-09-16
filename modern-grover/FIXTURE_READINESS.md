# Current-app fixture and authority map

Status: source-verified planning record, updated after the protected Property
Manager Portfolio read on 2026-09-16. No matched record has been seeded, no
protected write was made for this review,
and no participant comparison is claimed. The [matched facts](MATCHED_FIXTURES.md)
describe task moments, not one record that can be in every lifecycle state at
once.

## What the current app can represent

| Task moment | Current route and surface | Authority and data needed | Readiness for a matched task |
| --- | --- | --- | --- |
| Yard Owner decides proposal v3 | `GET /owner-properties/{property_id}/initial-service-proposals`, detail, messages, and `POST .../{proposal_id}/decision`; `OwnerInitialServiceProposalPanel` in the acquisition flow | Owner property, invitation, disclosure grant, assessment, immutable v3 proposal with $420 fixed price; exact-version acceptance and affirmation. A change request is a proposal message; the decision endpoint supports accept or decline. | API path exists. Neither Canyon View nor Sage Lane has been prepared. The prototype's “request revision” must map to the message path, not an acceptance decision. |
| Customer sees confirmed work | `GET /customer-portal/visits` and `.../{visit_reference}/messages`; Yard Owner Home and My yard | Active portal grant plus matching active organization, account relation, property, and membership with the same role and scope. Accepted proposal alone is insufficient: activation, active relationship, confirmed first-visit series/proposal/decision, and a service release are needed for a linked visit. | Local Yard Owner currently has no active portal access. A proposal task and a portal task need separate prepared snapshots or full authorized progression. |
| Company Manager releases work | Provider service release for an activation and confirmed first-visit version; separately `POST /day-plans`, stop assignment, and `POST /day-plans/{id}/publish`; Manage → Schedule → Day plans | Organization owner/manager can release the initial service and manage a crew schedule. The immutable service release creates/links a job; the route stop links that job to a crew and service date. | Separate workflows exist. There is no single service-centered “accepted proposal → crew fit → release Plan 8” screen. `day_plans` has an ID, date, status, and stops but no Plan 8/9 version field or exact-version publish guard. Label Plan 8/9 as prototype language only. |
| Crew Lead works and recovers | `GET /crews/{crew_id}/day-plan/today`, stop status, job checklist, photos, and day-plan amendments; Route and Job surfaces | Crew route read requires an authorized organization role. The route query picks a published plan for today first, then latest past, then earliest future. The field UI currently requests the seeded `crew_1001` ID. Offline queueing exists for stop progress and amendments; photo/checklist queues have separate paths. | The June 15 sample route is past on the study date. Seed a current published route and verify crew assignment, protected reads, local storage, replay, and conflicts on the actual study device. Amendment types are add/remove stop or add service; they do not express the prototype's access clarification. |
| Manager resolves field access | `GET/POST /operational-exceptions`, `PUT /operational-exceptions/{id}`; Manage → Exceptions. Day-plan amendment review is a separate route. | Exception list/write requires an active owner/manager schedule role. An exception may reference a route, job, property, crew, or stop and can be assigned, started, resolved, or reopened with an expected update timestamp. | An access exception and assigned manager can be represented for office review. Crew Lead cannot create it through this endpoint, and the exception is not a versioned Plan 8/9 release. The prototype's cross-role handoff is not comparable as one completed current-app task. |
| Manager reviews and delivers proof | `GET /completion-reports`, `POST /completion-reports/{id}/review`, `.../request-changes`, `.../resubmit`, `.../deliver`; Manage → Reports | Report lifecycle, eligible reviewer/deliverer role, job evidence, and a delivered snapshot. Customer `GET /customer-portal/visits/{reference}/proof` returns only delivered proof; pending proof has a distinct response. | Real lifecycle exists, but no matched evidence package or image has been prepared. The prototype's “package 1/2” exact-version labels are study language; verify the current report's persisted status and snapshot before scoring a task. |
| Property Manager scans portfolio | `/app` Portfolio now uses `PropertyManagerAuthorizedPortfolioPanel` with `GET /customer-portal/visits`; Home uses the same protected read. Backend also has separate account-portfolio and property report-history routes. | At least two properties returned by a valid property-manager portal grant and matching membership/scope; one customer-safe visit question. | The preview property/visit props are no longer shown in this workspace. The local identity receives `customer_portal_access_required`. The supported activation write creates only a Property Owner membership/grant, and `activation_id` is unique per portal grant; no Property Manager grant-issuance route was found. This task is not yet comparable. The protected collection also lacks grouping, addresses, proof history, and a provider-originated access request. |
| Company Owner finds accountable operator | `/app` Home → Manage; operational exceptions and manager schedule routes use the owner's organization authority | One company-level exception with a named accountable manager and a linked resource | The exception record can hold an assignee, but Home currently leads with field job totals. A normal-entry owner task needs a source-backed business queue or must be scored only as a navigation study. |

The route and permission statements above come from `backend/src/main.rs`,
`backend/src/access_control.rs`, `backend/src/customer_portal_access.rs`,
`backend/src/postgres_day_plans.rs`, the related migrations, and the named
frontend panels. They describe code paths, not hosted behavior. The
[current journey trace](CURRENT_JOURNEYS.md) records the limited local browser
observation. PostgreSQL command-line tools were unavailable in this review
environment, so database counts were not independently rechecked here.
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
   normal `/app` entry and direct API read. A supported Property Manager
   delegation/issuance contract is needed before a manager fixture can be
   treated as production-equivalent. Do not use a direct SQL grant as proof
   that the intended access workflow exists.
4. Prepare distinct field, exception, proof-review, and delivered-outcome
   snapshots through supported transitions. Verify proof is hidden before
   delivery and that failed reads never become confident empty states.
5. Capture a reset/replay script or repeatable database snapshot, then run the
   same task at 320 and 390 px with a recorded online/offline condition. Only
   score tasks for which both current and new conditions show the same facts
   and authorized next action.

## Next bounded development

Property Manager Portfolio now reads the authorized visit collection and
withholds sample records on denial or failure. Next prepare the smallest
Yard Owner proposal and portal fixture copies through supported writes.
Specify and approve how a Property Manager receives and loses property or
account access before building a manager grant fixture. The previous
preview-only Proof and Approvals tabs are not presented as live
capabilities in this protected view; source-backed equivalents require their
own contract and verification. Separately decide whether the proposed plan
revision and Crew Lead access-question handoff warrant new product/API
contracts. These decisions are prerequisites for claiming a full current-app
versus prototype completion comparison; they do not block simulated design
review of those moments.
