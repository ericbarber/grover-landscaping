# Production Deployment

## Decision

Use Render for the first protected production pilot:

- One Docker web service serves the React application and Rust API from the same origin.
- One private Render PostgreSQL database stores application state.
- Render terminates TLS, runs readiness health checks, deploys only after GitHub checks pass, and retains deploys for rollback.
- The repository-root `render.yaml` defines both resources.

The starter web service and Basic-256mb PostgreSQL plan currently total approximately $13 USD per month before bandwidth or other usage. Confirm current pricing before creating the resources.

This is materially simpler and less expensive for the current single-service MVP than immediately operating Amplify, App Runner or ECS, a VPC connector, and RDS. AWS remains the growth path when Cognito, S3 photo storage, queues, or stricter network isolation are required.

## Current Security Boundary

The application uses Amazon Cognito managed login with OAuth authorization code and PKCE. The browser sends Cognito access tokens to the Rust API, which verifies the RS256 signature, issuer, client ID, expiry, and token type before applying role gates. Health endpoints, runtime auth configuration, frontend assets, tokenized shared reports, and expiring tokenized bid reviews are public; operational APIs require authentication.

Before storing real customer or employee data or opening access broadly:

1. Add persisted organization memberships and organization-scoped database queries; current Cognito groups provide coarse role authorization only.
2. Replace placeholder photo URLs with private object storage and expiring signed URLs.
3. Remove runtime seed fallbacks from production repository error paths.
4. Persist customer account data instead of returning seeded account summaries.
5. Choose a database tier and backup/restore policy that meet the business recovery target.
6. Configure and validate an email/SMS webhook gateway before enabling `NOTIFICATION_DISPATCH_MODE=webhook`; delivery remains explicitly disabled in `render.yaml` until those credentials exist.
6. Add an email/SMS outbox dispatcher before treating queued project-bid notifications as delivered; the current runtime persists delivery work but does not call a provider.

## Provisioning

1. Push the reviewed production changes to the repository's default branch.
2. In the Render dashboard, create a new Blueprint and connect this repository.
3. Provision the production Cognito Terraform environment using the final Render application URL and the hosted pilot runbook.
4. Render reads `render.yaml` and requests the Cognito issuer URL, public app client ID, and login domain from the Terraform outputs.
5. Wait for the database and web service to become healthy. The web service applies all embedded SQLx migrations before opening its listener.
6. Record the generated `https://grover-landscaping.onrender.com` URL or attach a custom domain.

The database has `ipAllowList: []`, so it is reachable only through Render's private network. Do not add public database access for routine administration.

## Verification

Validate Cognito outputs before wiring Render:

```bash
bash scripts/validate-cognito-hosted-pilot.sh
```

Run the production smoke test after the first deploy and after material platform changes:

```bash
BASE_URL=https://grover-landscaping.onrender.com \
ACCESS_TOKEN='current-cognito-access-token' \
SMOKE_JOB_ID=job_1001 \
SMOKE_DAY_PLAN_ID=day_plan_2026_06_15_crew_1001 \
SMOKE_ACCOUNT_ID=acct_1001 \
SMOKE_PROPERTY_ID=property_1001 \
bash scripts/smoke-production.sh
```

The smoke test verifies:

- Database-backed readiness
- Cognito runtime auth configuration
- Rejection of unauthenticated API requests
- Cognito-authenticated access summary and job list reads
- Authenticated route, report, photo upload-ticket, customer portfolio, customer bid-history, and customer report-history access
- Public frontend delivery for the managed-login entry point

Override the `SMOKE_*` IDs when the pilot data set no longer uses the seeded demo job, day plan, account, or property identifiers.

Validate the notification webhook gateway before setting `NOTIFICATION_DISPATCH_MODE=webhook` in Render:

```bash
NOTIFICATION_DISPATCH_MODE=webhook \
PUBLIC_APP_URL=https://grover-landscaping.onrender.com \
NOTIFICATION_WEBHOOK_URL=https://notifications.example.com/deliver \
NOTIFICATION_WEBHOOK_BEARER_TOKEN='provider-gateway-token' \
bash scripts/validate-notification-webhook.sh
```

To send an intentional provider test request, add `VALIDATE_NOTIFICATION_WEBHOOK_DELIVERY=1`, `NOTIFICATION_WEBHOOK_SMOKE_CHANNEL`, and `NOTIFICATION_WEBHOOK_SMOKE_RECIPIENT`. Use a controlled internal recipient because the gateway may deliver a real email or SMS.

See [Hosted Pilot Runbook](hosted-pilot-runbook.md) for first-owner creation, Cognito group assignment, PostgreSQL membership binding, and rollback notes.

## Operations

- Deploys: Render builds after all GitHub checks pass on `main`.
- Migrations: SQLx runs pending migrations during startup before readiness can succeed.
- Rollback: restore the prior Render deploy. Migrations must remain backward-compatible because database rollback is separate from application rollback.
- Logs: use the Render service log stream; `RUST_LOG` defaults to application and HTTP info events.
- Identity configuration: manage user pools and app clients through Terraform; Cognito client IDs and issuer URLs are identifiers, not secrets.
- Health: use `/health/live` for process liveness and `/health/ready` for database readiness.
- Notifications: disabled by default. Webhook mode requires `PUBLIC_APP_URL`, `NOTIFICATION_WEBHOOK_URL`, and optionally `NOTIFICATION_WEBHOOK_BEARER_TOKEN`. Production URLs must use HTTPS. Failed delivery uses exponential backoff and moves to `dead_letter` after the configured attempt limit.

Provider references:

- <https://render.com/docs/infrastructure-as-code>
- <https://render.com/docs/health-checks>
- <https://render.com/docs/deploys>
- <https://render.com/pricing>
