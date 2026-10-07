# Yardfolio Study public claim inventory

Status: company-first audience and launch wording approved; remaining product
gates stay explicit. Reviewed 2026-10-01 against repository code and
[`PLAN.md`](../PLAN.md).
“Implemented” below means repository behavior with local review evidence, not a
healthy protected production deployment.

| Current public claim or preview | Repository evidence and boundary | Assessment | Wording to test, not yet approved |
| --- | --- | --- | --- |
| Company: “Plan the day. Guide the crew. Prove the work.” | [Company copy](../frontend/src/components/PublicLandingPage.tsx) and [tour](../frontend/src/components/MarketingProductTour.tsx) now limit the public promise to planning, field progress, reviewed proof, and accountable follow-through. Completion reports, offline field work, and manager review exist; [`PLAN.md`](../PLAN.md) keeps invoices, payments, and billing product gated. | **Supported in repository, with a hosting boundary.** The copy no longer implies invoice or payment capability. | Keep billing and payment language out until the product and protected runtime support it. |
| Yard Owner: start privately, then choose when a provider can see the yard. | [Owner landing copy](../frontend/src/components/PublicLandingPage.tsx) links to `/app/yard-owner`. [`PLAN.md`](../PLAN.md) records private owner workspace/property, versioned brief, optional photos, and owner-scoped disclosure work. Protected hosting is still unverified. | **Supported in repository, with a hosting boundary.** The privacy promise requires current authorization and disclosure checks in any launch environment. | Keep the private-start promise, subject to protected-hosting smoke and a plain statement of when details are shared. |
| Yard Owner: connect a provider you know, then understand every visit. | [Owner product copy](../frontend/src/components/PublicLandingPage.tsx) now names the known-provider path. The invitation and relationship flow has substantial repository implementation, while [`PLAN.md`](../PLAN.md) keeps curated marketplace/discovery behind product and operational gates. | **Supported in repository, with a hosting boundary.** The wording no longer implies an open provider marketplace. | Mention broader discovery only after its release gate is met. |
| Company: routes, crews, service progress, evidence, and customer follow-through stay connected. | [Company copy](../frontend/src/components/PublicLandingPage.tsx); current [workspace navigation](../frontend/src/workspaces/personas/registry.ts) and [manager tool menu](../frontend/src/components/ManagerWorkspaceMenu.tsx) spread the work across destinations. The [critical review](review/application-workflow-critical-review-2026-09-16.md) documents the observed manager path. | **Capabilities exist; the experience claim is unproven.** A shared data model does not prove a user can follow one service without context loss. | Name concrete capabilities until matched task testing confirms a connected-workflow claim. |
| Crew: “Progress and evidence wait safely when coverage disappears.” | [Crew copy](../frontend/src/components/PublicLandingPage.tsx), [offline queue design](../docs/offline-mutation-queue.md), and [`PLAN.md`](../PLAN.md) document device-held work, retry, and conflicts. | **Supported with a device/sync limit.** Saved on the phone is different from synced to the server; conflicts can still need manager review. | Say “Save progress on this device while offline and see when it syncs or needs attention.” Validate on supported phones. |
| Property Manager: review service status and delivered proof across properties covered by active access. | [Property Manager copy](../frontend/src/components/PublicLandingPage.tsx) stays within the protected portfolio read and delivered-proof boundary. Customer-controlled invitation, verified-recipient acceptance, and revocation are implemented; broad multi-vendor governance, invoice matching, and vendor scorecards remain later work in [`PLAN.md`](../PLAN.md). | **Supported repository boundary, with hosting and study gates.** Scoped reads and delegation fail closed, but matched multi-property grants and protected deployment evidence do not exist. | Keep broad vendor-governance claims out; validate grant language with matched customers and managers before promoting it publicly. |
| Public proof and numeric previews imply real outcomes. | The [public page](../frontend/src/components/PublicLandingPage.tsx) labels the product cards illustrative and reserves customer results for verified approval. The new [critical review](review/application-workflow-critical-review-2026-09-16.md) treats sample counts as fixture evidence only. | **Boundary is present.** Preserve it through any new homepage or screenshot. | Keep “illustrative preview” next to sample counts and use customer quotes, metrics, or provider badges only with recorded verification. |

## Decision gate before new public copy

1. Preserve [MG-D1 and MG-D2](PRODUCT_DECISIONS.md): landscaping company
   owners/managers are the primary buyer and the approved promise is planning,
   field progress, reviewed proof, and accountable follow-through.
2. Confirm each approved statement against the exact route/API, authorization,
   persistence, recovery, and hosted environment that will back it.
3. Run public entry tasks with representative Yard Owners, Property Managers,
   provider owners, and invited staff. Record what capability each person
   expects after reading the promise and clicking the CTA.
4. Keep a dated copy-to-capability link in this inventory when wording changes.

This is a source audit and recommendation list. It contains no conversion data,
participant findings, or approval to change the live marketing page.
