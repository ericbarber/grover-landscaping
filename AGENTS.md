# Repository Working Instructions

These instructions apply to the entire Grover Landscaping repository.

## Development Workflow

- Continue work in coherent, reviewable feature slices.
- After completing and committing one planned slice or phase, immediately begin
  the next safe in-scope roadmap item instead of stopping only to report status.
- Pause between phases only when user input, new authority, unavailable external
  infrastructure, or a materially different product decision is required.
- Preserve unrelated or pre-existing uncommitted changes.
- Update `PLAN.md` when delivery status or next implementation work changes.
- Update `project-planning/ROADMAP.md`, `FEATURE_CATALOG.md`, or
  `VERSION_HISTORY.md` when a change materially affects those documents.

## Commit Policy

- Create a commit when a coherent feature slice is complete and adequately
  validated.
- A standing user authorization exists to make normal local Git commits for
  completed development work in this repository.
- Do not wait for a separate commit request when the commit criteria are met.
- Keep commits narrowly scoped and use an outcome-focused imperative message.
- Separate planning/documentation changes from product code when they represent
  independent review units.
- Include related migrations, implementation, tests, and delivery-plan updates in
  the same feature commit when they form one atomic change.
- Do not include unrelated user changes, secrets, generated build output, local
  environment files, or editor artifacts.
- Do not amend, rewrite, squash, reset, or otherwise alter existing commit history
  unless the user explicitly requests it.
- Do not push commits or open pull requests unless the user explicitly requests
  publication.

## Commit Readiness

Before committing:

1. Review the diff and confirm every included file belongs to the feature.
2. Run formatting, type checks, tests, builds, and migration validation in
   proportion to the change.
3. Record any unavailable or failing validation clearly.
4. Do not commit a known-broken change unless the user explicitly accepts the
   limitation.
5. Confirm that documentation accurately distinguishes delivered, in-progress,
   and planned behavior.

## Project Records

- `PLAN.md` is the canonical delivery-status tracker.
- `project-planning/` is the review entry point for roadmap, feature catalog, and
  version history.
- `features/` contains product specifications and roadmap inputs.
- `docs/` contains technical contracts, designs, validation notes, and runbooks.
