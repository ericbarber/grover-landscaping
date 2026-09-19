# Raspberry Pi development deployment

This path hosts the compiled React app and Rust API on one Raspberry Pi for
private development review. GitHub Actions builds an ARM64 image from a `main`
push only after all CI jobs pass, sends it over Tailscale SSH, and checks the
deployed app. The Pi keeps PostgreSQL in a named Docker volume. Tailscale Serve
provides the HTTPS URL inside the tailnet. The existing Render/Cognito pilot
deployment is a separate path.

## Runtime boundary

- The Pi stack uses `APP_ENV=local` and `AUTH_MODE=local_review`. Anyone allowed
  to open its Tailscale Serve URL can select a local reviewer role. Use
  synthetic development data only. Restrict access to the Pi in the tailnet
  policy; this is not a protected production identity boundary.
- Docker publishes the application only at `127.0.0.1:10000`; PostgreSQL has
  no host port. Do not enable Tailscale Funnel for this site.
- App migrations run on startup. The deploy script restores the previous
  application image when readiness fails, but a database migration is not
  reversed. Keep migrations compatible with the previous image.

## One-time Pi preparation

The Pi needs a 64-bit ARM operating system (`uname -m` should print `aarch64`),
Docker Engine with the Compose plugin, `curl`, `gzip`, OpenSSH, and Tailscale.
Install Docker and Tailscale using their current official Raspberry Pi/Linux
instructions. Add `eric480` to the `docker` group and reconnect before testing
`docker compose version` without `sudo`. Keep the Pi's operating system and
Docker updated.

On a freshly flashed 64-bit Debian Trixie Pi, the repository's
`infra/pi/install-host-dependencies.sh` performs these package and service
steps using the official Docker and Tailscale apt repositories. Copy it to the
Pi, run `sudo bash install-host-dependencies.sh`, then reconnect SSH so the new
Docker group membership takes effect. The script checks the OS and account
before changing apt configuration. [Docker Debian installation](https://docs.docker.com/engine/install/debian/)
and [Tailscale Debian packages](https://pkgs.tailscale.com/stable/)
describe the upstream commands.

The target at `192.168.50.10` is a Raspberry Pi 3 Model B with 1 GB RAM. It
was reimaged from 32-bit Raspberry Pi OS to 64-bit Debian Trixie on 2026-09-18.
The new SSH host key was checked against the device's unchanged Ethernet MAC
address before updating the workstation's known-hosts entry. The workstation
public key was reinstalled. Docker Engine, Compose, and Tailscale are now
installed and running; the Pi joined the tailnet as
`grover-dev-pi.tailf6631b.ts.net`. The prior
home directory was backed up outside this repository and was not restored
wholesale onto the new OS.

1. Join the Pi to the same tailnet as the development workstation. Choose a
   stable hostname, for example `grover-dev-pi`, and record the complete
   `*.ts.net` DNS name from `tailscale status`. Enable MagicDNS and HTTPS
   certificates for Tailscale Serve in the tailnet admin console.
2. Create a runtime file on the Pi. Use the Pi's actual tailnet DNS name:

   ```bash
   mkdir -p ~/grover-landscaping
   cd ~/grover-landscaping
   umask 077
   password="$(openssl rand -hex 32)"
   printf 'POSTGRES_PASSWORD=%s\nPUBLIC_APP_URL=https://%s\n' \
     "$password" 'grover-dev-pi.example.ts.net' > .env
   unset password
   chmod 600 .env
   ```

   Preserve `.env` and the Docker `postgres-data` volume across deployments.
   The password must be 64 lowercase hexadecimal characters because the stack
   embeds it in a PostgreSQL URL.
3. Configure Tailscale Serve on the Pi after the first app deployment:

   ```bash
   tailscale serve --bg 10000
   tailscale serve status
   ```

   Serve's displayed `https://...ts.net` URL must match `PUBLIC_APP_URL` in
   `.env`. Check `/health/ready` and `/auth/config` through that URL from a
   tailnet device. If Serve requires administrator privileges on this Pi, run
   those commands with `sudo`.

## CI access setup

Create a dedicated Ed25519 SSH key for CI. Add only its public key to
`eric480`'s `~/.ssh/authorized_keys` on the Pi. Store the private key as the
`PI_SSH_PRIVATE_KEY` secret in the GitHub `pi-development` environment. The
deployment user needs Docker permission. Treat Docker group access as
administrator-equivalent access to the Pi.

Pin the Pi's SSH host key. Capture its Ed25519 public key over the tailnet,
then compare the fingerprint with the Pi's local
`/etc/ssh/ssh_host_ed25519_key.pub` before storing the line as the
`PI_SSH_KNOWN_HOSTS` environment secret. The line must name the same
`*.ts.net` host used by the workflow. The workflow requires strict host-key
checking and will not trust a newly presented key automatically.

Create a [Tailscale workload identity federation credential](https://tailscale.com/docs/integrations/github/github-action)
with `auth_keys` scope for `tag:grover-ci`, restricted to this repository and
its `main` deployment workflow. Set these GitHub `pi-development` environment
secrets and variable:

First open [Tailscale Access controls](https://console.tailscale.com/admin/acls),
choose **Tags → Create tag**, and enter `grover-ci` as the tag name without the
`tag:` prefix. Leave the default admin ownership if offered. Save the tag so
`tag:grover-ci` becomes available in the credential's Tags selector. This tag
identifies the temporary GitHub runner.

For this repository, open [Tailscale Trust credentials](https://console.tailscale.com/admin/settings/trust-credentials),
select **Credential → OpenID Connect → GitHub Actions**, and enter this Subject:
`repo:ericbarber/grover-landscaping:environment:pi-development`. Add two Custom
claim rows, putting each key and value into its own input:

| Claim key | Claim value |
| --- | --- |
| `ref` | `refs/heads/main` |
| `workflow_ref` | `ericbarber/grover-landscaping/.github/workflows/ci.yml@refs/heads/main` |

Grant only `auth_keys` scope for `tag:grover-ci`, then copy the generated Client
ID and Audience to the GitHub environment secrets below. The repository uses
GitHub's default OIDC subject format and was created before the July 2026
immutable-subject cutoff; recheck the subject if GitHub OIDC settings change.

| Name | Kind | Value |
| --- | --- | --- |
| `TS_OAUTH_CLIENT_ID` | Secret | Tailscale federated identity client ID |
| `TS_AUDIENCE` | Secret | Tailscale federated identity audience |
| `PI_SSH_PRIVATE_KEY` | Secret | Dedicated CI private key, including newlines |
| `PI_SSH_KNOWN_HOSTS` | Secret | Verified `*.ts.net ssh-ed25519 ...` line |
| `PI_TAILSCALE_HOST` | Environment variable | Pi's `*.ts.net` DNS name |

The tailnet policy supplied on 2026-09-18 has a single broad grant with
`src: ["*"]`, `dst: ["*"]`, and `ip: ["*"]`. Grants are additive, so adding a
narrow CI grant while that rule remains would still allow the CI runner to
reach every tailnet device and port. The current three nodes are all owned by
one tailnet user. Replace that broad grant with these two grants, retaining the
existing `tagOwners` and other policy sections:

```hujson
"grants": [
  {"src": ["autogroup:member"], "dst": ["*"], "ip": ["*"]},
  {"src": ["tag:grover-ci"], "dst": ["100.104.108.28"], "ip": ["tcp:22"]},
]
```

`100.104.108.28` is the Pi's current Tailscale IPv4 address; update the grant
if the Pi receives a different address. Check that no other allow-all grant or
ACL remains. Allow intended reviewers to reach the Pi's Serve HTTPS port (443)
through a separate grant if they are not tailnet members. Apply and validate
this tailnet policy before enabling CI deployment.
The Tailscale action creates an ephemeral CI node and waits for the Pi to
become reachable. The Pi itself must remain a persistent tailnet node.

`PI_DEPLOY_ENABLED` is set to `true`. Each passing push to `main` builds and
deploys its exact tested commit; pull requests never deploy. A maintainer can
also manually run the **CI** workflow against `main` to redeploy the current
commit through every quality gate. Set the variable to `false` before pausing
automatic deployment or performing host maintenance.

The GitHub `pi-development` environment has been created with a `main`-only
branch policy and `PI_SSH_PRIVATE_KEY` set to a dedicated CI key. Its public
half is installed on the Pi and a dedicated-key SSH login succeeded over
Tailscale. The Compose and deployment files are present on the Pi with matching
checksums. The SSH host key was verified against the Pi's local key and stored
as `PI_SSH_KNOWN_HOSTS`; `PI_TAILSCALE_HOST` names
`grover-dev-pi.tailf6631b.ts.net`. A private `.env` exists on the Pi, and
PostgreSQL is healthy with a named data volume. Tailscale Serve routes the
tailnet-only `https://grover-dev-pi.tailf6631b.ts.net/` endpoint to
`127.0.0.1:10000`. The owner applied the narrower grants above and removed the
default allow-all grant.

The first GitHub Actions baseline deployment completed on 2026-09-18 for
commit `1bd623731b308994d2136da89ad6ca9013b0755b`. That run exercised the
Tailscale OIDC credential, `tag:grover-ci` grant, pinned SSH connection, ARM64
image transfer, Compose activation, and readiness checks. Independent checks
from a tailnet workstation confirmed valid TLS, HTTP 200 at the root,
PostgreSQL-backed readiness, `local_review` authentication configuration, and
the expected ARM64 image on the Pi. The deployment run is recorded in
[GitHub Actions](https://github.com/ericbarber/grover-landscaping/actions/runs/35411774285).

## Operating the site

On the Pi, `~/grover-landscaping` holds the runtime `.env`, current
`.release.env`, Compose file, and deploy script. The image is named
`grover-landscaping:<full-commit-sha>`. GitHub's deployment job reports the
deployed SHA after readiness succeeds. Check local service status with:

```bash
cd ~/grover-landscaping
docker compose --env-file .env --env-file .release.env -f compose.yml ps
docker compose --env-file .env --env-file .release.env -f compose.yml logs --tail=100 app
curl --fail http://127.0.0.1:10000/health/ready
```

For a manual application rollback, run `bash deploy-pi.sh <previous-full-sha>`
on the Pi while that image remains loaded. Back up the PostgreSQL volume
before significant data or migration changes. For example, from the Pi:

```bash
cd ~/grover-landscaping
docker compose --env-file .env --env-file .release.env -f compose.yml \
  exec -T postgres pg_dump -U grover grover_landscaping > "grover-$(date +%F).sql"
```

Keep backup files outside the web server and test restoration on a separate
database. Do not commit `.env`, database dumps, SSH keys, or Tailscale
credentials. Old application images remain on the Pi for rollback until an
operator prunes them after checking disk usage.

References: [GitHub hosted ARM64 runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners),
[Tailscale GitHub Action](https://tailscale.com/docs/integrations/github/github-action),
[Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve).
