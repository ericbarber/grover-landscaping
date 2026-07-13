#!/usr/bin/env bash
set -euo pipefail

: "${BASE_URL:?Set BASE_URL to the deployed application URL}"
: "${ACCESS_TOKEN:?Set ACCESS_TOKEN to a current Cognito access token}"

base_url=${BASE_URL%/}
job_id=${SMOKE_JOB_ID:-job_1001}
day_plan_id=${SMOKE_DAY_PLAN_ID:-day_plan_2026_06_15_crew_1001}
account_id=${SMOKE_ACCOUNT_ID:-acct_1001}
property_id=${SMOKE_PROPERTY_ID:-property_1001}

auth_header=("--header" "Authorization: Bearer ${ACCESS_TOKEN}")

authenticated_get() {
  local path=$1
  curl \
    --fail \
    --silent \
    --show-error \
    "${auth_header[@]}" \
    "${base_url}${path}"
}

authenticated_json_post() {
  local path=$1
  local body=$2
  curl \
    --fail \
    --silent \
    --show-error \
    "${auth_header[@]}" \
    --header "content-type: application/json" \
    --request POST \
    --data "${body}" \
    "${base_url}${path}"
}

readiness=$(curl --fail --silent --show-error "${base_url}/health/ready")
case "${readiness}" in
  *'"status":"ok"'*'"persistence":"postgres"'*) ;;
  *)
    echo "Unexpected readiness response: ${readiness}" >&2
    exit 1
    ;;
esac

auth_config=$(curl --fail --silent --show-error "${base_url}/auth/config")
case "${auth_config}" in
  *'"mode":"cognito"'*) ;;
  *)
    echo "Unexpected auth config response: ${auth_config}" >&2
    exit 1
    ;;
esac

unauthorized_status=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "${base_url}/jobs")
if [[ "${unauthorized_status}" != "401" ]]; then
  echo "Expected unauthenticated /jobs to return 401, got ${unauthorized_status}" >&2
  exit 1
fi

access_summary=$(authenticated_get "/me/access")
case "${access_summary}" in
  *'"memberships"'*) ;;
  *)
    echo "Unexpected access summary response: ${access_summary}" >&2
    exit 1
    ;;
esac

jobs=$(authenticated_get "/jobs")
case "${jobs}" in
  *'"id"'*) ;;
  *)
    echo "Expected authenticated /jobs to return at least one job, got: ${jobs}" >&2
    exit 1
    ;;
esac

authenticated_get "/day-plans/${day_plan_id}" >/dev/null
authenticated_get "/jobs/${job_id}/report" >/dev/null
authenticated_get "/accounts/${account_id}/customer-property-portfolio" >/dev/null
authenticated_get "/accounts/${account_id}/bids" >/dev/null
authenticated_get "/properties/${property_id}/completion-reports" >/dev/null

photo_ticket=$(authenticated_json_post \
  "/jobs/${job_id}/photos/presign" \
  '{"file_name":"smoke-before.jpg","content_type":"image/jpeg","photo_type":"before"}')
case "${photo_ticket}" in
  *'"upload_url"'*'"object_key"'*) ;;
  *)
    echo "Unexpected photo upload ticket response: ${photo_ticket}" >&2
    exit 1
    ;;
esac

curl \
  --fail \
  --silent \
  --show-error \
  "${base_url}/" \
  >/dev/null

echo "Production smoke checks passed for ${base_url}."
