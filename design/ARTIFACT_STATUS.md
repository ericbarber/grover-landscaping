# Design Artifact Status

This inventory is the interpretation key for the Grover design gallery. It
classifies artifact families by how they should be used today; a polished image
or interactive prototype is not production evidence by itself.

## Classification rules

| Classification | Use |
| --- | --- |
| Current mirror | Dated evidence of rendered production composition. Compare against the named capture date; do not assume it includes later commits. |
| Adopted behavior | The named workflow or visual decision exists in React and has proportionate validation. Production code and API contracts remain authoritative. |
| Design direction | A reviewed proposal for work that has not been fully adopted. It may contain illustrative data and non-persistent interactions. |
| Historical input | A retained exploration or prior composition. Use it for rationale and regression context, not pixel parity. |
| Product-gated boundary | A concept that cannot proceed until its named product, legal, privacy, operational, or financial decision is resolved. |

When one artifact contains several states, the primary classification below is
followed by an exact boundary. “Adopted behavior” never means that illustrative
counts, people, dates, providers, or customer claims are production facts.

## Working prototypes

| Artifact family | Primary classification | Exact boundary |
| --- | --- | --- |
| `prototypes/minimalist-personas/` | Design direction | Ten personas have distinct task-first hierarchy, destinations, primary actions, short queues, explicit omissions, and attention/on-track/no-work scenarios. Illustrative actions are non-persistent and do not add roles or product authority. |
| `prototypes/current-frontend-review/` | Current mirror | September 3, 2026 baseline only. Manager continuity and shell compression delivered afterward are intentionally absent. |
| `prototypes/yard-owner-minimal-rollout/` | Adopted behavior | The version-2 projection, cohort persistence/administration, cumulative navigation, persona composition, manager continuity, and protected runner are implemented for authoritative roles. Hosted cohort execution and explicit Dispatcher/Billing backend roles remain external or gated. |
| `prototypes/frontend-truth-recovery/` | Adopted behavior | Yard Owner protected-read exits and Crew Route date/persistence vocabulary are adopted. Illustrative prototype records remain non-production examples. |
| `prototypes/public-homepage/` | Historical input | Persona continuity, Plan–Care–Proof behavior, conversion recovery, and core visual language are adopted. Its taller composition is no longer the production parity source. |
| `prototypes/property-manager-portfolio/` | Adopted behavior | Overview, Properties, Proof, Approvals, scoped composition, and partial-source recovery are adopted. Illustrative readiness values are not production evidence. |
| `prototypes/yard-owner-portal/` | Adopted behavior | Home, Visits, Proof, Account, service-day state, questions, and recommendation decisions are adopted. Concerns, preferences, provider contact, and billing remain separately gated. |
| `prototypes/yard-owner-acquisition/` | Adopted behavior | Private intake through explicit activation and first-visit confirmation is adopted. Curated discovery and broader relationship continuity are not implied. |
| `prototypes/yard-crew-acquisition/` | Adopted behavior | Public entry, known-owner connection, readiness facts, proposal/activation, and first-visit preparation are adopted. Availability, credential verification, curated opportunities, and alerts remain design direction or product-gated. |
| `prototypes/shared/` | Adopted behavior | Core palette, type roles, controls, focus treatment, disclosure, and shell materials are adopted incrementally; production components remain the implementation source. |

## Static concepts and wireframes

| Artifact family | Primary classification | Exact boundary |
| --- | --- | --- |
| `high-fidelity/current/minimalist-personas-*` | Design direction | Responsive browser captures of customer, field, operations, and administrative task-first experiences; not production parity or implementation evidence. |
| `high-fidelity/current/current-frontend-*` | Current mirror | September 3 capture pair associated with the dated mirror. |
| `high-fidelity/current/*minimal-rollout*` | Adopted behavior | Functional-unit contracts are adopted in the repository; images do not prove live cohort enablement. |
| `high-fidelity/current/frontend-truth-recovery-*` | Adopted behavior | State hierarchy and vocabulary are adopted; the static example data is illustrative. |
| `high-fidelity/public/homepage-*` | Historical input | Retained visual and interaction rationale; current React is the composition source. |
| `high-fidelity/field/crew-route-*` | Adopted behavior | Current-stop hierarchy, progress, sync confidence, and stable field navigation are adopted; dated example content is illustrative. |
| `high-fidelity/manager/schedule-*` | Adopted behavior | Today’s-operation hierarchy, route board, inspector, and manager handoffs are adopted; the image is not live operational data. |
| `wireframes/public/` | Adopted behavior | Persona campaigns, conversion, and customer-safe shared proof are adopted at their core. `01-homepage.svg` is historical composition input. |
| `wireframes/auth/` | Adopted behavior | Fail-closed access, first-owner setup, and invitation paths are adopted. |
| `wireframes/field/` | Adopted behavior | Home, Route, Jobs, and focused Job detail hierarchy are adopted. |
| `wireframes/manager/` | Adopted behavior | Hub, Schedule, Team, Reports, and Recovery core are adopted. Customer and report cards may also contain named future extensions. |
| `wireframes/customer/` | Adopted behavior | Yard Owner and Property Manager core are adopted; concern/preferences/contact/billing remain outside that claim. |
| `wireframes/revenue/` | Product-gated boundary | Existing bid and billing-readiness foundations do not authorize invoices, payments, tax, or accounting integration. |
| `wireframes/future/` | Product-gated boundary | Homeowner-assistant and multi-vendor modes establish separation only; neither is an implementation commitment. |

## Review rule

Start with the current mirror for dated visual comparison, then use the adoption
tracker for implementation status and this inventory for artifact intent. If
the three disagree, `PLAN.md` and production code determine delivery status;
update the design records in the same feature slice.
