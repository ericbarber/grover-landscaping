# All-Persona Minimal Rollout Plan

## Outcome

Roll out every signed-in Grover workspace as a sequence of small, complete,
supportable capabilities. Each persona receives a minimum useful experience
before broader destinations or write authority appear. The
[interactive rollout map](../prototypes/yard-owner-minimal-rollout/index.html#overview/map)
shows all ten persona contracts and every cumulative unit.

This is a design and delivery contract. It does not claim that production
capability flags, pilot cohorts, or protected hosting are live. Existing API
authorization remains authoritative. The browser may hide an unavailable unit,
but it may never grant one.

The shared projection, audited cohort administration, managed-versus-legacy
state, cumulative desktop/mobile destinations, and Yard Owner U2–U4 contextual
composition are now delivered. Manager-style categories and tools also follow
the Company Owner, Company Manager, Property Manager, Dispatcher, Billing, and
Support unit maps. Field contextual controls now preserve read-only C1/CM1,
add assigned-work execution at C2/CM2, evidence at C3/CM3, and Crew Lead-only
route amendments at C4 while company and dispatcher field views remain
read-only oversight. Offline work is retained across suspension, and replay
waits for the corresponding field unit to become active. Property Manager
composition now progresses from P1
readiness/coverage through P2 search/history/proof, P3 questions/decisions, and
the already-bounded P4 administration tools; managed P1 does not request later
history. Protected unit smoke, operational enablement, and hosted cohorts
remain external. The repository-owned smoke runner is delivered: it checks the
exact managed projection, cumulative and forbidden capabilities, an authorized
resource read, and cross-resource denial without logging protected inputs.

## Production persona source

The rollout follows `frontend/src/domain/workspacePersona.ts`, including its
role mapping, navigation, and no-role fallback. Management surfaces are further
bounded by `frontend/src/components/ManagerWorkspaceMenu.tsx`.

| Workspace persona | Production role | Minimum useful unit | Complete path |
| --- | --- | --- | --- |
| Yard Owner | `PropertyOwner` | U1 Care visibility | U1–U4 |
| Property Manager | `PropertyManager` | P1 Portfolio readiness | P1–P4 |
| Crew Lead | `CrewLead` | C1 Day plan visibility | C1–C4 |
| Crew Member | `CrewMember` | CM1 Assigned work | CM1–CM4 |
| Yard-care Company Owner | `OrganizationOwner` | O1 Company readiness | O1–O4 |
| Yard-care Company Manager | `Manager` | M1 Operating readiness | M1–M4 |
| Dispatcher | `Dispatcher` (UI-defined; backend role not yet delivered) | D1 Schedule visibility | D1–D4 |
| Billing Administrator | `BillingAdmin` (UI-defined; backend role not yet delivered) | B1 Account records | B1–B3 |
| Support Administrator | `SupportAdmin` | S1 Support triage | S1–S4 |
| Team Member fallback | no active mapped role | G1 Access resolution | G1 only |

The [Yard Owner plan](yard-owner-minimal-rollout-plan.md) and
[Crew Lead plan](crew-lead-minimal-rollout-plan.md) remain the detailed
contracts for their already-reviewed units. This document completes the other
personas and defines shared sequencing.

The current authoritative Rust/API role union and membership editor do not yet
contain Dispatcher or BillingAdmin even though the React persona catalog maps
those keys. Their designs are included so the product boundary is complete,
but no server projection or live cohort may synthesize those roles from
Manager. That gap requires an explicit least-privilege role decision.

## Rules shared by every persona

- Capability is server-derived from current identity, organization/account,
  role, membership, resource scope, named cohort, and operational readiness.
- A unit is complete for the exact enabled subject or absent. Disabled
  destinations, inert actions, and “coming soon” panels do not appear.
- Read units must distinguish valid empty, stale or partial where applicable,
  access ended, inconsistent data, and unavailable service.
- Write units require retry identity, authoritative reload, replay and
  conflict behavior, named operational ownership, and audit evidence.
- Multi-role users receive the union of independently authorized persona
  workspaces. Enabling one persona never widens another persona’s resource
  scope.
- Rollback rejects new entry or writes and preserves immutable outcomes,
  accepted receipts, audit history, and permitted queued field work.
- Deep links repeat server authorization even when navigation is hidden.

## Property Manager

| Unit | Complete experience | Enablement gate | Rollback |
| --- | --- | --- | --- |
| P1 — Portfolio readiness | Home and Portfolio show authorized properties, coverage, next service, customer-safe exceptions, and truthful recovery. | Exact portfolio/property grants; provider owns access/schedule correction; protected cross-portfolio denial smoke. | Hide Portfolio for the grant; retain provider records and offer an account-safe Home recovery. |
| P2 — Property coverage and proof | Adds property search, service history, and immutable delivered proof without draft provider evidence. | P1; atomic proof delivery; pending/missing/unavailable contract; evidence reviewer. | Disable proof entry/read; never rewrite a delivered snapshot. |
| P3 — Approvals and questions | Adds exact-property questions and version-bound decisions with receipts. | P2; response owner; decision versioning; replay/conflict and retention rules. | Stop new messages/decisions; keep threads and receipts read-only. |
| P4 — Portfolio administration | Adds Manage containing only Customer view and Portfolios. | P3; manager-menu role filters and deep-link denials proven. | Hide Manage; Portfolio remains at the prior safe unit. |

Property Managers never inherit route, job, team, billing, or provider-private
recovery tools from proximity to the provider organization.

## Crew Member

| Unit | Complete experience | Enablement gate | Rollback |
| --- | --- | --- | --- |
| CM1 — Assigned work | Home and Route show only assigned stops, service/access context, date, and sync confidence. | Active membership and assignment; supported device; other-crew and unassigned-job denials. | Remove field entry and use the named Crew Lead/office fallback. |
| CM2 — Job execution | Jobs and Job add progress writes for assigned work only. | CM1; durable queue; actor/device binding; replay, conflict, permission-loss, and unknown-outcome recovery. | Reject new writes; preserve and visibly account for queued work. |
| CM3 — Field evidence | Adds checklist and offline-safe photo capture with quality retry. | CM2; object lifecycle/privacy policy; evidence reviewer; failed-upload recovery. | Stop new capture/submission; retain only permitted queued evidence. |
| CM4 — Personal recovery | Adds review and recovery of this member’s device-held changes plus Crew Lead escalation. | CM3; device ownership/loss procedure; exact local/server reconciliation. | Preserve unresolved work and hand it to the Crew Lead; never grant route mutation. |

Crew Members do not receive day-plan publishing, crew assignment, skip approval,
or route-level amendment authority.

## Yard-care Company Owner

| Unit | Complete experience | Enablement gate | Rollback |
| --- | --- | --- | --- |
| O1 — Company readiness | Home and Manage expose organization setup, company summary, crew/access readiness, and recovery. | Verified ownership; organization isolation; invitation/support owner. | Suspend the organization workspace without deleting configuration or memberships. |
| O2 — Daily operations | Adds schedule, dispatch hierarchy/workload, Route, Jobs, and Job oversight. | O1; publish/version contract; route/job authorization; correction history. | Stop new publish/change writes and keep the last published plan readable. |
| O3 — Customers and team | Adds property, account, portfolio, member, invitation, and activity tools. | O2; least-privilege role assignment; customer/property isolation; invitation lifecycle. | Stop new administration while retaining memberships, receipts, and audit history. |
| O4 — Reports and recovery | Adds operations/completion/question reporting plus notification, photo, exception, privacy, and erasure recovery. | O3; each recovery retry contract; retention/privacy controls; named support escalation. | Disable the affected recovery action independently; preserve original failures and outcomes. |

## Yard-care Company Manager

| Unit | Complete experience | Enablement gate | Rollback |
| --- | --- | --- | --- |
| M1 — Operating readiness | Home and Manage show company summary, day-plan confidence, workload risk, and recovery states. | Active Manager membership; exact organization scope; read smoke. | Hide Manage and return to safe Home; preserve operational records. |
| M2 — Schedule and field coordination | Adds day-plan publishing, workload assignment, Route, Jobs, and Job oversight. | M1; versioned writes; replay/conflict behavior; field visibility. | Stop new scheduling writes and retain last published state. |
| M3 — Customers and team | Adds manager-authorized property/account/portfolio, member, and activity tools. | M2; tool-level role projection; tenant and deep-link denials. | Revert to M2 without changing memberships or customer data. |
| M4 — Reports and operational recovery | Adds activity, notification, completion, question, photo, and operational-exception workflows. | M3; delivery/retry telemetry; evidence and exception ownership. | Disable affected recovery writes independently and preserve audit evidence. |

Manager scope explicitly omits owner-only setup, dispatch hierarchy, team
invitations, customer privacy, and erasure tools.

## Dispatcher

| Unit | Complete experience | Enablement gate | Rollback |
| --- | --- | --- | --- |
| D1 — Schedule visibility | Home and Manage show read-only day plans, assignments, crew workload, and risk. | Active Dispatcher role; current-date contract; workload read smoke. | Hide scheduling entry and use the named operations fallback. |
| D2 — Dispatch publishing | Adds assignments and exact-version day-plan publication. | D1; retry-safe writes; publish conflict/correction history; manager visibility. | Reject new publishes; retain last published plan and uncertain-write recovery. |
| D3 — Field follow-through | Adds read-only Route, Jobs, and Job status for the published operation. | D2; reliable crew status; other-organization denial; stale-date treatment. | Hide field status destinations; do not interrupt crew execution. |
| D4 — Schedule change recovery | Adds field-request review and republish through the day-plan workflow. | D3; immutable published-plan boundary; amendment replay/conflict telemetry. | Stop new change handling and escalate unresolved requests to a Manager/Owner. |

Dispatchers receive Day plans and Workload manager tools only. Field surfaces
are oversight, not assigned-job execution authority.

## Billing Administrator

| Unit | Complete experience | Enablement gate | Rollback |
| --- | --- | --- | --- |
| B1 — Account records | Home and Accounts show exact authorized customer records and customer-safe portal context. | Active BillingAdmin role; account isolation; missing/unavailable contract. | Hide Accounts and retain records for authorized operations staff. |
| B2 — Completion readiness | Adds Billing as an exact-visit completion-report readiness queue. | B1; immutable delivered report; pending/delivered distinction; correction owner. | Hide Billing queue; never change delivered proof. |
| B3 — Account exception handoff | Adds traceable handoff for missing contacts or completion context. | B2; named receiving owner; audit and resolution receipt. | Stop new handoffs; retain accepted receipts and prior resolution history. |

The current product does not supply invoice creation, payment collection,
refunds, accounting ledger, or payout capabilities. The rollout does not imply
them. A future revenue unit requires a separate product, compliance, and
integration decision.

## Support Administrator

| Unit | Complete experience | Enablement gate | Rollback |
| --- | --- | --- | --- |
| S1 — Support triage | Home and Support provide tenant-scoped, minimized read-only diagnostics and incident ownership. | Explicit support role; purpose/tenant context; access audit; protected denial smoke. | End the support session and revoke its scoped access; no customer data is cached as fallback. |
| S2 — Access and delivery support | Adds member/invitation, activity, and notification recovery. | S1; audited retry/revoke procedures; tenant/resource target confirmation. | Disable mutations independently; retain original event and action outcome. |
| S3 — Evidence and exception recovery | Adds completion/conversion reporting, photo processing, and operational exceptions. | S2; idempotent retry; evidence privacy; named operational owner. | Stop recovery actions and preserve the original failure for escalation. |
| S4 — Privacy and erasure recovery | Adds customer privacy and failed-erasure recovery under heightened control. | S3; verified request/provenance; dual control; immutable audit; legal retention rules. | Revoke high-risk tools independently; never mark unconfirmed deletion complete. |

Support access is not broad tenant browsing. Purpose, tenant, resource, actor,
action, and outcome must be bounded and audited.

## Team Member fallback

G1 Access resolution is the complete experience for an authenticated account
with no active mapped role. It shows no customer, field, company, billing, or
support data. It explains the state and offers only safe invitation checking,
organization-administrator guidance, and sign out. Product destinations appear
only after a real role is assigned and a persona capability is resolved.

## Cross-persona delivery sequence

Implement the control plane once, then onboard persona units in dependency
order. Cohort breadth and capability breadth remain separate controls.

1. **Foundation:** server-derived capability projection, audited cohort
   assignments, capability-shaped navigation, deep-link denial, support-safe
   state vocabulary, and per-capability suspension.
2. **Read-only minimums:** U1, P1, C1, CM1, O1, M1, D1, B1, S1, and G1. A
   persona advances only when its protected smoke and operational owner pass.
3. **Operational writes:** C2, CM2, O2, M2, and D2 after shared retry,
   conflict, offline/unknown-outcome, and authoritative-reload contracts pass.
4. **Customer/evidence continuity:** U2–U4, P2–P3, C3, CM3, B2, and S2–S3
   after provider response, proof, notification, object-storage, and privacy
   dependencies are live.
5. **Administration and recovery:** P4, C4, CM4, O3–O4, M3–M4, D3–D4, B3,
   and S4 after tool-level authority and rollback rehearsals pass.

This order is a dependency path, not a requirement to enable every persona at
once. The safest first provider cohort can contain only the roles that are
staffed and operationally supportable.

## Capability projection shape

Use one minimized server response with independent persona scopes. Names are
illustrative until the API contract is implemented:

```json
{
  "persona": "dispatcher",
  "scope": { "organization": "opaque-reference" },
  "capabilities": {
    "schedule_read": true,
    "day_plan_publish": false,
    "field_status_read": false,
    "schedule_change_recovery": false
  }
}
```

The server chooses persona, scope, and capability. The client uses the result
for composition only. Every API repeats role and exact-resource authorization.

## Exit evidence for every unit

- exact deployed source, migrations, identity configuration, and cohort record;
- authorized success plus other-tenant/account/property/crew denial as relevant;
- loading, valid empty, stale/partial where relevant, access ended,
  inconsistent, and unavailable behavior;
- keyboard and assistive semantics, 320px/390px phone behavior, 44px targets,
  zoom/reflow, and final-action clearance above fixed navigation;
- redacted production telemetry, named operational/support owner, and rehearsed
  enable, suspend, rollback, and recovery actions;
- no known P0/P1 defect in the enabled unit’s critical journey.

Write units add replay, duplicate, stale/conflict, unknown outcome, permission
loss, read-after-write, and accepted-receipt preservation. Field write units add
offline/reconnect and shared/lost-device evidence. Evidence and privacy units
add real storage lifecycle and erasure evidence.

Protected enablement remains blocked until the R2 hosted environment, real
identities, operators, and role-scoped test data exist. Repository design and
local browser validation are not substitutes for that evidence.
