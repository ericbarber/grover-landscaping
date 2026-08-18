# Yard Owner Known-Provider Connection Handoff

## Outcome

The V2 working design completes the direct owner-to-provider connection loop
from a private yard brief through a recipient-specific invitation, provider
organization claim, authorized response, affirmative owner disclosure, and a
provider-specific access receipt.

This is a design-complete, validated interaction contract. It is not evidence
that messaging, provider verification, authorization, consent persistence, or
support operations are implemented in production. Phase 3 of the production
delivery plan remains the next adoption slice.

Review the prototype at:

```text
/design/prototypes/yard-owner-acquisition/index.html#invite
```

Use **Review journey** to jump directly to invitation activity, connection
support, provider recipient entry, provider organization claim, provider inbox,
disclosure approval, and the access receipt.

## Phased design delivery

| Phase | Delivered design outcome |
| --- | --- |
| 0 — workflow review | Identified compressed identity, authority, consent, receipt, terminal-state, and support boundaries |
| 1 — owner invitation | Limited invitation preview, explicit send affirmation, delivery progress, revoke, and preserved retry |
| 2 — invitation lifecycle | Delivered, opened, failed, expired, declined, opted-out, and revoked states with safe next actions |
| 3 — recipient and provider claim | Recipient-specific entry, existing-provider sign-in, organization claim/bootstrap, and separate response authority |
| 4 — authorized provider response | Preliminary question, interest, customer-safe decline, report/block, and explicit action boundaries |
| 5 — owner disclosure | No preselected data categories, provider identity facts, purpose/retention copy, and affirmative confirmation |
| 6 — access receipt | Approved and withheld categories, brief version, provider, property, purpose, timestamp, download feedback, and future revoke |
| 7 — recovery and validation | Delivery, identity, safety, withdrawal, responsive, touch-target, text-zoom, semantic, and browser-error coverage |

## End-to-end workflow

1. The owner reviews a limited invitation containing only name, coarse service
   area, care goal, and preferred timing.
2. The owner explicitly confirms and sends to a business email. A failed send
   preserves the recipient and disclosure choices without claiming success.
3. The recipient opens a recipient-specific link. Exact address, photographs,
   phone number, and access notes remain withheld.
4. An existing authorized provider user signs in, or the recipient selects and
   claims/bootstrap a provider organization.
5. Email control, organization relationship, and opportunity-response authority
   are evaluated as separate facts.
6. An authorized opportunity manager can ask a preliminary question, decline,
   report/block, or express assessment interest. None creates service.
7. The owner reviews the responding provider and chooses each data category.
   Every category and the overall disclosure confirmation start unselected.
8. Approval creates a new provider-specific receipt snapshot. It records what
   was approved and withheld without accepting a proposal or scheduling work.
9. The owner may continue to assessment planning or revoke future assessment
   access. Historical receipt content is not rewritten.

## Invitation lifecycle contract

| State | Owner-visible meaning | Data boundary | Safe next action |
| --- | --- | --- | --- |
| Delivered | Business email accepted the message | Limited invitation only | Wait, revoke, or resend after cooldown |
| Opened | Recipient viewed the limited request | No new categories exposed | Wait for verification, revoke, or get support |
| Failed | Recipient could not receive it | No recipient access | Correct address and create a new invitation |
| Expired | Recipient-specific link closed | Historical delivery receipt only | Review and send a new invitation |
| Declined | Provider is not taking the request | No additional yard access | Invite another provider or choose discovery |
| Opted out | Recipient rejected future invitations | Historical delivery receipt only | Choose a different legitimate recipient/provider |
| Revoked | Owner withdrew the request | Historical delivery receipt only | Create a new reviewed invitation if appropriate |

Expired and revoked links cannot be reopened. Opted-out recipients cannot be
automatically resent. A corrected recipient creates a new invitation rather
than mutating the original delivery record.

## Identity and authority model

The UI must not collapse these checks into a generic “verified provider” badge:

| Fact | What it establishes | What it does not establish |
| --- | --- | --- |
| Recipient email checked | Control of the invitation recipient mailbox/session | Relationship to a provider organization |
| Organization relationship checked | Recipient is linked to the selected provider organization | Authority to perform every provider action |
| Opportunity-response capability | May review, ask a preliminary question, decline, and request disclosure | Pricing, proposal submission, crew assignment, work-order release, or field work |
| Provider-declared service area | Provider says it operates in the coarse area | Availability, suitability, or owner selection |
| Dated identity/trust fact | A named fact has source and freshness | Quality, licensing, insurance, or future performance unless separately evaluated |

Production authorization must be capability-based and server-enforced. Role
labels may explain capabilities but cannot be the enforcement mechanism.

## Visibility matrix

| Information | Invitation recipient | Authorized provider before owner approval | Provider after receipt |
| --- | --- | --- | --- |
| Owner name | Visible | Visible | Visible |
| Coarse service area | Visible | Visible | Visible |
| Care goal and cadence | Visible | Visible | Visible if approved in yard brief |
| Exact address | Hidden | Hidden | Visible only if explicitly approved |
| Selected yard photographs | Hidden | Hidden | Visible only if explicitly approved |
| Owner email | Hidden | Hidden | Visible only if explicitly approved |
| Access considerations | Hidden | Hidden | Visible only if explicitly approved |
| Competitors and other requests | Hidden | Hidden | Hidden |
| Provider-private notes/capacity | Not applicable | Provider-private | Provider-private |

## Disclosure receipt contract

Each successful owner approval creates a new versioned snapshot containing:

- owner subject and property identifiers;
- provider organization and authorized actor identifiers;
- invitation/request identifier;
- yard-brief version and selected-media identifiers;
- purpose and disclosed retention notice version;
- approved categories and explicitly withheld categories;
- consent text/policy version and owner affirmation timestamp;
- creation actor, timestamp, and delivery/access state;
- later revocation event without mutation of the original snapshot.

No category is implicitly inherited from another provider request. Changing the
provider, purpose, recipient, or selected categories requires a new receipt.
Revocation ends future access but does not falsely claim that already delivered,
accepted-proposal, audit, or legally retained records were erased.

## Recovery and support

The working design separates four support intents:

- delivery/recipient correction without widening access;
- provider-identity dispute with a fail-closed connection pause;
- spam, harassment, or unsafe contact with explicit block/report confirmation;
- invitation withdrawal or future-access revocation with historical receipts
  retained for accountability.

Production must define support ownership, response targets, escalation,
notification retry, identity appeal, abuse evidence access, retention, and
emergency wording before the pilot is operated.

## Accessibility and content requirements

- One persistent H1 names the active stage and receives focus after navigation.
- Every input has a programmatic label; validation is associated and preserves
  submitted values after recoverable failure.
- Consent categories and the disclosure affirmation are never preselected.
- Status is expressed with text and structure, not color alone.
- Destructive block, revoke, and access-ending actions require confirmation.
- Mobile controls are at least 44 by 44 CSS pixels.
- All connection states reflow at 320px and at 200% text without horizontal
  scrolling.
- Copy distinguishes invitation, response, assessment, proposal, service setup,
  crew assignment, and work-order release.

## Production adoption gates

Before Phase 3 can exit, implementation must prove:

1. Invitation tokens are recipient-specific, hashed at rest, single-purpose,
   expiring, revocable, rate-limited, and resistant to forwarding/replay.
2. Messaging outcomes distinguish queued, delivered, bounced/failed, opened if
   lawfully available, expired, opted out, declined, and revoked.
3. Provider claim/bootstrap prevents silent duplicate organizations and supports
   correction or dispute without leaking existing organization data.
4. Server authorization checks provider organization and explicit capability on
   every recipient, inbox, response, and disclosure read/write.
5. Access grants are provider-, property-, purpose-, category-, and version-
   specific, with fail-closed reads and immutable receipt history.
6. Interest, assessment, proposal, activation, customer creation, crew
   assignment, and service scheduling remain separate lifecycle transitions.
7. Owner and provider audit/read models expose safe progress without exposing
   internal notes, security signals, competitors, or private decline reasons.
8. Notification, authorization, audit, revocation, opt-out, abuse, and support
   failure paths have monitoring and recovery runbooks.

## Validation evidence

Run:

```bash
node design/tools/validate-yard-owner-acquisition.mjs --capture
```

The validator exercises the complete owner/provider loop, all invitation
terminal states, claim validation, preliminary provider response, unselected
disclosure defaults, approved/withheld receipt content, download feedback,
revocation confirmation, support recovery, desktop/tablet/mobile layouts,
320px compact layout, 200% text, accessible names, target sizing, focus,
overflow, and browser errors.

Gallery references:

- `design/high-fidelity/customer/yard-owner-known-provider-desktop-v2.png`
- `design/high-fidelity/customer/yard-owner-known-provider-mobile-v2.png`
