# Infrastructure

The first protected production pilot is defined by the repository-root `render.yaml`. See `docs/production-deployment.md` for provisioning and operating instructions.

AWS remains the target for a later stage that needs managed user identity, private S3 photo storage, asynchronous workflows, or tighter network isolation.

Local development does not require AWS, Render, Cognito, or S3. The default
Compose stack uses PostgreSQL, `AUTH_MODE=local_review`, local photo placeholders,
and disabled notification delivery. See
[`../docs/local-development-without-cloud.md`](../docs/local-development-without-cloud.md).

## Current infrastructure status

| Area | Repository state | External work still required |
| --- | --- | --- |
| Local stack | Delivered through Docker Compose and watchdog scripts | None for normal local review |
| Protected pilot image | Delivered Dockerfile, health/readiness, migrations, non-root runtime, and `render.yaml` | Provisioned service, secrets, domain, smoke/rollback evidence |
| Cognito | Terraform modules and dev/prod environment definitions delivered | Apply with an authorized AWS account and bind real identities |
| S3 photos | Optional private/versioned Terraform module delivered | Enable, provision, validate lifecycle/CORS, and approve retention |
| Notification delivery | Webhook worker contract delivered | Select provider, configure authenticated gateway/callback, dashboards, alerts, and ownership |
| Full AWS application stack | Direction only | Networking, compute, database, eventing, deployment, and operations remain demand-gated |

## Cognito and Photo Storage

Terraform now manages separate Cognito environments and includes an optional S3 photo-storage module:

```text
infra/terraform/environments/dev
infra/terraform/environments/prod
infra/terraform/modules/cognito
infra/terraform/modules/s3-photos
```

Development:

```bash
terraform -chdir=infra/terraform/environments/dev init
terraform -chdir=infra/terraform/environments/dev plan
terraform -chdir=infra/terraform/environments/dev apply
```

Production requires an HTTPS application origin:

```bash
cp infra/terraform/environments/prod/terraform.tfvars.example \
  infra/terraform/environments/prod/terraform.tfvars
terraform -chdir=infra/terraform/environments/prod init
terraform -chdir=infra/terraform/environments/prod plan
```

Do not apply production until the Render URL or custom domain is final. Production enables mandatory MFA and Cognito deletion protection.

Production photo storage is disabled by default. Set `enable_photo_storage = true` in `infra/terraform/environments/prod/terraform.tfvars` when the pilot is ready for S3-backed photo evidence. The module blocks public access, enables bucket-owner-enforced ownership, server-side encryption, versioning, browser CORS for the application origin, incomplete upload cleanup after one day, archive transition after `photo_archive_after_days`, current-object deletion after `photo_delete_after_days`, and noncurrent-version deletion after `photo_noncurrent_delete_after_days`.

Validate the production outputs before wiring Render:

```bash
bash scripts/validate-cognito-hosted-pilot.sh
```

See `docs/hosted-pilot-runbook.md` for first-owner creation and membership binding.

## Future AWS layout

The following remains a growth target, not a claim about directories currently
implemented in this repository:

```text
infra/
  terraform/
    environments/
      dev/
      prod/
    modules/
      networking/
      ecs-api/
      rds/
      s3-photos/
      cognito/
      eventing/
```

## AWS Growth Direction

Use GitHub Actions with AWS OIDC to deploy without long-lived AWS access keys.
