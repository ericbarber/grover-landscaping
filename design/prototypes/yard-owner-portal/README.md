# Yard Owner Portal Working Design

This dependency-free prototype demonstrates the intended Yard Owner customer
experience before production React adoption.

Open [`index.html`](index.html) directly in a browser, from the design gallery, or
from the development server at:

```text
http://<vpn-ip>:5173/design/prototypes/yard-owner-portal/
```

## Production adoption status

The production application now adopts the connected Home/Visits/Proof/Account
shell, portal-wide property selection, authorized persisted visits, all six
explicit service-day states, and delivered proof on top of customer-scoped
foundations. Concern recovery, recommendation collaboration, and customer-
controlled preferences remain planned.
Billing remains product-gated. See the
[adoption tracker](../../../project-planning/PROTOTYPE_ADOPTION.md).

## Product journey

- **Home** leads with live service-day status, preparation expectations, an
  action-needed recommendation, and comparable delivered proof.
- **Visits** separates confirmed upcoming service from customer-visible completed
  history.
- **Proof** makes outcome, evidence, completed care, recommendations, feedback,
  and concern recovery the report story.
- **Account** provides property selection, provider contact, event-level
  notification preferences, and customer-authored access guidance without
  exposing provider-only operations.

Selecting Sonoran House or Backyard Garden updates the property context across
the entire portal. A property selected from Account returns to its Home so the
change is immediately understandable.

## Working interactions

- Navigate between Home, Visits, Proof, and Account on mobile or desktop.
- Switch the active property from the global selector or Account.
- Open next-visit detail and return to the invoking control.
- Review confirmed, en-route, arrived, weather-delay, rescheduled, and
  proof-pending service-day states.
- Ask a visit-specific question with validation, preserved input, simulated send
  failure, retry, and confirmation.
- Open delivered proof, inspect completed work, and continue to its related
  recommendation.
- Adjust the before/after comparison with a pointer or keyboard.
- Record positive feedback or report a concern, then inspect received,
  follow-up, and resolved recovery states.
- Review bid context, line items, total, expiration, and decision consequence.
- Ask about a recommendation or request a scope change without accidentally
  accepting or declining it.
- Approve or decline through explicit confirmation.
- Fail the next bid response, preserve context, retry, and reach completion.
- Review accepted, declined, revision-requested, expired, and scheduled
  recommendation history.
- Edit notification, channel, quiet-hour, access, pet, and vehicle preferences
  with unsaved, validation, simulated failure, retry, saved, and externally
  changed states.
- Close details with the close action or Escape and restore focus.

## Review states

Use **Review states** in the sand prototype banner to switch among:

| State | Intended contract |
| --- | --- |
| Default | Confirmed visit, delivered proof, pending recommendation |
| En route | Arrival range, immediate preparation, and progress rail |
| Care in progress | Arrival confirmation and no-action expectation |
| Weather delay | Cause, update deadline, and provider ownership |
| Rescheduled | Original timing and confirmed replacement date |
| Visit complete | Completion time and proof-review expectation |
| Loading | Customer-oriented status plus structural skeleton |
| No scheduled service | Valid empty state with provider next step |
| No delivered proof | First-service or not-yet-delivered explanation |
| Portal unavailable | Protected data message, retry, and provider contact |
| Expired proof link | Safe explanation and return to the signed-in portal |
| Decision received / declined | Completed response with next expectation |
| Revision requested | Scope question retained independently from a decision |
| Recommendation expired | Safe next step without an active decision action |
| Recommendation scheduled | Approved work with the next known milestone |
| Concern follow-up / resolved | Customer-visible recovery status and closure |
| Preferences changed elsewhere | Stale-save protection with explicit latest-settings refresh |

The same review panel can make the next bid decision, message, or preference save
fail once. Each retry then succeeds so reviewers can inspect recovery without
changing source code.

## Accessibility behavior

- Semantic page, navigation, main, section, article, list, and dialog structure.
- One persistent H1 describing the active destination.
- Skip navigation and visible focus across light, dark, clay, and image surfaces.
- `aria-current` on the active navigation destination and `aria-pressed` on the
  selected Account property.
- Native modal focus containment, Escape close, and explicit focus restoration.
- Native range and form controls with visible labels, descriptions, inline
  validation, and preserved values after recoverable failures.
- Live announcements for destination, property, state, error, and decision
  changes.
- Mobile controls target at least 44 by 44 CSS pixels.
- Reduced-motion support and a layout that reflows without horizontal scrolling.

## Prototype boundaries

- Every property, date, image-like illustration, service record, recommendation,
  provider contact, and price is illustrative design-review data.
- No authentication, API call, scheduling, notification, message, payment,
  support ticket, preference, feedback, or decision persistence occurs.
- The working design uses delivered product concepts, but its composition is not
  yet the production React portal.
- Provider notes, internal IDs, unpublished evidence, crew operations, recovery
  records, and staff-only quality decisions are deliberately absent.
- Billing, invoices, payment methods, refunds, and balances are deliberately
  absent until financial ownership, authorization, privacy, and compliance
  contracts are approved.
- Message, access, notification, concern, feedback, and recommendation states
  demonstrate the customer contract only; production services remain planned.

## Validation

From an environment with the frontend dependencies installed:

```bash
node design/tools/validate-yard-owner-portal.mjs
```

Pass `--capture` to refresh the desktop and mobile gallery images.
