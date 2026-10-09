# Local-review fixture probe

This directory holds preparation tools for the independent Yardfolio Study
comparison. [`probe.mjs`](probe.mjs) makes only GET requests. It first verifies
`/auth/config` is in `local_review` mode, then reports status, counts, and the
Crew Lead route date for the fixed local reviewer identities. Canyon View and
Sage Lane use separate synthetic Property Owner reviewers so their owner-scoped
records and denial checks cannot collapse into one principal. The probe does not
print property names, addresses, message bodies, tokens, or full API records.

From the repository root, with the local-review API running:

```bash
YARDFOLIO_STUDY_AS_OF=2026-10-09 \
YARDFOLIO_STUDY_API_URL=http://127.0.0.1:8081 \
node yardfolio-study/fixtures/probe.mjs
```

Use only the isolated study API URL; the shared private-review API is not a
fixture target. The as-of date is a comparison input, not a route write. The
script does not seed records, reset state, or replace the executor's exact
role/scope denial checks. Treat its fixed-owner counts as a privacy-minimized
readiness summary. The [fixture authority map](../FIXTURE_READINESS.md) lists
the record chain and unsupported transitions.

The [isolated seed contract](SEED_CONTRACT.md) defines the supported owner
record sequence, reset ownership, and date/role gates. The API-driven seeder
and transactional reset are implemented, repository-tested, and verified
through three local live provider-to-outcome cycles. Participant sessions remain
a separate human-evidence gate.

## Manifest contract

[`fixture-manifest.example.json`](fixture-manifest.example.json) is a
non-runnable, non-secret template for the local manifest required by the seed
contract. Validate the repository template from the repository root with:

```bash
node --test yardfolio-study/fixtures/validate-manifest.test.mjs
node yardfolio-study/fixtures/validate-manifest.mjs \
  --allow-template yardfolio-study/fixtures/fixture-manifest.example.json
```

The seeder writes its real `local_fixture` manifest under the
ignored `.localdev/yardfolio-study/` directory and validate it without
`--allow-template`. Passing this structural validator does not prove the target
database identity, create a record, or satisfy the read/denial checks in the
seed contract; those remain runtime gates.

After restarting the exact study API build and configuring libpq for the study
database, prepare that real manifest with:

```bash
YARDFOLIO_STUDY_API_URL=http://127.0.0.1:8081 \
YARDFOLIO_STUDY_SOURCE_COMMIT='<exact 40-character commit running on the API>' \
YARDFOLIO_STUDY_AS_OF=2026-09-16 \
node yardfolio-study/fixtures/prepare-manifest.mjs
```

The preparation utility runs the full target preflight again, requires both
fixed study-owner profiles from `/auth/config`, writes the ignored manifest
with mode `0600`, and refuses to replace an existing file. It creates no
application records. Do not substitute the current Git commit unless that is
the exact source running on port 8081.

Manifest schema 2 keeps API-generated IDs under the Canyon View or Sage Lane
record that owns them and now journals the fixed workspace owner ID under the
same record before property work begins. It accepts only an allowlisted table
and the table's exact ID rule; the `yardfolio_study_canyon_` and
`yardfolio_study_sage_` values are request/idempotency namespaces, not fabricated
database IDs. This preserves exact reset ownership without pretending supported
APIs accept caller-selected primary keys. Each record also pins its fixed
local-review owner user ID so owner-scope denial checks and reset queries cannot
conflate the two records.

[`fixture-state.mjs`](fixture-state.mjs) is the crash-safe manifest journal for
the seeder/reset process. It takes an exclusive private lock, validates
the current manifest before every change, writes API-generated IDs and verified
snapshot markers through an atomic mode-`0600` replacement, rejects delegation
lifecycle regressions, and records reset completion only with a zero-remaining
receipt. Repeating the same ID, snapshot, or completed reset is idempotent. A
leftover `.lock` file fails closed; remove it only after confirming that no
fixture process still owns the recorded PID.

The journal is imported by the seed/reset orchestrators and can also be exercised directly:

```bash
node yardfolio-study/fixtures/fixture-state.mjs \
  .localdev/yardfolio-study/fixture-manifest.json \
  record-id canyon owner_properties owner_property_<generated-id>
```

Other commands are `record-snapshot`, `record-delegation`, and
`complete-reset`. The utility prints only counts and lifecycle state. Direct
journal commands do not call application APIs or delete records; those actions
belong to the bounded orchestrators below. Never pass an invitation token or
protected content to this journal.

[`owner-foundation-plan.mjs`](owner-foundation-plan.mjs) defines the
declarative owner-foundation boundary consumed by the seeder. It derives separate public-API request
plans for the Canyon and Sage workspaces, synthetic properties, ready briefs,
and delivered provider invitations from a validated manifest. Before the
executor writes a property, the fixed workspace must be discovered,
matched, and journaled. Property recovery requires an owner-scoped discovery
result to match every fixed synthetic field: one exact unjournaled match is
recovered, zero matches permits creation, and scope leaks, same-label
collisions, duplicates, or stale journal IDs fail closed. Ready-brief recovery
likewise requires the exact journaled property, content, API ID, and persisted
version before a retry is skipped. The plan marks the invitation header as
same-process memory only. The plan module does not perform network requests on
its own; the bounded seeder executes it and keeps reset mandatory.

[`reset-plan.mjs`](reset-plan.mjs) builds the exact direct ownership inventory
for [`reset-fixtures.mjs`](reset-fixtures.mjs). It validates the manifest, refuses `prepared` or
already-reset state, covers every allowlisted ID table, and orders each exact
primary key child before parent. The only non-`id` key is the exact
`owner_workspaces.owner_user_id` already owned by that manifest record. It emits
neither a free-form predicate nor caller-controlled SQL and supports the earliest workspace-only
partial run. The plan catalogs selectors for acquisition
events; invitation delivery, recipient, claim, and capability children;
disclosure, assessment, proposal, activation, first-visit, delegation, release,
visit, recommendation, route, job, checklist, photo, report, add-on, mutation,
operational-exception, and derived audit records. Each selector carries an exact manifest root
ID and a declarative relation path. The reset executor snapshots those exact
roots, removes derived children and direct rows in one PostgreSQL transaction,
rolls back on any SQL or verification failure, verifies every journaled ID is
absent, and only then records the zero-remaining receipt.

## Target-boundary preflight

Before any fixture seeder writes a record, run this fail-closed boundary
preflight. It accepts only the dedicated port-8081 loopback or Tailscale
origin, requires `local_review` mode and ready PostgreSQL persistence, queries
the API's local-review-only readiness identity and the operator-selected
PostgreSQL target for the exact `yardfolio_study` database, verifies a
successful migration count, and scans every public text column for either
reserved fixture namespace. It prints only those summary facts; it does not
print connection settings, record locations, or record values.

Configure libpq through the normal `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`,
and exact database-name variables in the operator shell, then run:

```bash
PGDATABASE=yardfolio_study \
YARDFOLIO_STUDY_API_URL=http://127.0.0.1:8081 \
node yardfolio-study/fixtures/validate-target.mjs
```

The command must report `target_boundary_preflight_passed`, a positive
migration count, and zero namespace matches. That result is one prerequisite,
not authorization to seed: it proves that the API and operator inspection both
name the isolated database, but it does not approve a seed payload. Before
writes, the seeding workflow must also validate the real manifest. Re-run the
read-only probe and direct role/scope checks after the seeder completes.

## Isolated invitation handoff

The supported provider workflow needs the one-time invitation bearer value,
which production owner responses intentionally withhold. The dedicated study
service may set:

```bash
YARDFOLIO_STUDY_FIXTURE_MODE=enabled
```

Startup fails unless that process is non-production, in `local_review`, backed
by PostgreSQL, and connected to exactly `yardfolio_study`. In this mode,
only invitation requests using a `yardfolio_study_canyon_` or
`yardfolio_study_sage_` idempotency key are accepted. A newly created invitation
is marked delivered through the existing delivery transition and returns its
token once in `x-yardfolio-local-fixture-invitation-token`. The seeder keeps
that value only in process memory. Never print it or store it in the local
manifest. If the process exits after invitation creation, the token cannot be
recovered; run the transactional reset and prepare a fresh manifest instead of
attempting to resume that record.

## Seed and reset execution

[`seed-fixtures.mjs`](seed-fixtures.mjs) executes both isolated owner journeys
through current proposal v3, acceptance, activation, customer-controlled
Property Manager delegation, confirmed first visit, service release, a
published crew route, assigned access exception, field completion, report
correction/review, and immutable customer delivery. It verifies pending-only
proof before delivery, cross-owner denial, and minimized owner/manager proof
after delivery. Local placeholder evidence exercises workflow and privacy but
does not claim real-image quality. The manifest stores checkpoint names—not
protected response content.

Run it only after preparing the manifest against the exact API build:

```bash
PGDATABASE=yardfolio_study \
YARDFOLIO_STUDY_API_URL=http://127.0.0.1:8081 \
node yardfolio-study/fixtures/seed-fixtures.mjs
```

For a session that needs an earlier forward-only moment, prepare a fresh
manifest and set `YARDFOLIO_STUDY_STOP_AFTER` to exactly one of
`open_customer_decision`, `accepted_not_scheduled`, `confirmed_visit`,
`field_route`, `exception_handoff`, `proof_review`, or `delivered_outcome`.
The executor advances both records only through that checkpoint and verifies
the manifest; it never rewinds a later record. A live open-decision checkpoint
and exact reset passed on 2026-10-09.

```bash
PGDATABASE=yardfolio_study \
YARDFOLIO_STUDY_API_URL=http://127.0.0.1:8081 \
YARDFOLIO_STUDY_STOP_AFTER=open_customer_decision \
node yardfolio-study/fixtures/seed-fixtures.mjs \
  .localdev/yardfolio-study/fixture-manifest-session.json
```

Serve the current application separately from shared review. The launcher
fails before startup unless port 8081 reports `local_review`, PostgreSQL,
`yardfolio_study`, and every required study identity. Browser API calls use the
same-origin `/study-api` proxy on port 5174, avoiding cross-origin failures and
allowing a Tailscale phone to follow the frontend host.

```bash
YARDFOLIO_STUDY_API_URL=http://127.0.0.1:8081 \
bash scripts/study-review.sh
```

From another shell, run the live normal-entry gate. It refuses any frontend
origin except loopback or Tailscale port 5174.

```bash
cd frontend
E2E_BASE_URL=http://127.0.0.1:5174 npm run test:e2e:study
```

Use `bash scripts/study-review.sh --check` with the same environment variable
to verify only the runtime binding without starting the frontend.

Reset with the same API and libpq target binding:

```bash
PGDATABASE=yardfolio_study \
YARDFOLIO_STUDY_API_URL=http://127.0.0.1:8081 \
node yardfolio-study/fixtures/reset-fixtures.mjs
```
