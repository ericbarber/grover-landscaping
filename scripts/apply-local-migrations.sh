#!/usr/bin/env bash
set -euo pipefail

COMPOSE_PROJECT=${COMPOSE_PROJECT:-grover-landscaping}
DB_SERVICE=${DB_SERVICE:-postgres}
DB_NAME=${POSTGRES_DB:-grover_landscaping}
DB_USER=${POSTGRES_USER:-grover}
MIGRATIONS_DIR=${MIGRATIONS_DIR:-backend/migrations}

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run local migrations" >&2
  exit 1
fi

for migration in "${MIGRATIONS_DIR}"/*.sql; do
  echo "Applying ${migration}"
  docker compose exec -T "${DB_SERVICE}" psql -U "${DB_USER}" -d "${DB_NAME}" < "${migration}"
done

echo "Local migrations applied."
