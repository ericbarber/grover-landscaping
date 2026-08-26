# Customer Visit Communication API

Status: D-060 persistence, minimized authenticated API, Yard Owner questions,
and provider owner/manager response workspace delivered on 2026-08-26.

## Customer visit discovery

`GET /customer-portal/visits` adds `customer_visit_reference` only after an
exact service release has created the visit thread. Confirmed but unreleased
visits omit it. The random reference is safe to display but is not authorization:
every thread operation rechecks the caller's full active hybrid portal grant,
membership, organization/account/property provenance, and active relationship.

## Customer routes

```http
GET  /customer-portal/visits/{customer_visit_reference}/messages
POST /customer-portal/visits/{customer_visit_reference}/messages
```

The POST body contains only `expected_thread_version`, an allowlisted `topic`,
`customer_safe_body`, and a stable `idempotency_key`. It returns `201` when the
question is created and `200` for an exact replay. Missing access is `403`, an
inconsistent active grant is `409`, an unknown or ended visit is `404`, stale or
changed content is `409`, and unconfirmed storage is `503` with instructions to
retain the retry key and reload.

## Provider routes

```http
GET  /provider-customer-visit-threads
GET  /provider-customer-visit-threads/{customer_visit_reference}
POST /provider-customer-visit-threads/{customer_visit_reference}/responses
```

Middleware limits these routes to organization owners/managers; the repository
then requires a current active organization-scoped membership in the exact
provider organization and an active relationship. The queue orders unanswered
customer questions first, then recent activity. A response supplies the current
thread version, exact customer message ID, bounded customer-safe body, and retry
key. The server inherits the question topic and permits one response per
question.

## Minimized projection and deliberate non-effects

Thread and message responses contain the random visit reference, version,
customer-safe message fields, reply link, timestamps, and persistence state. The
provider queue adds the customer/property display names, service date, and
service title needed to identify the conversation. Responses omit actor user IDs
and release, activation, job, organization, account, property, membership,
route, crew, notification, and operational-exception identifiers.

Saving a message does not change service status, scope, schedule, assignment,
proof, billing, or concern state. It does not claim notification delivery,
message reading, a response time, or a service-level commitment.

## Responsive workspace behavior

Yard Owner Home and Visits open the exact thread only for released visits and
retain a stable retry key until a write is confirmed. Company owners/managers
open Visit questions from Reports, where the server-ordered queue identifies
safe visit context and the selected exact thread determines the unanswered
question. Provider writes supply the exact question ID and reload both thread
and queue after success, conflict, or an uncertain write. Support, billing, and
property-manager personas are not offered this tool.
