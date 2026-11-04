# Round 1 plan: Yard Owner decision comprehension

Status: selected and technically rehearsed; participants not yet observed

Round 1 uses task `MG-Y1` to test whether a Yard Owner can find one current
service proposal, explain its exact terms and consequences, and later identify
which completion proof is safe to trust. This document fixes the round; it is
not a session result. Use [SESSION_PROTOCOL.md](SESSION_PROTOCOL.md) for the
research rules and copy [SESSION_NOTES_TEMPLATE.md](SESSION_NOTES_TEMPLATE.md)
outside the repository for each consented anonymous participant.

## Selected moments

| Moment | Current-app checkpoint | Required answer | Mutation boundary |
| --- | --- | --- | --- |
| Decision | `open_customer_decision` | Current proposal v3, $420 fixed total, exact scope, and acceptance requests provider setup without scheduling, charging, or assigning a crew | A participant may inspect the acceptance confirmation but must not submit a decision during the scored task. |
| Proof follow-up | `delivered_outcome` | Only manager-reviewed delivered proof is customer-visible; internal job, report, route, and evidence identifiers remain hidden | Read only. Do not create a recommendation or another service request. |

These moments require separate fresh manifests. Never advance or rewind one
participant manifest to reuse it for the other moment.

## First-wave participants

Recruit two Yard Owners with different levels of experience arranging
residential property service. One should regularly coordinate service or
repairs; one should do so infrequently. Additional perspectives remain later
rounds and must not be mixed into the Yard Owner completion count.

Counterbalance the condition order:

| Participant | First condition | First record | Second condition | Second record |
| --- | --- | --- | --- | --- |
| `MG-Y1-P01` | Current application | Canyon View | Yardfolio Study prototype | Sage Lane |
| `MG-Y1-P02` | Yardfolio Study prototype | Canyon View | Current application | Sage Lane |

Use a short unrelated reset prompt between conditions. Do not tell the
participant which navigation control, version, amount, or consequence to find.

## Current-app session preparation

From the repository root, create a unique ignored manifest for the participant
and moment. The exact source commit must be the commit running on the isolated
port-8081 API—not merely the current checkout.

```bash
PGDATABASE=yardfolio_study \
YARDFOLIO_STUDY_API_URL=http://127.0.0.1:8081 \
YARDFOLIO_STUDY_SOURCE_COMMIT='<exact running API commit>' \
YARDFOLIO_STUDY_AS_OF='<session date>' \
node yardfolio-study/fixtures/study-session.mjs prepare \
  open_customer_decision \
  .localdev/yardfolio-study/mg-y1-p01-decision.json
```

Start the isolated frontend with `scripts/study-review.sh`, then immediately
before observation verify the receipt:

```bash
YARDFOLIO_STUDY_API_URL=http://127.0.0.1:8081 \
node yardfolio-study/fixtures/study-session.mjs verify \
  open_customer_decision \
  .localdev/yardfolio-study/mg-y1-p01-decision.json
```

Record the returned fixture revision, source commit, as-of date, record labels,
verification time, viewport, device, and connection condition in the session
notes. The checkpoint-gated browser test may be run as a technical preflight;
do not count its result as participant behavior.

After the current-app condition—or any interrupted preparation—reset the exact
manifest and retain only the privacy-minimized reset facts in the notes:

```bash
PGDATABASE=yardfolio_study \
YARDFOLIO_STUDY_API_URL=http://127.0.0.1:8081 \
node yardfolio-study/fixtures/study-session.mjs reset \
  .localdev/yardfolio-study/mg-y1-p01-decision.json
```

Require `remainingManifestRecords: 0` and `namespaceMatches: 0` before another
participant or checkpoint. Repeat with a new manifest and
`delivered_outcome` only for the separate proof follow-up.

## Scored prompt and follow-up

Use the neutral prompt verbatim:

> Find the service that needs your decision. Explain the scope, total, what
> your choice does, and who acts next.

After the participant answers, ask:

> What would happen if you accepted this? What would not happen yet?

For the separately prepared proof moment, ask:

> Find what proves the work was delivered. What can you trust here, and what
> can you decide next?

Do not correct an answer until its first destination, first spoken answer,
wrong turns, context changes, and time to orientation are recorded.

## Stop and comparison rules

- Stop before a final accept, decline, activation, schedule, payment, message,
  or external communication is submitted.
- Mark the task `unsafe` if the participant believes acceptance schedules or
  charges for service, treats a superseded proposal as current, or trusts
  undelivered/private proof.
- Mark the proof comparison `not comparable` for judgments about image quality;
  current fixtures intentionally use placeholder evidence.
- Do not score unsupported Crew Lead-originated handoff or Plan 8/9 semantics.
- Keep names, addresses, tokens, recordings, and private screenshots outside
  the repository.

## Round exit

Round 1 is complete only after two consented participants finish both condition
orders, every current-app manifest has a zero-proven reset, and findings are
linked to anonymous note IDs. Classify each proposed change as `retain`,
`revise`, `reject`, or `gated`; do not start B2 composition work from facilitator
expectations alone.
