# Customer and manager service decisions

Status: simulated M2 slices; no real account, API read, write, scheduling,
notification, or participant result. Open `/modern-grover/prototype/customer.html`
for Yard Owner or `/modern-grover/prototype/` for Company Manager on the
private review server. State resets when each page reloads.

These are the first new Modern Grover compositions in the independent track.
The [Yard Owner decision](customer.html) and [Company Manager decision](index.html)
use the Canyon View synthetic record from [MATCHED_FIXTURES.md](../MATCHED_FIXTURES.md).
The customer reviews proposal v3 for $420. Acceptance requests planning and
does not schedule or charge. The manager study starts at the subsequent
**accepted proposal / draft plan** moment. The prior released Plan 7 is
context; the current draft is Plan 8, linked to accepted proposal v3. Plan 9
appears after a simulated correction or version conflict. The link between
pages is a study control; it does not grant a customer provider access or
persist a real decision. Field progress and proof review are subsequent M2
slices. The scenario buttons load independent task moments rather than a
continuous persisted timeline.

## Review tasks

1. As Yard Owner, review the exact version, scope, price, and consequence.
   Simulate acceptance or a revision request; state the next owner. Inject a
   stale proposal during confirmation and a failed read before deciding.
2. From the manager Today queue, find the exact service and explain the
   customer impact, draft version, open crew fit check, and next owner.
   Confirm fit, review the exact
   release summary, and simulate release.
3. Request a correction instead. Identify who owns the next step and confirm
   the draft remains unreleased. Simulate a revised Plan 9, then check crew fit
   again; the earlier request is not a release approval.
4. Inject a stale version while reviewing Plan 8. Verify release stops, load
   Plan 9, and repeat the fit decision rather than reusing the Plan 8 approval.
5. Inject a failed read. Verify protected service details and release actions
   disappear until a successful retry.

Record task completion, first wrong turn, whether the participant states the
correct version and next owner, and whether the recovery explains what did
or did not happen. This prototype is task material, not evidence that the
composition works for real users or real authorization.

For local regression, run `node modern-grover/prototype/validate.mjs` with the
Vite review server active. Set `MODERN_GROVER_REVIEW_URL` to the Tailscale URL
when validating from a remote browser environment.
