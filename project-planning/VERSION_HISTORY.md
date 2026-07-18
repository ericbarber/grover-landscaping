# Version History

The project did not use formal product version numbers during its initial
development. The entries below establish a milestone history from the repository's
delivery plan and commit history. Future deployable releases should add an explicit
version and release date.

## Unreleased — Pilot Readiness

Current continuation work:

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
