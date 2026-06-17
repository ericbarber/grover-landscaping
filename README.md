# Grover Landscaping

Grover Landscaping is a mobile-first proof-of-completion application for yard care and landscaping crews. Crews can view assigned jobs, follow a daily route, track stop progress, capture service photo placeholders, complete checklists, and prepare completion reports for customer or manager review.

The project is built as a Rust + React application with local-first development support. The frontend can run with seeded browser data when the backend is unavailable, and the backend exposes the first set of job, account, photo-ticket, and stop-progress APIs.

## Features

- Crew completion dashboard
- Daily crew route / day-plan panel
- Ordered route stops with drive and service estimates
- Local stop progress tracking with browser persistence
- Assigned job list and job detail view
- Start-job and complete-job actions
- Before / after / issue photo placeholder flow
- Completion checklist and completion report panel
- Customer account status display
- Browser fallback mode for demos and frontend-only development
- Rust API endpoints for jobs, accounts, photo tickets, and stop progress
- PostgreSQL migrations for job and account foundations
- Docker Compose local stack
- GitHub Actions CI configuration

## Tech Stack

| Area | Technology |
| --- | --- |
| Backend | Rust, Axum, Tokio, SQLx |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Database | PostgreSQL |
| Local runtime | Docker Compose |
| Cloud direction | AWS, S3, RDS, ECS/App Runner or Fargate, Amplify/CloudFront |
| CI | GitHub Actions |

## Repository Layout

```text
.github/workflows/  GitHub Actions workflows
backend/            Rust API service
frontend/           React/Tailwind crew application
infra/              Infrastructure notes and future IaC location
docs/               Architecture, data model, and development notes
scripts/            Local developer utility scripts
```

## Local Development

Copy the example environment file:

```bash
cp .env.example .env
```

Start the local stack:

```bash
docker compose up --build
```

Apply database migrations after PostgreSQL is healthy:

```bash
bash scripts/apply-local-migrations.sh
```

Local services:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8080
Health:   http://localhost:8080/health
Database: localhost:5432
```

The frontend can also run without the backend. In that mode it uses seed data, local photo placeholders, and browser storage for route progress.

```bash
cd frontend
npm install
npm run dev
```

## Backend Commands

```bash
cd backend
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all
```

## Frontend Commands

```bash
cd frontend
npm install
npm run typecheck
npm test
npm run build
```

## API Endpoints

Current backend endpoints include:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API health check |
| GET | `/jobs` | List assigned jobs |
| GET | `/jobs/{id}` | Read job detail |
| GET | `/jobs/{id}/account` | Read account status for a job |
| POST | `/jobs/{id}/start` | Mark a job started |
| POST | `/jobs/{id}/complete` | Mark a job complete |
| POST | `/jobs/{id}/photos/presign` | Create a local photo upload ticket |
| POST | `/jobs/{id}/photos/complete` | Mark a photo upload ticket complete |
| GET | `/crews/{crew_id}/day-plan/today` | Read the current crew day plan route |
| POST | `/day-plans` | Create a manager draft day plan |
| POST | `/day-plans/{day_plan_id}/publish` | Publish a manager draft day plan |
| POST | `/day-plans/{day_plan_id}/stops` | Assign a job to a manager day plan |
| PUT | `/day-plans/{day_plan_id}/stops/order` | Replace manager day-plan stop order |
| DELETE | `/day-plans/{day_plan_id}/stops/{stop_id}` | Remove a stop from a manager day plan |
| POST | `/day-plans/{day_plan_id}/stops/{stop_id}/status` | Update crew stop progress |

The day-plan route reads from PostgreSQL when a persisted route is available and falls back to seeded API data when persistence is unavailable.

## Data and Persistence

The project currently includes migrations for:

- Service jobs
- Job checklist items
- Job photos
- Customer accounts
- Account status and service tracking foundations

The API can fall back to seeded local data where persistence is not fully wired yet. This keeps the product usable for frontend development and demos before a hosted environment exists.

## Frontend Behavior

The crew dashboard is designed to work on mobile devices. It currently supports:

- Viewing today’s route
- Opening jobs from route stops
- Tracking each stop as pending, in progress, or finished
- Persisting stop progress in browser storage
- Viewing account status in the completion report
- Creating local photo upload tickets
- Preparing a customer-facing completion summary

## Deployment Direction

The application is structured for AWS deployment:

- Frontend hosted with Amplify, S3/CloudFront, or equivalent static hosting
- Backend hosted with ECS Fargate, App Runner, or a similar container runtime
- PostgreSQL hosted with RDS or Aurora PostgreSQL
- Photo storage with S3 presigned uploads
- Secrets managed with AWS Secrets Manager or SSM Parameter Store

The repository includes an `amplify.yml` for frontend hosting setup and an `infra/` directory for deployment documentation and future infrastructure code.

## Development Notes

This repository is currently in active MVP development. Prefer small vertical slices that keep the app runnable locally. The frontend should continue to degrade gracefully when the backend or database is unavailable.
