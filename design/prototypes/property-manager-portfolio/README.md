# Property-manager portfolio working design

This dependency-free prototype connects the property-manager portfolio wireframe
to a responsive, implementation-ready customer workspace. Open `index.html`
directly or use the development design gallery.

The design establishes four stable destinations:

- Overview prioritizes readiness, exceptions, decisions, and recent delivery.
- Properties exposes portfolio-wide cadence, next-service, provider, and status.
- Proof collects customer-safe completion records.
- Approvals keeps recommendation decisions connected to property and provider.

All records are illustrative. The prototype deliberately excludes crew identity,
routes, internal notes, costs, margins, and other provider-private operations. It
does not assert that portfolio service events or owner authorization are already
persisted by the application.

Validate from the repository root:

```bash
node design/tools/validate-property-manager-portfolio.mjs
```
