# Grover Landscaping

Grover Landscaping is a proof-of-completion platform for yard care and landscaping crews. The application will help crews capture job photos, track service completion, and provide customers or managers with a reliable visual record of completed work.

## Target Architecture

- AWS-first deployment model
- Rust backend services
- React and Tailwind mobile-first frontend
- PostgreSQL for application data
- Amazon S3 for direct photo storage
- GitHub Actions for CI/CD automation

## Initial Repository Layout

```text
.github/workflows/  CI/CD workflows
backend/            Rust backend application
frontend/           React/Tailwind frontend application
infra/              Infrastructure as code
docs/               Architecture and product planning
```

## Development Workflow

1. Work happens on feature branches.
2. Pull requests run CI checks.
3. Required tests must pass before merge.
4. Merges to `main` become candidates for deployment.

## Local Development

Copy the example environment file:

```bash
cp .env.example .env
```

Run the full local stack with Docker Compose:

```bash
docker compose up --build
```

The local services will be available at:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8080
Health:   http://localhost:8080/health
Database: localhost:5432
```

You can also run only the frontend. It will use seed data and browser-local placeholders if the backend is not reachable:

```bash
cd frontend
npm install
npm run dev
```

Run backend checks directly:

```bash
cd backend
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all
```

Run frontend checks directly:

```bash
cd frontend
npm install
npm run typecheck
npm test
npm run build
```

## Current Capabilities

The project now has a working first vertical slice:

- Rust Axum API skeleton
- React/Tailwind crew dashboard
- Backend `/jobs` and `/jobs/{id}` API integration
- Start-job and complete-job actions
- Local photo upload-ticket placeholder flow
- Browser-local fallback when the backend is not running
- Backend and frontend tests
- GitHub Actions CI
- Docker Compose local stack

## Next Step

The next step is to replace seed/local job state with a PostgreSQL-backed job model and migrations.
