# Minimalist Persona Experience Prototype Plan

## Outcome

Create a separate, interactive design review for the simplest useful Grover
experience each signed-in persona can receive. This prototype answers **how the
work should feel and flow**. The existing
[functional-unit rollout](all-persona-minimal-rollout-plan.md) continues to
answer **when capabilities may be enabled**.

The prototype is design direction, not a production or authorization claim.
Production APIs remain authoritative and product-gated functions stay absent.

## Minimalist experience rules

Every persona prototype must follow the same constraints:

1. Lead with one outcome and one primary action.
2. Keep global navigation to four destinations or fewer at the minimum useful
   experience.
3. Show at most three supporting facts before the user asks for more detail.
4. Prefer a short work queue over a dashboard of unrelated metrics.
5. Put recovery beside the affected task instead of in a disconnected help
   surface.
6. Use progressive disclosure for history, explanation, and secondary actions.
7. Preserve a consistent shell while changing density and composition for the
   customer, field, operations, and administrative contexts.
8. Keep unsupported, unauthorized, future, and product-gated actions absent.

## Persona journey contracts

| Persona | First answer | Primary task | Supporting destinations | Intentionally absent |
| --- | --- | --- | --- | --- |
| Yard Owner | What happens next at my yard? | Prepare for the next visit | Visits, Proof | Provider operations, billing, broad support |
| Property Manager | Which property needs attention? | Resolve the highest-priority coverage issue | Properties, Proof, Approvals | Routes, crews, provider-private notes |
| Crew Lead | What should my crew do now? | Start or continue the current stop | Route, Jobs | Company administration and customer history |
| Crew Member | What is my assigned task? | Record progress on the current job | Route, My work | Route publication and crew reassignment |
| Company Owner | Is the business ready to operate today? | Resolve the highest business blocker | Operations, Customers, Team | Platform support and unsupported revenue tools |
| Company Manager | What threatens today’s service? | Balance and publish the operation | Schedule, Customers, Recovery | Owner-only setup and privacy administration |
| Dispatcher | What prevents the plan from publishing? | Assign the unowned stop | Day plan, Crews | Job execution and customer administration |
| Billing Administrator | Which completed work is not billing-ready? | Correct or hand off the next record | Readiness, Accounts | Invoices, payments, refunds, and accounting |
| Support Administrator | Which incident needs ownership? | Take and triage the highest-impact incident | Incidents, Activity | Unscoped tenant browsing |
| Team Member fallback | Why is no workspace available? | Check an invitation or contact an administrator | Home only | All protected product data |

## Design phases

### M0 — Shared minimalist shell

Deliver the persona selector, stable account context, responsive desktop rail,
phone navigation, one-primary-task composition, disclosure pattern, status
language, and ready/attention/clear-day scenario controls.

Exit: the shell remains usable at 1440px, 390px, and 320px; changing persona or
scenario updates the URL and accessible announcement without leaking another
persona's content.

### M1 — Customer confidence

Deliver purpose-built Yard Owner and Property Manager views. Prefer service
confidence and explicit decisions over operational metrics.

Exit: each customer can answer what happens next, what needs action, and where
delivered proof lives without seeing provider-private information.

Delivered detail:

- Yard Owner: Today preparation → Visits chronology → immutable delivered Proof.
- Property Manager: portfolio exception → exact Property → delivered Proof →
  version-bound Approval.
- Preparation checkboxes and access/proof/approval choices block illustrative
  confirmation until the required selection is present.
- Completion offers the next useful destination and repeats that no production
  data changed.

### M2 — Field focus

Deliver distinct Crew Lead and Crew Member views optimized for outdoor phone
use. Crew Lead coordinates the route; Crew Member acts only on assigned work.

Exit: both roles can identify the next task in one glance, while authority
differences remain visible without explanatory clutter.

### M3 — Provider operations

Deliver distinct Company Owner, Company Manager, and Dispatcher views. Owner
starts with business readiness, Manager with service risk, and Dispatcher with
publishability.

Exit: each role receives one role-appropriate queue and action rather than a
shared generic management dashboard.

### M4 — Administrative focus

Deliver bounded Billing Administrator, Support Administrator, and no-role
fallback views. Billing remains a completion-readiness workflow; Support
requires exact tenant context; the fallback exposes no protected data.

Exit: administrative tasks are actionable without implying unsupported revenue
or broad support authority.

### M5 — States, accessibility, and convergence

Validate ready, attention, and clear-day/empty scenarios; navigation and detail
interactions; keyboard focus; live announcements; reduced motion; 200% text;
44px phone targets; horizontal overflow; and fixed-navigation clearance.

Exit: all persona/scenario combinations pass repeatable browser validation and
the gallery presents the artifact as design direction with desktop and mobile
references.

## Progress

| Phase | Repository status | Remaining review |
| --- | --- | --- |
| M0 — Shared minimalist shell | Validated | Human shell and content-density review |
| M1 — Customer confidence | Connected destination prototype validated | Yard Owner and Property Manager task-comprehension review |
| M2 — Field focus | Validated | Crew Lead/Crew Member outdoor and physical-device review |
| M3 — Provider operations | Validated | Owner/Manager/Dispatcher workflow review; Dispatcher role remains product-gated |
| M4 — Administrative focus | Validated | Billing/Support workflow review; Billing role remains product-gated |
| M5 — States and convergence | Automated browser evidence complete | Moderated users, physical devices, and assistive-technology sessions |

Repository validation covers all ten personas, all three scenarios, every
destination, and 1440px, 390px, and 320px viewports. Human review is not
inferred from automated evidence.

## Review order

Review the minimum experience before adding feature breadth:

1. Customer: Yard Owner, Property Manager
2. Field: Crew Lead, Crew Member
3. Operations: Company Manager, Dispatcher, Company Owner
4. Administration: Billing, Support, Team Member fallback
5. End-to-end handoff: customer need → plan → field work → proof → customer

## Handoff boundary

Prototype approval may establish information hierarchy, content, navigation,
responsive behavior, interactions, and state treatment. It does not approve a
new role, API, persisted write, hosted cohort, billing capability, concern
workflow, or external review integration. Each production adoption slice must
map the approved design to its real authorization and data contracts.
