#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${repository_root}"

dry_run=false
base_ref=""
requested_scopes=()
requested_paths=()

usage() {
  sed -n '2,36p' "${BASH_SOURCE[0]}" | sed -n 's/^# //p'
}

# Validate the current working changes with the smallest useful package gates.
#
# Usage:
#   bash scripts/validate-changes.sh
#   bash scripts/validate-changes.sh --scope frontend
#   bash scripts/validate-changes.sh --scope backend --scope database
#   bash scripts/validate-changes.sh --base origin/main --dry-run
#   bash scripts/validate-changes.sh --dry-run -- path/to/file another/file
#
# Options:
#   --scope NAME  Select docs, repository, frontend, backend, database, infra,
#                 browser, or full. May be repeated.
#   --base REF    Classify committed changes in REF...HEAD instead of the
#                 working tree.
#   --dry-run     Print selected scopes and commands without running them.
#   --help        Show this help.

while (($#)); do
  case "$1" in
    --scope)
      [[ $# -ge 2 ]] || { echo "--scope requires a value" >&2; exit 2; }
      requested_scopes+=("$2")
      shift 2
      ;;
    --base)
      [[ $# -ge 2 ]] || { echo "--base requires a Git reference" >&2; exit 2; }
      base_ref="$2"
      shift 2
      ;;
    --dry-run)
      dry_run=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    --)
      shift
      requested_paths+=("$@")
      break
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

declare -A selected=()
changed_paths=()

select_scope() {
  case "$1" in
    docs|repository|frontend|backend|database|infra|browser)
      selected["$1"]=1
      ;;
    full)
      for scope in repository docs frontend backend database infra browser; do
        selected["${scope}"]=1
      done
      ;;
    *)
      echo "Unknown validation scope: $1" >&2
      exit 2
      ;;
  esac
}

classify_path() {
  local path="$1"

  case "${path}" in
    frontend/e2e/*)
      select_scope frontend
      select_scope browser
      ;;
    frontend/*)
      select_scope frontend
      ;;
    backend/migrations/*)
      select_scope backend
      select_scope database
      ;;
    backend/*)
      select_scope backend
      ;;
    infra/*|render.yaml|Dockerfile|.dockerignore)
      select_scope infra
      ;;
    *.md|docs/*|project-planning/*|features/*|design/*)
      select_scope docs
      ;;
    .github/workflows/*|scripts/*|docker-compose.yml|.gitignore)
      select_scope repository
      ;;
    *)
      select_scope repository
      ;;
  esac
}

if ((${#requested_scopes[@]})); then
  for scope in "${requested_scopes[@]}"; do
    select_scope "${scope}"
  done
elif ((${#requested_paths[@]})); then
  changed_paths=("${requested_paths[@]}")
else
  if [[ -n "${base_ref}" ]]; then
    git rev-parse --verify "${base_ref}^{commit}" >/dev/null
    mapfile -t changed_paths < <(git diff --name-only "${base_ref}...HEAD" --)
  else
    mapfile -t changed_paths < <(
      {
        git diff --name-only HEAD --
        git ls-files --others --exclude-standard
      } | sort -u
    )
  fi

fi

if ((${#requested_scopes[@]} == 0)); then
  for path in "${changed_paths[@]}"; do
    classify_path "${path}"
  done
fi

scope_order=(repository docs frontend backend database infra browser)
ordered_scopes=()
for scope in "${scope_order[@]}"; do
  [[ -n "${selected[${scope}]:-}" ]] && ordered_scopes+=("${scope}")
done

if ((${#ordered_scopes[@]} == 0)); then
  echo "No changed files or explicit validation scopes were selected."
  exit 0
fi

echo "Selected validation scopes: ${ordered_scopes[*]}"

run_command() {
  echo "+ $*"
  "$@"
}

compose_service_is_running() {
  local expected="$1"
  local service

  while IFS= read -r service; do
    [[ "${service}" == "${expected}" ]] && return 0
  done < <(docker compose ps --status running --services 2>/dev/null)

  return 1
}

frontend_command() {
  if command -v npm >/dev/null 2>&1; then
    (cd frontend && run_command npm "$@")
  elif compose_service_is_running frontend; then
    run_command docker compose exec -T frontend npm "$@"
  else
    echo "Frontend validation requires npm or the running Compose frontend service." >&2
    return 1
  fi
}

backend_command() {
  if command -v cargo >/dev/null 2>&1; then
    (cd backend && run_command cargo "$@")
  elif compose_service_is_running backend; then
    run_command docker compose exec -T backend cargo "$@"
  else
    echo "Backend validation requires cargo or the running Compose backend service." >&2
    return 1
  fi
}

node_command() {
  if command -v node >/dev/null 2>&1; then
    run_command node "$@"
  elif compose_service_is_running frontend; then
    run_command docker compose exec -T -w /workspace frontend node "$@"
  else
    echo "Repository evidence validation requires Node.js or the running Compose frontend service." >&2
    return 1
  fi
}

validate_markdown_links() {
  local files=()
  local file target resolved

  if ((${#changed_paths[@]})); then
    for file in "${changed_paths[@]}"; do
      [[ "${file}" == *.md && -f "${file}" ]] && files+=("${file}")
    done
  fi

  if ((${#files[@]} == 0)); then
    files=(PLAN.md project-planning/DELIVERY_BOARD.md project-planning/CURRENT_HANDOFF.md)
  fi

  for file in "${files[@]}"; do
    while IFS= read -r target; do
      case "${target}" in
        http:*|https:*|mailto:*|'') continue ;;
      esac
      target="${target%%#*}"
      [[ -z "${target}" ]] && continue
      resolved="$(dirname "${file}")/${target}"
      if [[ ! -e "${resolved}" ]]; then
        echo "Broken link: ${file} -> ${target}" >&2
        return 1
      fi
    done < <(perl -ne 'while (/\[[^]]*\]\(([^)]+)\)/g) { print "$1\n" }' "${file}")
  done
}

print_scope_commands() {
  case "$1" in
    repository) echo "  git diff --check; bash -n scripts/*.sh; shell and release-evidence contract tests; docker compose config --quiet" ;;
    docs) echo "  validate changed Markdown links and delivery records" ;;
    frontend) echo "  npm run typecheck; npm test; npm run build" ;;
    backend) echo "  cargo fmt --all -- --check; cargo clippy --all-targets --all-features -- -D warnings; cargo test --all" ;;
    database) echo "  bash scripts/apply-local-migrations.sh" ;;
    infra) echo "  terraform fmt -check -recursive and validate dev/prod modules" ;;
    browser) echo "  npm run test:e2e:cross-browser" ;;
  esac
}

if [[ "${dry_run}" == true ]]; then
  for scope in "${ordered_scopes[@]}"; do
    print_scope_commands "${scope}"
  done
  exit 0
fi

for scope in "${ordered_scopes[@]}"; do
  case "${scope}" in
    repository)
      run_command git diff --check
      for script in scripts/*.sh; do run_command bash -n "${script}"; done
      run_command bash scripts/validate-changes.test.sh
      run_command bash scripts/release-preflight.test.sh
      run_command bash scripts/smoke-production.test.sh
      node_command --test scripts/validate-protected-release-evidence.test.mjs
      run_command docker compose config --quiet
      ;;
    docs)
      run_command git diff --check
      validate_markdown_links
      ;;
    frontend)
      frontend_command run typecheck
      frontend_command test
      frontend_command run build
      ;;
    backend)
      backend_command fmt --all -- --check
      backend_command clippy --all-targets --all-features -- -D warnings
      backend_command test --all
      ;;
    database)
      run_command bash scripts/apply-local-migrations.sh
      ;;
    infra)
      if ! command -v terraform >/dev/null 2>&1; then
        echo "Infrastructure validation requires terraform on PATH." >&2
        exit 1
      fi
      run_command terraform fmt -check -recursive infra/terraform
      run_command terraform -chdir=infra/terraform/environments/dev init -backend=false
      run_command terraform -chdir=infra/terraform/environments/dev validate
      run_command terraform -chdir=infra/terraform/environments/prod init -backend=false
      run_command terraform -chdir=infra/terraform/environments/prod validate
      ;;
    browser)
      frontend_command run test:e2e:cross-browser
      ;;
  esac
done

echo "Selected validation scopes passed."
