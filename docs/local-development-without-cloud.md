# Local Development Without Cloud Hosting

## Goal

Continue developing Grover Landscaping without setting up an AWS account, billing, or hosted review environment yet.

## Recommended Workflow

```text
ChatGPT-assisted development
  -> commits to GitHub
  -> GitHub Actions validates the repository
  -> local checkout for manual review when needed
  -> cloud deployment added later
```

## What We Can Build Without AWS

We can develop most of the application locally before using cloud infrastructure:

- React/Tailwind frontend shell
- Rust Axum API
- PostgreSQL-backed domain model
- Authentication abstraction
- Job and photo metadata APIs
- Local file-backed photo upload simulation
- Docker Compose development environment
- Unit tests and integration tests
- GitHub Actions CI

## What We Should Defer Until AWS

These pieces should be integrated once an AWS account is available:

- Cognito user pools
- S3 presigned upload URLs
- ECS Fargate deployment
- RDS or Aurora PostgreSQL
- EventBridge and SQS workflows
- Lambda image processing
- CloudFront distribution
- Production secrets management

## Local Substitutes

| Production Concern | Local Substitute |
| --- | --- |
| S3 photo storage | local filesystem or MinIO later |
| Cognito auth | mock user identity / local JWT later |
| RDS PostgreSQL | Docker Compose PostgreSQL |
| EventBridge/SQS | in-process events or local queue table |
| ECS Fargate | local Rust process or Docker Compose service |
| Hosted frontend | Vite dev server |

## Review Without a Hosted Web App

Until a cloud review site exists, review can happen through:

- local app runs from a cloned repo
- screenshots committed or attached to issues later
- GitHub Actions build/test results
- PR diffs and Markdown documentation
- generated static build artifacts later

## Local Developer Commands

Once the frontend exists:

```text
cd frontend
npm install
npm run dev
```

Once the backend exists:

```text
cd backend
cargo run
```

Once Docker Compose exists:

```text
docker compose up --build
```

## Near-Term Direction

The next development step is to scaffold:

1. React/Tailwind frontend shell.
2. Rust Axum backend shell.
3. Docker Compose with PostgreSQL.
4. CI checks for both projects.

This lets development proceed without AWS costs while keeping the future AWS deployment path clean.
