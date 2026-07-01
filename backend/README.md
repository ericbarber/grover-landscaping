# Backend

The backend will be implemented in Rust using Axum, Tokio, SQLx, and PostgreSQL.

## Planned Structure

```text
backend/
  Cargo.toml
  crates/
    api/
    domain/
    db/
    auth/
    jobs/
    photos/
    completions/
    notifications/
```

## First API Endpoints

```text
GET  /health
GET  /reports/:share_token
GET  /jobs
GET  /jobs/:id
GET  /jobs/:id/report
POST /jobs/:id/start
GET  /jobs/:id/photos
POST /jobs/:id/photos/presign
POST /jobs/:id/photos/complete
POST /jobs/:id/complete
```

## Production Runtime

The production binary serves the compiled frontend and API from one origin. It:

- Reads the listening port from `PORT`
- Requires `DATABASE_URL` when `APP_ENV=production`
- Applies embedded SQLx migrations before binding the HTTP listener
- Requires Cognito OIDC configuration when `APP_ENV=production`
- Verifies Cognito access-token signatures, issuer, client ID, expiry, and token use
- Maps Cognito groups to route-level application role checks
- Exposes `/health/live` and database-backed `/health/ready` probes
- Serves the SPA from `FRONTEND_DIST_DIR`
- Handles `SIGTERM` for graceful platform deploys

The repository-root `Dockerfile` builds the frontend and backend into a non-root production image.

Authentication variables:

```text
AUTH_MODE=cognito
COGNITO_ISSUER_URL=https://cognito-idp.<region>.amazonaws.com/<user-pool-id>
COGNITO_CLIENT_ID=<public-spa-client-id>
COGNITO_LOGIN_DOMAIN=https://<prefix>.auth.<region>.amazoncognito.com
```

`AUTH_MODE=disabled` is accepted outside production for seed-data development and tests. The API exposes public runtime configuration at `GET /auth/config`; all job, crew, and day-plan APIs require a valid Bearer access token in Cognito mode.

Notification delivery is disabled by default. Webhook mode claims PostgreSQL outbox rows safely across service instances, sends bounded batches, retries failures with exponential backoff, recovers abandoned claims, and records provider receipts.

```text
NOTIFICATION_DISPATCH_MODE=webhook
PUBLIC_APP_URL=https://grover-landscaping.example.com
NOTIFICATION_WEBHOOK_URL=https://notification-gateway.example.com/deliver
NOTIFICATION_WEBHOOK_BEARER_TOKEN=<optional-bearer-token>
NOTIFICATION_POLL_SECONDS=5
NOTIFICATION_BATCH_SIZE=10
NOTIFICATION_MAX_ATTEMPTS=5
```

Production webhook and public application URLs must use HTTPS. The webhook receives `notification_id`, `channel`, `recipient`, `template_key`, and `payload`; a successful JSON response may return `{ "message_id": "provider-id" }`.
