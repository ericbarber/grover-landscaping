#!/usr/bin/env bash
set -u

cargo run &
app_pid=$!

cleanup() {
  kill "${app_pid}" 2>/dev/null || true
  wait "${app_pid}" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

started=0
for _ in $(seq 1 120); do
  if ! kill -0 "${app_pid}" 2>/dev/null; then
    wait "${app_pid}"
    exit $?
  fi
  if curl --fail --silent --max-time 5 \
    http://127.0.0.1:8080/health >/dev/null; then
    started=1
    break
  fi
  sleep 5
done
if (( started == 0 )); then
  echo "Backend did not become ready within 600 seconds; restarting container." >&2
  kill "${app_pid}" 2>/dev/null || true
  wait "${app_pid}" 2>/dev/null || true
  exit 1
fi

failures=0
while kill -0 "${app_pid}" 2>/dev/null; do
  sleep 15
  if curl --fail --silent --max-time 5 \
    http://127.0.0.1:8080/health >/dev/null; then
    failures=0
  else
    failures=$((failures + 1))
    if (( failures >= 3 )); then
      echo "Backend readiness failed three consecutive checks; restarting container." >&2
      kill "${app_pid}" 2>/dev/null || true
      wait "${app_pid}" 2>/dev/null || true
      exit 1
    fi
  fi
done

wait "${app_pid}"
