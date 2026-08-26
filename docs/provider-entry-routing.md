# Provider Entry Routing

## Purpose

Grover routes landscaping professionals into the provider organization and
invitation model that matches their actual authority. “Yard Crew” remains an
audience name; it is not a public marketplace account type.

## Public route

`GET /providers/start` is a client-side public route with four paths:

| Entrant | Next route | Authority consequence |
| --- | --- | --- |
| Owner-operator | `/app?provider-entry=owner-operator` | Authenticated owner setup may create a provider organization of one |
| Company owner | `/app?provider-entry=company-owner` | Authenticated owner setup may create or continue one provider organization |
| Crew lead or team member | The exact organization invitation, then `/app` | Generic signup grants no organization or team role |
| Known-owner recipient | `/app/provider-invitation` | Recipient-specific invitation and disclosure contracts remain authoritative |

The landscaping-company public hero, direct company signup, and final company
invitation all route through `/providers/start`.

## Authenticated handoff

The `provider-entry` query accepts only `owner-operator` or `company-owner`. When
present for an authorized company-owner persona, `/app` opens Company setup and
explains the selected model. The query is presentation context only:

- it does not create a claim, membership, organization, role, or capability;
- it does not bypass `/me/access` or first-owner bootstrap rules;
- it does not accept team-member or marketplace values;
- it does not publish a provider profile or enable opportunity discovery.

## Adopted readiness projection

Public entry explains the preparation sequence: verified account, provider
organization, business profile, and operating setup. Authenticated Company setup
now projects the fields Grover actually reads into distinct fact states:

- business identity, contact, website, and service area are **supplied by the
  provider** or explicitly need information;
- timezone and default daily capacity are **operating preferences recorded**;
- service categories and customer communication languages are **supplied by the
  provider** or explicitly need information;
- first-crew configuration is an **operational setup record**;
- insurance, license, and certification facts are **not collected**;
- opportunity publication, ranking, and eligibility are **not evaluated**.

The projection deliberately does not collapse these states into a “verified
provider" badge. Existing company setup persists contact, website, timezone,
service-area label, daily stop capacity, service categories, customer
communication languages, crews, routes, and invitations. The exact operating-
profile contract is in
[`provider-operating-profile.md`](provider-operating-profile.md). Provider
availability, eligibility, credential checking, opportunity matching, ranking,
and marketplace publication remain separate product/operations contracts.

## Validation

- Domain tests cover normalized public routing, authenticated handoff generation,
  allowlisted query parsing, and invalid-value rejection.
- Component coverage verifies all four paths and the no-publication/no-
  opportunity language.
- Readiness domain/component checks preserve supplied, recorded, operational,
  missing, not-collected, and not-evaluated states.
- Phone and desktop Chromium journeys verify the public page, company CTA, exact
  link destinations, authenticated setup opening, authority wording, and
  horizontal reflow.
