#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
validator="${repository_root}/scripts/validate-changes.sh"

assert_contains() {
  local output="$1"
  local expected="$2"
  [[ "${output}" == *"${expected}"* ]] || {
    echo "Expected validator output to contain: ${expected}" >&2
    echo "${output}" >&2
    exit 1
  }
}

assert_not_contains() {
  local output="$1"
  local unexpected="$2"
  [[ "${output}" != *"${unexpected}"* ]] || {
    echo "Expected validator output not to contain: ${unexpected}" >&2
    echo "${output}" >&2
    exit 1
  }
}

docs_output="$(bash "${validator}" --dry-run -- project-planning/ROADMAP.md)"
assert_contains "${docs_output}" "Selected validation scopes: docs"
assert_not_contains "${docs_output}" "npm run typecheck"

frontend_output="$(bash "${validator}" --dry-run -- frontend/src/App.tsx)"
assert_contains "${frontend_output}" "Selected validation scopes: frontend"
assert_contains "${frontend_output}" "npm run typecheck"
assert_not_contains "${frontend_output}" "cargo clippy"

browser_output="$(bash "${validator}" --dry-run -- frontend/e2e/browser-accessibility.spec.ts)"
assert_contains "${browser_output}" "Selected validation scopes: frontend browser"
assert_contains "${browser_output}" "npm run test:e2e:cross-browser"

migration_output="$(bash "${validator}" --dry-run -- backend/migrations/0122_test.sql)"
assert_contains "${migration_output}" "Selected validation scopes: backend database"
assert_contains "${migration_output}" "cargo clippy"
assert_contains "${migration_output}" "apply-local-migrations.sh"

workflow_output="$(bash "${validator}" --dry-run -- .github/workflows/ci.yml)"
assert_contains "${workflow_output}" "Selected validation scopes: repository"
assert_contains "${workflow_output}" "docker compose config --quiet"

full_output="$(bash "${validator}" --scope full --dry-run)"
assert_contains "${full_output}" "Selected validation scopes: repository docs frontend backend database infra browser"

echo "Change-aware validation selection tests passed."
