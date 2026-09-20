# Frontend Truth and Recovery Design

This adopted-behavior reference follows the September 3 current-frontend
audit. It is separate from the dated production mirror; production React and
API contracts remain authoritative for exact composition and behavior.

It defines two bounded improvements:

- Yard Owner My yard states for loading, valid empty, ended access,
  inconsistent access, and temporary unavailability. Protected reads never
  fall back to invented property or visit content, and every failure provides a
  safe destination in addition to retry where retry is meaningful.
- Crew Route states using one user-facing confidence vocabulary: Syncing, Saved
  on device, Synced, Needs attention, and Read only. Current and historical
  routes are explicit rather than inferred from an unqualified date.

No support promise, provider contact, cached customer fact, notification,
service-level target, or successful write is simulated.

Validate from the repository root:

```bash
node design/tools/validate-frontend-truth-recovery.mjs --capture
```
