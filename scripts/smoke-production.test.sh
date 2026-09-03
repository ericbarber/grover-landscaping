#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
smoke="${repository_root}/scripts/smoke-production.sh"
fake_curl="${repository_root}/scripts/test-fixtures/fake-smoke-curl.sh"
test_dir="$(mktemp -d /tmp/grover-smoke-production-test.XXXXXX)"
trap 'rm -rf -- "${test_dir}"' EXIT

common_environment=(
  BASE_URL=https://pilot.example.test
  ACCESS_TOKEN=do-not-print-access-token
  SMOKE_JOB_ID=job_smoke
  SMOKE_OTHER_TENANT_JOB_ID=job_other_tenant
  SMOKE_DAY_PLAN_ID=day_plan_smoke
  SMOKE_ACCOUNT_ID=account_smoke
  SMOKE_PROPERTY_ID=property_smoke
  SMOKE_CURL_BIN="${fake_curl}"
  SMOKE_FAKE_CURL_LOG="${test_dir}/curl.log"
)

success_output=$(env "${common_environment[@]}" bash "${smoke}")
[[ "${success_output}" == 'Production smoke checks passed for https://pilot.example.test.' ]]
[[ "${success_output}" != *'do-not-print-access-token'* ]]
[[ "${success_output}" != *'do-not-print-object-key'* ]]
[[ -s "${test_dir}/curl.log" ]]
[[ "$(sort -u "${test_dir}/curl.log")" == 'connect=10 max=30' ]]

set +e
unsafe_url_output=$(env "${common_environment[@]}" BASE_URL=http://pilot.example.test bash "${smoke}" 2>&1)
unsafe_url_status=$?
set -e
[[ "${unsafe_url_status}" -eq 1 ]]
[[ "${unsafe_url_output}" == *'BASE_URL must be an HTTPS origin'* ]]
[[ "${unsafe_url_output}" != *'do-not-print-access-token'* ]]

set +e
unsafe_origin_output=$(env "${common_environment[@]}" BASE_URL='https://pilot.example.test?private=query' bash "${smoke}" 2>&1)
unsafe_origin_status=$?
set -e
[[ "${unsafe_origin_status}" -eq 1 ]]
[[ "${unsafe_origin_output}" == *'BASE_URL must be an HTTPS origin'* ]]
[[ "${unsafe_origin_output}" != *'private=query'* ]]

set +e
unsafe_id_output=$(env "${common_environment[@]}" SMOKE_JOB_ID='../another-tenant' bash "${smoke}" 2>&1)
unsafe_id_status=$?
set -e
[[ "${unsafe_id_status}" -eq 1 ]]
[[ "${unsafe_id_output}" == *'SMOKE_JOB_ID must be a safe non-empty path identifier'* ]]

set +e
same_job_output=$(env "${common_environment[@]}" SMOKE_OTHER_TENANT_JOB_ID=job_smoke bash "${smoke}" 2>&1)
same_job_status=$?
set -e
[[ "${same_job_status}" -eq 1 ]]
[[ "${same_job_output}" == *'SMOKE_OTHER_TENANT_JOB_ID must identify a different tenant job'* ]]

set +e
cross_tenant_output=$(env "${common_environment[@]}" SMOKE_FAKE_SCENARIO=cross-tenant-allowed bash "${smoke}" 2>&1)
cross_tenant_status=$?
set -e
[[ "${cross_tenant_status}" -eq 1 ]]
[[ "${cross_tenant_output}" == *'cross-tenant job access did not fail closed with 403'* ]]
[[ "${cross_tenant_output}" != *'job_other_tenant'* ]]
[[ "${cross_tenant_output}" != *'do-not-print-access-token'* ]]

set +e
readiness_output=$(env "${common_environment[@]}" SMOKE_FAKE_SCENARIO=invalid-readiness bash "${smoke}" 2>&1)
readiness_status=$?
set -e
[[ "${readiness_status}" -eq 1 ]]
[[ "${readiness_output}" == *'readiness did not report PostgreSQL-backed status'* ]]
[[ "${readiness_output}" != *'do-not-print-response-body'* ]]

set +e
readback_output=$(env "${common_environment[@]}" SMOKE_FAKE_SCENARIO=missing-photo-readback bash "${smoke}" 2>&1)
readback_status=$?
set -e
[[ "${readback_status}" -eq 1 ]]
[[ "${readback_output}" == *'completed photo was not readable from the persisted job'* ]]
[[ "${readback_output}" != *'another-private-photo'* ]]
[[ "${readback_output}" != *'do-not-print-object-key'* ]]

set +e
timeout_output=$(env "${common_environment[@]}" SMOKE_REQUEST_TIMEOUT_SECONDS=0 bash "${smoke}" 2>&1)
timeout_status=$?
set -e
[[ "${timeout_status}" -eq 1 ]]
[[ "${timeout_output}" == *'smoke timeouts must be whole seconds between 1 and 300'* ]]

echo 'Production smoke contract tests passed.'
