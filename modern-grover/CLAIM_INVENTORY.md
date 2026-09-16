# Modern Grover public claim inventory

Status: first-pass source audit; product wording and launch audience are not
approved. Reviewed 2026-09-16 against repository code and [`PLAN.md`](../PLAN.md).
“Implemented” below means repository behavior with local review evidence, not a
healthy protected production deployment.

| Current public claim or preview | Repository evidence and boundary | Assessment | Wording to test, not yet approved |
| --- | --- | --- | --- |
| Company: “A calmer system from morning plan to completed revenue”; billing stays connected and verified work moves toward invoice. | [Company copy](../frontend/src/components/PublicLandingPage.tsx) and [tour](../frontend/src/components/MarketingProductTour.tsx) use revenue language. Completion reports, bid decisions, and account context exist, but [`PLAN.md`](../PLAN.md) keeps invoices, payments, and billing product gated. | **Overstates the end state.** “Completed revenue” can sound like an invoice or payment result Grover does not yet deliver. | “Plan the day, capture work, and prepare customer-ready proof.” Describe billing readiness separately and precisely when it has an approved source. |
| Yard Owner: start privately, then choose when a provider can see the yard. | [Owner landing copy](../frontend/src/components/PublicLandingPage.tsx) links to `/app/yard-owner`. [`PLAN.md`](../PLAN.md) records private owner workspace/property, versioned brief, optional photos, and owner-scoped disclosure work. Protected hosting is still unverified. | **Supported in repository, with a hosting boundary.** The privacy promise requires current authorization and disclosure checks in any launch environment. | Keep the private-start promise, subject to protected-hosting smoke and a plain statement of when details are shared. |
| Yard Owner: “From finding care to understanding every visit.” | [Owner product copy](../frontend/src/components/PublicLandingPage.tsx) describes finding care. The known-provider invitation and relationship flow has substantial repository implementation, while [`PLAN.md`](../PLAN.md) keeps curated marketplace/discovery behind product and operational gates. | **Ambiguous breadth.** A visitor may expect an open provider marketplace. | “Connect a provider you know, then follow the service” for the known-provider path. Mention broader discovery only after its release gate is met. |
| Company: routes, crews, service progress, evidence, and customer follow-through stay connected. | [Company copy](../frontend/src/components/PublicLandingPage.tsx); current [workspace navigation](../frontend/src/domain/workspacePersona.ts) and [manager tool menu](../frontend/src/components/ManagerWorkspaceMenu.tsx) spread the work across destinations. The [critical review](review/application-workflow-critical-review-2026-09-16.md) documents the observed manager path. | **Capabilities exist; the experience claim is unproven.** A shared data model does not prove a user can follow one service without context loss. | Name concrete capabilities until matched task testing confirms a connected-workflow claim. |
| Crew: “Progress and evidence wait safely when coverage disappears.” | [Crew copy](../frontend/src/components/PublicLandingPage.tsx), [offline queue design](../docs/offline-mutation-queue.md), and [`PLAN.md`](../PLAN.md) document device-held work, retry, and conflicts. | **Supported with a device/sync limit.** Saved on the phone is different from synced to the server; conflicts can still need manager review. | Say “Save progress on this device while offline and see when it syncs or needs attention.” Validate on supported phones. |
| Property Manager: “Track service quality, open needs, and completion evidence across your portfolio.” | [Property Manager copy](../frontend/src/components/PublicLandingPage.tsx) and [portfolio panel](../frontend/src/components/PropertyManagerPortfolioPanel.tsx) support authorized property/service views. Broad multi-vendor governance, invoice matching, and vendor scorecards remain later roadmap work in [`PLAN.md`](../PLAN.md). | **Partly supported.** Authorized portfolio visibility exists; generalized vendor accountability may exceed current scope. | Say “Review service status and delivered proof across the properties you can access.” Keep vendor-governance claims out until implemented. |
| Public proof and numeric previews imply real outcomes. | The [public page](../frontend/src/components/PublicLandingPage.tsx) labels the product cards illustrative and reserves customer results for verified approval. The new [critical review](review/application-workflow-critical-review-2026-09-16.md) treats sample counts as fixture evidence only. | **Boundary is present.** Preserve it through any new homepage or screenshot. | Keep “illustrative preview” next to sample counts and use customer quotes, metrics, or provider badges only with recorded verification. |

## Decision gate before new public copy

1. Resolve [MG-D1 and MG-D2](PRODUCT_DECISIONS.md): primary audience and
   approved capability promise. The current public default is the landscaping
   company, while the earlier website concept starts with a broad customer and
   provider choice; neither wins by visual preference alone.
2. Confirm each approved statement against the exact route/API, authorization,
   persistence, recovery, and hosted environment that will back it.
3. Run public entry tasks with representative Yard Owners, Property Managers,
   provider owners, and invited staff. Record what capability each person
   expects after reading the promise and clicking the CTA.
4. Keep a dated copy-to-capability link in this inventory when wording changes.

This is a source audit and recommendation list. It contains no conversion data,
participant findings, or approval to change the live marketing page.
