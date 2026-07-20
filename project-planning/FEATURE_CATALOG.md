# Feature Catalog

## Public Product Experience

- Public outcome-led homepage with direct workspace entry
- Interactive benefit stories for yard owners, property managers, landscaping companies, and crew leads
- Plan-Care-Proof product narrative and representative workspace preview
- Responsive product capability and trust sections
- Persona-specific demo, portfolio-discussion, and early-access conversion paths
- Consent-based PostgreSQL lead capture with landing-page and UTM attribution
- Honeypot spam filtering and honest local-preview confirmation
- Shareable persona campaign paths with tailored hero copy, calls to action, canonical metadata, and crawler controls
- Interactive persona-aware Plan-Care-Proof product tour
- Evidence standard and trust cards grounded in delivered offline, audit, access, evidence, reporting, and bid workflows
- First-party conversion events for visits, personas, tour steps, CTAs, form starts, submissions, and failures
- Anonymous per-tab measurement with UTM attribution, an explicit event allowlist, and no third-party tracking
- Planned extensions: manager funnel reporting, verified customer proof, production screenshots, and lead notifications

## Persona Workspaces

- Shared authenticated Home with signed-in identity, persona context, work/sync summary, and persona-specific quick actions
- Yard owner: properties, upcoming service, reports, photos, bids, and service history
- Property manager: portfolio service, vendor work, reports, and approvals
- Crew lead: route execution, crew progress, field exceptions, and completion evidence
- Crew member: assigned work, job steps, photos, and completion evidence
- Yard-care company owner: company operations, customers, teams, routes, and recovery
- Yard-care company manager: dispatch, schedules, customers, reports, and daily operations
- Dispatcher: route risk, crew workload, assignments, and schedule changes
- Billing administrator: accounts, bids, approvals, and billing readiness
- Support administrator: tenant access, recovery, diagnostics, and audited support

This catalog connects each major product track to its detailed specification and
roadmap phases. A feature specification describes the desired product; inclusion
here does not mean every capability has been delivered.

| Product track | Primary audiences | Specification | Main roadmap phases |
| --- | --- | --- | --- |
| Field crew operations | Crew leads, crew members, dispatchers, account managers, billing administrators | [`../features/yard-crew.md`](../features/yard-crew.md) | 1, 2, 3, 5 |
| Yard-care company operations | Owners, operations managers, branch managers, dispatchers, fleet, finance | [`../features/yard-care-company.md`](../features/yard-care-company.md) | 3, 5, 6 |
| Homeowner self-service | Homeowners maintaining their own yards | [`../features/self-service.md`](../features/self-service.md) | 7 |
| Multi-vendor property management | Property managers, vendor managers, accounts payable, independent vendors | [`../features/property-managment.md`](../features/property-managment.md) | 4, 8 |

## Capability Areas

### Identity, organizations, and onboarding

- Cognito authentication and role-aware access
- Organization memberships and invitations
- Tenant-aware resource boundaries
- Customer, property, crew, manager, and organization onboarding
- Owner-managed organization profile identity
- Owner-managed member display names with immutable identity references
- Role administration and audited access changes
- Branch, territory, region, and service-area hierarchy

### Crew field workflow

- Daily routes and ordered stops
- Job and stop lifecycle tracking
- Offline mutation queues and synchronization
- Checklists, contracted scope, exceptions, and amendments
- Before/after/issue photo evidence
- Add-on work, labor, materials, equipment, and treatment records
- Safety, attendance, readiness, and crew handoff notes

### Manager operations

- Draft route creation, editing, capacity review, and publishing
- Dispatch calendar and cross-crew reassignment
- Completion-report and quality-review queues
- Bid, amendment, notification, and photo-processing recovery
- Operational exception management
- Persisted activity and audit history

### Customer experience

- Authenticated account, property, and portfolio portal
- Scheduled-work and service-history timelines
- Immutable completion reports and customer-safe evidence
- Bid review and bid history
- Notification preferences and communication history
- Support and service-issue requests

### Revenue and administration

- Service catalog and recurring contracts
- Estimates, bids, change orders, deposits, and invoices
- Payment and account status
- Billing readiness and job costing
- Fleet, equipment, inventory, and material usage
- Organization settings and data-retention controls

### Platform operations

- Hosted development, staging, and production environments
- Database migrations, smoke tests, and rollback procedures
- Notification and image-processing workers
- Logs, metrics, traces, alerts, backups, and restore drills
- Rate limits, usage governance, feature flags, and abuse monitoring
- Calendar, maps, accounting, CSV, webhook, and public API integrations

### Future product modes

- Adaptive homeowner yard-care planning and guided work sessions
- Vendor onboarding, compliance, coverage, and work distribution
- Evidence validation and vendor quality scorecards
- Three-way vendor invoice matching
- Multi-region property-management portfolio dashboards
