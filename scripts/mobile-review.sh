#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tailscale_ip="${MOBILE_REVIEW_HOST:-}"

if [[ -z "$tailscale_ip" ]] && command -v tailscale >/dev/null 2>&1; then
  tailscale_ip="$(tailscale ip -4 2>/dev/null | head -n 1)"
fi

if [[ -z "$tailscale_ip" ]]; then
  echo "Could not detect a Tailscale IPv4 address."
  echo "Set MOBILE_REVIEW_HOST to the workstation IP that your phone can reach."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1 && [[ -d "$HOME/.nvm/versions/node" ]]; then
  node_bin="$(find "$HOME/.nvm/versions/node" -mindepth 2 -maxdepth 2 -type d -name bin | sort -V | tail -n 1)"
  if [[ -n "$node_bin" ]]; then
    export PATH="$node_bin:$PATH"
  fi
fi

for command_name in cargo npm; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command is unavailable: $command_name"
    exit 1
  fi
done

frontend_url="http://${tailscale_ip}:5173"
api_url="http://${tailscale_ip}:8080"
backend_pid=""
frontend_pid=""

cleanup() {
  trap - EXIT INT TERM
  [[ -z "$frontend_pid" ]] || kill "$frontend_pid" 2>/dev/null || true
  [[ -z "$backend_pid" ]] || kill "$backend_pid" 2>/dev/null || true
  wait "$frontend_pid" "$backend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting Grover Landscaping mobile review..."
echo "Phone URL: ${frontend_url}/"
echo "API URL:   ${api_url}/health"
echo "The phone must be connected to the same Tailscale network."
echo

(
  cd "$repo_root/backend"
  APP_ENV=local \
    AUTH_MODE=disabled \
    CORS_ALLOWED_ORIGIN="$frontend_url" \
    PUBLIC_APP_URL="$frontend_url" \
    PORT=8080 \
    cargo run
) &
backend_pid=$!

(
  cd "$repo_root/frontend"
  VITE_API_BASE_URL="$api_url" npm run dev -- --host 0.0.0.0
) &
frontend_pid=$!

wait -n "$backend_pid" "$frontend_pid"
echo "A mobile-review service stopped unexpectedly."
exit 1
