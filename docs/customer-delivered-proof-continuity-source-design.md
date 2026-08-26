# Customer Delivered Proof Continuity Source

Status: Source and authorization audit completed on 2026-08-26. Decision D-061
adopts an exact visit-to-delivered-snapshot source with hybrid authorization.
The legacy property-report list is not an authorized Yard Owner source; atomic
snapshot delivery and minimized authenticated reads remain implementation work.

## Source-audit outcome

The existing public delivered-report projection is a useful content projector,
but the current signed-in property-report list cannot authorize Yard Owner proof:

- `GET /properties/{property_id}/completion-reports` derives organization scope
  from active organization memberships and does not invoke the D-058 hybrid
  account-owner/property-delegate resolver for the requested property;
- its response includes report, job, property, and organization identifiers plus
  a bearer share URL, exceeding the minimized customer visit boundary;
- its SQL can infer a property from a legacy completion-report row or a job-ID
  naming fallback instead of requiring exact D-059 release provenance; and
- the Yard Owner browser was calling this older route after loading authorized
  properties, but client-side sequencing cannot replace server authorization.

The public `GET /reports/{share_token}` route projects a narrower customer-safe
shape and accepts only delivered reports. It remains a deliberate share-link
surface, however: possession of the token is its authority, so it does not
revalidate a signed-in customer's current grant or relationship.

## Proof-integrity findings

The intended delivered snapshot is not yet a fully authoritative immutable
source:

1. report delivery commits `delivered` status and the share token before the
   snapshot is built and stored in a second operation;
2. a snapshot failure can therefore leave a delivered report without its
   promised immutable proof; and
3. the public read falls back to rebuilding that missing snapshot from mutable
   job, checklist, photo, and add-on state.

Customer proof must fail closed instead of reconstructing delivered evidence
after publication. Delivery status, immutable snapshot content, snapshot time,
and customer reference availability should become one atomic outcome.

## Adopted decision D-061

Use the existing exact production chain:

```text
customer_visit_reference
  → customer service visit thread
  → immutable D-059 service release
  → exact service job
  → delivered completion report and immutable snapshot
```

The authenticated repository must revalidate the caller's full hybrid grant,
membership, organization/account/property provenance, and active relationship
on every proof list or detail read. The random visit reference is an identifier,
not a bearer credential.

The initial delivered-proof contract should:

1. atomically publish report delivery and its immutable snapshot, with exact
   replay and fail-closed recovery;
2. set `delivered_proof_available` only for a valid delivered snapshot on the
   exact released service job;
3. expose an authenticated exact-visit proof read using
   `customer_visit_reference`, without accepting report, job, release,
   organization, account, property, crew, route, photo, add-on, bid, or service
   identifiers from the browser;
4. reuse the existing safe snapshot projector for service/checklist/photo data
   only after validating the stored snapshot and exact provenance;
5. omit the public share token from the authenticated proof projection; sharing
   remains a separate deliberate link workflow; and
6. distinguish proof pending, delivered, missing/ended access, invalid
   provenance, corrupt snapshot, and unavailable persistence without falling
   back to live or illustrative data.

## Recommendation boundary

The snapshot's `completed_recommendations` are completed job add-ons created by
the existing approved-bid conversion path. They are historical delivered-work
outcomes and may appear inside immutable proof after provenance validation.
They are not current recommendations, pending proposals, customer decisions, or
authorization to perform more work.

Active recommendation collaboration needs a later dedicated contract with an
exact source, versioned offer, customer decision, expiration/revision behavior,
and non-billing meaning. Project-bid messages, provider notes, incomplete
add-ons, and manager review fields must not be repurposed as that contract.

## Immediate containment

Until D-061 reads are delivered, Yard Owner Home and Proof do not call the
legacy property-report list and state that protected proof is not available in
that workspace. Existing public share links continue under their separate
bearer-link contract. Provider and property-manager workflows retain their
existing routes and are not granted new customer authority by this decision.

## Deliberate non-effects

Reading proof does not acknowledge receipt, mark evidence viewed, change report
or visit status, open a concern, accept a recommendation, create an add-on,
schedule work, notify a provider, or change billing. Proof feedback and concern
recovery remain separate decisions.
