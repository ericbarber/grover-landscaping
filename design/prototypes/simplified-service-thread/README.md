# Simplified Service Thread

This dependency-free working prototype begins Grover's post-MVP experience
redesign. It does not remove mature capability. It reorganizes that capability
around one exact service thread so users no longer need separate approval,
schedule, report, proof, and recovery products to understand one outcome.

The first slice shows the same illustrative Mesa Court service through:

- Yard Owner customer-safe decision, service status, and delivered outcome;
- Company Manager decision state, exact release, field-request review, and proof
  publication; and
- Crew Lead released work, field recovery, and completion submission.

Use the review controls to change perspective and service moment or follow a
handoff between roles. Role-specific information and authority remain filtered.
Prototype confirmations do not persist or change production data.

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
