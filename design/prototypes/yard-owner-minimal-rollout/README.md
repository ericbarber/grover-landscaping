# Yard Owner and Crew Lead Minimal Rollout Prototype

This dependency-free prototype shows the Yard Owner portal and Crew Lead field
workspace as separate sets of cumulative, independently enableable units.

For Yard Owners, U1 Care visibility is the minimum
launch: Home only, with a protected property, next confirmed visit, preparation,
next-update ownership, and complete empty/recovery behavior.

U2 adds Visits, U3 adds Proof, and U4 adds contextual questions and
recommendation decisions without adding another primary destination. Disabled
units are absent rather than presented as unfinished navigation.

This is a rollout design. It does not implement capability flags, enable a
cohort, call an API, or persist any interaction. Review the authoritative
[Yard Owner plan](../../review/yard-owner-minimal-rollout-plan.md).

For Crew Leads, C1 Day plan visibility is the minimum launch: Home and Route
provide a read-only assigned route, ordered stops, service/access context, and
sync confidence. C2 adds resilient stop execution, C3 field proof, and C4 route
changes and recovery. Review the authoritative
[Crew Lead plan](../../review/crew-lead-minimal-rollout-plan.md).

Validate and refresh gallery captures with:

```bash
node design/tools/validate-yard-owner-minimal-rollout.mjs --capture
```
