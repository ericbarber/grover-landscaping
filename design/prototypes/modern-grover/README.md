# Modern Grover website and workspace preview

Status: prior design candidate. The active planning and review are in the
independent [Modern Grover track](../../../modern-grover/README.md).

Open [index.html](index.html) directly or visit `/design/prototypes/modern-grover/`
on the local Vite review server. The prototype is static and dependency-free.
The [styled plan](plan.html) is the phone-friendly browser view of the
[source plan for this candidate](../../review/modern-website-prototype-plan.md).

Review routes:

- `#home` — public website concept;
- `#customer` — Yard Owner customer path;
- `#provider` — known-provider path; and
- `#workspace/owner`, `#workspace/property`, `#workspace/company`,
  `#workspace/manager`, `#workspace/lead` — five role-filtered examples.

The workspace preview offers attention, on-track, and unavailable states. All
names, properties, dates, and counts are illustrative. The controls do not
authenticate, save a choice, publish a plan, or update production data.
Dispatcher and Billing Administrator remain design-only roles and are excluded
from this first-wave preview.

The [personas](../../personas/README.md) explain the intended review. This is a
design direction, separate from the current React app and from the existing
[service-thread prototype](../simplified-service-thread/README.md).
The [earlier comparison guide](../../review/modern-website-comparison-guide.md)
is research input for the new track, not participant evidence or approval.

Validate the five perspectives, three states, styled plan, keyboard interaction,
and desktop and phone layouts with:

```bash
node design/tools/validate-modern-grover.mjs
```
