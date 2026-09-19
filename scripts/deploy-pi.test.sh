#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
temporary="$(mktemp -d)"
trap 'rm -rf -- "${temporary}"' EXIT
mkdir -p "${temporary}/bin" "${temporary}/site"
cp "${repository_root}/scripts/deploy-pi.sh" "${temporary}/site/deploy-pi.sh"
cp "${repository_root}/infra/pi/compose.yml" "${temporary}/site/compose.yml"
printf 'POSTGRES_PASSWORD=%064d\nPUBLIC_APP_URL=https://grover-dev-pi.example.ts.net\n' 0 \
  > "${temporary}/site/.env"
chmod 600 "${temporary}/site/.env"

cat > "${temporary}/bin/docker" <<'SH'
#!/usr/bin/env bash
if [[ "$1 $2" == 'image inspect' ]]; then
  printf 'arm64\n'
elif [[ "$1" == compose ]]; then
  exit 0
else
  exit 1
fi
SH

cat > "${temporary}/bin/curl" <<'SH'
#!/usr/bin/env bash
current="$(sed -n 's/^GROVER_IMAGE=//p' .release.env)"
[[ "${current}" != "${FAKE_FAIL_IMAGE:-}" ]] || exit 22
if [[ "${*: -1}" == */auth/config ]]; then
  printf '{"mode":"local_review"}\n'
fi
SH

cat > "${temporary}/bin/sleep" <<'SH'
#!/usr/bin/env bash
exit 0
SH
chmod +x "${temporary}/bin/"*

old_sha="$(printf 'a%.0s' {1..40})"
new_sha="$(printf 'b%.0s' {1..40})"
export PATH="${temporary}/bin:${PATH}"
bash "${temporary}/site/deploy-pi.sh" "${old_sha}"
grep -Fxq "GROVER_IMAGE=grover-landscaping:${old_sha}" \
  "${temporary}/site/.release.env"

export FAKE_FAIL_IMAGE="grover-landscaping:${new_sha}"
if bash "${temporary}/site/deploy-pi.sh" "${new_sha}"; then
  echo 'Expected failed readiness to fail the deployment' >&2
  exit 1
fi
grep -Fxq "GROVER_IMAGE=grover-landscaping:${old_sha}" \
  "${temporary}/site/.release.env"

if bash "${temporary}/site/deploy-pi.sh" invalid >/dev/null 2>&1; then
  echo 'Expected invalid release SHA to be rejected' >&2
  exit 1
fi
printf 'Pi deployment and rollback checks passed.\n'
