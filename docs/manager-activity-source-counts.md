# Manager Activity Source Counts

This note tracks the next focused manager activity improvement.

## Current behavior

The review queue groups manager activity by source: route, job, photo, and sync. Source filter cards now display total activity and source-specific review state.

## Follow-up development

- Add a completion-review quick filter for `job` source activity.
- Add Vitest coverage for source activity counts and source-specific review counts.
- Refactor the activity panel to use shared source summary helpers once the component is safe to rewrite.
