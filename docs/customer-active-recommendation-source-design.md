# Customer Active Recommendation Source

Status: Source, authorization, versioning, and decision audit completed on
2026-08-26. Decision D-062 adopts an immutable exact-visit recommendation
publication around the existing project-bid authoring source. The constrained
persistence foundation, atomic provider-send bridge, immutable provider
revision publication, and legacy bearer-decision reconciliation are delivered;
authenticated customer APIs are next.

## Audit outcome

The existing project-bid workflow is the correct provider-side authoring origin,
but its current account history and public share link are not safe signed-in
Yard Owner contracts:

- a bid originates from an `add_service` day-plan amendment and can resolve
  through its exact route stop to a service job;
- a sent bid already has customer-safe scope, quantities, unit prices, a total,
  a provider-authored customer message, expiration, and approve/reject behavior;
- approved bids convert idempotently into add-ons on that same service job, and
  completed add-ons later appear as immutable delivered-proof outcomes;
- `GET /accounts/{account_id}/bids` authorizes through provider-organization
  membership and accepts an account ID from the browser. It does not apply the
  D-058 hybrid customer grant, require an exact property, or prove the bid came
  from the visit being viewed;
- that account response exposes bid, plan, amendment, service, conversion,
  delivery-recipient, and bearer-link data that exceeds a customer portal read;
- the public shared-bid decision authenticates possession of a bearer token, not
  the currently signed-in customer or delegate; and
- the legacy model has no immutable customer publication snapshot, proposal
  version, revision lineage, expected-version write, actor-scoped idempotency,
  approval affirmation version, or customer scope-change state. Link expiry also
  does not itself create a durable `expired` lifecycle record.

Initial-service proposals are pre-relationship acquisition agreements, while
completion-report `completed_recommendations` are historical outcomes. Neither
is a source for active visit recommendations. Provider notes, raw amendment
notes, incomplete add-ons, and project-bid notification rows are also excluded.

## Accepted decision D-062

Wrap a provider-sent project bid in an immutable customer recommendation
publication whose provenance is exact:

```text
customer_visit_reference
  → customer service visit thread
  → immutable service release
  → exact service job
  → exact day-plan stop and add-service amendment
  → provider project bid
  → immutable customer recommendation publication version
```

Publication must occur atomically with the provider send transition. If the bid
cannot resolve through that complete chain with matching organization, account,
property, and job provenance, it may retain its legacy provider/public-link
workflow but must not appear in the signed-in Yard Owner portal.

Each recommendation series receives a random non-bearer customer reference and
starts at proposal version 1. A changed scope, price, quantity, expiration, or
customer-facing explanation creates a new immutable publication version and
supersedes the prior decision surface; it never edits previously published
content. Only one version may be active. Withdrawal and expiration close the
active version without erasing its history.

## Signed-in customer contract

Every list, detail, message, change request, and decision begins with the
authenticated user and repeats the D-058 hybrid grant, active membership,
organization/account/property relationship, and exact visit-chain checks. Visit
and recommendation references are identifiers, not bearer credentials.

The minimized projection may include:

- recommendation reference and proposal version;
- customer-safe reason and scope;
- line-item name, description, quantity, unit price, currency, and exact total;
- publication and expiration times;
- `pending`, `approved`, `declined`, `revision_requested`, `expired`,
  `withdrawn`, `scheduled`, or `completed` customer state; and
- the next customer/provider milestone.

It omits internal bid, amendment, plan, stop, job, release, organization,
account, property, service, line-item, actor, notification, recipient, audit, and
bearer-token fields. No customer read falls back to provider account history or
infers a recommendation from a note, add-on, nearby job, or completed proof.

## Decision meaning and recovery

An approval authorizes only the exact displayed one-time scope and total to be
converted into scheduled work. It does not choose a service date, mark work
complete, create or pay an invoice, charge a payment method, change recurring
service, or approve a later revision. Billing remains separately gated.

Approval requires the current proposal version and a versioned affirmation.
Approval, decline, and revision request require a bounded actor-scoped
idempotency key. Exact replay returns the recorded result; a reused key with
different content or a stale/superseded/expired version returns a conflict and
the authoritative current publication. Unknown writes reload before retrying.

A revision request is not an approval or decline and does not authorize work.
Questions and provider responses use immutable messages tied to the exact
recommendation version; they make no notification or response-time promise.

## Immediate containment

Yard Owner no longer calls `GET /accounts/{account_id}/bids`, and middleware no
longer grants Property Owner roles access to that provider/property-manager
history route. Existing provider/property-manager views and public shared links
remain available under their current separate contracts. No recommendation or
approval control appears in Yard Owner until the D-062 publication and hybrid
API are delivered.

## Delivery order

1. Add constrained publication-series, immutable-version, decision, message,
   and lifecycle persistence plus database guards. **Delivered.**
2. Publish only exact-provenance recommendation versions atomically from the
   provider send/revision workflow. **Delivered.**
3. Add minimized hybrid-authorized exact-visit list/detail and actor-scoped
   decision APIs with replay/conflict tests.
4. Adopt pending/history/decision/recovery states in Yard Owner without public
   tokens, provider-private data, or billing claims.

## Delivered initial provider bridge

Provider bid delivery now requires an actor-scoped `idempotency_key`. Inside the
existing bid/link/notification transaction, the repository attempts to resolve
the exact active relationship, visit thread, immutable release/job, route stop,
add-service amendment, and sent bid. An exact match atomically creates version 1
with a minimized USD scope/price snapshot, SHA-256 digest, publication event,
and pending series state. The snapshot omits internal IDs, service IDs, line-
item notes, notification data, recipients, and the public share token.

An exact retry with the same actor/key and snapshot rolls the attempted resend
back and returns authoritative bid state without duplicating the publication or
notification. Changed-key reuse after publication returns a conflict. Bids that
cannot prove the complete D-062 chain retain only the legacy provider/public-link
workflow and create no signed-in recommendation publication.

This bridge adds no customer read or decision authority.

## Delivered revision and transitional decision reconciliation

An authorized provider can prepare a revision only for an unanswered exact
recommendation. The write requires the displayed current proposal version, the
complete revised customer-safe scope, an enabled delivery destination, and an
actor retry key. One transaction updates the provider authoring bid, inserts the
next minimized immutable snapshot, records exact prior-version supersession and
new-version publication events, advances the series to pending, refreshes the
bounded public link, and queues quiet-hours-aware delivery. Exact retry returns
the authoritative version without duplicate publication or notification;
changed retry content and stale expected versions conflict.

The public bearer link remains a temporary compatibility channel. If it answers
an exact D-062-backed bid, the same transaction records the legacy bid outcome
and closes the signed-in recommendation surface as `withdrawn`, with an event
that identifies `legacy_bearer_decision` and the legacy action. It does not
create a D-062 customer decision, affirmation, or authenticated actor claim.
This prevents a signed-in pending state from drifting after a bearer answer
while preserving an honest distinction between the two authorization models.
