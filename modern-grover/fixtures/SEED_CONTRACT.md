# Isolated matched-record seed contract

Status: implementation contract for a future seeder. A separate local study
database has now been created and migrated, as recorded in
[LOCAL_STUDY_ENV.md](LOCAL_STUDY_ENV.md); no Modern Grover fixture records have
been written. Use the [matched facts](../MATCHED_FIXTURES.md)
and [authority map](../FIXTURE_READINESS.md) as the task source. The
[read-only probe](README.md) reports the current local-review baseline.

## Isolation and ownership

- Use a dedicated non-production PostgreSQL database and API process for
  study records. The current private review database contains unrelated sample
  work. Seed and reset must refuse to run if the target is the shared review
  database or if the API is outside `local_review` mode.
- The fresh local study database includes a migration-owned June 15 sample
  day plan and stops. Reserve a distinct namespace and leave that baseline
  intact on reset; an empty database is not the precondition.
- Give Canyon View and Sage Lane distinct synthetic owner users, property
  IDs, provider invitations, idempotency-key namespaces, and record IDs.
  Avoid real addresses, contacts, gate codes, photos, and payment data.
- Store a local fixture manifest with the target database identity, app
  commit, migration revision, synthetic user IDs, generated record IDs,
  phase, as-of date, and creation time. Keep invitation tokens and any private
  connection data out of logs and committed files.
- Reset only records created by the manifest in reverse dependency order,
  verify the counts afterward, and refuse an unknown or partial manifest.
  `backend/tests/owner_provider_invitation_persistence.rs` shows the
  dependency order for its own test records; its broad cleanup must not be
  used as a study reset against the shared database.

## Supported transition sequence

| Snapshot | Required transition | Verification before saving a snapshot |
| --- | --- | --- |
| Open customer decision | Owner workspace/property and ready brief → delivered, recipient-checked provider invitation → provider claim/capability → scoped disclosure and completed assessment → immutable proposal v1, v2, then current v3 with one-time scope and $420 fixed total | Owner read returns only the target property and proposal v3 `sent`; v1/v2 are superseded; wrong owner cannot read or decide it. A stale v2 acceptance conflicts without a partial decision. |
| Accepted, not scheduled | Owner accepts exact v3 with affirmation and idempotency key; activation is a separate owner-confirmed transition | Acceptance snapshot matches v3 and $420. Acceptance alone creates no route, crew assignment, visit date, or payment. Activation creates the owner's portal grant and account/property relationship. |
| Confirmed visit | Provider proposes a first-visit window; owner confirms the current version with affirmation; provider releases the exact initial service | Portal visit read is authorized and matches the synthetic service/date. Service release links accepted proposal, activation, first-visit proposal, and created job. Wrong user and invalid grant/scope fail closed. |
| Field route | Manager creates a draft day plan, assigns the released job to a stop, and publishes for the study day | Crew Lead reads a published route for the as-of day and exact job/stop. The route has a plan ID but no Plan 8/9 revision number, so prototype revision tasks remain comprehension-only. |
| Exception/proof/outcome | Use supported operational exception, stop/job progress, evidence, report review/request-changes/resubmit/deliver, and customer proof reads | Crew-originated access-question handoff is unsupported; do not assert it completed. Customer proof is pending before delivery and comes only from the delivered snapshot afterward. No real image means visual proof quality remains untested. |

Keep these as **separate snapshots or independent copies**. A proposal cannot
remain open after acceptance, and a report cannot be both under review and
delivered. Do not rewrite immutable proposals, releases, events, or report
snapshots to make an earlier task moment reappear. The backend persistence
test demonstrates the owner and first-visit sequence and its version conflicts;
it is a test fixture, not a reusable browser-study seed script.

## Date and role gates

`GET /crews/{crew_id}/day-plan/today` uses the database server's
`CURRENT_DATE`: it selects today first, then a past route, then a future one.
The prototype currently displays September 16, 2026. A later session needs
either a controlled test clock or an updated prototype/service-day fixture;
otherwise the current app would present the route as historical and the task
would not be comparable.

The activation write creates only a Property Owner membership and portal
grant. [MG-D6](../PRODUCT_DECISIONS.md) now assigns Property Manager access
to customer-controlled delegation after relationship activation, but the
issuance/revocation workflow does not yet exist. Do not fabricate a manager
grant by SQL and claim the delegation task works. Company Owner
accountability, provider-originated property access
questions, and Plan 8/9 exact revision semantics also need product/API
decisions before they can be scored as equivalent completion tasks.

## Acceptance gate for the seeder

1. The isolated target is proven by connection identity and an empty reserved
   fixture namespace before the first write.
2. Setup and reset are idempotent, scoped to the manifest, and tested twice on
   the isolated database.
3. The read-only probe reports the expected status/counts for both records.
   Direct API checks verify exact IDs, role/scope denial, current version,
   customer-safe projection, current route date, proof privacy, and failure
   recovery. Counts alone never establish a matched fixture.
4. A session record captures fixture revision, app commit, device/viewport,
   displayed date, and network condition. Only then can a supported task be
   compared to the simulated prototype.
