# Modern Grover website and workspace preview

Open [index.html](index.html) directly or visit `/design/prototypes/modern-grover/`
on the local Vite review server. The prototype is static and dependency-free.

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

The [plan](../../review/modern-website-prototype-plan.md) and
[personas](../../personas/README.md) explain the intended review. This is a
design direction, separate from the current React app and from the existing
[service-thread prototype](../simplified-service-thread/README.md).
Use the [comparison guide](../../review/modern-website-comparison-guide.md)
to collect participant evidence before a production adoption proposal.

Validate the five perspectives, three states, keyboard interaction, and desktop
and phone layouts with:

```bash
node design/tools/validate-modern-grover.mjs
```
