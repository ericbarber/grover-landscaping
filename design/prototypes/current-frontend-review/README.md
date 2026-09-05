# Current Frontend Review Mirror

This dependency-free prototype mirrors representative production frontend
surfaces as they appeared in the local PostgreSQL-backed review environment on
September 3, 2026. It exists to compare the current product with the older
conceptual prototypes without implying that either one is automatically the
approved next design.

This is a dated mirror, not a continuously updated copy. Rollout-aware manager
status and the compressed authenticated shell were delivered on September 19 and
are intentionally absent. See the
[`artifact-status inventory`](../../ARTIFACT_STATUS.md) for the current
classification of every prototype family.

## Included surfaces

- Public landing
- Company owner Home and Manage
- Crew lead Home and Route
- Yard owner Home and the current unavailable My yard state
- Property manager Portfolio

Use the surface picker or URL hashes such as `#crew-route` and `#portfolio`.
The mirror is responsive and recreates the production-like signed-in shell;
the local-review identity selector is intentionally excluded because it is a
review-only tool, not hosted product chrome.

## Boundaries

- No API calls, authentication, persistence, or simulated successful writes.
- Representative values are design-review fixtures, not production evidence.
- This is a current-state reference, not approval to preserve every observed
  behavior.
- Findings and proposed follow-up slices live in
  [`../../review/current-frontend-design-audit-2026-09-03.md`](../../review/current-frontend-design-audit-2026-09-03.md).

Validate and optionally refresh gallery captures from the repository root:

```bash
node design/tools/validate-current-frontend-review.mjs --capture
```
