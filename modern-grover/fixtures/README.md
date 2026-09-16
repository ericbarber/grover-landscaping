# Local-review fixture probe

This directory holds preparation tools for the independent Modern Grover
comparison. [`probe.mjs`](probe.mjs) makes only GET requests. It first verifies
`/auth/config` is in `local_review` mode, then reports status, counts, and the
Crew Lead route date for the fixed local reviewer identities. It does not
print property names, addresses, message bodies, tokens, or full API records.

From the repository root, with the local-review API running:

```bash
MODERN_GROVER_AS_OF=2026-09-16 \
MODERN_GROVER_API_URL=http://127.0.0.1:8080 \
node modern-grover/fixtures/probe.mjs
```

Set `MODERN_GROVER_API_URL` to the Tailscale API URL when probing the private
review service remotely. The as-of date is a comparison input, not a route
write. The script does not seed records, reset state, or validate role access
to a specific Canyon View/Sage Lane resource. Treat a 200 response and a
nonzero count as readiness clues; exact grant/scope, proposal version, and
record linkage still need direct verification before a study task can be
scored. The [fixture authority map](../FIXTURE_READINESS.md) lists the record
chain and unsupported transitions.

The [isolated seed contract](SEED_CONTRACT.md) defines the supported owner
record sequence, reset ownership, and date/role gates for a future writable
fixture utility. No seeder is available yet.
