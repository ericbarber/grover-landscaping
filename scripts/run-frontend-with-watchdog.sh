#!/usr/bin/env bash
set -u

npm install
npm run dev &
app_pid=$!

cleanup() {
  kill "${app_pid}" 2>/dev/null || true
  wait "${app_pid}" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

started=0
for _ in $(seq 1 24); do
  if ! kill -0 "${app_pid}" 2>/dev/null; then
    wait "${app_pid}"
    exit $?
  fi
  if node -e "
    fetch('http://127.0.0.1:5173/', { signal: AbortSignal.timeout(5000) })
      .then((response) => {
        if (!response.ok) process.exit(1);
      })
      .catch(() => process.exit(1));
  "; then
    started=1
    break
  fi
  sleep 5
done
if (( started == 0 )); then
  echo "Frontend did not become ready within 120 seconds; restarting container." >&2
  kill "${app_pid}" 2>/dev/null || true
  wait "${app_pid}" 2>/dev/null || true
  exit 1
fi

failures=0
while kill -0 "${app_pid}" 2>/dev/null; do
  sleep 15
  if node -e "
    fetch('http://127.0.0.1:5173/', { signal: AbortSignal.timeout(5000) })
      .then((response) => {
        if (!response.ok) process.exit(1);
      })
      .catch(() => process.exit(1));
  "; then
    failures=0
  else
    failures=$((failures + 1))
    if (( failures >= 3 )); then
      echo "Frontend readiness failed three consecutive checks; restarting container." >&2
      kill "${app_pid}" 2>/dev/null || true
      wait "${app_pid}" 2>/dev/null || true
      exit 1
    fi
  fi
done

wait "${app_pid}"
