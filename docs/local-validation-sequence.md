# Local Validation Sequence

Use this sequence after pulling the repository into a local development environment.

## Order of operations

1. Pull the latest `main` branch.
2. Install frontend dependencies.
3. Run frontend static checks.
4. Run backend formatting and compile checks.
5. Run frontend and backend unit tests.
6. Apply PostgreSQL migrations locally.
7. Start the app and walk through manual product flows.
8. Capture follow-up work as small repository changes.

## Why this order matters

- Static frontend checks catch type and build issues before manual UI review.
- Backend formatting and compile checks catch Rust module and migration-adjacent issues early.
- Unit tests validate domain helpers before full manual product review.
- Migrations should be reviewed before local product flows that depend on persisted records.
- Manual checks should focus on customer, property, portfolio, route, and crew-service boundaries.
