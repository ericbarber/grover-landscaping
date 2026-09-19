#!/usr/bin/env bash
set -euo pipefail

: "${BASE_URL:?Set BASE_URL to the deployed application URL}"
: "${ACCESS_TOKEN:?Set ACCESS_TOKEN to a current Cognito access token}"
: "${SMOKE_JOB_ID:?Set SMOKE_JOB_ID to an authorized persisted pilot job}"
: "${SMOKE_DAY_PLAN_ID:?Set SMOKE_DAY_PLAN_ID to an authorized persisted pilot day plan}"
: "${SMOKE_ACCOUNT_ID:?Set SMOKE_ACCOUNT_ID to an authorized persisted pilot account}"
: "${SMOKE_PROPERTY_ID:?Set SMOKE_PROPERTY_ID to an authorized persisted pilot property}"

base_url=${BASE_URL%/}
job_id=${SMOKE_JOB_ID}
day_plan_id=${SMOKE_DAY_PLAN_ID}
account_id=${SMOKE_ACCOUNT_ID}
property_id=${SMOKE_PROPERTY_ID}
connect_timeout=${SMOKE_CONNECT_TIMEOUT_SECONDS:-10}
request_timeout=${SMOKE_REQUEST_TIMEOUT_SECONDS:-30}
curl_bin=${SMOKE_CURL_BIN:-curl}

fail() {
  echo "Production smoke failed: $1" >&2
  exit 1
}

if [[ ! "${base_url}" =~ ^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?$ ]]; then
  fail "BASE_URL must be an HTTPS origin without a path, query, or fragment"
fi

for name in SMOKE_JOB_ID SMOKE_DAY_PLAN_ID SMOKE_ACCOUNT_ID SMOKE_PROPERTY_ID; do
  value=${!name}
  if [[ ! "${value}" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$ ]]; then
    fail "${name} must be a safe non-empty path identifier"
  fi
done

for timeout in "${connect_timeout}" "${request_timeout}"; do
  if [[ ! "${timeout}" =~ ^[1-9][0-9]{0,2}$ ]] || ((timeout > 300)); then
    fail "smoke timeouts must be whole seconds between 1 and 300"
  fi
done

auth_header=("--header" "Authorization: Bearer ${ACCESS_TOKEN}")
curl_transport=(
  --silent
  --show-error
  --connect-timeout "${connect_timeout}"
  --max-time "${request_timeout}"
)
curl_checked=(--fail "${curl_transport[@]}")

authenticated_get() {
  local path=$1
  "${curl_bin}" \
    "${curl_checked[@]}" \
    "${auth_header[@]}" \
    "${base_url}${path}"
}

authenticated_json_post() {
  local path=$1
  local body=$2
  "${curl_bin}" \
    "${curl_checked[@]}" \
    "${auth_header[@]}" \
    --header "content-type: application/json" \
    --request POST \
    --data "${body}" \
    "${base_url}${path}"
}

readiness=$("${curl_bin}" "${curl_checked[@]}" "${base_url}/health/ready")
case "${readiness}" in
  *'"status":"ok"'*'"persistence":"postgres"'*) ;;
  *) fail "readiness did not report PostgreSQL-backed status" ;;
esac

auth_config=$("${curl_bin}" "${curl_checked[@]}" "${base_url}/auth/config")
case "${auth_config}" in
  *'"mode":"cognito"'*) ;;
  *) fail "runtime authentication did not report Cognito mode" ;;
esac

unauthorized_status=$("${curl_bin}" "${curl_transport[@]}" --output /dev/null --write-out '%{http_code}' "${base_url}/jobs")
if [[ "${unauthorized_status}" != "401" ]]; then
  fail "unauthenticated /jobs did not return 401"
fi

access_summary=$(authenticated_get "/me/access")
case "${access_summary}" in
  *'"memberships"'*) ;;
  *) fail "authenticated access summary did not contain memberships" ;;
esac

jobs=$(authenticated_get "/jobs")
case "${jobs}" in
  *'"id"'*) ;;
  *) fail "authenticated /jobs did not return a persisted job" ;;
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
  *) fail "photo upload ticket omitted required upload fields" ;;
esac
photo_id=$(printf '%s' "${photo_ticket}" | sed -n 's/.*"photo_id":"\([^"]*\)".*/\1/p')
if [[ -z "${photo_id}" ]]; then
  fail "photo upload ticket omitted its persisted photo identifier"
fi

photo_complete=$(authenticated_json_post \
  "/jobs/${job_id}/photos/complete" \
  "{\"photo_id\":\"${photo_id}\",\"file_size_bytes\":4096,\"image_width_px\":1600,\"image_height_px\":900}")
case "${photo_complete}" in
  *'"status":"accepted"'*) ;;
  *) fail "photo completion was not accepted" ;;
esac

photos=$(authenticated_get "/jobs/${job_id}/photos")
case "${photos}" in
  *'"id":"'"${photo_id}"'"'*) ;;
  *) fail "completed photo was not readable from the persisted job" ;;
esac
photo_processing_history=$(authenticated_get "/photo-processing-jobs?task_type=thumbnail_generation&limit=10")
case "${photo_processing_history}" in
  \[*\]) ;;
  *) fail "photo processing history did not return a JSON collection" ;;
esac

"${curl_bin}" \
  "${curl_checked[@]}" \
  "${base_url}/" \
  >/dev/null

echo "Production smoke checks passed for ${base_url}."
