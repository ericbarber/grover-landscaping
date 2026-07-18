# Project Planning and Version History

This directory is the review entry point for Grover Landscaping product planning.
It brings the roadmap, feature specifications, and release history together without
moving their existing canonical documents.

## Documents

| Document | Purpose |
| --- | --- |
| [ROADMAP.md](ROADMAP.md) | Consolidated continuation plan and phased roadmap |
| [FEATURE_CATALOG.md](FEATURE_CATALOG.md) | Index of product capabilities and their source specifications |
| [VERSION_HISTORY.md](VERSION_HISTORY.md) | Human-readable history of project milestones and releases |
| [WORKING_AGREEMENTS.md](WORKING_AGREEMENTS.md) | Durable collaboration, commit, and validation expectations |

## Canonical Sources

- [`../PLAN.md`](../PLAN.md) remains the detailed delivery-status tracker. Update it
  when an item moves between Delivered, In Progress, Planned, or Backlog.
- [`../features/`](../features/) contains the detailed audience and product
  specifications used as roadmap inputs and acceptance-criteria sources.
- [`../docs/`](../docs/) contains technical designs, API contracts, runbooks, and
  validation notes.

The files in this directory summarize and organize those sources. If a summary and
a detailed source disagree, `PLAN.md` and the relevant feature or technical
document take precedence.

## Maintenance Workflow

For each meaningful release:

1. Update `PLAN.md` to reflect delivered and remaining work.
2. Update `ROADMAP.md` if scope, sequencing, or priorities changed.
3. Add a dated entry to `VERSION_HISTORY.md`.
4. Update `FEATURE_CATALOG.md` when a capability or specification is added.
5. Link new API designs and operational runbooks from the relevant feature entry.

Version-history entries should describe user-visible outcomes, important platform
changes, migrations, and known follow-up work. They should not be raw commit logs.
