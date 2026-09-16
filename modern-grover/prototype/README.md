# Customer and manager service decisions

Status: simulated M2 service thread; no real account, API read, write,
scheduling, notification, or participant result. Start with the
[Yard Owner decision](customer.html), [Company Manager release](index.html),
[Crew Lead field task](field.html), [manager exception](exception.html),
[manager proof review](proof.html), or [Yard Owner outcome](outcome.html).
State resets when each page reloads.

These are the first new Modern Grover compositions in the independent track.
These six pages use the Canyon View synthetic record from
[MATCHED_FIXTURES.md](../MATCHED_FIXTURES.md).
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
is a separate later task moment. The manager proof page starts with a rejected
after-photo record in private package 1, simulates correction to package 2,
and permits customer delivery only after exact-version review. The customer
outcome page starts at the delivered package 2 moment and keeps the optional
seasonal care idea separate from completed work. No real image is supplied, so
the prototype cannot test visual proof quality. Scenario buttons load
independent task moments rather than a continuous persisted timeline.

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
8. In proof review, identify the rejected after-photo record and request a
   correction without delivering draft evidence. Simulate package 2, review
   its exact version, then deliver. Inject a newer package during delivery and
   verify the prior intent is stopped. Retry a failed read safely.
9. As Yard Owner, identify the delivered service and reviewed proof metadata.
   Open the optional seasonal care idea; request a separate proposal and
   explain why it does not reopen or charge the completed service. Retry an
   unavailable result without treating it as undone work.

Record task completion, first wrong turn, whether the participant states the
correct version and next owner, and whether the recovery explains what did
or did not happen. This prototype is task material, not evidence that the
composition works for real users or real authorization.

For local regression, run `node modern-grover/prototype/validate.mjs` with the
Vite review server active. Set `MODERN_GROVER_REVIEW_URL` to the Tailscale URL
when validating from a remote browser environment.
