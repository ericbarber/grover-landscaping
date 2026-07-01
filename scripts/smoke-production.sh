#!/usr/bin/env bash
set -euo pipefail

: "${BASE_URL:?Set BASE_URL to the deployed application URL}"
: "${ACCESS_TOKEN:?Set ACCESS_TOKEN to a current Cognito access token}"

base_url=${BASE_URL%/}

readiness=$(curl --fail --silent --show-error "${base_url}/health/ready")
case "${readiness}" in
  *'"status":"ok"'*'"persistence":"postgres"'*) ;;
  *)
    echo "Unexpected readiness response: ${readiness}" >&2
    exit 1
    ;;
esac

unauthorized_status=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "${base_url}/jobs")
if [[ "${unauthorized_status}" != "401" ]]; then
  echo "Expected unauthenticated /jobs to return 401, got ${unauthorized_status}" >&2
  exit 1
fi

curl \
  --fail \
  --silent \
  --show-error \
  --header "Authorization: Bearer ${ACCESS_TOKEN}" \
  "${base_url}/jobs" \
  >/dev/null

curl \
  --fail \
  --silent \
  --show-error \
  "${base_url}/" \
  >/dev/null

echo "Production smoke checks passed for ${base_url}."
