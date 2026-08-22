# Local Development Without Cloud Hosting

Grover can be developed and reviewed locally without AWS, Render, Cognito, S3,
or a notification provider. The local stack intentionally substitutes bounded,
visible development behavior without pretending cloud effects occurred.

## Start the complete stack

```bash
cp .env.example .env
docker compose up --build
bash scripts/apply-local-migrations.sh
```

Open:

```text
Frontend: http://localhost:5173
Application: http://localhost:5173/app
Backend: http://localhost:8080
Readiness: http://localhost:8080/health/ready
```

The default `AUTH_MODE=local_review` publishes seven fixed reviewer profiles.
Use the application header’s `Review as` selector to inspect Organization Owner,
Manager, Crew Lead, Crew Member, Property Manager, Property Owner, and Support
Administrator. Selection is tab-scoped. The backend derives roles and virtual
demo membership from its own allowlist and rejects unknown reviewers.

## Local substitutes and honest boundaries

| Hosted concern | Local behavior |
| --- | --- |
| Cognito | Production-rejected fixed local reviewers |
| RDS/managed PostgreSQL | Docker Compose PostgreSQL |
| S3 | Local placeholder tickets or browser-held photo blobs where supported |
| Notification provider | Durable outbox with dispatch disabled unless a test webhook is explicitly configured |
| Hosted frontend/API | Vite and Axum containers with watchdog restart |
| Cloud monitoring | Local logs, health/readiness, diagnostics, and synthetic assurance checks |

Local-only or queued results are labeled. They are not production delivery,
object storage, monitoring, or signed launch evidence.

## Review on a phone

With the workstation and phone on the same Tailscale or local network:

```bash
bash scripts/mobile-review.sh
```

The script detects a reachable address, starts local authenticated services with
safe fallbacks, and prints the phone URL. Override detection when necessary:

```bash
MOBILE_REVIEW_HOST=192.168.1.20 bash scripts/mobile-review.sh
```

See [`mobile-docker-access.md`](mobile-docker-access.md),
[`dev-review-environment.md`](dev-review-environment.md), and
[`local-validation-sequence.md`](local-validation-sequence.md).

## Frontend-only fallback

```bash
cd frontend
npm install
npm run dev
```

Supported views use seeded/browser-local behavior when the API is unavailable.
Authenticated persistence workflows still require the API and PostgreSQL.

## Validation through Compose

```bash
docker compose exec -T frontend npm run typecheck
docker compose exec -T frontend npm test
docker compose exec -T frontend npm run build
docker compose exec -T backend cargo fmt --all -- --check
docker compose exec -T backend cargo test --all
```

Playwright Firefox and WebKit projects require their browser executables. Use the
Chromium mobile/desktop projects as the compatible local baseline when those
executables are unavailable, and keep the full cross-browser matrix for CI or an
environment where all browsers are installed.

## What still requires external infrastructure or authority

- Provisioned Cognito identities and production tenant bindings
- Private S3 validation against real objects and lifecycle rules
- Live notification gateway/callback and delivery receipts
- Hosted deployment, domain, secrets, dashboards, pager routing, backups, and
  rollback evidence
- Human/device/privacy/security and go/no-go signoff

Those dependencies do not prevent normal local feature development; they do
prevent claiming a production pilot is ready.
