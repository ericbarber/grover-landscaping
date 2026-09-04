# Yard Owner Minimal Rollout Prototype

This dependency-free prototype shows the Yard Owner portal as four cumulative,
independently enableable customer units. U1 Care visibility is the minimum
launch: Home only, with a protected property, next confirmed visit, preparation,
next-update ownership, and complete empty/recovery behavior.

U2 adds Visits, U3 adds Proof, and U4 adds contextual questions and
recommendation decisions without adding another primary destination. Disabled
units are absent rather than presented as unfinished navigation.

This is a rollout design. It does not implement capability flags, enable a
cohort, call an API, or persist any interaction. Review the authoritative
[rollout plan](../../review/yard-owner-minimal-rollout-plan.md).

Validate and refresh gallery captures with:

```bash
node design/tools/validate-yard-owner-minimal-rollout.mjs --capture
```
