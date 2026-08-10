# Yard Owner Portal Working Design

This dependency-free prototype demonstrates the intended Yard Owner customer
experience before production React adoption.

Open [`index.html`](index.html) directly in a browser, from the design gallery, or
from the development server at:

```text
http://<vpn-ip>:5173/design/prototypes/yard-owner-portal/
```

## Product journey

- **Home** leads with next service, preparation expectation, an action-needed
  recommendation, and the newest delivered proof.
- **Visits** separates confirmed upcoming service from customer-visible completed
  history.
- **Proof** makes outcome, evidence, completed care, and recommendations the
  report story.
- **Account** provides property selection and provider contact without exposing
  provider-only operations.

Selecting Sonoran House or Backyard Garden updates the property context across
the entire portal. A property selected from Account returns to its Home so the
change is immediately understandable.

## Working interactions

- Navigate between Home, Visits, Proof, and Account on mobile or desktop.
- Switch the active property from the global selector or Account.
- Open next-visit detail and return to the invoking control.
- Open delivered proof, inspect completed work, and continue to its related
  recommendation.
- Review bid context, line items, total, expiration, and decision consequence.
- Approve or decline through explicit confirmation.
- Fail the next bid response, preserve context, retry, and reach completion.
- Close details with the close action or Escape and restore focus.

## Review states

Use **Review states** in the sand prototype banner to switch among:

| State | Intended contract |
| --- | --- |
| Default | Confirmed visit, delivered proof, pending recommendation |
| Loading | Customer-oriented status plus structural skeleton |
| No scheduled service | Valid empty state with provider next step |
| No delivered proof | First-service or not-yet-delivered explanation |
| Portal unavailable | Protected data message, retry, and provider contact |
| Expired proof link | Safe explanation and return to the signed-in portal |
| Decision received | Completed approval with next expectation |

The same review panel can make the next bid decision fail once. The retry then
succeeds so reviewers can inspect recovery without changing source code.

## Accessibility behavior

- Semantic page, navigation, main, section, article, list, and dialog structure.
- One persistent H1 describing the active destination.
- Skip navigation and visible focus across light, dark, clay, and image surfaces.
- `aria-current` on the active navigation destination and `aria-pressed` on the
  selected Account property.
- Native modal focus containment, Escape close, and explicit focus restoration.
- Live announcements for destination, property, state, error, and decision
  changes.
- Mobile controls target at least 44 by 44 CSS pixels.
- Reduced-motion support and a layout that reflows without horizontal scrolling.

## Prototype boundaries

- Every property, date, image-like illustration, service record, recommendation,
  provider contact, and price is illustrative design-review data.
- No authentication, API call, scheduling, notification, message, payment,
  support ticket, or decision persistence occurs.
- The working design uses delivered product concepts, but its composition is not
  yet the production React portal.
- Provider notes, internal IDs, unpublished evidence, crew operations, recovery
  records, and staff-only quality decisions are deliberately absent.
- Ratings, editable communication preferences, support tickets, invoices, and
  payments remain planned product work and are not simulated as delivered.

## Validation

From an environment with the frontend dependencies installed:

```bash
node design/tools/validate-yard-owner-portal.mjs
```

Pass `--capture` to refresh the desktop and mobile gallery images.
