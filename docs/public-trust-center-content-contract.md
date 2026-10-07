# Public trust center content contract

Status: internal B6 draft; not approved for publication. Updated 2026-10-01.

This contract maps possible public trust-center language to repository behavior,
protected-runtime evidence, accountable functions, and correction triggers. It
does not claim that a protected pilot is deployed, that optional providers are
enabled, or that an owner has approved legal/privacy wording.

## Publication rule

A statement may move to the public site only when:

1. its repository source is still authoritative;
2. any named runtime mode is proven in the current protected-release evidence;
3. Product, Engineering, Operations, and Privacy/Security owners approve the
   wording that falls within their responsibility;
4. a review date and emergency correction owner are recorded; and
5. the public page passes metadata, link, accessibility, and performance gates.

If evidence expires or configuration changes, remove or narrow the public
statement before the next deploy. A local-review environment, CI test,
illustrative preview, or configuration option is not deployment evidence.

## Draft statement inventory

| Topic | Draft plain-language statement | Repository source | Publication evidence still required | Accountable functions |
| --- | --- | --- | --- | --- |
| Sign-in | “Protected workspaces use managed sign-in. Yardfolio verifies the access token and then checks the person's active organization, role, and exact resource access on the server.” | [`authentication.md`](authentication.md), [`customer-portal-authorization-model.md`](customer-portal-authorization-model.md) | Protected Cognito mode, real identity binding, unauthenticated rejection, exact authorized read, and cross-tenant denial in the current release record | Engineering, Privacy/Security |
| Local review | “Demo and local-review identities are development tools and cannot be used as production principals.” | [`authentication.md`](authentication.md), production auth guards | Protected runtime rejects `local_review` and `disabled` modes | Engineering, Privacy/Security |
| Role and property scope | “Navigation never grants access. The API rechecks organization membership and, for customer delegates, each active property grant and provider relationship.” | [`authentication.md`](authentication.md), [`customer-portal-authorization-model.md`](customer-portal-authorization-model.md), Property Manager delegation contract | Live exact-scope grant, sibling-property denial, ended-access denial, and tenant-isolation smoke | Product, Engineering, Privacy/Security |
| Customer/provider separation | “Customers receive customer-safe visit and delivered-proof views. Provider planning, crew, internal review, and recovery details stay in provider-authorized APIs.” | [`customer-portal-visits-api.md`](customer-portal-visits-api.md), [`completion-report-customer-evidence.md`](completion-report-customer-evidence.md) | Protected response review for the exact pilot fixture and regression evidence for forbidden fields | Product, Engineering, Privacy/Security |
| Offline field work | “When the browser confirms a durable local save, supported field changes remain on that device until they sync or need review. Yardfolio distinguishes saved-on-device, sent, conflict, and unavailable states.” | [`offline-mutation-queue.md`](offline-mutation-queue.md), [`offline-photo-capture.md`](offline-photo-capture.md) | Supported-device rehearsal under intermittent connectivity, eviction/persistence behavior, conflict recovery, and operator support path | Product, Engineering, Operations |
| Offline limits | “A local save is not a server sync. Closing the browser, clearing site data, changing identity, storage eviction, or an unsupported browser can affect device-held work. Yardfolio does not claim background sync.” | Offline queue/photo contracts and [`service-worker-strategy.md`](service-worker-strategy.md) | Final supported browser/device list and approved help language | Product, Support, Engineering |
| Browser-held data | “The signed-in browser keeps the managed-login session in session storage and may keep authorized field mutations and photo bytes in IndexedDB. It does not put access tokens, invitation/share tokens, signed upload URLs, or object-store keys in the offline queue.” | [`authentication.md`](authentication.md), offline queue/photo contracts | Browser storage inspection on each supported platform and approved retention/clear-device instructions | Privacy/Security, Engineering, Support |
| Encryption boundary | “Yardfolio uses HTTPS for protected production traffic. Optional object storage is configured for server-side encryption and blocked public access when enabled. Yardfolio does not describe customer or field content as end-to-end encrypted.” | [`production-deployment.md`](production-deployment.md), Terraform S3 module | Final HTTPS origin, storage mode, bucket controls, and signed read/write smoke | Privacy/Security, Engineering |
| Photo evidence | “Field photos remain provider-authorized until the completion package is reviewed and delivered. Customer proof exposes only the delivered customer-safe snapshot.” | [`completion-report-customer-evidence.md`](completion-report-customer-evidence.md), [`offline-photo-capture.md`](offline-photo-capture.md) | Protected upload/read/delete path, processing recovery, delivered-only customer read, and redaction/erasure smoke | Product, Privacy/Security, Operations |
| Notifications | “Notification preferences, verified recipients, channel availability, quiet hours, retries, and delivery outcomes are checked before supported messages are attempted. Queued or sent does not mean read.” | [`production-deployment.md`](production-deployment.md), completion-report notification contracts | Enabled dispatch mode, provider callback validation, controlled-recipient smoke, dead-letter alert, retry/recovery owner, and exact public channel list | Product, Operations, Privacy/Security |
| Notification limits | “Email and SMS are disabled unless an approved delivery provider and sender configuration are enabled. The application continues to show authoritative in-app state when delivery is unavailable.” | Render/deployment configuration and notification runbooks | Current protected configuration and approved sender/support process | Operations, Product |
| Availability | “Yardfolio distinguishes unavailable reads from an empty or successful state. Health checks separate a running process from database readiness.” | [`production-deployment.md`](production-deployment.md), quality-budget operational indicators | Protected readiness history, alert routes, incident owner, and tested runbook | Engineering, Operations |
| Recovery | “Retry, conflict, dead-letter, and manual-recovery states remain visible to authorized operators. A failed follow-up does not rewrite an earlier successful business action.” | Queue, notification, photo-processing, and completion-report recovery contracts | Protected dashboard queries, alerts, recovery rehearsal, and rollback evidence | Operations, Engineering |
| Backups and restore | No public statement is approved yet. | [`production-deployment.md`](production-deployment.md) requires a database tier, backup/restore objectives, and rehearsal | Named database plan, recovery objectives, completed restore rehearsal, evidence location, and owner | Operations, Engineering, Privacy/Security |
| Retention | “Retention differs by record purpose. Yardfolio publishes a duration only after the database, object storage, device-held data, suppression evidence, audit history, and legal-hold rules are approved together.” | S3 lifecycle configuration, privacy operations, B10 decision packet | Approved schedule for every relevant source plus deletion/minimization job and legal review | Privacy/Security, Legal, Product, Operations |
| Export and erasure | “Authorized provider managers can export scoped customer operational metadata and request photo erasure. Erasure hides retained evidence, redacts delivered snapshots, audits the request, and reports storage deletion that still needs follow-up.” | [`production-deployment.md`](production-deployment.md) privacy actions | Live exact-account export, wrong-account denial, storage deletion/recovery, legal-hold policy, and customer request path | Privacy/Security, Operations, Engineering |
| Incident contact | No public security/privacy/support address or response promise is approved yet. | Yard Owner acquisition operations runbook | Owned monitored destinations, primary/backup staff, approved severity/response policy, exercise, and public wording | Operations, Privacy/Security, Support |
| Providers and subprocessors | “Yardfolio names only providers enabled in the current protected environment and explains their purpose.” | Render Blueprint and Terraform/configuration state | Approved current provider inventory, data purpose/location, contract owner, change notice process, and protected-release evidence | Privacy/Security, Legal, Operations |

## Statements that must not be published yet

- A compliance certification, independent audit, penetration test, uptime
  percentage, response-time guarantee, disaster-recovery objective, or breach
  notification promise without separate current evidence and approval.
- “Encrypted end to end,” “zero knowledge,” “never leaves your device,” or
  “always available.” These do not describe the implemented architecture.
- A blanket deletion promise. Immutable receipts, audit history, suppression
  proof, legal holds, backups, object versions, and provider records require
  purpose-specific handling.
- Claims that Cognito, S3, email, SMS, dashboards, alerts, backups, or a public
  incident contact are active merely because repository configuration exists.
- Claims that a queued notification was delivered/read, a local mutation was
  synced, a revocation erased previously viewed information, or an unavailable
  read means no record exists.

## Public page structure after approval

1. **How access works** — managed identity, server authorization, property and
   tenant scope, and local-review exclusion.
2. **What customers and teams can see** — customer-safe projections and
   provider-private boundaries.
3. **Working with limited connectivity** — device-held data, sync states,
   conflicts, supported-device limitations, and safe recovery.
4. **Photos and notifications** — enabled mode, review-before-delivery,
   preferences, delivery semantics, and provider limitations.
5. **Retention, export, and erasure** — approved purpose-specific schedule and
   request path, with legal-hold and recovery limits.
6. **Availability and incidents** — truthful readiness/outage behavior, owned
   contact routes, current response policy, and dated review.
7. **Service providers** — only the current approved provider/purpose list.

The page must expose its last-reviewed date and functional owner, use a durable
public route, contain no customer or operator identifiers, and remain separate
from authenticated diagnostics and release evidence.

## Approval record required before publication

| Field | Required value |
| --- | --- |
| Protected release ID and source commit | Pending |
| Enabled identity/storage/notification modes | Pending |
| Product owner and approval date | Pending |
| Engineering owner and approval date | Pending |
| Operations/support owner and approval date | Pending |
| Privacy/security owner and approval date | Pending |
| Legal owner/date for retention, incidents, providers, and property damage wording | Pending |
| Backup/restore rehearsal reference | Pending |
| Incident-contact exercise reference | Pending |
| Emergency correction owner | Pending |
| Next scheduled review | Pending |

Until every applicable field is complete, this document remains an internal
claim contract and no public trust-center route should be presented as approved
operating fact.
