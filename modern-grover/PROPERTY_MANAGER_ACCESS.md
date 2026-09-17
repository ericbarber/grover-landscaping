# Customer-controlled Property Manager access contract

Status: product authority decided under [MG-D6](PRODUCT_DECISIONS.md);
implementation contract for a future bounded API/UI slice. No issuance or
revocation route is delivered yet.

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

## Source changes required

The current `customer_portal_access_grants.activation_id` is unique, so the
owner's activation grant prevents a second manager grant. The current
activation transaction also creates only a `property_owner` membership/grant.
A migration must permit separately identified delegated grants while
preserving the one owner-origin grant per activation and the existing
organization/account/property/user uniqueness. The issuance transaction
must lock and recheck the active relationship and customer authority before
writing. The read path must reject a delegated grant after relationship end,
membership suspension, recipient mismatch, or customer revocation.

The first UI slice belongs in the Yard Owner's activated provider relationship
view: “People with access” lists property, recipient, pending/active/revoked
state, and revoke action. Property Manager Home and Portfolio already withhold
details without a valid protected read; they should show the newly authorized
property only after recipient acceptance. The provider view may show status
without offering an access-grant control.

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
