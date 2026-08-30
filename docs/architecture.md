# Architecture

Grover Landscaping is currently a modular-monolith web application with a React
client, Rust/Axum API, and PostgreSQL persistence. Local development runs through
Docker Compose; the protected-pilot deployment contract packages the frontend and
API into one Render web service. AWS remains a demand-driven growth path, not a
local-development requirement.

## Current runtime

```text
Browser / installable web app
  ├─ public persona landing and tokenized customer pages
  └─ authenticated multi-persona application
          │
          ▼
Rust Axum API
  ├─ Cognito JWT or production-rejected local-review identity
  ├─ route policy plus active organization/owner scope checks
  ├─ modular domain and PostgreSQL repositories
  ├─ notification outbox worker (disabled by default)
  └─ photo-processing worker (disabled by default)
          │
          ▼
PostgreSQL
```

In the production image, Axum also serves the compiled frontend from the same
origin. Health and database readiness are separate. Embedded SQLx migrations run
before the server accepts traffic.

## Application boundaries

- Public marketing, lead capture, and first-party conversion measurement
- Authentication, organization memberships, roles, and local review
- Field jobs, day plans, stop progress, checklists, photos, offline mutations,
  amendments, and completion handoff
- Manager scheduling, dispatch, operational exceptions, reporting, customer,
  team, hierarchy, notification, and recovery workflows
- Customer-safe completion reports and project-bid decisions
- Private Yard Owner acquisition outside provider organization tenants, including
  provider connection, disclosure, assessment, and initial proposal contracts

Customer-safe projections, provider-private notes, general audit, and restricted
support evidence are deliberately separate stores or response shapes. Cognito
groups are coarse roles; PostgreSQL membership and resource ownership remain the
tenant boundary.

## Persistence and fallback rules

PostgreSQL-backed repositories are authoritative for production writes. Selected
local surfaces can fall back to seeded data or browser storage for review, but
must label local-only, queued, unavailable, conflict, and persisted outcomes
distinctly. Production configuration rejects authentication modes intended only
for local review and must not turn a persistence outage into an apparent success.

The retained compatibility boundaries are:

| Boundary | Retained local behavior | Production guard |
| --- | --- | --- |
| Jobs, schedules, bids, and field photos | Seeded review data, local mutations, and placeholder upload tickets | Production startup requires PostgreSQL; placeholder tickets are not production evidence |
| Organization invitation review | Explicit `persisted: false` create/accept fixtures | Cognito plus persisted membership and invitation workflows are authoritative |
| Private owner acquisition | Self-scoped in-memory review repository with explicit persistence flags | Hosted owner records use the configured PostgreSQL repository |
| Public lead/event ingestion | Explicit local acceptance metadata for review | The production service cannot start without its database binding |

Ordinary persisted manager repositories do not opt into these substitutes.
Organization virtual membership is available only through the explicit local-
review/test repository configuration, and production rejects `local_review` and
`disabled` authentication modes.

## Photo flow

Local review can use placeholder upload tickets. S3 mode uses direct, expiring
presigned upload URLs so photo bytes do not pass through the API:

```text
1. Client requests a scoped upload ticket.
2. API validates actor, resource, type, content, and lifecycle state.
3. Client uploads directly to private object storage.
4. Client confirms completion without retaining upload credentials.
5. API verifies metadata, records evidence, and attempts thumbnail processing.
6. Failed processing enters a durable bounded retry/recovery queue.
```

Owner intake media and provider-job evidence use separate authorization scopes.
Customer reports expose only approved evidence projections.

## Deployment stages

| Stage | Runtime |
| --- | --- |
| Local | Docker Compose: Vite, Axum, PostgreSQL, local review, disabled delivery |
| Protected pilot contract | Combined Docker image on Render with private PostgreSQL and Cognito |
| Optional photo pilot | Private S3 module with signed access and lifecycle controls |
| Growth | AWS compute/database/eventing/networking only when measured demand requires it |

## AWS growth direction

Potential services remain Cognito, S3, RDS/Aurora PostgreSQL, App Runner or ECS,
SQS/EventBridge, CloudFront, Secrets Manager, and CloudWatch. Only Cognito and S3
Terraform modules are currently source-controlled. Do not describe the broader
AWS stack as deployed until it is provisioned and operationally validated.

See [`production-deployment.md`](production-deployment.md),
[`authentication.md`](authentication.md), [`data-model.md`](data-model.md), and
the [prototype adoption tracker](../project-planning/PROTOTYPE_ADOPTION.md).
