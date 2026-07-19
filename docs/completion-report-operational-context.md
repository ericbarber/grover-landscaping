# Completion Report Operational Context

Phase 2 completion readiness now combines evidence with the operational work that
produced it.

The API attaches the selected job's current published day-plan stop when one is
available:

- day plan and crew identity;
- service date;
- stop identity and order;
- current stop state.

A route stop blocks readiness until its state is `finished`. Approved add-on work
also blocks readiness while any item is not `completed`. These checks join the
existing checklist, before-photo, and after-photo blockers in one ordered
`readiness_blockers` list. The API recomputes readiness before persistence, so a
report cannot become submitted based on evidence counts while route or approved
additional work remains unfinished.

The field report presents route order, service date, stop state, unfinished
add-on count, and corrective labels. Reports without a matching current day-plan
stop retain their evidence-based readiness; absence of route context is not
treated as proof of an unfinished stop.
