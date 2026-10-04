# Local-review fixture probe

This directory holds preparation tools for the independent Modern Grover
comparison. [`probe.mjs`](probe.mjs) makes only GET requests. It first verifies
`/auth/config` is in `local_review` mode, then reports status, counts, and the
Crew Lead route date for the fixed local reviewer identities. Canyon View and
Sage Lane use separate synthetic Property Owner reviewers so their owner-scoped
records and denial checks cannot collapse into one principal. The probe does not
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
fixture utility. Property Manager delegation prerequisites are delivered, but
no seeder or matched record is available yet.

## Manifest contract

[`fixture-manifest.example.json`](fixture-manifest.example.json) is a
non-runnable, non-secret template for the local manifest required by the seed
contract. Validate the repository template from the repository root with:

```bash
node --test modern-grover/fixtures/validate-manifest.test.mjs
node modern-grover/fixtures/validate-manifest.mjs \
  --allow-template modern-grover/fixtures/fixture-manifest.example.json
```

The eventual seeder must write its real `local_fixture` manifest under the
ignored `.localdev/modern-grover/` directory and validate it without
`--allow-template`. Passing this structural validator does not prove the target
database identity, create a record, or satisfy the read/denial checks in the
seed contract; those remain runtime gates.

After restarting the exact study API build and configuring libpq for the study
database, prepare that real manifest with:

```bash
MODERN_GROVER_API_URL=http://127.0.0.1:8081 \
MODERN_GROVER_SOURCE_COMMIT='<exact 40-character commit running on the API>' \
MODERN_GROVER_AS_OF=2026-09-16 \
node modern-grover/fixtures/prepare-manifest.mjs
```

The preparation utility runs the full target preflight again, requires both
fixed study-owner profiles from `/auth/config`, writes the ignored manifest
with mode `0600`, and refuses to replace an existing file. It creates no
application records. Do not substitute the current Git commit unless that is
the exact source running on port 8081.

Manifest schema 2 keeps API-generated IDs under the Canyon View or Sage Lane
record that owns them. It accepts only an allowlisted table and that API's
normal ID prefix; the `modern_study_canyon_` and `modern_study_sage_` values are
request/idempotency namespaces, not fabricated database IDs. This preserves
exact reset ownership without pretending supported APIs accept caller-selected
primary keys. Each record also pins its fixed local-review owner user ID so
owner-scope denial checks and reset queries cannot conflate the two records.

[`fixture-state.mjs`](fixture-state.mjs) is the crash-safe manifest journal for
the future seeder/reset process. It takes an exclusive private lock, validates
the current manifest before every change, writes API-generated IDs and verified
snapshot markers through an atomic mode-`0600` replacement, rejects delegation
lifecycle regressions, and records reset completion only with a zero-remaining
receipt. Repeating the same ID, snapshot, or completed reset is idempotent. A
leftover `.lock` file fails closed; remove it only after confirming that no
fixture process still owns the recorded PID.

The journal can be imported by the future orchestrator or exercised directly:

```bash
node modern-grover/fixtures/fixture-state.mjs \
  .localdev/modern-grover/fixture-manifest.json \
  record-id canyon owner_properties owner_property_<generated-id>
```

Other commands are `record-snapshot`, `record-delegation`, and
`complete-reset`. The utility prints only counts and lifecycle state. It does
not call application APIs, delete database records, verify that a reset count
is true, or make the fixture participant-ready; those remain responsibilities
of the bounded seeder/reset orchestrator. Never pass an invitation token or
protected content to this journal.

## Target-boundary preflight

Before any fixture seeder writes a record, run this fail-closed boundary
preflight. It accepts only the dedicated port-8081 loopback or Tailscale
origin, requires `local_review` mode and ready PostgreSQL persistence, queries
the API's local-review-only readiness identity and the operator-selected
PostgreSQL target for the exact `grover_modern_study` database, verifies a
successful migration count, and scans every public text column for either
reserved fixture namespace. It prints only those summary facts; it does not
print connection settings, record locations, or record values.

Configure libpq through the normal `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`,
and exact database-name variables in the operator shell, then run:

```bash
PGDATABASE=grover_modern_study \
MODERN_GROVER_API_URL=http://127.0.0.1:8081 \
node modern-grover/fixtures/validate-target.mjs
```

The command must report `target_boundary_preflight_passed`, a positive
migration count, and zero namespace matches. That result is one prerequisite,
not authorization to seed: it proves that the API and operator inspection both
name the isolated database, but it does not approve a seed payload. Before
writes, the seeding workflow must also validate the real manifest. Re-run exact
read and denial checks after the future seeder completes.

## Isolated invitation handoff

The supported provider workflow needs the one-time invitation bearer value,
which production owner responses intentionally withhold. The dedicated study
service may set:

```bash
MODERN_GROVER_FIXTURE_MODE=enabled
```

Startup fails unless that process is non-production, in `local_review`, backed
by PostgreSQL, and connected to exactly `grover_modern_study`. In this mode,
only invitation requests using a `modern_study_canyon_` or
`modern_study_sage_` idempotency key are accepted. A newly created invitation
is marked delivered through the existing delivery transition and returns its
token once in `x-grover-local-fixture-invitation-token`. The future seeder must
keep that value only in process memory. Never print it or store it in the local
manifest.
