# Customer-controlled Property Manager access contract

Status: product authority decided under [MG-D6](PRODUCT_DECISIONS.md).
Invitation/grant schema, accepted-invitation read checks, customer issuance,
verified-recipient acceptance, revocation routes, and bounded UI are implemented
and package-validated in the working tree. Two isolated Canyon/Sage grant
cycles passed supported owner issuance, verified-recipient acceptance, exact
two-property/visit/proof reads, and zero-reset verification. Participant
validation remains open.

## Customer action and timing

The Yard Owner who confirmed the provider relationship can invite a Property
Manager to see one of that relationship's properties. Show this control only
after `owner_provider_active_relationships.status = active` and the linked
activation, customer account, customer property, owner membership, and owner
portal grant agree. An accepted proposal without activation is insufficient.
The provider company may see the delegation's status for coordination, but
cannot issue, enlarge, or revoke the customer's grant.

The first grant is **property scoped** to the exact organization, customer
account, and customer property created by the active relationship. Granting a
manager another property requires another explicit customer action. This
allows a manager to cover several customer accounts only through separate
authorized grants. No portfolio grouping, matching display name, or provider
membership implies customer access.

## Safe issuance and lifecycle

1. Customer chooses the exact property and enters the manager's business
   email. Show the property and customer-safe access being shared before
   confirmation; exclude provider-private route, crew, and pricing controls.
2. Create a pending invitation tied to the customer's activation and a
   recipient-checked email. Pending status reveals no property data to the
   recipient. Only the signed-in recipient with that verified email may accept
   it. Do not accept a user ID supplied by the customer as proof of identity.
3. On acceptance, atomically create or reactivate the property-scoped
   `property_manager` membership and portal grant. A replay of the same
   invitation is idempotent; a changed property, recipient, or activation is
   a conflict. Record customer actor, recipient, property, activation,
   timestamp, and grant status in an audit event.
4. The customer can revoke a pending invitation or active grant from the same
   property. Revocation immediately removes portal access and prevents a
   previously issued invitation from reactivating it. A new invitation is
   required for regrant. The manager sees an ended-access state, not an empty
   portfolio. A relationship ending also invalidates its delegated grants.
5. A manager's protected read must still validate the active grant, matching
   active membership, organization/customer relation, property, and scope.
   Loading, mismatch, and unavailable reads fail closed. Grant status alone
   is never sufficient.

Recipient acceptance and a customer-owned revocation are implementation
defaults chosen to make the approved authority rule enforceable. They require
normal task validation with customers and managers; this document does not
claim those interactions have been observed or approved as final UI copy.

## Source implementation status

The migration now provides pending/accepted/revoked/expired invitations,
audit events, one owner-origin grant per activation, and separately sourced
property-scoped manager grants. The existing
organization/account/property/user uniqueness remains. The activation read
still selects the owner's grant when a manager grant shares that activation.
Portal property/visit, customer message/proof, and recommendation reads
require an accepted invitation with the same customer, activation,
organization, account, property, and recipient, plus an active relationship
and matching manager membership. A revoked invitation fails closed even if
its old grant still says `active`.

The activation transaction still creates only a `property_owner` grant.
Customer invitation creation separately locks and rechecks the active
relationship and customer authority. Verified-recipient acceptance atomically
creates the exact-property membership and grant; customer revocation removes
both access paths, and immutable events retain the lifecycle.

The first UI slice is delivered in the Yard Owner's activated provider
relationship view: “People with access” lists recipient and
pending/active/revoked state with invite/revoke actions. The minimized Property
Manager invitation inbox reveals no property details until acceptance, and Home
and Portfolio withhold details without a valid protected read. The provider
view does not receive an access-grant control.

## Acceptance checks before matched study use

- Proposal acceptance without activation cannot invite or grant access.
- Wrong customer, property, provider organization, unverified recipient, and
  stale/ended activation all fail without a partial membership or grant.
- Pending invitation, revoked grant, suspended membership, and failed read
  reveal no protected property or visit detail to the manager.
- Two explicitly granted properties can be read together; an ungranted third
  property in the same or another account cannot be inferred or opened.
- Customer revocation takes effect on the next protected read and cannot be
  undone by replaying an old invitation. Audit and idempotency survive retry.
- The isolated study fixture uses supported issuance and revocation routes,
  not direct SQL grants, and its manifest reset removes only its own records.
