# Infrastructure

The first protected production pilot is defined by the repository-root `render.yaml`. See `docs/production-deployment.md` for provisioning and operating instructions.

AWS remains the target for a later stage that needs managed user identity, private S3 photo storage, asynchronous workflows, or tighter network isolation.

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

## Recommended Starting Layout

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
