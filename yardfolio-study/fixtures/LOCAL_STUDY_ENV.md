# Local isolated study database

Status: local database, separate study API, and two complete provider-to-field
seed/reset cycles verified on 2026-10-09. The final reset restored zero reserved
fixture-namespace matches. This is an environment record, not a portable
connection string or participant-session result.

A repository-owned, fail-closed boundary preflight is now available in
[`validate-target.mjs`](validate-target.mjs). It checks the permitted API
origin and mode plus the operator-selected database name, migrations, and
reserved namespaces without exposing connection details. It passed against the
recorded local service before the first write and after each full reset. The
backend exposes its database name only on
ready PostgreSQL responses in `local_review` mode, so the preflight can require
the API and operator inspection to identify the same isolated database.

The private review API still uses its separate shared-review database on the
local PostgreSQL cluster. A fresh `yardfolio_study` database was created from
`template0`, owned by the local `yardfolio` role. No password, connection URL,
or customer record is stored in this repository. The study database is on the
same local PostgreSQL server but is a separate database. A one-off Docker study
API targets it on port 8081 in `local_review` mode with fixture mode enabled;
the shared review API remains on port 8080. The study container is local machine
state and is not a durable service definition.

## Verified baseline

| Check | 2026-10-09 result |
| --- | --- |
| Pre-create guard | Target database absent; local role had `CREATEDB` authority. |
| Fresh database identity | `yardfolio_study`, owner `yardfolio`, zero public tables before migrations. |
| Migration run | Current `backend` `cargo run --bin migrate` completed; second run also completed. |
| Migration verification | 127 SQLx migrations, all marked successful; an immediate second migration run was idempotent. |
| Provider prerequisite | The fixed organization-owner reviewer accepted a supported organization invitation, creating its persisted synthetic provider membership without direct SQL. |
| Partial recovery | Two deliberately stopped Canyon attempts were removed through exact owner roots, including an invitation written before its ID was journaled. |
| Complete cycles | Two fresh manifests each seeded Canyon and Sage through proposal v3, accepted manager delegation, confirmed visit, service release, and published route, then reset to zero. |
| Matched reads | Each isolated owner read one property and one current v3; the Property Manager read two delegated properties and visits; Crew Lead read the current 2026-10-09 route with one exact stop. |
| Final reset | Both complete resets returned `remainingManifestRecords: 0`; the final preflight reported `namespaceMatches: 0`. |
| Task-related record counts | Manifest-owned owner/provider/customer/route records were removed; the migration baseline and synthetic provider membership remain. |
| Existing baseline route | `day_plans` 1: migration `0003_add_day_plan_tables.sql` inserts a published June 15, 2026 sample for `crew_1001` with two stops. It is not a Yardfolio Study fixture. |
| Separate API identity | Readiness reported `yardfolio-api`, PostgreSQL, and exact database `yardfolio_study`; fixture-mode startup accepted that binding. |
| API reachability | `GET /auth/config` returned 200 and `local_review` at `127.0.0.1:8081`. |
| Read-only fixture probe | The privacy-minimized probe verified the matched owner, delegated Property Manager, and Crew Lead counts without printing IDs, addresses, messages, or tokens. |

These checks establish the isolated provider-to-field fixture path and its
repeatable cleanup, not participant evidence or the later proof/delivered-
outcome snapshot. The route query prefers a current-day published plan and can
fall back to the historical migration record. Never count the seeded June route
as Canyon View or Sage Lane.

## Next environment gate

1. Extend the fixture path through supported exception, completion proof,
   report review, and delivered customer outcome states without introducing a
   real image or unsupported provider access-question claim.
2. Re-run exact role/scope denial and delivered-only proof checks for those
   additional states, then reset to zero again.
3. Conduct the counterbalanced participant sessions and record device,
   viewport, displayed date, network condition, fixture revision, and app
   commit before treating a task as matched evidence.

The API is a data-isolation endpoint, not a separate styled frontend. The phone
review app remains at `/app` on port 5173 and uses the shared review API on port
8080. The Yardfolio Study prototype is separate and simulated.

The database is local machine state. Recreate and revalidate it on another
host; a Git checkout alone does not provide it.
