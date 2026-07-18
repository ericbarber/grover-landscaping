# Working Agreements

This document records durable collaboration and delivery expectations for the
Grover Landscaping project.

## Completed Feature Commits

Codex may create a local Git commit without asking again when a coherent feature
slice is complete and adequately validated. A good feature commit:

- Produces one understandable product or platform outcome.
- Includes its implementation, migration, tests, and status-document updates.
- Excludes unrelated working-tree changes.
- Uses a concise imperative commit message.
- Leaves the repository in a buildable and reviewable state.

Planning-only work should be committed separately when it is independent of a
code change. Small documentation updates that describe a feature's new delivery
status should remain with that feature commit.

Commits remain local. Pushing, opening pull requests, rewriting history, or
publishing releases requires a separate explicit request.

## Continuous Roadmap Progress

After a planned feature slice or phase is completed, validated, and committed,
development should continue with the next safe in-scope roadmap item. A status
handoff alone is not a reason to stop.

Pause before the next phase only when it requires user-specific information, new
external authority, unavailable hosted infrastructure, or a product decision
whose alternatives would materially change the result.

## Validation Expectations

Use the checks relevant to the affected area:

- Backend: Rust formatting, compilation, focused tests, and database-backed tests
  for persistence or migration behavior.
- Frontend: TypeScript typecheck, focused tests, and production build.
- Database: migration application against PostgreSQL plus persistence tests.
- Hosted behavior: smoke scripts and provider validation only when the required
  environment and credentials are available.
- Documentation: link review, delivery-status accuracy, and consistency with the
  canonical plan.

If a required tool or environment is unavailable, record the limitation and keep
the feature uncommitted when that missing validation creates meaningful breakage
risk.

## Updating Requirements

When a new durable project rule is agreed:

1. Add agent-execution instructions to `../AGENTS.md`.
2. Add the human-readable agreement here when it affects project collaboration.
3. Add product scope or sequencing decisions to `ROADMAP.md`.
4. Add delivery-state changes to `../PLAN.md`.
5. Add release outcomes to `VERSION_HISTORY.md`.

Temporary requests do not need to become permanent repository rules.
