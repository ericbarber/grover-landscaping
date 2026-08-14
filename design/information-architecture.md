# Information Architecture

## Experience map

```text
Grover
├── Public website
│   ├── Homepage
│   ├── Persona campaign landing
│   ├── Yard Crew provider acquisition
│   ├── Conversion request
│   └── Customer-safe shared report or bid
├── Identity and setup
│   ├── Sign in / callback / recovery
│   ├── First-owner company setup
│   ├── Provider owner-operator or company setup
│   └── Team invitation acceptance
├── Authenticated workspace
│   ├── Persona Home
│   ├── Field
│   │   ├── Route
│   │   ├── Assigned jobs
│   │   └── Job detail
│   ├── Provider growth
│   │   ├── Provider readiness
│   │   ├── Owner-approved opportunities
│   │   ├── Yard assessment
│   │   └── Initial proposal and work-ready handoff
│   ├── Manager
│   │   ├── Overview
│   │   ├── Schedule
│   │   ├── Customers
│   │   ├── Team
│   │   ├── Reports
│   │   └── Recovery
│   ├── Customer
│   │   ├── Yard-owner property history
│   │   └── Property-manager portfolio
│   └── Revenue administration
│       ├── Catalog and contracts
│       ├── Estimates and changes
│       ├── Billing readiness
│       └── Invoices, payments, and cost
└── Future product modes
    ├── Homeowner self-service yard assistant
    └── Multi-vendor property management
```

## Navigation rules

- The public website explains the product; it must not inherit application
  readiness, offline, update, or API failure banners.
- Persona Home answers “what should I do next?” and does not duplicate every
  destination available to that person.
- Yard Crew marketing may address owner-operators, company operators, and
  invited workers together, but it routes them to provider-organization or
  least-privilege invitation outcomes before authenticated setup.
- Owner opportunities belong to authorized provider organizations, never public
  individual-worker inventory. Interest, owner disclosure, assessment, proposal,
  acceptance, internal crew assignment, and first-visit confirmation remain
  separate lifecycle decisions.
- Field navigation remains stable and thumb reachable: Home, Route, Jobs, Job.
- Manager mobile navigation uses four levels: Home, manager hub, category tool
  picker, and one active tool. Desktop may show persistent category navigation.
- Customer navigation excludes provider-only concepts such as crew assignment,
  internal audit IDs, recovery queues, and unpublished reports.
- Support and billing roles reuse manager layout primitives but see only their
  allowed destinations.
- Homeowner self-service is not a simplified crew workspace. Its tasks, schedule,
  supplies, and guidance are homeowner concepts.
- Multi-vendor property management is not a larger landscaping-company account.
  Vendor governance, compliance, work distribution, and invoice matching require
  their own hierarchy.

## Page composition contract

Every authenticated page should answer these questions in the first viewport:

1. Where am I and which persona or organization context is active?
2. What is the most important current state?
3. What is the primary safe action?
4. What is blocked, unsynced, unavailable, overdue, or at risk?
5. How do I return to the parent workflow without losing review state?

Data-heavy pages should use this hierarchy:

```text
Page identity → summary metrics → filters/search → collection or board
              → selected record → action and confirmation → audit/recovery
```

## Responsive intent

- **Mobile field:** current work and primary actions dominate; secondary workflows
  open one at a time.
- **Mobile manager:** one category and one tool at a time; context bars preserve
  the path back to the manager hub.
- **Desktop manager:** persistent navigation, summaries, collection/board, and a
  contextual inspector can coexist without stacking every tool.
- **Customer mobile:** compact property selection before service history; only the
  newest proof is expanded by default.
- **Public responsive:** retain one message and primary conversion action in the
  first viewport, with the product preview following rather than competing.

## Required state variants

Approved high-fidelity screens need explicit variants for:

- Loading and slow startup
- Valid empty data
- Persisted storage or API unavailable
- Offline work queued locally
- Conflict requiring review
- Missing or unauthorized resource
- Expired or revoked public link
- Destructive confirmation and completed recovery
- Success with the next useful action
