#!/usr/bin/env bash
set -euo pipefail

BACKEND_SERVICE=${BACKEND_SERVICE:-backend}

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run local migrations" >&2
  exit 1
fi

if [[ -z "$(docker compose ps --status running -q "${BACKEND_SERVICE}")" ]]; then
  echo "the ${BACKEND_SERVICE} Compose service must be running" >&2
  exit 1
fi

docker compose exec -T "${BACKEND_SERVICE}" cargo run --quiet --bin migrate
