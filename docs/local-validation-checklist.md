# Local Validation Checklist

This checklist captures the validation steps to run later from a local development environment. The project can continue moving forward in the repository before a development server or test server is available.

## Frontend checks

Run from `frontend/`:

```bash
npm install
npm run typecheck
npm test
npm run build
```

Review these areas after the checks pass:

- Customer portal preview renders scheduled, in-progress, completed, bid-review, and report-ready work summaries.
- Property portfolio helpers keep grouped and ungrouped yards visible for the customer account.
- Crew service helper functions keep customer and property ownership separate from crew service changes.
- Crew option helpers only return enabled crews in the same service organization as the property.

## Backend checks

Run from `backend/`:

```bash
cargo fmt --check
cargo test
cargo check
```

Review these areas after the checks pass:

- Access-control role helpers enforce organization-scoped policies.
- Property portfolio request validation rejects blank fields and unsupported portfolio types.
- Access audit event domain types match the audit event migration values.

## Database migration checks

Run migrations against a local PostgreSQL database once the local database is available.

Review these migrations:

- Property portfolio persistence.
- Property portfolio boundary indexes.
- Property crew service history persistence.
- Access audit event persistence.

## Manual product checks

When the app can run locally, walk through these flows:

- Manager sees customer, property, route, and portfolio context separately.
- Customer portal shows only properties owned by the signed-in customer account.
- Property grouping does not change customer ownership.
- Crew service changes do not change customer ownership or portfolio grouping.
- Completion reports remain tied to the property and crew that performed the work.

## Notes

- Do not treat missing local validation as a blocker for repository-only planning and development.
- Do not claim a check passed until it has been run locally or by CI.
- Keep future changes small enough to validate independently.
