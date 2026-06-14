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

## Current Status

The project now has a working first development scaffold:

- Rust Axum API skeleton
- React/Tailwind frontend shell
- Seed job data for the crew dashboard
- Backend and frontend tests
- GitHub Actions CI
- Docker Compose local stack

The next step is to connect the frontend to the backend `/jobs` API and add the first job detail screen.
