# Current application journey trace

Status: first-pass local-review browser trace, not production parity or user
research. Reviewed 2026-09-16 at 390 × 844 at commit `322dc86` on branch
`codex-review-feature` with
the PostgreSQL-backed local-review service and its sample identities. The
diagnostic identity selector is not hosted product UI. No write action was
performed. The current fixture does not contain one equivalent service record
across all five roles, so this trace cannot yet score an end-to-end task.

| Perspective | Normal entry and first useful path observed | Current answer | Continuity issue or limit |
| --- | --- | --- | --- |
| Yard Owner | `/app` Home → My yard | Home says `0 of 0` visits and “You’re clear for now.” My yard says customer portal access is not active, with Review account access and Return Home. | Home interprets zero jobs as no action even when protected portal access cannot be confirmed. The My yard read correctly withholds details. This fixture needs an access-aware Home state before it can represent an active customer journey. |
| Property Manager | `/app` Home → Portfolio → Overview | Home says two services scheduled; Portfolio shows two authorized sample properties, zero exceptions/decisions, and a local-review data-boundary note. | This fixture can test scanning and safe scope, but cannot test a property exception or decision. The next comparison needs one exact authorized property requiring a response. |
| Company Owner | `/app` Home → Manage | Home leads with `0 of 3` field jobs and Route/Jobs/Job shortcuts; Manage opens six categories. | Company-level risk and accountable manager are not the first facts. A multi-role owner may need field access, but the default office task is not obvious. |
| Company Manager | `/app` Home → Manage → Schedule → Day plans or Workload | Home recommends Manage; the chosen service or plan is only found after category and tool selection. | The path begins from application taxonomy rather than the customer's affected service. The current fixture does not expose a matched plan conflict and proof correction from the normal entry. |
| Crew Lead | `/app` Home → Route | Home says three stops assigned and recommends today's Route. Route opens a **past**, read-only June 15 plan with two stops. | The Route correctly labels historical work, but Home still implies current assigned work. This is a local fixture/source mismatch that can mislead a field user and invalidate a fair comparison. |

These are observed interface outputs in local review, not a claim that every
production account has the same records. The [critical review](review/application-workflow-critical-review-2026-09-16.md)
contains the ranked design response. The [experience blueprint](review/application-experience-blueprint.md)
shows the cross-role target to test; the older prototype compositions are
comparison inputs only.

## What to prepare before comparing designs

1. Create two equivalent synthetic services with distinct names so learning
   one record does not give away the second. Each must have the same accepted
   scope, exact proposal/plan versions, service date, assigned owner, field
   exception, proof status, and customer-safe outcome.
2. Confirm the current Home, Route, Portal, Portfolio, and Manage surfaces read
   consistent authoritative states for each fixture. If a read is unavailable,
   show that limitation rather than a confident zero or “all clear.”
3. Record normal entry, required clicks, first stated answer, wrong turns,
   context changes, and authority/version interpretation for each role. Use the
   [new workplan](WORKPLAN.md) and earlier
   [SX4 task prompts](../design/review/simplified-product-experience-comparative-study.md)
   as inputs, without treating earlier prototype results as evidence.

## Immediate development candidate

After confirming the current data contracts, make Home summaries reflect the
same protected access and service-day truth as their destination screens. For
Yard Owner, access inactive must not become “clear for now.” For Crew Lead, a
past route must not become today's assigned route merely because job counts are
nonzero. This is a bounded continuity candidate, not approval to change
production behavior before the fixture, API, and authorization mapping is
reviewed.
