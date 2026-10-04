# Modern Grover product decisions

Status: MG-D1, MG-D2, MG-D4, and MG-D6 are decided by the customer/product
owner; MG-D3 and MG-D5 remain open. Provisional recommendations elsewhere are
not approved choices.

| ID | Decision | Current evidence | Recommendation to test | Required resolution |
| --- | --- | --- | --- | --- |
| MG-D1 · decided | Who is the first public audience and buyer? | The current public page defaults to Landscaping company; the earlier modern preview opens with a general care story and customer/provider choices. | Lead with the provider-company operating workflow while retaining explicit Yard Owner, Property Manager, and Crew Lead perspectives. | **Approved 2026-10-01:** landscaping company owners/managers are the primary public buyer; company setup is the primary conversion outcome. |
| MG-D2 · decided | What can the public site promise today? | Earlier company copy said billing/revenue stayed connected and described “completed revenue”; invoices and payments remain gated in [`PLAN.md`](../PLAN.md). | Describe delivered planning, field evidence, customer proof, and accountable follow-through precisely. Avoid wording that implies invoice or payment capability until implemented and validated. | **Approved 2026-10-01:** lead with “Plan the day. Guide the crew. Prove the work.” and keep billing, payments, open discovery, and generalized vendor governance out of the core promise. |
| MG-D3 | How should Property Manager and owner-operator enter? | The earlier modern preview groups Property Manager with Yard Owner and sends providers to a Company Manager example. Current provider entry distinguishes owner-operator, company owner, invited team member, and owner invitation. | Observe role selection from the homepage and preserve invitation-specific access. Promote an entry path only if it reduces errors. | Decide top-level entry architecture after task observation. |
| MG-D4 · decided | What appears first for a person with office and field responsibilities? | The earlier Company Manager fixture led with field job totals and Route/Jobs/Job navigation before a manager service decision. Some real people may hold both responsibilities. | Lead with the active responsibility and its exact work queue; show field controls when that user's authorized field assignment calls for them. | **Approved 2026-10-01:** Company Owner and Company Manager Home lead with an authorized service-handoff queue; Route, Jobs, and field controls remain reachable only within their existing capability and assignment boundaries. |
| MG-D5 | What is the minimum service outcome to prototype and adopt? | The earlier modern preview stops at inspection; the service-thread candidate connects more of the lifecycle but has no participant results. | Test one versioned customer decision → manager release → field exception → proof review → customer outcome, including recovery. | Select one representative service and success criteria before building the new prototype. |
| MG-D6 · decided | Who grants Property Manager portal access? | Activation issues only a Property Owner grant. The separately implemented customer invitation, verified-recipient acceptance, and revocation path creates and removes each exact-property manager grant/membership. | Customer-controlled delegation after the customer accepts the company as their service team. | **Approved 2026-09-17:** the customer grants access after the company relationship is active. The provider cannot grant it on the customer's behalf. See the [implementation contract](PROPERTY_MANAGER_ACCESS.md). |

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
- **Delivery status:** invitation, verified-recipient acceptance, persistence,
  exact-property grant/membership issuance, revocation, audit, and owner/
  recipient UI are implemented and package-validated. The
  [contract](PROPERTY_MANAGER_ACCESS.md) remains authoritative. Browser
  execution and matched multi-property study fixtures remain external gates;
  no live or hosted grant is implied by repository delivery.

Record each final decision with date, owner, rationale, observed evidence, and
the affected public/workspace/API slices. A previous prototype is a candidate,
not approval.

## MG-D1 and MG-D2 decision record

- **Decision maker and date:** customer/product owner, 2026-10-01.
- **Primary public buyer:** landscaping company owners and managers.
- **Primary conversion:** begin company setup, with a guided walkthrough as a
  secondary path. Other audience perspectives remain available without becoming
  competing default calls to action.
- **Approved promise boundary:** daily planning, field progress, offline-safe
  capture, reviewed customer proof, and accountable follow-through. Do not imply
  invoicing, payments, open provider discovery, or broad vendor governance.
- **Reason:** these are the strongest connected, repository-supported outcomes
  and the clearest basis for a protected pilot.

## MG-D4 decision record

- **Decision maker and date:** customer/product owner, 2026-10-01.
- **Rule:** Company Owner and Company Manager Home starts with a short queue of
  exact property services ordered by customer/service consequence and workflow
  state. It opens the relevant Job or Report directly instead of requiring the
  user to traverse the manager tool directory.
- **Authority boundary:** the queue derives only from job and report reads that
  the current rollout unit already authorizes. It does not grant field actions,
  preload later-unit data, or replace Route and Jobs for an assigned field role.
- **Failure behavior:** loading and unavailable reads are explicit; neither may
  be presented as a valid empty or all-clear queue.
