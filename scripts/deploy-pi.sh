#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! $1 =~ ^[a-f0-9]{40}$ ]]; then
  echo 'Usage: deploy-pi.sh <40-character lowercase Git commit SHA>' >&2
  exit 64
fi

deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${deploy_dir}"

if [[ ! -f .env ]]; then
  echo 'Missing Pi runtime .env' >&2
  exit 1
fi

if [[ $(stat -c %a .env) != 600 ]]; then
  echo 'Pi runtime .env must have mode 600' >&2
  exit 1
fi

if ! grep -Eq '^POSTGRES_PASSWORD=[a-f0-9]{64}$' .env ||
   ! grep -Eq '^PUBLIC_APP_URL=https://[a-z0-9.-]+\.ts\.net$' .env; then
  echo 'Pi runtime .env requires a 64-character hex password and HTTPS tailnet URL' >&2
  exit 1
fi

image="grover-landscaping:$1"
if [[ $(docker image inspect --format '{{.Architecture}}' "${image}") != arm64 ]]; then
  echo 'Expected a loaded ARM64 application image' >&2
  exit 1
fi

previous=''
if [[ -f .release.env ]]; then
  previous="$(sed -n 's/^GROVER_IMAGE=//p' .release.env)"
  if [[ ! ${previous} =~ ^grover-landscaping:[a-f0-9]{40}$ ]]; then
    echo 'Invalid previous release record' >&2
    exit 1
  fi
fi

write_release() {
  local next_image="$1"
  local temporary
  temporary="$(mktemp .release.env.XXXXXX)"
  chmod 600 "${temporary}"
  printf 'GROVER_IMAGE=%s\n' "${next_image}" > "${temporary}"
  mv -f -- "${temporary}" .release.env
}

compose() {
  docker compose --env-file .env --env-file .release.env -f compose.yml "$@"
}

ready() {
  local attempt
  for ((attempt = 1; attempt <= 60; attempt++)); do
    if curl --fail --silent --show-error --max-time 3 \
         -o /dev/null http://127.0.0.1:10000/health/ready 2>/dev/null &&
       curl --fail --silent --show-error --max-time 3 \
         -o /dev/null http://127.0.0.1:10000/ 2>/dev/null &&
       curl --fail --silent --show-error --max-time 3 \
         http://127.0.0.1:10000/auth/config 2>/dev/null |
           grep -Eq '"mode"[[:space:]]*:[[:space:]]*"local_review"'; then
      return 0
    fi
    sleep 2
  done
  return 1
}

write_release "${image}"
if compose up -d --no-build --remove-orphans && ready; then
  printf 'Pi development release %s is ready.\n' "$1"
  exit 0
fi

echo 'Pi deployment failed readiness; restoring the prior application image.' >&2
if [[ -n ${previous} ]]; then
  write_release "${previous}"
  if compose up -d --no-build --remove-orphans && ready; then
    echo 'Prior Pi application image is ready again.' >&2
  else
    echo 'Prior Pi application image did not pass readiness; inspect Compose logs.' >&2
  fi
else
  compose stop app || true
  rm -f -- .release.env
fi
exit 1
