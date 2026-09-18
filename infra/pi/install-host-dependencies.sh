#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo 'Run as root: sudo bash install-host-dependencies.sh' >&2
  exit 1
fi

version_codename="$(sed -n 's/^VERSION_CODENAME=//p' /etc/os-release | tr -d '"')"
if [[ $(uname -m) != aarch64 || ${version_codename} != trixie || $(dpkg --print-architecture) != arm64 ]]; then
  echo 'This installer requires a 64-bit ARM Debian Trixie host.' >&2
  exit 1
fi

if ! id eric480 >/dev/null 2>&1; then
  echo 'The eric480 deployment account is missing.' >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl

install -m 0755 -d /etc/apt/keyrings /usr/share/keyrings
curl --fail --silent --show-error --location \
  https://download.docker.com/linux/debian/gpg \
  --output /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
cat > /etc/apt/sources.list.d/docker.sources <<'SOURCES'
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: trixie
Components: stable
Architectures: arm64
Signed-By: /etc/apt/keyrings/docker.asc
SOURCES

curl --fail --silent --show-error --location \
  https://pkgs.tailscale.com/stable/debian/trixie.noarmor.gpg \
  --output /usr/share/keyrings/tailscale-archive-keyring.gpg
curl --fail --silent --show-error --location \
  https://pkgs.tailscale.com/stable/debian/trixie.tailscale-keyring.list \
  --output /etc/apt/sources.list.d/tailscale.list

apt-get update
apt-get install -y \
  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin \
  tailscale
systemctl enable --now docker tailscaled
usermod -aG docker eric480

docker --version
docker compose version
tailscale version | head -1
echo 'Docker and Tailscale installed. Reconnect SSH to use the docker group.'
