# Version History

- 2026-07-19: Added tenant-scoped crew daily capacity and eligible crew-lead assignment controls.
- 2026-07-19: Applied crew-specific daily capacity snapshots to new draft route guards.
- 2026-07-19: Added crew capacity and leadership readiness to manager route selection.
- 2026-07-19: Added persisted customer contacts to onboarding readiness and repaired property lifecycle audit constraints.
- 2026-07-19: Added account email/SMS opt-ins and validated quiet-hour preferences.
- 2026-07-19: Enforced account channel, recipient, and quiet-hour preferences for report and bid deliveries.
- 2026-07-19: Added manager guidance for customer deliveries blocked by account preferences.
- 2026-07-19: Connected persisted customer notification events to manager activity history.
- 2026-07-19: Connected tenant-scoped route and report events to manager activity history.
- 2026-07-19: Added persisted bid and photo recovery events to manager activity history.
- 2026-07-19: Replaced demo manager activity seeds with persisted operational history.
- 2026-07-19: Added filtered cursor pagination for persisted operational activity.
- 2026-07-19: Added actor-attributed transactional audit events for schedule mutations.
- 2026-07-19: Added structured route mutation metadata to operational activity.
- 2026-07-19: Added readable organization-member identities to operational activity.
- 2026-07-19: Added audited owner-managed display names for organization members.
- 2026-07-19: Used readable member names in crew leadership and owner activity views.
- 2026-07-19: Added mobile team member search and role/status filters.
- 2026-07-19: Added actor and event filters to mobile owner activity.
- 2026-07-19: Added bounded pagination for persisted owner team activity.
- 2026-07-19: Applied owner team event filters across persisted history.
- 2026-07-19: Applied debounced owner actor search across persisted history.
- 2026-07-19: Added persisted affected-member and crew search to owner activity.
- 2026-07-19: Added active-filter summaries and clearing to mobile team administration.
- 2026-07-19: Added mobile team composition summary counts.
- 2026-07-19: Added mobile owner activity category summary counts.
- 2026-07-19: Added CSV export for filtered owner team activity.

The project did not use formal product version numbers during its initial
development. The entries below establish a milestone history from the repository's
delivery plan and commit history. Future deployable releases should add an explicit
version and release date.

## Unreleased — Pilot Readiness

Current continuation work:

- New day-plan drafts snapshot organization timezone, service-area, and daily stop-capacity defaults.
- Draft route planning now blocks stop assignments at the plan's snapshotted capacity.
- First-owner setup now reports persisted organization, crew, published-route, and team-invitation completion milestones.
- The mobile first-owner workspace now recommends the next incomplete launch action.
- First-owner launch progress now refreshes automatically after related manager actions.
- Organization owners can now create tenant-scoped crews from the mobile first-user workflow.
- Manager day-plan creation now selects from authorized tenant crews instead of a free-form crew ID.
- Owners can rename, deactivate, and reactivate crews with operational-work guards and audit events.
- Owner activity history now includes crew profile and lifecycle changes.
- Provision and validate the first production Cognito owner identity.
- Finish tenant-aware boundaries for remaining shared customer reads.
- Configure and validate the production email/SMS provider.
- Connect manager activity history to persisted events.
- Expand customer account onboarding and first-user administration.
- Continue replacing seeded or browser-only route behavior with persisted state.
- Complete authenticated customer-scoped bid history.
- Manager property onboarding now loads, validates, and saves operational profiles
  through the persisted API with explicit local-fallback feedback.
- First-owner onboarding can bootstrap a persisted organization and owner membership
  from the signed-in Cognito subject, then presents the first-route setup sequence.
- Customer-account onboarding can create and list organization-scoped accounts,
  with explicit organization relationships and manager-visible billing state.
- Managers can edit tenant-scoped customer account billing, payment, service
  approval, service-frequency, and notes fields.
- Local mobile review can start the seeded API and Vite frontend on a detected
  Tailscale address without requiring Docker or PostgreSQL.
- The dashboard now prioritizes route, assigned jobs, and job actions on phones,
  with manager tools collapsed into a separate workspace and touch-safe controls.
- A sticky phone navigation bar links the core workflow sections, and opening a
  job moves directly to its detail and field actions on narrow viewports.
- Mobile application metadata now supports standalone home-screen presentation,
  portrait orientation, safe-area viewports, and Grover Field branding.
- Mobile route cards now keep stop progress prominent while route changes,
  request history, and extra-service controls remain available on demand.
- Mobile job detail now presents lifecycle actions first and condenses the
  read-only checklist into an expandable completion summary.
- Customer accounts now own explicit persisted property records through
  tenant-scoped list and create APIs, independently of jobs and crew assignment.
- Manager account onboarding can list and create properties inline, then pass new
  properties directly into the operational onboarding workflow.
- Reloaded persisted properties also repopulate the operational onboarding
  selector, preserving the account-to-property workflow across sessions.
- Persisted operational onboarding now rejects mismatched or archived property
  ownership and does not return local fallback records from PostgreSQL runtimes.
- Portfolio reads now use explicit customer properties, while portfolio creation
  and links enforce active organization/account and same-account ownership.
- Manager property setup can create portfolios, group properties, and assign
  tenant-scoped crews as separate operations.
- Portfolio management remains usable for property managers when their role does
  not allow crew assignment.
- Manager property setup now shows each yard's current persisted portfolio and
  updates portfolio membership counts immediately after regrouping.
- Added audited property archive/reactivation controls; archiving atomically ends
  active crew service and removes the yard from operational onboarding choices.
- Added mobile property name/address editing with audited tenant boundaries and a
  case-insensitive duplicate identity constraint.
- Guarded first property activation on an active operational profile plus crew
  assignment, with distinct activation and reactivation audit events.
- Added a role-safe activation readiness endpoint and mobile checklist for
  operational-profile and crew prerequisites.
- Added account-level onboarding progress across service details, current
  properties, service readiness, and activation, with live mobile card refresh.
- Added mobile account filters for all, incomplete, and completed onboarding work.
- Added property-level onboarding attention reasons and mobile action labels for
  incomplete profiles, missing crews, blocked yards, and pending activation.
- Linked each property attention action to the matching mobile workspace while
  preserving the affected property selection.
- Added a mobile customer-detail readiness action that opens and focuses the
  affected account editor.
- Added a missing-property progress action that opens the affected account's
  property form and closes it after successful creation.
- Added a mobile team-invitation workflow with organization-scoped roles, queued
  delivery feedback, and local pilot-token visibility.
- Linked the first-owner readiness checklist to property, crew, route-planning,
  and team-administration workspaces.
- Added an owner-only invitation history endpoint and mobile pending-access list
  that omits invitation tokens and stays scoped to the active organization.
- Added guarded pending-invitation revocation with mobile confirmation, atomic
  membership archival, and a tenant-scoped audit event.
- Added active and suspended membership visibility plus two-step mobile role
  administration with a repository-enforced last-owner invariant.
- Added audited membership suspension and reactivation with two-step mobile
  confirmation and the same repository-enforced last-owner invariant.
- Added an owner-only recent team-access activity feed and a fresh-database
  migration for invitation and membership lifecycle audit event kinds.
- Added an authenticated recipient invitation page, safe post-sign-in return
  paths, explicit acceptance feedback, and notification acceptance paths.
- Merged active membership roles into request authorization after token
  verification and added refreshed role-aware workspace guidance.
- Added finite 7-, 14-, and 30-day mobile invitation windows, strict UTC
  expiration validation, effective expired-state visibility, and acceptance and
  revocation guards after expiration.
- Added guarded mobile reissue for expired and revoked invitations with a fresh
  token, queued delivery, restored invited membership, and tenant-scoped audit.
- Prevented concurrent, case-variant duplicate pending invitations per tenant and
  recipient, and added mobile guidance to existing history and reissue controls.
- Added latest invitation-email delivery status and attempt counts to owner
  history, with concise mobile failed-delivery retry guidance.
- Added a two-step owner retry action that safely returns failed or dead-letter
  invitation email to the existing audited notification queue.
- Bound invitation acceptance to the authenticated token's normalized verified
  email, with non-disclosing mismatch responses and recipient sign-in guidance.
- Added verified-email readiness to current-user access and disabled mobile
  invitation activation early when Cognito identity claims are unavailable.
- Added tenant-guarded, audited organization profile reads and updates plus a
  mobile owner editor for company name and organization type.
- Extended organization profiles with normalized contact email, readable phone,
  and HTTP(S) website fields plus mobile-first editing and validation.
- Added owner-managed timezone, service-area label, and daily stop-capacity
  defaults with database constraints and mobile numeric controls.
- Added tenant-scoped member display-name editing to mobile owner administration,
  while retaining immutable identity IDs and auditing each update.
- Applied member display names to crew-lead choices and resolved readable actor
  and target labels in the owner team-administration feed.
- Nested customer-account routes are now explicitly protected, and crew
  assignment requires an existing non-archived property in the crew organization.

## 2026-07-17 — Photo Erasure Recovery

- Added durable jobs for photo object deletions that fail during privacy erasure.
- Added retry, backoff, and dead-letter foundations to the photo-processing worker.
- Added organization-scoped manager history, retry, and manual-resolution APIs.
- Added manager visibility and recovery controls for failed and dead-lettered
  deletion jobs.

## 2026-07-13 — Hosted Pilot and Privacy Foundations

- Added customer photo privacy export and retained-evidence erasure workflows.
- Added manager privacy and photo-processing recovery panels.
- Added S3 photo lifecycle infrastructure and server-side thumbnail processing.
- Added durable photo-processing retries and rejected-evidence quarantine.
- Expanded production smoke coverage and notification webhook validation.
- Added customer bid-history visibility in the portal preview.

## Earlier MVP Foundation

- Established the Rust/Axum API, React/Tailwind frontend, PostgreSQL migrations,
  Docker Compose development stack, and CI validation.
- Delivered crew job, route, stop-progress, checklist, photo, and completion-report
  foundations with browser fallback behavior.
- Delivered manager draft-route planning, publishing, amendments, project bids,
  report review, notification recovery, and activity-history foundations.
- Added Cognito authentication, organization membership, invitations, role gates,
  tenant-aware access checks, and audit events.
- Added customer-safe report and bid links, immutable delivered report snapshots,
  notification outbox processing, and approved-bid conversion into job add-ons.
- Added property portfolios, crew assignment history, onboarding-profile APIs, and
  customer portal previews.

## Versioning Convention Going Forward

Use semantic versions for deployable product releases:

- **Major (`X.0.0`)**: incompatible API/data-contract changes or a materially new
  product mode.
- **Minor (`0.X.0`)**: backward-compatible user-facing capability or substantial
  operational feature.
- **Patch (`0.0.X`)**: backward-compatible fixes, security hardening, and small
  operational improvements.

During the pilot, versions may remain below `1.0.0`. Every release entry should
include:

- Release date and deployment environment
- User-visible capabilities
- API or schema changes
- Migration and rollback notes
- Security, privacy, or tenant-boundary changes
- Known limitations and next follow-up work
