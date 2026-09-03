#!/usr/bin/env bash
set -euo pipefail

url=""
authenticated=false
connect_timeout=""
request_timeout=""

while (($#)); do
  case "$1" in
    --header)
      shift
      [[ "${1:-}" == Authorization:\ Bearer\ * ]] && authenticated=true
      ;;
    --connect-timeout)
      shift
      connect_timeout=${1:-}
      ;;
    --max-time)
      shift
      request_timeout=${1:-}
      ;;
    https://*) url=$1 ;;
  esac
  shift
done

if [[ -n "${SMOKE_FAKE_CURL_LOG:-}" ]]; then
  printf 'connect=%s max=%s\n' "${connect_timeout}" "${request_timeout}" >> "${SMOKE_FAKE_CURL_LOG}"
fi

case "${url}" in
  https://pilot.example.test/health/ready)
    if [[ "${SMOKE_FAKE_SCENARIO:-}" == "invalid-readiness" ]]; then
      printf '{"private_value":"do-not-print-response-body"}'
    else
      printf '{"status":"ok","persistence":"postgres"}'
    fi
    ;;
  https://pilot.example.test/auth/config)
    printf '{"mode":"cognito"}'
    ;;
  https://pilot.example.test/me/access)
    printf '{"memberships":[{"role":"organization_owner"}]}'
    ;;
  https://pilot.example.test/jobs)
    if [[ "${authenticated}" == true ]]; then
      printf '[{"id":"job_smoke"}]'
    else
      printf '401'
    fi
    ;;
  https://pilot.example.test/jobs/job_other_tenant)
    if [[ "${authenticated}" != true ]]; then
      printf '401'
    elif [[ "${SMOKE_FAKE_SCENARIO:-}" == "cross-tenant-allowed" ]]; then
      printf '200'
    else
      printf '403'
    fi
    ;;
  https://pilot.example.test/day-plans/day_plan_smoke)
    printf '{"id":"day_plan_smoke"}'
    ;;
  https://pilot.example.test/jobs/job_smoke/report)
    printf '{"job_id":"job_smoke"}'
    ;;
  https://pilot.example.test/accounts/account_smoke/customer-property-portfolio)
    printf '[]'
    ;;
  https://pilot.example.test/accounts/account_smoke/bids)
    printf '[]'
    ;;
  https://pilot.example.test/properties/property_smoke/completion-reports)
    printf '[]'
    ;;
  https://pilot.example.test/jobs/job_smoke/photos/presign)
    printf '{"photo_id":"photo_smoke","upload_url":"https://signed.example.test/do-not-print","object_key":"do-not-print-object-key"}'
    ;;
  https://pilot.example.test/jobs/job_smoke/photos/complete)
    printf '{"status":"accepted"}'
    ;;
  https://pilot.example.test/jobs/job_smoke/photos)
    if [[ "${SMOKE_FAKE_SCENARIO:-}" == "missing-photo-readback" ]]; then
      printf '[{"id":"another-private-photo"}]'
    else
      printf '[{"id":"photo_smoke"}]'
    fi
    ;;
  'https://pilot.example.test/photo-processing-jobs?task_type=thumbnail_generation&limit=10')
    printf '[]'
    ;;
  https://pilot.example.test/)
    printf '<!doctype html><title>Grover</title>'
    ;;
  *)
    echo "Fake curl received an unexpected request target." >&2
    exit 22
    ;;
esac
