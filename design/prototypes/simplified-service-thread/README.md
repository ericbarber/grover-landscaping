# Simplified Service Thread

This dependency-free working prototype begins Grover's post-MVP experience
redesign. It does not remove mature capability. It reorganizes that capability
around one exact service thread so users no longer need separate approval,
schedule, report, proof, and recovery products to understand one outcome.

The first two slices show the same illustrative Mesa Court service through:

- Yard Owner customer-safe decision, service status, and delivered outcome;
- Property Manager portfolio-scoped decisions and customer-safe exceptions;
- Company Owner business readiness and accountable operating outcomes;
- Company Manager decision state, exact release, field-request review, and proof
  publication; and
- Crew Lead released work, field recovery, and completion submission.

Use the review controls to change perspective and service moment or follow a
handoff between roles. Role-specific information and authority remain filtered.
Prototype confirmations do not persist or change production data.

The Review path control exercises seven contextual paths without turning them
into new product silos:

- exact plan conflict, device-held offline work, and proof correction;
- an owned, minimized Support incident and product-gated completion readiness;
  and
- access-ended and authorization-mismatch recovery with protected service or
  property data absent from the document.

Support and completion-readiness paths return to the exact accountable service
moment. The no-role and inconsistent-authorization paths fail closed before a
service lifecycle is rendered.

The active design contract is the
[Simplified Product Experience Plan](../../review/simplified-product-experience-plan.md).

Validate every perspective and moment at desktop, phone, and narrow-phone
viewports with:

```bash
node design/tools/validate-simplified-service-thread.mjs
```

Refresh its gallery images with:

```bash
node design/tools/validate-simplified-service-thread.mjs --capture
```
