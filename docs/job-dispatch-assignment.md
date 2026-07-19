# Job Dispatch Assignment

Managers and organization owners can move scheduled work through:

`PUT /jobs/{job_id}/dispatch-assignment`

The JSON body requires an active destination `crew_id` and a valid
`scheduled_date` in `YYYY-MM-DD` form.

The API authorizes schedule management against the job's organization before
processing the destination. The crew must be active in that same organization,
and only jobs still in `scheduled` state may move. Started or completed jobs
return a conflict so dispatch cannot rewrite active field work.

The service-job update and `job_reassigned` audit event commit in one PostgreSQL
transaction. Audit metadata records the old and new crew IDs and service dates,
along with the authenticated actor and organization boundary.

The manager day-workload view exposes the operation only for scheduled jobs,
loads active tenant crew choices, requires an actual crew or date change, and
refreshes the local workload grouping from the persisted response.

Before confirmation, the view projects active destination stops against the
crew's daily stop capacity. Moves that would exceed the loaded crew capacity are
blocked with guidance to choose another crew or service date.

Move review also shows the source workload remaining after removal and whether
the customer keeps the same crew and service date. Crew or date changes are
called out before confirmation as customer-continuity impacts.

The API repeats this capacity calculation while holding a lock on the
destination crew. Concurrent dispatch requests therefore cannot both consume
the final slot, and an overloaded request returns `crew_capacity_exceeded`
without changing the job or writing a reassignment audit event.
