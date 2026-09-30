# Authenticated Workspace Architecture

## Status

The React application now resolves authenticated workspaces through a
capability-driven composition boundary. Each persona has one manifest under
`frontend/src/workspaces/personas/`; shared resolution and types live under
`frontend/src/workspaces/core/`. Production components import that boundary
directly; the former `domain/workspacePersona.ts` compatibility facade has been
removed.

This structure changes interface composition, not API authorization. Every
protected backend route must continue to authorize the principal's persisted
role, active membership, exact organization/resource scope, and requested
operation.

## Vocabulary and ownership

| Concept | Owner | Responsibility |
| --- | --- | --- |
| Access role | Rust API and persisted membership | Coarse authenticated authority |
| Resource scope | Rust API and persisted membership/grant/assignment | Exact organization, property, crew, or platform boundary |
| Workspace capability | Server-derived `/me/access` projection | Fail-closed interface composition and rollout state |
| Persona manifest | `frontend/src/workspaces/personas/<persona>/manifest.ts` | Presentation, priority, copy, destinations, and feature ordering |
| Workspace resolver | `frontend/src/workspaces/core/resolveWorkspace.ts` | Intersects a manifest with the server projection |
| Feature implementation | `frontend/src/workspaces/features/` plus existing domain/API modules | Reusable workflow behavior shared by one or more personas |

A persona is a presentation profile. It does not grant access, expand a scope,
or replace backend checks. Dispatcher and Billing Administrator manifests are
explicitly `proposed` because their authoritative backend roles do not yet
exist. The remaining role-backed manifests are `authoritative`; the no-role
fallback is `system`.

## Resolution flow

```text
verified identity
  -> active role and exact resource scope
  -> server-derived workspace capability projection
  -> selected persona manifest
  -> resolved workspace
       - allowed navigation
       - home language
       - visible surfaces
       - field controls
       - manager tools
       - rollout unit and scope metadata
```

For a managed projection, explicit capability booleans control composition.
An all-false projection stays closed even when an `enabled_unit` value is
present. Unit-to-capability conversion remains only as a compatibility path for
older/local fixtures that omit the capability object. Legacy subjects retain
the pre-rollout composition until they enter managed enforcement.

The resolver retains the selected projection's scope metadata. The current UI
still switches by persona; a future multi-scope selector must select an exact
resolved projection rather than unioning authority across organizations,
properties, or crews.

## Dependency rules

- Persona manifests may depend on workspace core types and shared manifest
  helpers.
- Shared components may consume a resolved workspace or compatibility persona;
  they should not add new persona-by-persona access matrices.
- A shared feature may be referenced by several manifests. It must not import a
  persona manifest.
- Rollout unit names belong in manifests and the server rollout contract, not
  in individual screens.
- Components must use resolved capabilities when they are available. Hidden
  navigation is interface composition only and never a security check.
- New authoritative personas require a backend role, storage mapping,
  authorization decision, `/me/access` projection, manifest, and boundary
  tests. A manifest alone is insufficient.

## Testing contract

Workspace tests must cover:

- explicit role-to-manifest mapping and deterministic persona order;
- managed capability composition, including non-cumulative and all-false
  projections;
- suspended and unknown rollout states failing closed;
- manager tools and field controls following resolved capabilities;
- proposed versus authoritative persona status;
- backend denial and exact-resource isolation independently of interface
  visibility.

## Remaining migration

The architecture boundary is active, but `frontend/src/App.tsx` still
coordinates state and data loading for all workspace families. Continue by
extracting shared feature modules and thin persona home compositions in small
slices. Keep new persona policy in manifests and the resolver while that
top-level orchestration is reduced. Management is the first extracted feature:
its section/tool catalog, capability filtering, active-tool validation, and
status derivation live under `workspaces/features/management`; the React menu
contains rendering and interaction only. Home is the second extracted feature:
shortcut composition, persona language access, progress/priority rules,
protected-read continuity, and route-date interpretation live under
`workspaces/features/home`; the React panel owns layout and interaction. The
workspace-selection hook in `workspaces/core` now owns eligible-persona state,
safe fallback when access changes, and rollout resolution; `App` consumes the
resolved workspace instead of coordinating those persona rules itself. Customer
workspace policy now owns customer-mode selection, protected-read eligibility,
manager-preview separation, and Home work summaries. Unsupported proposed
customer modes fail closed instead of inheriting the Yard Owner experience.
Field recovery policy now provides one summary for job, checklist, and photo
queues plus the conflict-aware replay gate used by the shell. Assigned-job and
offline-recovery presentation now live in dedicated components, including their
local filtering and conflict-confirmation state; `App` retains mutation
execution until the field coordinator is extracted. Selected-job presentation
is also separated: workflow navigation, checklist, photo evidence, add-ons, and
completion-report rendering consume injected operations and resolved field
controls rather than owning access policy. Pure field-data continuity rules now
live beside that recovery policy: trusted job summaries can produce an explicit
detail fallback, failed uploads can produce typed local evidence, and persisted
evidence merges without discarding unsaved local or other-job photos. `App`
no longer coordinates selected-job detail and add-on reads: a field selection
hook owns request lifecycle, stale-result cancellation, loading/unavailable
state, and the narrow transport fallback. `App` still owns photo/report reads,
durable mutation execution, and their cross-request state until those field
coordinators are extracted.
