#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${repository_root}"

repository_only=false
external_only=false
case "${1:-}" in
  --repository-only) repository_only=true; shift ;;
  --external-only) external_only=true; shift ;;
esac
if (($#)); then
  echo "Usage: bash scripts/release-preflight.sh [--repository-only|--external-only]" >&2
  exit 64
fi

failed_checks=0
external_prerequisites=0
terraform_runner=""
terraform_image="hashicorp/terraform:1.13.5"
temporary_terraform=""

cleanup() {
  if [[ -n "${temporary_terraform}" && -f "${temporary_terraform}" ]]; then
    rm -f -- "${temporary_terraform}"
  fi
}
trap cleanup EXIT

ready() {
  printf '[READY] %s\n' "$1"
}

failed() {
  printf '[FAILED] %s\n' "$1" >&2
  failed_checks=$((failed_checks + 1))
}

external() {
  printf '[EXTERNAL PREREQUISITE] %s\n' "$1"
  external_prerequisites=$((external_prerequisites + 1))
}

require_files() {
  local missing=()
  local path

  for path in \
    Dockerfile \
    render.yaml \
    backend/Cargo.lock \
    backend/src/auth.rs \
    backend/src/main.rs \
    frontend/package-lock.json \
    infra/terraform/environments/dev/.terraform.lock.hcl \
    infra/terraform/environments/dev/main.tf \
    infra/terraform/environments/prod/.terraform.lock.hcl \
    infra/terraform/environments/prod/main.tf \
    infra/terraform/environments/prod/variables.tf \
    infra/terraform/environments/prod/outputs.tf \
    docs/protected-release-evidence.template.json \
    scripts/smoke-production.sh \
    scripts/smoke-production.test.sh \
    scripts/test-fixtures/fake-smoke-curl.sh \
    scripts/validate-protected-release-evidence.mjs \
    scripts/validate-protected-release-evidence.test.mjs; do
    [[ -f "${path}" ]] || missing+=("${path}")
  done

  if ((${#missing[@]})); then
    failed "required release files are missing: ${missing[*]}"
  else
    ready "required release files are present"
  fi
}

validate_render_blueprint() {
  local blueprint=render.yaml
  local errors=0
  local pattern

  for pattern in \
    'type:\s*web.*?name:\s*grover-landscaping.*?runtime:\s*docker' \
    'dockerfilePath:\s*\./Dockerfile' \
    'healthCheckPath:\s*/health/ready' \
    'autoDeployTrigger:\s*checksPass' \
    'key:\s*APP_ENV\s*\n\s*value:\s*production' \
    'key:\s*AUTH_MODE\s*\n\s*value:\s*cognito' \
    'key:\s*PUBLIC_APP_URL\s*\n\s*value:\s*https://' \
    'key:\s*DATABASE_URL\s*\n\s*fromDatabase:\s*\n\s*name:\s*grover-landscaping-db\s*\n\s*property:\s*connectionString' \
    'key:\s*COGNITO_ISSUER_URL\s*\n\s*sync:\s*false' \
    'key:\s*COGNITO_CLIENT_ID\s*\n\s*sync:\s*false' \
    'key:\s*COGNITO_LOGIN_DOMAIN\s*\n\s*sync:\s*false' \
    'databases:.*?name:\s*grover-landscaping-db.*?postgresMajorVersion:\s*"16".*?ipAllowList:\s*\[\]'; do
    if ! PREFLIGHT_PATTERN="${pattern}" perl -0ne '
      BEGIN { $pattern = qr/$ENV{PREFLIGHT_PATTERN}/s }
      exit($_ =~ $pattern ? 0 : 1)
    ' "${blueprint}"; then
      errors=$((errors + 1))
    fi
  done

  if ((errors)); then
    failed "Render blueprint is missing ${errors} required production setting(s)"
  else
    ready "Render blueprint uses Docker, PostgreSQL readiness, Cognito, and a private database"
  fi
}

validate_production_guards() {
  local errors=0

  rg -q 'app_environment\.eq_ignore_ascii_case\("production"\)' backend/src/main.rs || errors=$((errors + 1))
  rg -q 'DATABASE_URL is required when APP_ENV=production' backend/src/main.rs || errors=$((errors + 1))
  rg -q 'production && matches!\(mode, "disabled" \| "local_review"\)' backend/src/auth.rs || errors=$((errors + 1))
  rg -q 'production Cognito URLs must use HTTPS' backend/src/auth.rs || errors=$((errors + 1))
  rg -q 'unsafe_development_auth_modes_are_rejected_in_production' backend/src/auth.rs || errors=$((errors + 1))

  if ((errors)); then
    failed "production persistence/authentication guard contract is incomplete (${errors} missing assertion(s))"
  else
    ready "production requires PostgreSQL and rejects unsafe auth modes or non-HTTPS Cognito URLs"
  fi
}

validate_smoke_contract() {
  local errors=0
  local smoke=scripts/smoke-production.sh

  [[ -x "${smoke}" ]] || errors=$((errors + 1))
  rg -q 'BASE_URL:\?Set BASE_URL' "${smoke}" || errors=$((errors + 1))
  rg -q 'ACCESS_TOKEN:\?Set ACCESS_TOKEN' "${smoke}" || errors=$((errors + 1))
  rg -q '/health/ready' "${smoke}" || errors=$((errors + 1))
  rg -q '/auth/config' "${smoke}" || errors=$((errors + 1))
  rg -q 'unauthorized_status.*401|return 401' "${smoke}" || errors=$((errors + 1))
  rg -q 'BASE_URL must be an HTTPS origin' "${smoke}" || errors=$((errors + 1))
  rg -q -- '--connect-timeout' "${smoke}" || errors=$((errors + 1))
  rg -q -- '--max-time' "${smoke}" || errors=$((errors + 1))
  rg -q 'completed photo was not readable from the persisted job' "${smoke}" || errors=$((errors + 1))
  rg -q 'cross-tenant job access did not fail closed with 403' "${smoke}" || errors=$((errors + 1))
  for name in SMOKE_JOB_ID SMOKE_OTHER_TENANT_JOB_ID SMOKE_DAY_PLAN_ID SMOKE_ACCOUNT_ID SMOKE_PROPERTY_ID; do
    rg -Fq "${name}:?Set" "${smoke}" || errors=$((errors + 1))
  done

  if ((errors)); then
    failed "production smoke input/behavior contract is incomplete (${errors} missing assertion(s))"
  else
    ready "production smoke requires an app URL and token, supplies explicit pilot IDs, and checks fail-closed hosting and tenant isolation"
  fi
}

select_terraform_runner() {
  if command -v terraform >/dev/null 2>&1; then
    terraform_runner="$(command -v terraform)"
    return
  fi

  if command -v docker >/dev/null 2>&1 && docker image inspect "${terraform_image}" >/dev/null 2>&1; then
    local container_id
    temporary_terraform="$(mktemp /tmp/grover-release-preflight-terraform.XXXXXX)"
    container_id="$(docker create "${terraform_image}")"
    if docker cp "${container_id}:/bin/terraform" "${temporary_terraform}" >/dev/null 2>&1; then
      chmod +x "${temporary_terraform}"
      terraform_runner="${temporary_terraform}"
    fi
    docker rm "${container_id}" >/dev/null
  fi
}

run_terraform() {
  TF_IN_AUTOMATION=1 "${terraform_runner}" "$@"
}

validate_terraform() {
  select_terraform_runner
  if [[ -z "${terraform_runner}" ]]; then
    external "Terraform 1.13.5+ or the cached ${terraform_image} image is required for repository validation"
    return
  fi

  local formatting_failed=0
  local terraform_directory
  for terraform_directory in \
    infra/terraform/modules/cognito \
    infra/terraform/modules/s3-photos \
    infra/terraform/environments/dev \
    infra/terraform/environments/prod; do
    run_terraform fmt -check "${terraform_directory}" >/dev/null || formatting_failed=1
  done

  if ((formatting_failed == 0)); then
    ready "Terraform files are formatted"
  else
    failed "Terraform formatting validation failed"
  fi

  local environment
  for environment in dev prod; do
    local terraform_environment="infra/terraform/environments/${environment}"
    local initialized=true
    if [[ ! -d "${terraform_environment}/.terraform/providers" ]]; then
      run_terraform -chdir="${terraform_environment}" init -backend=false -input=false >/dev/null 2>&1 || initialized=false
    fi

    if [[ "${initialized}" == true ]] && run_terraform -chdir="${terraform_environment}" validate >/dev/null; then
      ready "Terraform ${environment} environment initializes and validates without a backend"
    else
      failed "Terraform ${environment} environment did not initialize and validate"
    fi
  done
}

validate_https_input() {
  local name="$1"
  local description="$2"
  local value="${!name:-}"

  if [[ -z "${value}" ]]; then
    external "${name}: ${description}"
  elif [[ ! "${value}" =~ ^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?/?$ ]]; then
    failed "${name} must be an HTTPS origin without a path, query, or fragment"
  else
    ready "${name} is present and uses HTTPS"
  fi
}

require_external_value() {
  local name="$1"
  local description="$2"
  if [[ -n "${!name:-}" ]]; then
    ready "${name} is present (value redacted)"
  else
    external "${name}: ${description}"
  fi
}

validate_external_inputs() {
  validate_https_input TF_VAR_application_url "set the final protected application origin for Terraform"
  validate_https_input BASE_URL "set the deployed protected application origin for smoke validation"

  if [[ -n "${TF_VAR_application_url:-}" && -n "${BASE_URL:-}" &&
    "${TF_VAR_application_url%/}" != "${BASE_URL%/}" ]]; then
    failed "TF_VAR_application_url and BASE_URL must identify the same origin"
  fi

  require_external_value ACCESS_TOKEN "provide a current Cognito access token only in the operator shell"
  require_external_value SMOKE_JOB_ID "provide an authorized persisted pilot job identifier"
  require_external_value SMOKE_OTHER_TENANT_JOB_ID "provide a known persisted job identifier owned by another pilot tenant"
  require_external_value SMOKE_DAY_PLAN_ID "provide an authorized persisted pilot day-plan identifier"
  require_external_value SMOKE_ACCOUNT_ID "provide an authorized persisted pilot account identifier"
  require_external_value SMOKE_PROPERTY_ID "provide an authorized persisted pilot property identifier"
  if [[ -z "${OWNER_EMAIL:-}" ]]; then
    external "OWNER_EMAIL: provide the approved first-owner email only in the operator shell"
  elif [[ "${OWNER_EMAIL}" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
    ready "OWNER_EMAIL is present and structurally valid (value redacted)"
  else
    failed "OWNER_EMAIL must be a structurally valid email address"
  fi

  if [[ "${RENDER_ACCESS_CONFIRMED:-}" == "1" ]]; then
    ready "Render owning-account access is confirmed"
  else
    external "RENDER_ACCESS_CONFIRMED=1: confirm owning-account Blueprint and rollback access"
  fi

  if [[ "${TERRAFORM_STATE_CONFIRMED:-}" == "1" ]]; then
    ready "production Terraform state ownership is confirmed"
  else
    external "TERRAFORM_STATE_CONFIRMED=1: confirm the production backend/state owner and recovery decision"
  fi

  if ! command -v aws >/dev/null 2>&1; then
    external "AWS CLI and an authenticated production account session are required"
  elif aws sts get-caller-identity >/dev/null 2>&1; then
    ready "AWS production account session is authenticated (identity redacted)"
  else
    external "AWS CLI is present but no usable production account session was detected"
  fi
}

printf 'Grover Landscaping protected-release preflight\n\n'
if [[ "${external_only}" == false ]]; then
  require_files
  validate_render_blueprint
  validate_production_guards
  validate_smoke_contract
  validate_terraform
fi

if [[ "${repository_only}" == false ]]; then
  validate_external_inputs
fi

printf '\nFailed checks: %d\n' "${failed_checks}"
if [[ "${repository_only}" == true ]]; then
  echo 'External prerequisites: skipped'
else
  printf 'External prerequisites: %d\n' "${external_prerequisites}"
fi

if ((failed_checks)); then
  echo 'PREFLIGHT RESULT: FAILED'
  exit 1
fi
if ((external_prerequisites)); then
  echo 'PREFLIGHT RESULT: EXTERNAL PREREQUISITE'
  exit 2
fi

echo 'PREFLIGHT RESULT: READY'
