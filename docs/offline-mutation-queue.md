# Offline Mutation Queue

Phase 2 field reliability uses a versioned IndexedDB database named
`grover-field-offline`. Its `mutations` store is the durable boundary for field
actions that cannot reach the API.

The initial record contract covers stop progress and stores:

- a client-generated mutation ID and creation timestamp;
- the organization and actor identity captured when the action occurs;
- the day plan, stop, and requested progress state; and
- pending, failed, or conflict state with retry metadata.

Access tokens, invitation tokens, customer share tokens, route URLs, and API
responses must never be stored in this database. Sync code must use the current
authenticated session, confirm that its active organization and actor match the
queued record, preserve creation ordering, and remove a record only after the API
confirms persistence.

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

The first schema includes indexes for ordered state processing and
organization-scoped inspection. Future schema changes must increment the database
version and migrate existing records in `onupgradeneeded`.
