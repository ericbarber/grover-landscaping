# Customer Portal Authorization Model

Status: Authorization foundation, minimized persisted visit read, and Yard Owner
Home/Visits adoption delivered through 2026-08-26.

## Decision

Grover uses a hybrid authorization model for customer portal access:

- a verified customer-account owner receives customer-account scope and
  inherits every current and future active property linked to that account in
  the same provider organization;
- a delegate receives one or more explicit property-scoped grants and never
  inherits sibling or future properties from the account.

The provider organization, customer account, user, role, scope, and active grant
status are all part of the authorization boundary. A global `PropertyOwner`
claim or organization membership alone never authorizes a customer read.

## Grant semantics

The persisted portal grant must distinguish two scopes:

| Scope | Scope identifier | Property access |
| --- | --- | --- |
| `customer_account` | Customer account ID | Every active property related to that account inside the same provider organization |
| `property` | Customer property ID | Only that exact property after its organization/account relationship is revalidated |

An account-scoped owner grant does not cross provider organizations, even when
two organizations use the same contact address or represent the same person.
Property-scoped grants remain independent of an account-owner grant. When a user
has more than one active grant, effective access is the union of those grants;
no grant may widen the organization or account recorded by another grant.

## Owner and delegate lifecycle

- Relationship activation creates an account-scoped `property_owner`
  membership and portal grant for the verified owner subject.
- Adding a property to that customer account makes it visible to an active
  account owner without issuing another grant.
- Moving or unlinking a property removes inherited access through the old
  account immediately because every read rechecks the current relationship.
- Revoking the account-owner grant removes all inherited properties but does
  not revoke separately issued property grants.
- A delegate grant requires an explicit property and does not become account
  scope when another property is added.
- Suspending or revoking the governing membership or portal grant fails access
  closed. Archived accounts and properties are not returned as active portal
  content.

Delegate role naming and invitation UX remain a separate product surface. That
work may not delay the authorization boundary: any non-owner delegation must be
persisted at property scope and must not receive provider-management authority.

## Read authorization

Every persisted customer-facing read must start from the authenticated user and
an active portal grant, then join through the current provider-organization,
customer-account, and property relationships. Reads must distinguish:

- authorized content;
- a valid empty collection;
- no matching active grant;
- a stale or relationally inconsistent grant; and
- unavailable authorization or source persistence.

Missing, stale, inconsistent, and unavailable authorization all fail closed.
Customer reads must never expose provider notes, route ordering, crew identity,
internal recovery state, unpublished evidence, staff quality decisions, billing
notes, or other provider-only fields.

## Existing-data transition

The pre-migration activation flow created property-scoped owner records. The
delivered migration widens a record to customer-account scope only
when immutable activation provenance proves that:

- the grant belongs to the activation's verified owner subject;
- its organization, account, property, and membership all match the activation;
- the role is `property_owner`; and
- the grant and membership are active.

Unknown, manually created, mismatched, inactive, or delegate-like grants remain
property-scoped for review. The migration is repeatable and does not infer
ownership from email address, display name, role claim, or organization
membership alone.

## Minimized visit-read boundary

After the authorization migration, the first customer read may expose only:

- customer-safe property identity;
- display service date and bounded arrival window;
- customer-visible service label or scope;
- coarse visit lifecycle status;
- customer-facing preparation or next-update copy; and
- delivered-proof availability when publication is authoritative.

It must not expose live location, route order, crew assignment, unpublished
proof, internal schedule risk, provider notes, or billing data. Service-day
detail, concerns, conversations, recommendations, and preferences remain later
slices.

## Delivery sequence

1. Add constrained account/property grant scope and account membership scope.
   **Delivered.**
2. Backfill only activation-proven owner grants and prove delegate isolation.
   **Delivered.**
3. Add one shared fail-closed authorization resolver with account-owner and
   property-delegate coverage. **Delivered.**
4. Add the minimized customer visit read through that resolver. **Delivered.**
5. Replace illustrative Yard Owner visit data only after persisted read,
   unavailable, empty, and revoked-access states pass validation. **Delivered.**
6. Extend the projection into customer-safe service-day lifecycle and
   preparation states without exposing provider operations. **Decision required:
   see the [source audit](customer-service-day-projection-design.md).**

## Non-goals

This decision does not grant billing, provider administration, portfolio
management, scheduling, crew, route, work-order, marketplace, or credential
authority. It does not approve delegate invitation UX or any provider-facing
availability workflow.
