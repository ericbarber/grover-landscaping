# Local isolated study database

Status: local environment prepared on 2026-09-16; no Modern Grover fixture
records, study API process, or reset tool exists yet. This is an environment
record, not a portable connection string or a hosted study endpoint.

The private review API still uses `grover_landscaping` on the local PostgreSQL
cluster. A separate `grover_modern_study` database was created from
`template0`, owned by the local `grover` role. No password, connection URL,
or customer record is stored in this repository. The study database is on the
same local PostgreSQL server but is a separate database; fixture writes must
target it through a separate API process, never the shared review API on port
8080.

## Verified baseline

| Check | 2026-09-16 result |
| --- | --- |
| Pre-create guard | Target database absent; local role had `CREATEDB` authority. |
| Fresh database identity | `grover_modern_study`, owner `grover`, zero public tables before migrations. |
| Migration run | Current `backend` `cargo run --bin migrate` completed; second run also completed. |
| Migration verification | 124 SQLx migrations, all marked successful. |
| Task-related record counts | `owner_properties` 0; `customer_portal_access_grants` 0; `operational_exceptions` 0. |
| Existing baseline route | `day_plans` 1: migration `0003_add_day_plan_tables.sql` inserts a published June 15, 2026 sample for `crew_1001` with two stops. It is not a Modern Grover fixture. |

These checks establish an isolated *database*, not a matched service. The
route query prefers a current-day published plan and can fall back to that
historical migration record. A study fixture must use its own IDs and a
verified current service date; its reset must leave the migration-owned sample
intact. Never count the seeded June route as Canyon View or Sage Lane.

## Next environment gate

1. Create a separate local-review API process bound to a different port and
   the study database. Check `/auth/config` mode and database identity without
   exposing its connection string. The existing app and API remain on their
   shared review database.
2. Implement a seeder with the [manifest and reset contract](SEED_CONTRACT.md).
   Refuse the shared database name and any target without the expected study
   identity and empty reserved fixture namespace. Do not use a broad cleanup
   from backend persistence tests.
3. Verify owner/grant/scope denial, exact proposal version, confirmed visit,
   current-day route, and delivered-only proof through that study API before
   recording a matched task. Property Manager grant issuance still requires
   [MG-D6](../PRODUCT_DECISIONS.md).

The database is local machine state. Recreate and revalidate it on another
host; a Git checkout alone does not provide it.
