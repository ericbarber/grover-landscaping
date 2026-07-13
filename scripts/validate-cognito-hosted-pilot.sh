#!/usr/bin/env bash
set -euo pipefail

terraform_dir=${TERRAFORM_DIR:-infra/terraform/environments/prod}

if ! command -v terraform >/dev/null 2>&1; then
  echo "terraform is required to validate Cognito outputs" >&2
  exit 1
fi

if [[ ! -d "${terraform_dir}" ]]; then
  echo "Terraform directory not found: ${terraform_dir}" >&2
  exit 1
fi

terraform_output() {
  terraform -chdir="${terraform_dir}" output -raw "$1"
}

user_pool_id=$(terraform_output user_pool_id)
app_client_id=$(terraform_output app_client_id)
issuer_url=$(terraform_output issuer_url)
login_domain=$(terraform_output login_domain)

for name in user_pool_id app_client_id issuer_url login_domain; do
  value=${!name}
  if [[ -z "${value}" ]]; then
    echo "Terraform output ${name} is empty" >&2
    exit 1
  fi
done

if [[ "${issuer_url}" != https://cognito-idp.*.amazonaws.com/* ]]; then
  echo "issuer_url is not an AWS Cognito HTTPS issuer: ${issuer_url}" >&2
  exit 1
fi

if [[ "${issuer_url}" != *"/${user_pool_id}" ]]; then
  echo "issuer_url does not end with the user_pool_id" >&2
  exit 1
fi

if [[ "${login_domain}" != https://*.auth.*.amazoncognito.com ]]; then
  echo "login_domain is not a Cognito managed-login HTTPS domain: ${login_domain}" >&2
  exit 1
fi

if [[ -n "${BASE_URL:-}" ]]; then
  base_url=${BASE_URL%/}
  auth_config=$(curl --fail --silent --show-error "${base_url}/auth/config")
  case "${auth_config}" in
    *'"mode":"cognito"'* ) ;;
    *)
      echo "Deployed /auth/config is not in Cognito mode: ${auth_config}" >&2
      exit 1
      ;;
  esac
  for expected in "${issuer_url}" "${app_client_id}" "${login_domain}"; do
    if [[ "${auth_config}" != *"${expected}"* ]]; then
      echo "Deployed /auth/config does not contain expected value: ${expected}" >&2
      echo "Response: ${auth_config}" >&2
      exit 1
    fi
  done
fi

cat <<EOF
Cognito hosted-pilot outputs are valid.

Render environment values:
COGNITO_ISSUER_URL=${issuer_url}
COGNITO_CLIENT_ID=${app_client_id}
COGNITO_LOGIN_DOMAIN=${login_domain}

First-owner AWS CLI context:
USER_POOL_ID=${user_pool_id}
EOF
