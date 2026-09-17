# Modern Grover product decisions

Status: MG-D6 decided by the customer/product owner on 2026-09-17; MG-D1–D5
remain open. Provisional recommendations elsewhere are not approved choices.

| ID | Decision | Current evidence | Recommendation to test | Required resolution |
| --- | --- | --- | --- | --- |
| MG-D1 | Who is the first public audience and buyer? | The current public page defaults to Landscaping company; the earlier modern preview opens with a general care story and customer/provider choices. | Test separate provider-company, Yard Owner, and Property Manager entry tasks. Choose the first audience from product strategy and observed wrong turns, then make one primary CTA. | Product owner names the primary audience and conversion outcome after claim review. |
| MG-D2 | What can the public site promise today? | Current company copy says billing/revenue stay connected and describes “completed revenue”; invoices and payments remain gated in [`PLAN.md`](../PLAN.md). | Describe delivered planning, field evidence, customer proof, and billing readiness precisely. Avoid wording that implies invoice or payment capability until implemented and validated. | Approve a claim/capability matrix before public copy adoption. |
| MG-D3 | How should Property Manager and owner-operator enter? | The earlier modern preview groups Property Manager with Yard Owner and sends providers to a Company Manager example. Current provider entry distinguishes owner-operator, company owner, invited team member, and owner invitation. | Observe role selection from the homepage and preserve invitation-specific access. Promote an entry path only if it reduces errors. | Decide top-level entry architecture after task observation. |
| MG-D4 | What appears first for a person with office and field responsibilities? | The local Company Manager fixture leads with field job totals and Route/Jobs/Job navigation before a manager service decision. Some real people may hold both responsibilities. | Lead with the active responsibility and its exact work queue; show field controls when that user's authorized field assignment calls for them. | Confirm role/scope behavior and the business rule before changing the shell. |
| MG-D5 | What is the minimum service outcome to prototype and adopt? | The earlier modern preview stops at inspection; the service-thread candidate connects more of the lifecycle but has no participant results. | Test one versioned customer decision → manager release → field exception → proof review → customer outcome, including recovery. | Select one representative service and success criteria before building the new prototype. |
| MG-D6 · decided | Who grants Property Manager portal access? | Activation currently issues only a Property Owner grant. The protected manager read requires a matching manager grant and membership; no issuance/revocation path exists. | Customer-controlled delegation after the customer accepts the company as their service team. | **Approved 2026-09-17:** the customer grants access after the company relationship is active. The provider cannot grant it on the customer's behalf. See the [implementation contract](PROPERTY_MANAGER_ACCESS.md). |

## MG-D6 decision record

- **Decision maker and date:** customer/product owner, 2026-09-17, in this
  conversation.
- **Rule:** the customer who accepted the provider company as their service
  team controls Property Manager access. The current application's separate
  relationship activation is the first eligible point. Accepting proposal v3
  alone requests planning and does not grant manager access.
- **Reason:** customer property visibility should follow customer consent,
  not a provider-side portfolio grouping or the provider's organization role.
- **Scope for the first implementation:** one customer property in one active
  provider relationship per grant. The customer can revoke it. A Property
  Manager covering several properties receives separate grants, with no
  implicit account-wide or cross-customer access.
- **Delivery status:** product rule decided; API, invitation/recipient check,
  persistence, revocation, UI, and matched fixture remain to build and verify.
  The [contract](PROPERTY_MANAGER_ACCESS.md) records safety and recovery
  behavior for the first slice. No current grant is implied by this decision.

Record each final decision with date, owner, rationale, observed evidence, and
the affected public/workspace/API slices. A previous prototype is a candidate,
not approval.
