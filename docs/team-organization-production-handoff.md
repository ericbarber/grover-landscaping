# Team and Organization Production Handoff

## Adoption boundary

Phase 6 core composition is adopted for the Organization Owner workspace at
`/app` → **Manage** → **Team**. The production experience now connects the
approved Team and access wireframe to the existing persisted administration
contracts. It does not create a second team model or infer production state from
local-review fixtures.

## Connected journey

1. Team opens a branded overview rather than a disconnected tool list.
2. Live summaries show active members, pending invitations, active crews, and
   active territories without a crew.
3. Staffing attention identifies active crews without a lead and active
   territories without a crew.
4. Recovery opens the exact crew-administration or branch/territory workspace and
   moves focus to that destination.
5. Member, invitation, and activity cards open their existing persisted
   workflows without changing the selected organization.
6. The signed-in membership is labeled **You**. Reviewing a self-role change or
   self-suspension explains the immediate access impact before confirmation.

## Production map

| Concern | Production implementation |
| --- | --- |
| Team overview and partial-read composition | `frontend/src/components/TeamOrganizationOverviewPanel.tsx` |
| Role-filtered Team entry | `frontend/src/components/ManagerWorkspaceMenu.tsx` and `frontend/src/App.tsx` |
| Membership profile, role, lifecycle, self-impact, filters, and export | `frontend/src/components/ManagerTeamMembershipsPanel.tsx` |
| Invitation create, expiry, revoke, reissue, and delivery recovery | `frontend/src/components/ManagerTeamInvitationsPanel.tsx` |
| Crew lead, capacity, lifecycle, and hierarchy assignment | `frontend/src/components/OwnerCrewAdministrationPanel.tsx` |
| Branch, territory, staffing, and lifecycle administration | `frontend/src/components/ManagerDispatchHierarchyPanel.tsx` |
| Actor-attributed access and hierarchy history | `frontend/src/components/ManagerTeamActivityPanel.tsx` |
| Responsive production journey | `frontend/e2e/local-role-workspaces.spec.ts` |

## Read and mutation contracts

The overview composes existing endpoints independently:

- `GET /organizations/{organization_id}/memberships`
- `GET /organizations/{organization_id}/invitations`
- `GET /organizations/{organization_id}/crews`
- `GET /organization-branches`
- `GET /service-territories`
- `GET /organizations/{organization_id}/team-activity`

Role, status, profile, invitation, crew, branch, and territory mutations remain
owned by their existing API clients and server authorization. The browser never
uses hidden navigation as an authorization control.

## State contract

| State | Required production behavior |
| --- | --- |
| All reads available | Show live metrics, staffing status, and all four administration paths. |
| One or more reads unavailable | Keep independently available counts, name every missing source, render an em dash for unknown values, and never infer zero. |
| No matching members | Preserve active filters and show a filtered no-result state. |
| Persisted memberships unavailable | Show unavailable recovery only; do not also claim the team is empty. |
| Last active owner | Disable role removal and suspension until another active owner exists. |
| Signed-in member change | Label the current membership and warn before self-role or self-suspension confirmation. |
| Crew missing lead | Open crew administration for recovery. |
| Territory missing crew | Open dispatch hierarchy for recovery and place keyboard focus on the destination. |
| Destructive or access-reducing change | Keep the delivered two-step confirmation and server-side recheck. |

## Authorization and privacy

- The command center is exposed only to the Organization Owner persona in the
  client tool map; every read and mutation still requires server authorization.
- Counts and records stay inside the selected organization.
- Readable names are primary; immutable membership, actor, target, and audit IDs
  remain available for support and export without becoming default display copy.
- No customer, yard, provider-disclosure, billing, or employee-sensitive data is
  introduced by the overview.

## Validation

- Pure summary and partial-read behavior are covered in
  `TeamOrganizationOverviewPanel.test.ts`.
- Last-owner, current-actor, filter, sort, summary, and CSV behavior are covered
  in `ManagerTeamMembershipsPanel.test.ts`.
- Phone and desktop Chromium journeys cover live metrics, responsive overflow,
  keyboard activation, focus transfer, partial API outage, signed-in access
  impact, and unavailable-versus-empty membership behavior.
- The production TypeScript build and full frontend unit suite remain required
  before each Phase 6 commit.

## Remaining boundaries

Phase 6 core workflow, working composition, state distinction, responsive
behavior, and production handoff are adopted. Continue regression as shared
authorization or hierarchy contracts evolve. Revenue operations, marketplace
governance, and the Yard Owner customer-scope decision remain separate product
boundaries.
