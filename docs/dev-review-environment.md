# Development Review Environment

## Goal

Provide a stable web URL where Eric can review and test the web application as it is developed.

## Recommended Approach

Use AWS Amplify Hosting for the frontend review environment.

Amplify Hosting fits the current project direction because it supports:

- Git-based continuous deployment
- React single-page applications
- Branch-based environments
- Pull request previews
- Password-protected branches
- Monorepo application roots

## Environment Model

```text
main
  -> production later

develop
  -> persistent dev review environment

feature/*
  -> pull request preview environments
```

## Initial Review URL Strategy

Create a long-running `develop` branch and connect it to Amplify Hosting.

Recommended behavior:

```text
push to develop
  -> CI runs
  -> Amplify builds frontend/
  -> dev URL updates automatically
```

For feature work:

```text
feature branch
  -> pull request opened
  -> CI runs
  -> Amplify creates preview URL if PR previews are enabled
```

## Amplify Console Setup

1. Open AWS Amplify Hosting.
2. Choose `Create new app`.
3. Choose GitHub as the source provider.
4. Select `ericbarber/grover-landscaping`.
5. Select the `develop` branch.
6. Mark the repository as a monorepo.
7. Set the app root to:

```text
frontend
```

8. Confirm the build settings from `amplify.yml`.
9. Deploy the app.
10. Enable password protection for the dev branch if the app should not be publicly viewable.

## Required Amplify Environment Variable

For a monorepo app, set:

```text
AMPLIFY_MONOREPO_APP_ROOT=frontend
```

Amplify may set this automatically when the app is connected through the console and the frontend app root is selected.

## Recommended Frontend Environment Variables

Eventually the frontend should use branch-specific environment values:

```text
VITE_APP_ENV=dev
VITE_API_BASE_URL=https://api-dev.example.com
VITE_COGNITO_USER_POOL_ID=...
VITE_COGNITO_CLIENT_ID=...
VITE_AWS_REGION=us-east-1
```

Do not commit secrets to the repository. Use Amplify environment variables or GitHub/AWS secrets as appropriate.

## Backend Review Environment

The first review environment can start with only the frontend. Once the Rust API exists, add a dev backend deployment using:

- ECS Fargate for the Rust API
- RDS PostgreSQL or Aurora PostgreSQL for dev data
- S3 dev bucket for photos
- Cognito dev user pool
- GitHub Actions with AWS OIDC for infrastructure and backend deployments

## Promotion Path

```text
feature branch
  -> PR preview
  -> merge to develop
  -> dev review environment
  -> merge to main
  -> production candidate
```
