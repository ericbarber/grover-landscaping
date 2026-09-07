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
