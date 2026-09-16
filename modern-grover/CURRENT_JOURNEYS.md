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

The bounded continuity repair is delivered after confirming the existing
customer visit-read error and crew day-plan response. In the 390 × 844
PostgreSQL-backed local review on 2026-09-16, Yard Owner Home now reports
“Customer portal access is not active,” suppresses unverified progress, and
leads to My yard. Crew Lead Home now shows `0 of 2` stops on the June 15 plan,
labels it “Past route” and read only, and directs the user to check with a
manager for a current plan. The Route header uses the service date; historical
stops are no longer called current/up next or given remaining time. Component
tests and the frontend build pass. The first-pass table above remains the
before-state evidence; this is a local-review regression check, not a matched
task or participant result.

## Property Manager protected-read repair

The first-pass Property Manager row above is also before-state evidence. The
current `/app` Home and Portfolio now use the protected customer visit
collection for that role. Portfolio lists only returned property names and
customer-safe visit summaries. It withholds property and action details during
loading, access denial, inconsistent access, and unavailable reads. In the
390px local review on 2026-09-16, the current Property Manager identity had no
active portal grant: Home reported inactive portfolio access; Portfolio showed
the same protected state with retry and Return Home; the former sample
properties were absent. A mocked two-property API read at phone and desktop
width verified list/search/detail, then an access-ended response removed both
properties. Component tests and the frontend build pass. The older preview
Portfolio's Proof and Approvals tabs are not asserted as live capabilities in
this read. A real matched Property Manager task still needs a valid grant,
service visit, and customer-safe question/decision record.
