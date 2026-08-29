# Frontend Build Performance

## Phase 6A9 baseline

The frontend CI job installed the same lockfile dependencies on every run
without restoring npm's package cache. It then ran `tsc --noEmit` for the
typecheck gate before `npm run build` invoked `tsc -b`, repeating the complete
TypeScript analysis in one job. The browser-journey job performed a second
uncached dependency install.

A local warm-package-cache baseline on 2026-08-29 used the available Node
24.18.0/npm 11.16.0 runtime. Hosted CI remains pinned to Node 22, so these
figures are directional local measurements rather than hosted equivalents:

| Stage | Elapsed | Peak RSS |
| --- | ---: | ---: |
| `npm ci` | 13.61 s | 279,840 KiB |
| `npm run typecheck` | 21.97 s | 529,044 KiB |
| 481 Vitest tests | 38.13 s | 268,784 KiB |
| `npm run build` | 30.40 s | 528,612 KiB |

## Lockfile cache and TypeScript reuse

Both Node-based CI jobs now ask `actions/setup-node` to cache npm's global
package data against `frontend/package-lock.json`. This does not cache
`node_modules`; `npm ci` still reconstructs the exact locked dependency tree in
each job. Per-step GNU `time` markers make dependency, typecheck, unit-test,
build, Playwright-install, and browser-journey costs visible in hosted logs.

The `typecheck` script now enables TypeScript's incremental no-emit mode and
writes `tsconfig.tsbuildinfo`, which is already ignored by Git. The following
`npm run build` retains its own typecheck safety gate, but invokes the same
incremental command and can reuse that verified graph instead of performing a
second full analysis. Build mode (`tsc -b`) was evaluated and rejected here:
because this project deliberately emits no JavaScript, it treated the absent
`src/App.js` output as perpetually out of date and repeated the full check.

Validation after selecting incremental no-emit mode:

| Stage | Elapsed | Peak RSS |
| --- | ---: | ---: |
| clean incremental typecheck | 17.96 s | 522,764 KiB |
| build reusing the verified graph | 11.34 s | 458,448 KiB |
| 481 Vitest tests | 38.55 s | 228,900 KiB |

The measured local build stage fell by 19.06 seconds (62.7%) from the baseline.
The production build remains green and still reports the existing 510.18 kB
application-chunk warning; bundle partitioning is a separate next optimization
rather than being hidden by a higher warning threshold.

Playwright browser binaries are deliberately not cached. Playwright's CI
guidance notes that restoring them costs about as much as downloading them and
that Linux operating-system dependencies cannot be cached. The workflow times
that installation so this choice can be revisited from hosted evidence.

## Phase 6A10 authenticated bundle partition

The Phase 6A9 validation surfaced an existing Vite warning: the authenticated
application chunk was 510.18 kB after minification. `App.tsx` statically owns
the broad manager tool suite as well as shared field/customer surfaces, so that
graph had outgrown the established 500 kB warning boundary.

Vite now assigns manager-prefixed workspaces and the organization overview to a
stable `manager-workspaces` chunk while preserving the existing React and OIDC
vendor partitions. This is a behavior-neutral cache and parallel-download
boundary: the authenticated app still statically imports those workspaces, so
it is not presented as role-conditional lazy loading.

The production build now completes without a chunk-size warning:

| Chunk | Before | After |
| --- | ---: | ---: |
| authenticated `App` | 510.18 kB | 248.49 kB |
| manager workspaces | included in `App` | 300.09 kB |
| largest resulting chunk | 510.18 kB | 300.09 kB |

The post-split build completed in 10.50 seconds on the local measurement host,
and all 481 Vitest tests pass. Role-conditional loading should be considered
only as a separate measured product-runtime change because it requires explicit
loading/recovery presentation rather than a build-only partition.
