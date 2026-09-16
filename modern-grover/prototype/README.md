# Manager service decision prototype

Status: simulated M2 slice; no real account, API read, write, scheduling,
notification, or participant result. Open `/modern-grover/prototype/` on the
private review server. The state resets when the page reloads.

This is the first new Modern Grover composition in the independent track. It
uses the Canyon View synthetic record from [MATCHED_FIXTURES.md](../MATCHED_FIXTURES.md)
at the **manager draft** task moment. The prior released Plan 7 is context;
the current draft is Plan 8, linked to accepted proposal v3. Plan 9 appears
only in the stale-version recovery scenario. The $420 acceptance requests
planning and does not schedule or charge. Field progress and proof review are
subsequent M2 slices, not simulated by this page.

## Review tasks

1. From Today, find the exact service and explain the customer impact, draft
   version, open crew fit check, and next owner. Confirm fit, review the exact
   release summary, and simulate release.
2. Request a correction instead. Identify who owns the next step and confirm
   the draft remains unreleased. Simulate a revised Plan 9, then check crew fit
   again; the earlier request is not a release approval.
3. Inject a stale version while reviewing Plan 8. Verify release stops, load
   Plan 9, and repeat the fit decision rather than reusing the Plan 8 approval.
4. Inject a failed read. Verify protected service details and release actions
   disappear until a successful retry.

Record task completion, first wrong turn, whether the participant states the
correct version and next owner, and whether the recovery explains what did
or did not happen. This prototype is task material, not evidence that the
composition works for real users or real authorization.

For local regression, run `node modern-grover/prototype/validate.mjs` with the
Vite review server active. Set `MODERN_GROVER_REVIEW_URL` to the Tailscale URL
when validating from a remote browser environment.
