# Grover application personas

Status: prior design hypotheses for review, 2026-09-16. These are task and
authority profiles, not interview findings or new production roles. The active
[Modern Grover track](../../modern-grover/README.md) uses them as input only.
Validate the needs and language in moderated sessions before using them as
adoption evidence.

The modern website prototype starts with the five roles in the core service
loop. The remaining profiles preserve specialized and recovery paths. A person
may hold more than one role; the interface must use the active authorized scope,
not infer access from a persona description.

| Persona | First answer they need | Primary task | Prototype wave |
| --- | --- | --- | --- |
| [Yard Owner](yard-owner.md) | What happens to my yard next? | Decide, prepare, and review delivered care | 1 |
| [Property Manager](property-manager.md) | Which property needs me? | Resolve an exact portfolio exception | 1 |
| [Company Owner](company-owner.md) | Is the business ready to deliver? | Clear a company-level blocker | 1 |
| [Company Manager](company-manager.md) | Which service needs an office decision? | Publish or correct an exact plan | 1 |
| [Crew Lead](crew-lead.md) | What is my next released stop? | Execute or request an office correction | 1 |
| [Crew Member](crew-member.md) | What assigned work is mine? | Complete an assigned task and save evidence | Later |
| [Dispatcher](dispatcher.md) | Can today's plan be published? | Coordinate capacity and exact plan versions | Gated role |
| [Billing Administrator](billing-administrator.md) | Which completed visit lacks billing-ready context? | Resolve an account or completion gap | Gated role |
| [Support Administrator](support-administrator.md) | Which owned incident needs help? | Resolve a purpose-bound incident | Contextual |
| [Team Member without a role](team-member-no-role.md) | Why can't I enter the workspace? | Resolve invitation or access | Recovery |

## Shared design contract

- Lead with one status, one next action, and a short queue. A queue opens the
  exact service thread; the thread retains decision, plan, field work, proof,
  and recovery history appropriate to the active role.
- Show accountable owner, date or version, and source of truth beside every
  consequential status. Label loading, empty, unavailable, and stale states
  distinctly.
- Customer views exclude provider-private crew and route details. Field views
  exclude customer pricing. Scope comes from production authorization, never
  from a prototype selector.
- Mobile layouts preserve the same task and recovery path with 44px or larger
  targets, readable labels, keyboard focus, and no horizontal scrolling.
- The prototype's controls preview interaction only. They do not authenticate,
  persist decisions, publish plans, or enable a role.

The [website and workspace prototype plan](../review/modern-website-prototype-plan.md)
defines the current wave. The existing [service-thread direction](../prototypes/simplified-service-thread/README.md),
[rollout contract](../review/all-persona-minimal-rollout-plan.md), and production
authorization rules remain the sources for workflow and access boundaries.
