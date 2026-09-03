#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
preflight="${repository_root}/scripts/release-preflight.sh"

repository_output="$(bash "${preflight}" --repository-only)"
[[ "${repository_output}" == *'PREFLIGHT RESULT: READY'* ]]
[[ "${repository_output}" == *'Failed checks: 0'* ]]

set +e
external_output="$(
  TF_VAR_application_url=https://pilot.example.com \
  BASE_URL=https://pilot.example.com \
  ACCESS_TOKEN=do-not-print-access-token \
  SMOKE_JOB_ID=job_smoke \
  SMOKE_OTHER_TENANT_JOB_ID=job_other_tenant \
  SMOKE_DAY_PLAN_ID=day_plan_smoke \
  SMOKE_ACCOUNT_ID=account_smoke \
  SMOKE_PROPERTY_ID=property_smoke \
  OWNER_EMAIL=do-not-print-owner-email@example.com \
  RENDER_ACCESS_CONFIRMED=1 \
  TERRAFORM_STATE_CONFIRMED=1 \
  bash "${preflight}" --external-only 2>&1
)"
external_status=$?
set -e

if command -v aws >/dev/null 2>&1 && aws sts get-caller-identity >/dev/null 2>&1; then
  [[ "${external_status}" -eq 0 ]]
  [[ "${external_output}" == *'PREFLIGHT RESULT: READY'* ]]
else
  [[ "${external_status}" -eq 2 ]]
  [[ "${external_output}" == *'PREFLIGHT RESULT: EXTERNAL PREREQUISITE'* ]]
fi

[[ "${external_output}" != *'do-not-print-access-token'* ]]
[[ "${external_output}" != *'do-not-print-owner-email@example.com'* ]]

set +e
invalid_output="$(
  TF_VAR_application_url=http://pilot.example.com \
  BASE_URL=https://different.example.com \
  bash "${preflight}" --external-only 2>&1
)"
invalid_status=$?
set -e

[[ "${invalid_status}" -eq 1 ]]
[[ "${invalid_output}" == *'[FAILED] TF_VAR_application_url must be an HTTPS origin'* ]]
[[ "${invalid_output}" == *'PREFLIGHT RESULT: FAILED'* ]]

echo 'Release preflight contract tests passed.'
