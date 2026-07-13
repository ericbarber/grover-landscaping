# Hosted Pilot Runbook

Use this runbook for the first protected hosted pilot after the Render service URL is final.

## Prerequisites

- GitHub checks pass on the branch being deployed.
- The Render Blueprint has created the web service and PostgreSQL database from `render.yaml`.
- `terraform`, `aws`, `psql`, and `curl` are available in the operator shell.
- AWS credentials point at the account that owns the Cognito Terraform state.

## Cognito Provisioning

1. Copy and edit the production Terraform variables:

```bash
cp infra/terraform/environments/prod/terraform.tfvars.example \
  infra/terraform/environments/prod/terraform.tfvars
$EDITOR infra/terraform/environments/prod/terraform.tfvars
```

Set `application_url` to the final HTTPS Render URL or custom domain.

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

Read the Cognito subject. This value must become the PostgreSQL membership `user_id`:

```bash
OWNER_SUB=$(aws cognito-idp admin-get-user \
  --user-pool-id "${USER_POOL_ID}" \
  --username "${OWNER_EMAIL}" \
  --query "UserAttributes[?Name=='sub'].Value | [0]" \
  --output text)
```

Create or update the first active organization membership. Run this against the Render PostgreSQL database connection string:

```bash
psql "${DATABASE_URL}" -v OWNER_SUB="${OWNER_SUB}" <<'SQL'
INSERT INTO organization_memberships (
    id,
    organization_id,
    user_id,
    role,
    status,
    scope_type,
    scope_id
)
VALUES (
    'membership_first_owner',
    'org_demo_landscaping',
    :'OWNER_SUB',
    'organization_owner',
    'active',
    'organization',
    'org_demo_landscaping'
)
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    scope_type = EXCLUDED.scope_type,
    scope_id = EXCLUDED.scope_id,
    updated_at = NOW();
SQL
```

Do not use the Cognito email as `organization_memberships.user_id`; the API authorizes memberships by token `sub`.

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
SMOKE_DAY_PLAN_ID=day_plan_2026_06_15_crew_1001 \
SMOKE_ACCOUNT_ID=acct_1001 \
SMOKE_PROPERTY_ID=property_1001 \
bash scripts/smoke-production.sh
```

The first owner passes validation only when `/me/access` returns an active `org_demo_landscaping` membership with `organization_owner` access, `/jobs` returns authenticated data, route/report/photo/customer portal smoke reads succeed for the configured `SMOKE_*` IDs, and the access summary writes a `login` audit event.

## Rollback Notes

- If Cognito values are wrong in Render, fix the environment variables and redeploy; do not switch production to disabled auth.
- If the first owner cannot see data, compare the Cognito `sub` with `organization_memberships.user_id`.
- If Terraform must be rolled back, keep the user pool until Render is moved to replacement Cognito outputs.
