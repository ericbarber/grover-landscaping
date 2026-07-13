#!/usr/bin/env bash
set -euo pipefail

: "${NOTIFICATION_DISPATCH_MODE:?Set NOTIFICATION_DISPATCH_MODE=webhook to validate provider configuration}"
: "${PUBLIC_APP_URL:?Set PUBLIC_APP_URL to the deployed HTTPS application URL}"
: "${NOTIFICATION_WEBHOOK_URL:?Set NOTIFICATION_WEBHOOK_URL to the provider gateway HTTPS delivery URL}"

if [[ "${NOTIFICATION_DISPATCH_MODE}" != "webhook" ]]; then
  echo "Expected NOTIFICATION_DISPATCH_MODE=webhook, got ${NOTIFICATION_DISPATCH_MODE}" >&2
  exit 1
fi

if [[ "${PUBLIC_APP_URL}" != https://* ]]; then
  echo "PUBLIC_APP_URL must use HTTPS for production notification delivery" >&2
  exit 1
fi

if [[ "${NOTIFICATION_WEBHOOK_URL}" != https://* ]]; then
  echo "NOTIFICATION_WEBHOOK_URL must use HTTPS for production notification delivery" >&2
  exit 1
fi

for name in NOTIFICATION_POLL_SECONDS NOTIFICATION_BATCH_SIZE NOTIFICATION_MAX_ATTEMPTS; do
  value=${!name:-}
  if [[ -z "${value}" ]]; then
    continue
  fi
  if ! [[ "${value}" =~ ^[1-9][0-9]*$ ]]; then
    echo "${name} must be a positive integer when set" >&2
    exit 1
  fi
done

if [[ "${VALIDATE_NOTIFICATION_WEBHOOK_DELIVERY:-0}" != "1" ]]; then
  echo "Notification webhook configuration is valid. Set VALIDATE_NOTIFICATION_WEBHOOK_DELIVERY=1 to send a provider test request."
  exit 0
fi

: "${NOTIFICATION_WEBHOOK_SMOKE_RECIPIENT:?Set NOTIFICATION_WEBHOOK_SMOKE_RECIPIENT before sending a provider test request}"

channel=${NOTIFICATION_WEBHOOK_SMOKE_CHANNEL:-email}
case "${channel}" in
  email)
    if [[ "${NOTIFICATION_WEBHOOK_SMOKE_RECIPIENT}" != *@* ]] || [[ "${NOTIFICATION_WEBHOOK_SMOKE_RECIPIENT}" =~ [[:space:]\"] ]]; then
      echo "NOTIFICATION_WEBHOOK_SMOKE_RECIPIENT must be an email address without spaces or quotes" >&2
      exit 1
    fi
    ;;
  sms)
    if ! [[ "${NOTIFICATION_WEBHOOK_SMOKE_RECIPIENT}" =~ ^\+[0-9]{7,15}$ ]]; then
      echo "SMS smoke recipients must use E.164 format, such as +16025550123" >&2
      exit 1
    fi
    ;;
  *)
    echo "NOTIFICATION_WEBHOOK_SMOKE_CHANNEL must be email or sms" >&2
    exit 1
    ;;
esac

share_url="${PUBLIC_APP_URL%/}/bid-review/smoke-validation"
body=$(cat <<JSON
{
  "notification_id": "notification_smoke_validation",
  "channel": "${channel}",
  "recipient": "${NOTIFICATION_WEBHOOK_SMOKE_RECIPIENT}",
  "template_key": "project_bid_review",
  "payload": {
    "bid_id": "bid_smoke_validation",
    "share_url": "${share_url}"
  }
}
JSON
)

curl_args=(
  --fail
  --silent
  --show-error
  --header
  "content-type: application/json"
  --request
  POST
  --data
  "${body}"
)

if [[ -n "${NOTIFICATION_WEBHOOK_BEARER_TOKEN:-}" ]]; then
  curl_args+=(--header "Authorization: Bearer ${NOTIFICATION_WEBHOOK_BEARER_TOKEN}")
fi

curl "${curl_args[@]}" "${NOTIFICATION_WEBHOOK_URL}" >/dev/null
echo "Notification webhook provider test request succeeded."
