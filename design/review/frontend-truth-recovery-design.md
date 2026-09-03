# Frontend Truth and Recovery Design Contract

## Status

Proposed design direction following findings DFR-02 and DFR-05 in the
[September 3 current-frontend audit](current-frontend-design-audit-2026-09-03.md).
This contract does not claim production adoption.

## Decisions

### Yard Owner protected-read states

| State | Meaning | Required action |
| --- | --- | --- |
| Loading | Current authorization and data are unresolved. | No stale property or visit facts; no premature empty state. |
| Valid empty | Access is valid and the authoritative read contains no confirmed visits. | Explain what happens next and allow return Home. |
| Access ended | The signed-in account no longer has the required current grant. | Withhold all property/service facts; return Home and offer account-access review. |
| Inconsistent | Related authorization or provenance records do not form a trustworthy projection. | Withhold facts, allow retry, and return Home. |
| Unavailable | The authoritative service could not complete the read. | State that information remains protected, allow retry, and return Home. |

Provider contact and support escalation remain outside this contract until the
existing product boundary is approved. No state may fall back to illustrative
or last-known customer data unless a separate encrypted/offline contract is
designed and accepted.

### Crew route confidence vocabulary

| Label | Meaning |
| --- | --- |
| Syncing | A current transfer is in progress. |
| Saved on device | The change is durable on this device but not server-confirmed. |
| Synced | The server confirmed the current relevant changes. |
| Needs attention | A conflict or failed save requires a deliberate action. |
| Read only | The route is historical or otherwise not mutable. |

“Local API,” “local,” and other transport/source descriptions do not appear as
user confidence states. Technical diagnostics may expose them in development
tooling without competing with the user-facing state.

### Date context

- A route whose service date matches the active local day is “Today’s route.”
- Any earlier route is “Past route” and shows a human-readable complete date.
- A past route is read only; the primary stop action is unavailable.
- A future route must be “Upcoming route”; it is not covered by this first
  prototype and must not reuse “Today.”

## Responsive and accessibility behavior

- State changes announce the surface and selected state.
- Every page has one visible `h1`; state messages begin at `h2`.
- Recovery actions and mobile navigation meet a 44px touch floor.
- The phone shell reserves bottom space for the fixed navigation.
- Color reinforces, but never carries, the state meaning.

## Production handoff boundary

Before implementation, map each state to the existing API/domain result rather
than inferring it from error text. The production slice must preserve fail-
closed customer authorization, current offline-write semantics, retry identity,
and conflict handling. It must add tests for route-date classification and the
final interactive control clearing the bottom bar at phone widths and zoom.
