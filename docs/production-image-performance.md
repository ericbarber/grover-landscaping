# Production Image Build Performance

## Phase 6A11 baseline and correctness gate

The CI production-image job previously invoked `docker build` on an ephemeral
host without importing or exporting a BuildKit cache. The frontend dependency
layer used no npm cache mount, and any backend source change invalidated the
single release-build layer after it had copied all source and migrations.

The local baseline attempt failed after 211.27 seconds before producing an
image. Vite eagerly resolved the development-only `design/` review directory
while loading its production configuration, but the production frontend stage
correctly copies only `frontend/`. The design path is now resolved inside the
serve-only plugin hook, keeping review artifacts out of the production context
and restoring the image gate.

Because the prior build did not complete, there is no honest full pre-change
image time. Its partial log still recorded roughly 65 seconds for `npm ci`, more
than 100 seconds for the uncached runtime package layer, and the beginning of a
from-scratch Cargo dependency build.

## Cache layout

The Dockerfile now uses persistent BuildKit mounts for:

- npm's package cache during the exact `npm ci` install;
- Cargo's registry; and
- the backend release target directory.

The release binary is copied outside the target cache mount before the build
step ends, so it remains available to the final runtime stage. CI now uses the
Docker Buildx and build-push actions to import and export a dedicated
`production-image` GitHub Actions cache in `mode=max`; it still loads the tagged
image and does not push it.

Local validation on 2026-08-29 measured:

| Build state | Elapsed |
| --- | ---: |
| first corrected cache population | 783.12 s |
| identical cache-hit rebuild | 28.66 s |

The local cache-hit reduction is 754.46 seconds (96.3%). Hosted cache import,
export, and eviction behavior cannot be asserted locally and must be read from
the next published Buildx job summary.

The resulting image is 39,838,759 bytes and runs as the unprivileged `grover`
user. A local PostgreSQL-backed smoke run passed `/health` and `/health/ready`
and served the compiled frontend from `/`. The smoke used the explicit local
review runtime mode because no external Cognito tenant was in scope; an
invented production issuer correctly failed closed while fetching JWKS.

## Phase 6A12 deterministic frontend context

The repository ignores `frontend/tsconfig.tsbuildinfo` for Git, but the Docker
context previously admitted that local incremental state into `COPY frontend/`.
A developer's host typecheck could therefore influence whether the container's
own typecheck performed a clean analysis. The same broad context also included
Playwright journeys/configuration, source unit/spec files, local test reports,
and the frontend README, causing production-layer invalidation for validation-
only edits.

The Docker ignore contract now excludes those generated and non-production
inputs. CI safety is unchanged: the production-image job depends on the separate
frontend and browser jobs, which still typecheck and execute the complete source
test and journey sets before the image gate runs. A direct image build remains
responsible for production source/config/assets, not repository test execution.

A clean-context proof forced the frontend stage to rebuild without host
TypeScript metadata while reusing npm, Cargo, and runtime layers. It completed
in 71.34 seconds, emitted the same production asset hashes, and retained the
same runtime image manifest/config digest. This confirms the filter changes
cache invalidation inputs rather than shipped behavior.
