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

## Next convergence boundary

All binary module redeclarations are removed. The next build-performance phase
should capture comparable cold and warm CI timings, then use those measurements
to prioritize linker settings, test-profile tuning, dependency caching, or test
partitioning. Incremental timings from the convergence work used different
artifact states and are not presented as an equivalent before/after benchmark.
