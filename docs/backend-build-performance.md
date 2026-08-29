# Backend Build Performance

## Pilot Readiness baseline

The exact backend CI test command exposed two compilation units for several
feature modules: `lib.rs` exported them while `main.rs` redeclared the same
source files. Rust therefore compiled their code and unit tests into both the
library and binary test targets. Before convergence, the binary target ran 233
tests, including copies already exercised by the 209-test library target.

## Phase 6A4 convergence

The first behavior-neutral slice removes binary redeclarations for:

- marketing events;
- marketing leads;
- notification delivery;
- project bids; and
- stop progress.

The binary imports those modules from `grover_landscaping_api` exactly as it
already does for newer feature areas. Runtime repositories, request validation,
worker startup, and route handlers retain the same implementations. The binary
target now runs 215 tests, eliminating 18 duplicate unit-test executions, and
the full backend command runs 484 tests.

Validation after the boundary change:

- `cargo fmt --all -- --check` passes;
- `cargo clippy --all-targets --all-features -- -D warnings` passes;
- `cargo test --bin grover-landscaping-api` passes all 215 binary tests; and
- `cargo test --all` passes all 484 backend tests.

## Phase 6A5 account convergence

The account repository and its request validation are self-contained, so the
binary now imports `accounts` from the library as the next dependency-ordered
slice. Its five module unit tests remain covered by the library target without
being compiled and run again in the binary. The binary target drops from 215 to
210 tests, for a cumulative reduction of 23 duplicate executions, and the full
backend command runs 479 tests. Strict all-target/all-feature Clippy and the full
test command remain green.

## Phase 6A6 day-plan convergence

Day-plan repositories are constructed from the shared PostgreSQL pool and do
not require the binary-local job repository type, so the complete day-plan
module now comes from the library. This removes 25 more repeated unit-test
executions: the binary target drops from 210 to 185 tests, the cumulative
reduction reaches 48, and the full backend command runs 454 tests. Strict
all-target/all-feature Clippy and the full test command pass.

## Phase 6A7 final core convergence

The final coupled slice moves completion reports, the core job repository,
photo processing, and photo storage onto the library boundary together. The
binary's duplicate job and photo structs are removed, and photo-upload request
validation now lives beside the library-owned request contract. `main.rs` no
longer redeclares any source module.

The binary target now contains only its 145 route and handler tests. Compared
with the 233-test baseline, all 88 repeated module-test executions are removed;
the full backend command runs 414 tests. Formatting, strict all-target/all-
feature Clippy, the binary target, and the full backend suite pass.

## Phase 6A8 cache and test-profile tuning

The backend CI job now restores Cargo registry and dependency build artifacts
through `Swatinem/rust-cache@v2`, keyed from the Rust toolchain, lockfile,
manifests, and job context. The cache step runs after toolchain installation and
targets `backend/target`. Workspace crate artifacts remain freshly built by the
action's default policy, so source changes are still exercised.

The test profile disables compiler debuginfo. Backend tests validate behavior
and do not use a debugger in CI; omitting the default full debuginfo reduces
test-link work and artifact size while leaving the development and release
profiles unchanged. Panic output remains available, although optimized debugger
source information is intentionally not part of this CI-oriented profile.

Each backend quality-gate command now reports GNU `time` elapsed, user, system,
and peak-RSS metrics in the hosted job log. A local warm baseline captured before
the profile change on 2026-08-29 was:

| Stage | Elapsed | Peak RSS |
| --- | ---: | ---: |
| `cargo fmt --all -- --check` | 1.33 s | 67,276 KiB |
| strict all-target/all-feature Clippy | 1.31 s | 87,472 KiB |
| all 414 backend tests | 16.55 s | 385,256 KiB |

An isolated empty-target run measured cold strict Clippy at 324.06 seconds and
1,013,472 KiB peak RSS. Its following test-profile build exhausted the bounded
2 GiB temporary filesystem after 126.64 seconds with 1.5 GiB of disposable
artifacts. That failure was environmental rather than a code/test failure and
motivated the debuginfo reduction; the temporary target was removed afterward.

After the change, the exact strict gate passed and all 414 tests executed. The
one-time fresh test-profile build plus execution took 440.02 seconds and peaked
at 1,126,460 KiB RSS on the normal workspace filesystem. A repeat warm sample
then measured strict Clippy at 0.50 seconds and all tests at 15.65 seconds. Those
single-machine samples confirm no warm regression, but they are diagnostic
observations rather than a statistically controlled benchmark.

Hosted cold and cache-hit numbers cannot be asserted locally. The next pushed
CI runs must supply those comparable measurements from the new log markers.
Cache keys should only be tuned further if those runs show low restore rates or
insufficient savings; linker or test-partition changes remain measurement-led.
