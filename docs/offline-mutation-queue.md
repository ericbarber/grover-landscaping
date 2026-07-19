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

The first schema includes indexes for ordered state processing and
organization-scoped inspection. Future schema changes must increment the database
version and migrate existing records in `onupgradeneeded`.
