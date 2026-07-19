# Offline Mutation Queue

Phase 2 field reliability uses a versioned IndexedDB database named
`grover-field-offline`. Its `mutations` store is the durable boundary for field
actions that cannot reach the API.

The initial record contract covers stop progress and stores:

- a client-generated mutation ID and creation timestamp;
- the organization and actor identity captured when the action occurs;
- the day plan, stop, and requested progress state; and
- pending, failed, or conflict state with retry metadata.

The queue schema also accepts job lifecycle records for start and completion.
They use the same client-generated ID, tenant, actor, ordering, and sync-state
fields while storing only the job ID and requested lifecycle action.
Failed job start and completion requests now enter that queue only when the job
response carries a server-owned organization and the current actor is known.
The assigned-jobs section shows a durable pending count and explicitly reports
when an action remains local because the browser queue is unavailable.
Job lifecycle replay runs oldest-first per tenant on load, network recovery, or
manual retry. Each action sends its UUID in `x-client-mutation-id`; PostgreSQL
records the tenant, actor, job, and action transactionally with the job/checklist
updates. Exact retries are accepted without reapplying work, while conflicting
reuse becomes a durable conflict and blocks later actions for that tenant.
The assigned-jobs queue review shows customer/job context, action, queued time,
state, and attempt count without internal error text. After manager review, a
two-step discard removes only the conflicted record, refreshes the job from the
server when available, and resumes ordered replay.

Access tokens, invitation tokens, customer share tokens, route URLs, and API
responses must never be stored in this database. Sync code must use the current
authenticated session, confirm that its active organization and actor match the
queued record, preserve creation ordering, and remove a record only after the API
confirms persistence.
The day-plan read contract carries the crew's server-owned organization ID.
Queue writes and replay use that value rather than a default or first membership,
so multi-organization users cannot misattribute offline field work.

Stop-progress writes now enter this store when the API rejects the request or
returns a local-fallback result. Once a tenant has queued progress, later stop
changes are appended instead of bypassing older work, preserving action order.
The crew route displays the number of durable changes awaiting synchronization.
If IndexedDB itself is blocked, the existing local-storage progress view remains
available but cannot claim durable queueing.

Queued stop progress replays oldest-first on initial load, network recovery, or a
manual **Sync now** action. Replay is limited to the current organization and
actor, stops at the first failure, records the attempt and safe error message,
and deletes only mutations that the API explicitly reports as persisted.

HTTP 404, 409, 410, 412, and 422 responses are classified as durable conflicts
rather than transient failures. A conflict blocks later ordered replay, disables
blind crew retries, and directs the crew to manager review. Network and server
availability failures remain retryable.

The crew queue review shows the affected customer stop, requested state, local
queue time, sync classification, and attempt count in replay order. It does not
render stored server error text or immutable tenant and actor identifiers.

After manager review, a crew member can use a two-step control to discard one
conflicted record. The control removes only that IndexedDB record, restores the
affected stop to the newest remaining queued state (or the server-backed state),
and resumes ordered replay. Storage-removal failure leaves the conflict intact
and visible.

Each replay sends the queued mutation UUID as `client_mutation_id`. PostgreSQL
stores that UUID with the tenant, actor, stop, and requested state in the same
transaction as the stop update. An exact retry returns a persisted idempotent
replay without applying the update again; reuse for different work returns HTTP
409. Direct online writes remain backward-compatible without an idempotency key.

The mobile route summarizes pending, retry-failed, and conflicted counts, the
oldest queued timestamp, and the maximum replay-attempt count before the detailed
ordered review.

IndexedDB failures are shown separately from a successfully queued change. The
crew is told to keep the app open and reconnect rather than receiving a false
durability claim. Legacy local-storage progress writes and resets also tolerate
blocked browser storage without breaking the in-memory field controls.

After the first durable queue write, Grover Field requests persistent browser
storage where supported. Granted storage needs no extra warning. Browser-managed
or unsupported retention receives accurate eviction guidance without describing
the queue as unavailable.

The first schema includes indexes for ordered state processing and
organization-scoped inspection. Future schema changes must increment the database
version and migrate existing records in `onupgradeneeded`.
