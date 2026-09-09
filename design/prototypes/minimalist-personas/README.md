# Minimalist Persona Experiences

This dependency-free working prototype explores the smallest clear, useful
frontend experience for all ten signed-in Grover personas. It is intentionally
separate from the functional-unit rollout prototype:

- this prototype reviews task hierarchy, navigation, content, responsive
  composition, progressive disclosure, and recovery;
- the rollout prototype reviews cumulative capability and enablement boundaries.

Use the review controls to switch persona and scenario. Within the workspace,
open persona-specific destinations, inspect the primary task, reveal its
rationale, and complete the illustrative primary action. Nothing calls an API
or persists.

The customer family now includes connected destination-level journeys. Yard
Owner moves from next-visit preparation through Visits to delivered Proof;
Property Manager moves from the portfolio exception through the exact property,
delivered evidence, and a version-bound decision. Contextual choices must be
made before illustrative confirmation, and every completion can continue to
the next useful destination without implying a production write.

The field family is connected separately. Crew Lead moves from current-stop
readiness through ordered Jobs to a route request that leaves the published
plan unchanged until office review. Crew Member moves from personal task
readiness to a read-only crew Route and personal device-held recovery without
receiving publish, reassignment, or crew coordination controls.

The operations family now keeps three different decision horizons. Company
Owner moves from business readiness into Team, Operations, and Customers;
Company Manager moves from the current service risk into an exact Schedule
version, customer impact, and Recovery; Dispatcher moves from plan
publishability into crew fit and a new-plan response. Dispatcher remains a
design-only role and no illustrative choice changes production data.

The administrative family is equally bounded. Billing Administrator moves
from an incomplete completion record into exact Account readiness and a
traceable Handoff without invoice or payment controls. Support Administrator
must own an incident before reviewing its minimized Activity and purpose-bound,
expiring Access. The no-role Team Member has one protected-data-free Home path
for invitation or account recovery and never receives a partial workspace.

The experience follows the
[minimalist persona plan](../../review/minimalist-persona-prototype-plan.md).

Validate all persona, scenario, destination, and responsive contracts with:

```bash
node design/tools/validate-minimalist-personas.mjs
```

Refresh the gallery references with:

```bash
node design/tools/validate-minimalist-personas.mjs --capture
```
