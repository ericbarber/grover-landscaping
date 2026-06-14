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

## Current Status

This repository is being initialized with the CI/CD foundation first. The next step is to add the Rust API skeleton and the React/Tailwind frontend shell.
