# Local isolated study database

Status: local database, separate study API, and three complete provider-to-outcome
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
| Complete cycles | After two route-only validation cycles, three fresh full-lifecycle manifests each seeded Canyon and Sage through proposal v3, delegation, current route, assigned exception, field completion, report correction/re-review, and delivered outcome. |
| Matched reads | Each isolated owner read one property, one current v3, one visit, and one delivered-proof indicator; the Property Manager read two delegated properties, visits, and delivered-proof indicators; Crew Lead read the current 2026-10-09 route; Manager read two in-progress exceptions. |
| Proof boundary | Before delivery, exact owner proof returned `customer_visit_proof_pending` and cross-owner access returned a safe denial. After delivery, exact owner and delegated manager reads returned minimized proof without internal report/job IDs or share links. Placeholder evidence did not test real-image quality. |
| Final reset | All three full-lifecycle resets returned `remainingManifestRecords: 0`; the final preflight reported `namespaceMatches: 0`. The latest reset also verified zero derived route/report/exception audits. One earlier partial full-lifecycle attempt reset cleanly after a safe cross-owner denial mismatch stopped execution. |
| Audit cleanup | The strengthened reset removes audit targets captured from exact plan/report/exception roots and fails if any remain. Sixty-two orphaned synthetic audit events from earlier development cycles were identified by those exact roots, removed transactionally, and followed by a fresh cycle ending with `remaining_study_actor_audits=0`. |
| Session checkpoint | A fresh `open_customer_decision` run stopped both records after one verified checkpoint, created no activation or route, then reset to zero. The same fail-closed selector supports every recorded lifecycle checkpoint. |
| Task-related record counts | Manifest-owned owner/provider/customer/route/exception/photo/report records were removed; the migration baseline and synthetic provider membership remain. |
| Existing baseline route | `day_plans` 1: migration `0003_add_day_plan_tables.sql` inserts a published June 15, 2026 sample for `crew_1001` with two stops. It is not a Yardfolio Study fixture. |
| Separate API identity | Readiness reported `yardfolio-api`, PostgreSQL, and exact database `yardfolio_study`; fixture-mode startup accepted that binding. |
| API reachability | `GET /auth/config` returned 200 and `local_review` at `127.0.0.1:8081`. |
| Read-only fixture probe | The privacy-minimized probe verified the matched owner, delegated Property Manager, and Crew Lead counts without printing IDs, addresses, messages, or tokens. |

These checks establish the isolated provider-to-outcome fixture path and its
repeatable cleanup, not participant evidence or real-image quality. The route query prefers a current-day published plan and can
fall back to the historical migration record. Never count the seeded June route
as Canyon View or Sage Lane.

## Next environment gate

1. Prepare independent session copies at the exact earlier/final lifecycle
   moments required by each matched task; never mutate an immutable record
   backward to recreate a state.
2. Conduct the counterbalanced participant sessions and record device,
   viewport, displayed date, network condition, fixture revision, and app
   commit before treating a task as matched evidence.
3. Keep Crew Lead-originated access handoff, Plan 8/9 revision semantics, and
   real-image proof quality explicitly non-comparable until supported evidence
   exists.

The API is a data-isolation endpoint, not a separate styled frontend. The phone
review app remains at `/app` on port 5173 and uses the shared review API on port
8080. The Yardfolio Study prototype is separate and simulated.

The database is local machine state. Recreate and revalidate it on another
host; a Git checkout alone does not provide it.
