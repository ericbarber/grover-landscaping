# Project Planning and Version History

This directory is the review entry point for Grover Landscaping product planning.
It brings the roadmap, feature specifications, and release history together without
moving their existing canonical documents.

## Documents

| Document | Purpose |
| --- | --- |
| [DELIVERY_BOARD.md](DELIVERY_BOARD.md) | Authoritative active phase, next queue, blockers, and exit evidence |
| [ROADMAP.md](ROADMAP.md) | Consolidated continuation plan and phased roadmap |
| [FEATURE_CATALOG.md](FEATURE_CATALOG.md) | Index of product capabilities and their source specifications |
| [PROTOTYPE_ADOPTION.md](PROTOTYPE_ADOPTION.md) | Approved design-to-production status and adoption history |
| [VERSION_HISTORY.md](VERSION_HISTORY.md) | Human-readable history of project milestones and releases |
| [CURRENT_HANDOFF.md](CURRENT_HANDOFF.md) | Current restart point, validation baseline, and next implementable slice |
| [WORKING_AGREEMENTS.md](WORKING_AGREEMENTS.md) | Durable collaboration, commit, and validation expectations |
| [`../design/`](../design/) | Visual gallery, information architecture, wireframes, and design decisions |

## Source Authority

- [`DELIVERY_BOARD.md`](DELIVERY_BOARD.md) owns execution order, current work,
  the next repository slice, and external blockers.
- [`../PLAN.md`](../PLAN.md) owns detailed Delivered, In Progress, Planned, and
  Backlog status.
- [`ROADMAP.md`](ROADMAP.md) owns long-range sequencing and product strategy; it
  is not the day-to-day task queue.
- [`../features/`](../features/) contains the detailed audience and product
  specifications used as roadmap inputs and acceptance-criteria sources.
- [`../docs/`](../docs/) contains technical designs, API contracts, runbooks, and
  validation notes.
- [`../design/`](../design/) contains the visual product model used to review page
  composition and responsive behavior before new UI implementation.

`CURRENT_HANDOFF.md` is a concise restart snapshot derived from the delivery
board and current validation evidence. `PROTOTYPE_ADOPTION.md` owns only visual
artifact adoption. If detailed behavior disagrees with a summary, `PLAN.md` and
the relevant feature or technical contract take precedence; if documents name
different next tasks, `DELIVERY_BOARD.md` wins.

## Maintenance Workflow

For each meaningful release:

1. Update `DELIVERY_BOARD.md` when active work, ordering, or an external blocker
   changes.
2. Update `PLAN.md` when detailed delivery state changes.
3. Refresh `CURRENT_HANDOFF.md` when the restart point or validation baseline
   changes.
4. Update `ROADMAP.md` only when strategic scope or sequencing changes.
5. Add a dated entry to `VERSION_HISTORY.md` for meaningful delivery outcomes.
6. Update `FEATURE_CATALOG.md` when a capability or specification is added.

Version-history entries should describe user-visible outcomes, important platform
changes, migrations, and known follow-up work. They should not be raw commit logs.
