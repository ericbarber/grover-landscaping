#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
study_api_url="${YARDFOLIO_STUDY_API_URL:-}"
frontend_port=5174
check_only=false

case "${1:-}" in
  '') ;;
  --check) check_only=true ;;
  *)
    echo "Usage: YARDFOLIO_STUDY_API_URL=http://127.0.0.1:8081 $0 [--check]" >&2
    exit 2
    ;;
esac

if [[ -z "${study_api_url}" ]]; then
  echo "YARDFOLIO_STUDY_API_URL is required and must identify the isolated port-8081 API." >&2
  exit 1
fi

run_node() {
  if command -v node >/dev/null 2>&1; then
    (cd "${repository_root}" && node "$@")
    return
  fi
  if ! command -v docker >/dev/null 2>&1; then
    echo "Study review requires Node.js or Docker." >&2
    return 1
  fi
  docker run --rm --network host \
    --user "$(id -u):$(id -g)" \
    --env HOME=/tmp \
    --env YARDFOLIO_STUDY_API_URL="${study_api_url}" \
    --volume "${repository_root}:/workspace" \
    --workdir /workspace \
    node:22 node "$@"
}

run_node yardfolio-study/fixtures/validate-study-runtime.mjs

if [[ "${check_only}" == true ]]; then
  echo "Study frontend preflight passed; port ${frontend_port} was not started."
  exit 0
fi

if command -v curl >/dev/null 2>&1 \
  && curl --fail --silent --max-time 2 "http://127.0.0.1:${frontend_port}/" >/dev/null 2>&1; then
  echo "Port ${frontend_port} already serves HTTP; stop that process before starting study review." >&2
  exit 1
fi

echo "Starting the isolated study frontend."
echo "App URL: http://127.0.0.1:${frontend_port}/app"
echo "API URL: ${study_api_url}"
echo "Browser API: http://127.0.0.1:${frontend_port}/study-api"
echo "Use the LOCAL REVIEW ONLY selector for the assigned study identity."

if command -v npm >/dev/null 2>&1; then
  cd "${repository_root}/frontend"
  exec env VITE_API_BASE_URL="http://127.0.0.1:${frontend_port}/study-api" \
    YARDFOLIO_STUDY_PROXY_TARGET="${study_api_url}" \
    npm run dev -- --host 0.0.0.0 --port "${frontend_port}" --strictPort
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Study review requires npm or Docker." >&2
  exit 1
fi

exec docker run --rm --init \
  --name yardfolio-study-frontend \
  --user "$(id -u):$(id -g)" \
  --add-host host.docker.internal:host-gateway \
  --env HOME=/tmp \
  --env NPM_CONFIG_CACHE=/tmp/npm-cache \
  --env VITE_API_BASE_URL="http://127.0.0.1:${frontend_port}/study-api" \
  --env YARDFOLIO_STUDY_PROXY_TARGET=http://host.docker.internal:8081 \
  --publish "${frontend_port}:${frontend_port}" \
  --volume "${repository_root}:/workspace" \
  --workdir /workspace/frontend \
  node:22 npm run dev -- --host 0.0.0.0 --port "${frontend_port}" --strictPort
