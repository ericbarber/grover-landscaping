# Manager Route Planning Status

## Delivered

- Local draft route workspace for manager planning.
- Assignable scheduled jobs list for jobs that are not already on the draft route.
- Local add-job helpers for draft routes.
- Local remove-job helpers for draft routes.
- Local move-up and move-down helpers for draft route ordering.
- Boundary helpers for disabling invalid route moves.
- Draft route summary helper for stop count, estimated minutes, and assignable job count.
- Draft route stop cards with move and remove controls.
- Draft route summary card component.
- Route-planning dashboard component that composes the summary card and local planner.
- Route-planning demo seed job helper for an extra scheduled assignable job.
- Backend routes for creating and publishing manager day plans.
- Backend routes for assigning, removing, and reordering manager day-plan stops.
- Local remove actions are wired into the editable route planner state.
- Draft day-plan creation mounts an editable route planner for that draft.
- Add, remove, and reorder planner actions call backend stop mutation routes when the draft is persisted.
- Planner actions fall back to local state when the API is unavailable.
- Route planner displays sync status for persisted, syncing, and local changes.
- Crew-facing day-plan panel refreshes after a persisted manager publish.
- Crew-facing day-plan reads ignore draft routes until they are published.

## Remaining Work

- Add workload summary for estimated drive and service duration.
- Add clearer error recovery for failed manager route mutations.
