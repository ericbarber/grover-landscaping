# Customer and manager service decisions

Status: simulated M2 slices; no real account, API read, write, scheduling,
notification, or participant result. Open `/modern-grover/prototype/customer.html`
for Yard Owner, `/modern-grover/prototype/` for Company Manager, or
`/modern-grover/prototype/field.html` for Crew Lead on the private review
server. The [manager exception review](exception.html) follows the field
question. State resets when each page reloads.

These are the first new Modern Grover compositions in the independent track.
The [Yard Owner decision](customer.html), [Company Manager decision](index.html),
[Crew Lead field task](field.html), and [manager exception review](exception.html)
use the Canyon View synthetic record from [MATCHED_FIXTURES.md](../MATCHED_FIXTURES.md).
The customer reviews proposal v3 for $420. Acceptance requests planning and
does not schedule or charge. The manager study starts at the subsequent
**accepted proposal / draft plan** moment. The prior released Plan 7 is
context; the current draft is Plan 8, linked to accepted proposal v3. Plan 9
appears after a simulated correction or version conflict. The link between
pages is a study control; it does not grant a customer provider access or
persist a real decision. The field study starts from released Plan 8 on a fixed
September 16, 2026 study day. It simulates an access question, one checklist
change, offline tab-held state, a sent request, a Plan 9 conflict, and a failed
read. Tab-held state is lost on reload; this page does not test durable offline
storage. The office return view starts with the matching synthetic field
request. It holds affected work, keeps the manager responsible for access
verification, and simulates a reviewed Plan 9 release with unchanged accepted
scope. The free-text field note does not transfer between pages. Proof review
is a subsequent M2 slice. Scenario buttons load independent task moments
rather than a continuous persisted timeline.

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
6. As Crew Lead, open released Plan 8, go offline, record a synthetic access
   question, and hold one walkway check in the tab. Identify which changes
   the office has not received. Retry a failed read without losing this tab's
   simulated local state. Inject Plan 9 and verify replay stops for manager
   review; in a fresh scenario, reconnect without conflict and state the next
   owner. No customer price or private office controls should appear.
7. From the office exception queue, open the matching Stop 1 request. Confirm
   a hold instruction without changing accepted scope or releasing a plan.
   Simulate verified access, review exact Plan 9, and release it to Crew Lead.
   Retry a failed read without displaying request details while unavailable.

Record task completion, first wrong turn, whether the participant states the
correct version and next owner, and whether the recovery explains what did
or did not happen. This prototype is task material, not evidence that the
composition works for real users or real authorization.

For local regression, run `node modern-grover/prototype/validate.mjs` with the
Vite review server active. Set `MODERN_GROVER_REVIEW_URL` to the Tailscale URL
when validating from a remote browser environment.
