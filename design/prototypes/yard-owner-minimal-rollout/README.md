# All-Persona Minimal Rollout Prototype

This dependency-free prototype defines cumulative functional-unit rollouts for
all ten signed-in workspace personas in the production role mapping:

- Yard Owner and Property Manager;
- Crew Lead and Crew Member;
- Yard-care Company Owner, Company Manager, and Dispatcher;
- Billing Administrator and Support Administrator;
- the Team Member fallback when no active role exists.

Open the [rollout map](index.html#overview/map), select a persona, and move
through its units. Every selection shows only destinations and contextual
capabilities that are complete at that unit. It does not render disabled or
“coming soon” navigation.

The legacy directory and Yard Owner/Crew Lead hashes remain stable. The
[all-persona plan](../../review/all-persona-minimal-rollout-plan.md) is the
cross-persona delivery contract, while the
[Yard Owner plan](../../review/yard-owner-minimal-rollout-plan.md) and
[Crew Lead plan](../../review/crew-lead-minimal-rollout-plan.md) retain their
detailed boundaries.

This is a rollout design. It does not implement server-derived capability
projection, enable a cohort, call an API, or persist interactions.

It is also not the current task-first UX direction. Use the separate
[minimalist persona prototype](../minimalist-personas/index.html) to review the
simplified first answer, primary action, navigation, and responsive experience
for each persona.

Validate all 36 persona/unit combinations at desktop, mobile, and narrow-phone
viewports and refresh gallery captures with:

```bash
node design/tools/validate-yard-owner-minimal-rollout.mjs --capture
```
