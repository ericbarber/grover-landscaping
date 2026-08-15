# Navigation and Shell System

Grover uses one visual shell language with three navigation models. The model is
chosen by user intent, not by prototype history.

## Shared shell rules

- Use the uppercase interface wordmark and 32px leaf mark in every shell.
- Use Forest for application rails, Paper for context bars and public headers,
  and Sand for the active item on a dark rail.
- Keep desktop public and context headers 80px high; compact them to 64px on
  mobile where the workflow permits.
- Give every navigation target at least a 44px touch target and a visible blue
  focus ring.
- Keep account, property, save/sync, and help context in the top context bar;
  keep destinations or acquisition progress in the rail.
- Do not mix progress steps and durable application destinations in one list.

## Model 1 — Public navigation

Use a horizontal Paper header for anonymous marketing and audience routing.
Navigation describes the product, audience, and next conversion action. On
mobile it collapses into a menu rather than becoming bottom navigation.

Current applications: public homepage and Yard Crew marketing.

## Model 2 — Acquisition progress

Use a Forest progress rail when the user is completing a bounded setup or
connection journey. Numbered items explain sequence and completion; contextual
help remains available without becoming a required step. Mobile uses a compact
header and previous/current/next controls.

Current applications: Yard Owner acquisition and the authenticated portion of
Yard Crew acquisition.

## Model 3 — Authenticated destinations

Use a Forest destination rail after setup. Items represent places the user can
return to—not completion steps. The active destination uses Sand. Mobile may use
bottom navigation for a small, stable destination set.

Current application: Yard Owner portal. Future provider and manager shells
should adopt this model when their destination architecture is approved.

## Intentional differences

- Marketing may use larger editorial type and generous spacing; application
  navigation and operational headings use the interface family.
- Acquisition rails may be wider than destination rails when step descriptions
  materially improve comprehension.
- Mobile acquisition uses sequential controls while mobile authenticated tools
  use destination navigation.
