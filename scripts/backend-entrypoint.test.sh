#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

assert_contains() {
  local file="$1"
  local expected="$2"
  if ! grep -Fq -- "${expected}" "${file}"; then
    echo "Expected ${file} to contain: ${expected}" >&2
    exit 1
  fi
}

assert_contains "${repository_root}/backend/Cargo.toml" \
  'default-run = "yardfolio-api"'
assert_contains "${repository_root}/scripts/run-backend-with-watchdog.sh" \
  'cargo run --bin yardfolio-api &'
assert_contains "${repository_root}/scripts/mobile-review.sh" \
  'cargo run --bin yardfolio-api'
assert_contains "${repository_root}/docs/authentication.md" \
  'cargo run --manifest-path backend/Cargo.toml --bin yardfolio-api'

echo "Backend entrypoint contract tests passed."
