# Hosted Pilot Runbook

Use this runbook for the first protected hosted pilot after the Render service URL is final.

If the AWS organization, production member account, temporary operator access,
cost controls, audit trail, and state bucket do not exist yet, complete
[`aws-account-setup.md`](aws-account-setup.md) first.

## Prerequisites

- GitHub checks pass on the branch being deployed.
- The Render Blueprint has created the web service and PostgreSQL database from `render.yaml`.
- `terraform`, `aws`, `psql`, and `curl` are available in the operator shell.
- The current temporary AWS session points at the production member account
  that owns Cognito and the Terraform state bucket.
- The production account and remote-state bucket pass the AWS account-setup
  acceptance checklist.

Confirm the repository boundary before provisioning:

```bash
bash scripts/release-preflight.sh --repository-only
```

The complete preflight names missing operator inputs without printing their
values. `RENDER_ACCESS_CONFIRMED=1` records owning-account access;
`TERRAFORM_STATE_CONFIRMED=1` records the approved production state/backend
decision.

## Cognito Provisioning

1. Set the final production origin for Terraform:

```bash
export TF_VAR_application_url=https://grover-landscaping.onrender.com
```

Use the final HTTPS Render URL or custom domain. The example variables file
documents optional photo-lifecycle values; if an operator creates a local
`terraform.tfvars`, verify that it remains outside version control.

When the pilot is ready for S3 photo evidence, also set `enable_photo_storage = true`. Use the resulting `photo_bucket_name`, `photo_bucket_region`, and `photo_key_prefix` outputs for Render's `S3_PHOTO_BUCKET`, `S3_PHOTO_REGION`, and `S3_PHOTO_KEY_PREFIX` values.

2. Plan and apply Cognito:

```bash
terraform -chdir=infra/terraform/environments/prod init
terraform -chdir=infra/terraform/environments/prod plan
terraform -chdir=infra/terraform/environments/prod apply
```

3. Validate the Cognito outputs before wiring Render:

```bash
bash scripts/validate-cognito-hosted-pilot.sh
```

4. Set these Render environment variables from the script output:

```text
AUTH_MODE=cognito
COGNITO_ISSUER_URL=<issuer_url>
COGNITO_CLIENT_ID=<app_client_id>
COGNITO_LOGIN_DOMAIN=<login_domain>
PUBLIC_APP_URL=<production HTTPS application URL>
# Set after enable_photo_storage=true:
# PHOTO_STORAGE_MODE=s3
# S3_PHOTO_BUCKET=<photo_bucket_name>
# S3_PHOTO_REGION=<photo_bucket_region>
# S3_PHOTO_KEY_PREFIX=<photo_key_prefix>
```

`AUTH_MODE=disabled` must not be used in production.

## First Organization Owner

Create the first Cognito user and add the coarse application role:

```bash
USER_POOL_ID=$(terraform -chdir=infra/terraform/environments/prod output -raw user_pool_id)
OWNER_EMAIL='owner@example.com'

aws cognito-idp admin-create-user \
  --user-pool-id "${USER_POOL_ID}" \
  --username "${OWNER_EMAIL}" \
  --user-attributes \
    Name=email,Value="${OWNER_EMAIL}" \
    Name=email_verified,Value=true

aws cognito-idp admin-add-user-to-group \
  --user-pool-id "${USER_POOL_ID}" \
  --username "${OWNER_EMAIL}" \
  --group-name OrganizationOwner
```

Sign in with the new identity and use the application's First-user setup panel to
create the service organization. `POST /organizations/bootstrap` atomically creates
the organization and binds an `organization_owner` membership to the authenticated
Cognito `sub`; it rejects users that already have an active membership.

Do not insert the Cognito email into `organization_memberships.user_id`; the API
authorizes memberships by token `sub`.

## Hosted Validation

After Render restarts with Cognito configuration:

```bash
BASE_URL=https://grover-landscaping.onrender.com \
bash scripts/validate-cognito-hosted-pilot.sh
```

Sign in as the first owner, complete the required temporary-password and MFA setup, then capture a current access token from the browser session for the smoke test:

```bash
BASE_URL=https://grover-landscaping.onrender.com \
ACCESS_TOKEN='<current Cognito access token>' \
SMOKE_JOB_ID=job_1001 \
SMOKE_OTHER_TENANT_JOB_ID=job_other_tenant_1001 \
SMOKE_DAY_PLAN_ID=day_plan_2026_06_15_crew_1001 \
SMOKE_ACCOUNT_ID=acct_1001 \
SMOKE_PROPERTY_ID=property_1001 \
bash scripts/smoke-production.sh
```

The first owner passes validation only when `/me/access` returns an active
`org_demo_landscaping` membership with `organization_owner` access, `/jobs`
returns authenticated data, a known persisted job from a controlled second
tenant returns exactly `403`, route/report/photo/photo-processing/customer
portal smoke reads succeed for the configured primary-tenant `SMOKE_*` IDs, and
the access summary writes a `login` audit event. Provision the second-tenant job
with a separate controlled identity and confirm the first owner has no active
membership there; do not use a fabricated ID because `404` is not tenant-
isolation evidence.

The smoke runner accepts only an HTTPS origin and explicit safe pilot IDs,
bounds every request, withholds response bodies from failures, and confirms the
completed photo can be read back from the exact persisted job. Validate this
runner without a live endpoint using `bash scripts/smoke-production.test.sh`.

Once smoke passes, complete the restricted copy of
[`protected-release-evidence.template.json`](protected-release-evidence.template.json)
and run `node scripts/validate-protected-release-evidence.mjs
/restricted/path/release-evidence.json`. Record only release, deploy, commit,
migration, check, and rollback references; the validator rejects common
credential material and the evidence must not contain tenant record IDs or
personal operator details.

Before enabling provider-backed delivery, validate the webhook gateway configuration:

```bash
NOTIFICATION_DISPATCH_MODE=webhook \
PUBLIC_APP_URL=https://grover-landscaping.onrender.com \
NOTIFICATION_WEBHOOK_URL='<provider delivery URL>' \
NOTIFICATION_WEBHOOK_BEARER_TOKEN='<provider gateway token>' \
bash scripts/validate-notification-webhook.sh
```

Only add `VALIDATE_NOTIFICATION_WEBHOOK_DELIVERY=1` with `NOTIFICATION_WEBHOOK_SMOKE_CHANNEL` and `NOTIFICATION_WEBHOOK_SMOKE_RECIPIENT` when an internal recipient is ready to receive a real provider test message.

Enable queued photo thumbnail retries only after S3 photo storage is configured for the API:

```bash
PHOTO_STORAGE_MODE=s3 \
PHOTO_PROCESSING_WORKER_MODE=enabled \
PHOTO_PROCESSING_POLL_SECONDS=10 \
PHOTO_PROCESSING_BATCH_SIZE=5 \
PHOTO_PROCESSING_MAX_ATTEMPTS=5
```

## Rollback Notes

- If Cognito values are wrong in Render, fix the environment variables and redeploy; do not switch production to disabled auth.
- If the first owner cannot bootstrap, confirm the token contains the
  `OrganizationOwner` group and that the Cognito `sub` has no existing active
  membership.
- If Terraform must be rolled back, keep the user pool until Render is moved to replacement Cognito outputs.
