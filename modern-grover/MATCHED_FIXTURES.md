# Matched service records for Modern Grover review

Status: synthetic fixture specification; no records have been seeded and no
participant result is claimed. Use only non-production identities and data.

The [current journey trace](CURRENT_JOURNEYS.md) cannot compare complete tasks:
Yard Owner and Property Manager protected access are inactive in local review,
Property Manager has no waiting decision, and Crew Lead's published route is
past. Prepare two equivalent services before
running current-app versus new-flow sessions. Record the app commit, fixture
revision, displayed as-of date, viewport, device, and network condition for
every session.

## Two equivalent records

| Fact | Record A | Record B | Invariant |
| --- | --- | --- | --- |
| Synthetic property label | Canyon View | Sage Lane | Different names reduce memorized answers. No real address, person, or phone number. |
| Customer relationship | Active, property-scoped grant | Active, property-scoped grant | Yard Owner and Property Manager see only their authorized property. |
| Customer decision | Current proposal version 3, one-time cleanup and pruning, total `$420` | Same scope, version, and total | The price and acceptance consequence appear to customers and authorized office roles, never Crew Lead. Acceptance requests planning; it does not schedule or charge. |
| Office plan | Draft Plan 8, accepted scope linked, one crew-fit check open | Same state | Manager must identify the exact draft and next release owner; Company Owner sees only business consequence and accountable manager. |
| Field work | Released Plan 8 in the field-task phase; one access clarification and one device-held photo/checklist change | Same state | Crew Lead sees current assigned stop, access/safety context, local save versus server sync, and office ownership of plan changes. |
| Proof | Completion package under manager review with one missing or rejected after photo | Same state | Customer sees no draft evidence; manager identifies correction before delivery. |
| Customer outcome | Delivered, manager-reviewed proof and one contextual recommendation in the completed phase | Same state | Customer can distinguish delivered work from the next proposal decision. |

The table describes **task moments**, not simultaneous contradictory states on
one live record. Each condition should start from the same moment and advance
through authorized state transitions or use a fresh fixture snapshot. Do not
manually change a released plan, reuse a stale decision, or claim a write
succeeded when the current system cannot perform it. If a current-app step
cannot be represented, mark that task **not comparable** and test comprehension
separately from completion.

## Role and state requirements

| Perspective | Entry and task | Required source/state |
| --- | --- | --- |
| Yard Owner | Sign in → exact service → decide current version → later review proof | Active grant; current proposal; explicit acceptance consequence; only delivered proof. |
| Property Manager | Sign in → portfolio exception → exact property decision | At least two authorized properties, one requiring action; no provider-private route/crew details. |
| Company Owner | Sign in → business blocker → accountable manager | One company-level access or capacity issue with a named operator; no default assumption that owner edits the route. |
| Company Manager | Sign in → plan conflict/release → proof correction | Accepted scope, draft/released version, crew fit, customer impact, evidence gap, and safe recovery. |
| Crew Lead | Sign in → today's assigned stop → continue offline/request correction | Current service date, released assignment, access/safety context, device-held work, and office response. |

## Comparison safeguards

1. Counterbalance A/current versus B/new and B/current versus A/new across
   participants. Keep facts and task success definitions equal; rotate labels.
2. Use an as-of date fixed in the session record, with both routes and Home
   summaries showing the same service day. Do not reuse the September local
   fixture's past June route as “today.”
3. Keep unavailable, ended-access, stale-version, and offline-conflict cases as
   explicit branches. They should never be silently replaced with empty or
   successful data.
4. Verify role and resource authorization from the server before each task.
   The prototype role selector is a review control, not an access grant.
5. For any write-intent task, use safe local or non-production records and
   document reset/replay behavior. The new prototype remains visibly simulated.

Implementing the records in the current app is separate development work. The
[current-app fixture and authority map](FIXTURE_READINESS.md) identifies the
supported route/API chain, source-backed gaps, and a safe snapshot sequence.
The current activation write cannot issue a Property Manager portal grant;
that role's fixture needs a supported delegation contract first.
The [workplan](WORKPLAN.md) requires matched records and reset verification
before participant sessions.
