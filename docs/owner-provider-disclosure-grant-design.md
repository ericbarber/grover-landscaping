# Provider-Specific Disclosure Grant and Receipt Design

## Outcome

Phase 3D allows a verified owner to disclose selected private intake categories
to one authorized provider organization for the single purpose of a yard
assessment. It creates an immutable consent receipt and a separately revocable
future-access grant. It does not accept a proposal, create a customer or service
property, schedule work, assign a crew, release a work order, or authorize
pricing.

## Preconditions

Grant creation is an owner-authenticated transaction. The server must lock and
recheck:

1. active owner workspace and owner/property scope;
2. current ready yard-brief version;
3. opened, unexpired invitation owned by that property;
4. latest bounded response is `express_interest` from the capability actor;
5. checked recipient and matching invitation mailbox;
6. eligible provider claim, active yard-care organization, and active actor
   membership;
7. active unexpired response capability bound to the same invitation, provider,
   property, brief version, and actor; and
8. no terminal invitation, suppression, relationship dispute, or existing
   active grant for the same invitation.

A stale brief version, capability version, selected-media version, or owner tab
returns a conflict and shows the latest review state. No partial grant or
receipt may remain after failure.

## Approved categories

Every category starts unselected. The controlled V1 categories are:

| Category | Content | Selection rule |
| --- | --- | --- |
| `exact_address` | Structured service location for this property | Independent checkbox |
| `yard_brief` | Named ready brief version: areas, goals, cadence, considerations | Independent checkbox |
| `selected_yard_photos` | Explicit immutable list of ready media IDs | Category plus per-photo selection |
| `owner_contact` | Current owner display name and verified contact route | Independent checkbox |
| `access_considerations` | Owner-authored access/pet considerations from the named brief | Independent checkbox |

At least one category must be selected. `selected_yard_photos` requires at
least one active ready media ID owned by the property and referenced at grant
creation. Choosing a brief does not implicitly choose access considerations;
choosing contact does not choose address. The server derives all content from
owner-scoped records and ignores client-supplied snapshots.

The receipt stores the complete controlled category universe split into
`approved_categories` and `withheld_categories`; the sets must be disjoint and
their union must be complete. Pricing and work authority are not selectable
categories and remain outside the grant.

## Owner affirmation

Creation requires all of the following, with no default selection:

- selected categories and selected media;
- `purpose = yard_assessment`;
- current consent-text version and retention-notice version supplied by the
  server review model;
- confirmation that the named provider organization may access only the
  selected items for this assessment; and
- current grant-review version plus actor-scoped idempotency key.

The UI names the provider, property nickname, purpose, each selected item,
withheld categories, retention notice, and “does not authorize” boundary before
the final action. The button uses “Approve selected assessment access,” not
“Connect,” “Accept,” or “Start service.”

## Owner API surface

`GET /owner-properties/{property_id}/provider-invitations/{invitation_id}/disclosure-review`
returns only after the server rechecks the current invitation, checked
recipient, provider relationship and membership, active response capability,
expressed interest, ready brief, suppression, expiry, and absence of an active
grant. It derives the property/provider names, exact address, brief content,
owner contact, access considerations, ready-photo options, policy versions,
deadline, and opaque `review_version`; clients do not construct those values.

`POST /owner-properties/{property_id}/provider-invitations/{invitation_id}/disclosure-grants`
accepts the opaque review version, purpose, approved category names, selected
media IDs, policy versions, explicit owner affirmation, and an idempotency key.
It reconstructs the review while locking the authoritative rows and creates the
receipt, active grant, immutable creation event, and minimized acquisition audit
in one transaction. An exact replay returns the existing grant. Changed
payload, stale review/media, or another active grant returns conflict;
ineligible state returns status without creating a partial receipt.

## Persistence model

`owner_provider_disclosure_receipts` is append-only and contains:

- receipt ID and monotonically increasing property/provider grant version;
- owner subject, property, invitation, provider organization, recipient actor,
  capability, ready brief ID/version, and selected media IDs;
- purpose, approved and withheld categories;
- consent-text and retention-notice versions;
- owner actor and affirmation timestamp;
- creation idempotency key and created timestamp.

`owner_provider_disclosure_grants` contains the current access projection:

- grant ID and receipt ID;
- provider/property/purpose/category/brief/media scope;
- `active`, `revoked`, `expired`, or `suspended` status;
- effective and expiry times, optimistic version, and timestamps.

The immutable receipt is never updated when access ends. Revocation appends an
`owner_provider_disclosure_grant_events` row linked to the original receipt and
updates only the current grant projection. Corrections or changed categories
create a new receipt/grant version after revoking or superseding the prior
grant; they never edit consent history.

## Provider read enforcement

Every provider disclosure read requires authenticated actor membership plus the
active grant ID, provider organization, property, purpose, category, receipt
version, and unexpired status. The read response is assembled category by
category; omitted categories are not serialized as empty placeholders.

Media access uses grant-scoped short-lived download authorization for only the
selected ready object IDs. It never returns storage object keys. Replaced,
deleted, rejected, or newly added media are not inherited. A new brief version
or photo requires a new owner approval before provider access.

Revoked, expired, disputed, inactive-membership, closed-invitation, or
suppressed relationships fail closed and return status-only recovery. Caches and
download authorization may not outlive the grant expiry and must be invalidated
on revocation.

`POST /provider-disclosures/access` accepts the checked invitation token only
in the protected request body. The server binds it to the authenticated actor
and verified mailbox, finds that invitation's latest provider-specific grant,
and rechecks the grant, receipt, recipient, relationship, organization,
membership, response capability, invitation, suppression, property, workspace,
brief, selected media, and expiry on every read. Approved categories are
serialized independently; withheld properties are omitted rather than returned
as empty or null placeholders. Selected ready media receive short-lived URLs
whose authorization cannot outlive the grant.

Missing owner approval returns a not-ready state without private data. A
revoked, expired, suspended, or newly ineffective grant returns only invitation
status and a controlled recovery action. A formerly active grant is reconciled
to `expired` or `suspended` with an immutable grant event before that closed
response is returned.

## Receipt views

The owner receipt may show the named provider, property nickname, purpose,
approved/withheld categories, selected photo labels, brief version, policy
versions, affirmation time, current grant status, and later revocation events.

The provider receipt may show its own organization, purpose, approved content
it can currently access, withheld category names, brief version, grant expiry,
and status. It never shows other providers, owner decisions for other requests,
or internal safety/identity signals.

## Revocation

Only the verified owner of the property may revoke future access. The request
requires grant ID, current version, controlled reason, explicit confirmation,
and idempotency key. Revocation atomically:

1. marks the active grant `revoked` and increments its version;
2. appends a revocation event and minimized audit event;
3. invalidates new category/media authorization; and
4. projects status-only provider recovery.

The confirmation says that future access ends, while information already
viewed, immutable consent history, accepted proposals, delivered work records,
or legally retained evidence are not falsely represented as erased.

`GET /owner-properties/{property_id}/provider-disclosure-receipts` returns the
owner's append-only receipt history with provider/property labels, complete
approved and withheld partitions, selected-photo labels, policy/brief/grant
versions, current status, and latest event. It never grants provider access.

`POST /owner-properties/{property_id}/provider-disclosure-grants/{grant_id}/revoke`
requires the current projection version, a controlled reason, explicit owner
confirmation, and an idempotency key. It locks the owner-scoped grant, updates
only the current projection, appends the immutable revocation event and
minimized acquisition audit, and returns the preserved receipt view. Exact
replay succeeds; stale version or changed reuse conflicts. Provider reads then
return status-only `revoked` recovery, while the invitation remains a separate
relationship state.

## Audit and privacy

General audit may include receipt/grant/invitation/property/provider IDs,
purpose, category names, version, status, and event kind. It excludes address
values, owner contact values, brief text, media names/URLs/keys, access notes,
recipient email, consent prose, and safety evidence. Restricted operational
evidence is not stored on receipt or grant rows.

## Delivery slices

1. **3D0 — contract (delivered):** prerequisites, category semantics,
   affirmation, immutable receipt/current grant split, read enforcement,
   revocation, audit, and acceptance criteria.
2. **3D1a — persistence foundation (delivered):** append-only receipt,
   revocable current grant, event history, category partition, selected-photo,
   lifecycle, active-invitation uniqueness, and audit-event constraints.
3. **3D1b — owner review and creation (delivered):** server-derived review model,
   receipt/grant/event schema, transactional creation API, replay/conflict/
   outage behavior, and owner isolation tests.
4. **3D2 — provider access (delivered):** category-filtered read model, short-lived selected
   media authorization, status-only closure, and cross-provider tests.
5. **3D3 — revocation (delivered):** versioned owner revoke API, access/cache
   reconciliation, immutable history, support visibility, and recovery tests.
6. **3D4 — interface adoption (delivered):** unselected owner approval,
   per-photo choice, explicit shared/withheld summary, named-provider
   affirmation, receipt history, controlled revoke confirmation, provider-only
   approved detail rendering, status-only ended access, responsive browser
   scenarios, accessibility semantics, and content review. Automated client,
   full frontend unit, type, production-build, and four-journey compatible-
   Chromium gates pass; signed human and physical-device assurance remains in
   Phase 3E.

## Acceptance criteria

- No checkbox or overall affirmation is preselected.
- Cross-owner, cross-property, cross-provider, wrong actor/mailbox, stale
  capability, changed brief/media, terminal invitation, and outage all fail
  closed without a receipt.
- The receipt and grant always name one provider, property, purpose, actor,
  brief version, and complete approved/withheld category partition.
- No unselected category or media item is returned or authorized.
- Replays create one receipt/grant; changed payload under the same idempotency
  key conflicts.
- Revocation blocks future reads without rewriting the receipt or claiming
  historical erasure.
- Interest, disclosure, assessment, proposal, activation, crew assignment, and
  service scheduling remain distinct states in API and interface wording.
